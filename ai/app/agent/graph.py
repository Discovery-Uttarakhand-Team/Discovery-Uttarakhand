"""
Discovery Uttarakhand - LangGraph Agent State Graph
Implements checkpointed state flow with parallel tool execution, RAG, and grounded synthesis.
"""
import asyncio
import time
from typing import Dict, Any, List
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver

from .state import AgentState
from .entities import extract_entities_from_text
from .intent import classify_intents
from .planner import analyze_slots, plan_tools
from .mutations import apply_mutation
from ..tools import (
    get_weather, plan_route, get_road_advisory,
    calculate_budget, find_stays, explore_destination,
    search_partner_listings, check_booking_eligibility
)
from ..rag.retriever import retrieve_knowledge
from ..recommendations.engine import score_and_rank_stays
from ..llm.resolver import resolve_provider

# LangGraph In-Memory Checkpointer for Thread Resumability
CHECKPOINTER = MemorySaver()

async def understand_node(state: Dict[str, Any]) -> Dict[str, Any]:
    msg = state.get("user_message", "")
    
    # Reconstruct context from MongoDB history if in-memory thread was restarted
    ctx_dest = state.get("destination")
    ctx_orig = state.get("origin")
    ctx_dur = state.get("duration_days")
    ctx_budg = state.get("budget")
    
    if not ctx_dest and state.get("history"):
        for h in reversed(state["history"]):
            h_text = h.get("content", "")
            h_ext = extract_entities_from_text(h_text)
            if not ctx_dest and h_ext.get("destination"):
                ctx_dest = h_ext["destination"]
            if not ctx_orig and h_ext.get("origin"):
                ctx_orig = h_ext["origin"]
            if not ctx_dur and h_ext.get("duration_days"):
                ctx_dur = h_ext["duration_days"]
            if not ctx_budg and h_ext.get("budget"):
                ctx_budg = h_ext["budget"]

    ctx = {
        "destination": ctx_dest,
        "origin": ctx_orig,
        "duration": ctx_dur
    }
    extracted = extract_entities_from_text(msg, ctx)
    intents = classify_intents(msg, extracted, ctx)

    updates = {
        "intents": intents,
        "primary_intent": intents[0] if intents else "GENERAL_CHAT"
    }
    if ctx_dest and not extracted.get("destination"):
        updates["destination"] = ctx_dest
    if ctx_orig and not extracted.get("origin"):
        updates["origin"] = ctx_orig
    if ctx_dur and not extracted.get("duration_days"):
        updates["duration_days"] = ctx_dur
    if ctx_budg and not extracted.get("budget"):
        updates["budget"] = ctx_budg
        
    for k, v in extracted.items():
        if v is not None:
            updates[k] = v

    return updates

async def slot_analysis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    intents = state.get("intents", [])
    missing = analyze_slots(intents, state)
    return {"missing_slots": missing}

async def tool_execution_node(state: Dict[str, Any]) -> Dict[str, Any]:
    intents = state.get("intents", [])
    tools = plan_tools(intents, state)
    
    tasks = []
    tool_names = []
    
    for t in tools:
        name = t["name"]
        args = t["args"]
        tool_names.append(name)
        if name == "getWeather":
            tasks.append(get_weather(args.get("location", "Uttarakhand")))
        elif name == "planRoute":
            tasks.append(plan_route(args.get("origin", "Delhi"), args.get("destination", "Uttarakhand")))
        elif name == "getRoadAdvisory":
            tasks.append(get_road_advisory(destination=args.get("destination")))
        elif name == "findStays":
            tasks.append(find_stays(destination=args.get("destination", "Uttarakhand"), budget_tier=args.get("budget_tier", "Balanced")))
        elif name == "exploreDestination":
            tasks.append(explore_destination(destination=args.get("destination", "Uttarakhand")))
        elif name == "calculateBudget":
            tasks.append(calculate_budget(
                duration_days=args.get("duration_days", 3),
                travelers=args.get("travelers", 2),
                budget_tier=args.get("budget_tier", "Balanced"),
                destination=args.get("destination"),
                user_budget=args.get("user_budget") or state.get("budget")
            ))

    results = await asyncio.gather(*tasks, return_exceptions=True)
    tool_results = dict(state.get("tool_results", {}))
    structured_cards = dict(state.get("structured_cards", {}))
    evidence_refs = list(state.get("evidence_refs", []))

    for name, res in zip(tool_names, results):
        if isinstance(res, Exception):
            tool_results[name] = {"success": False, "error": str(res), "status": "ERROR"}
        elif isinstance(res, dict) and res.get("success"):
            tool_results[name] = res
            data = res.get("data", {})
            if res.get("evidenceRefs"):
                evidence_refs.extend(res["evidenceRefs"])

            if name == "getWeather":
                structured_cards["weather"] = data.get("data")
            elif name == "planRoute":
                structured_cards["route"] = data
            elif name == "findStays":
                raw_stays = data.get("stays", [])
                ranked = score_and_rank_stays(
                    raw_stays,
                    user_budget=state.get("budget"),
                    budget_tier=state.get("budget_tier", "Balanced"),
                    duration_days=state.get("duration_days", 3),
                    travelers=state.get("travelers", 2)
                )
                structured_cards["stays"] = ranked[:4]
            elif name == "calculateBudget":
                structured_cards["budget"] = data
            elif name == "getRoadAdvisory":
                structured_cards["roadAdvisory"] = data

    tool_names_success = [name for name, res in tool_results.items() if res.get("success")]
    deduped_evidence = list(set(evidence_refs))

    return {
        "tool_results": tool_results,
        "tools_used": tool_names_success,
        "tool_count": len(tool_names_success),
        "structured_cards": structured_cards,
        "evidence_refs": deduped_evidence,
        "citations": deduped_evidence,
        "citation_count": len(deduped_evidence)
    }

async def rag_retrieval_node(state: Dict[str, Any]) -> Dict[str, Any]:
    query = state.get("user_message", "")
    dest = state.get("destination")
    docs = retrieve_knowledge(query, destination=dest, limit=2)
    
    evidence = list(state.get("evidence_refs", []))
    for d in docs:
        evidence.append(f"{d['title']} ({d['source']})")

    deduped_evidence = list(set(evidence))
    return {
        "rag_documents": docs,
        "evidence_refs": deduped_evidence,
        "citations": deduped_evidence,
        "citation_count": len(deduped_evidence)
    }

async def synthesis_node(state: Dict[str, Any]) -> Dict[str, Any]:
    msg = state.get("user_message", "")
    dest = state.get("destination")
    missing = state.get("missing_slots", [])
    tool_results = state.get("tool_results", {})
    rag_docs = state.get("rag_documents", [])
    cards = state.get("structured_cards", {})

    # Build Grounded Context
    context_lines = []
    if dest:
        context_lines.append(f"Destination: {dest} ({state.get('district', 'Uttarakhand')})")
    if state.get("origin"):
        context_lines.append(f"Origin: {state['origin']}")
    if state.get("start_date"):
        context_lines.append(f"Start Date: {state['start_date']}")
    if state.get("duration_days"):
        context_lines.append(f"Duration: {state['duration_days']} Days")
    if state.get("travelers"):
        context_lines.append(f"Travelers: {state['travelers']}")
    if state.get("budget"):
        context_lines.append(f"Budget: ₹{state['budget']:,} ({state.get('budget_tier', 'Balanced')})")

    trusted_sections = []
    for tool_name, res in tool_results.items():
        if res.get("success"):
            trusted_sections.append(f"<TRUSTED_TOOL name='{tool_name}' provenance='{res.get('provenance', 'VERIFIED')}'>\n{res.get('data')}\n</TRUSTED_TOOL>")

    for doc in rag_docs:
        trusted_sections.append(f"<TRUSTED_KNOWLEDGE title='{doc['title']}' source='{doc['source']}'>\n{doc['content']}\n</TRUSTED_KNOWLEDGE>")

    # Check for budget conflict
    user_budget = state.get("budget")
    budget_conflict_note = ""
    if user_budget and "calculateBudget" in tool_results:
        b_res = tool_results["calculateBudget"]
        if b_res.get("success"):
            b_data = b_res.get("data", {})
            est_total = b_data.get("totalEstimatedCost") or b_data.get("totalEstimatedCostRange", {}).get("min", 0)
            if est_total and user_budget < est_total:
                budget_conflict_note = (
                    f"\nBUDGET CONFLICT DETECTED:\n"
                    f"User specified a budget of ₹{user_budget:,}, but realistic estimated cost for {state.get('duration_days', 3)} days is ₹{est_total:,}.\n"
                    f"Acknowledge the budget warmly: state clearly 'Current plan aapke budget se upar ja raha hai.'\n"
                    f"Explain honestly that ₹{user_budget:,} is tight for 2 people over {state.get('duration_days', 3)} days without fabricating fake low prices.\n"
                    f"Suggest realistic optimizations like converting to a 1-day trip, using state buses, or choosing budget homestays.\n"
                    f"Keep your response concise (maximum 2 short paragraphs)."
                )

    system_prompt = (
        "You are the AI Travel Copilot for Discovery Uttarakhand (Devbhoomi, India).\n"
        "You are a warm, grounded, concise Himalayan travel companion.\n\n"
        "CRITICAL CONVERSATIONAL GUIDELINES:\n"
        "1. HIGH CONCISENESS & BREVITY: Keep your total response short, crisp, and easily readable on mobile (maximum 2 to 3 brief paragraphs or 3-4 short bullet points, strictly under 100-120 words). Never write long essays, numbered guides, or massive walls of text.\n"
        "2. NO REDUNDANT MARKDOWN TABLES: The Discovery Uttarakhand UI already displays interactive visual cards for Live Weather, Highway Route, Stays, and Budget Breakdown. NEVER recreate or duplicate full markdown tables, huge day-by-day spreadsheets, or long lists in your text response.\n"
        "3. PROGRESSIVE PLANNING: If key details are missing (e.g. origin city or date), warmly acknowledge the destination in 1 line and ask 1 simple question (e.g., 'Aap kahan se travel karenge?'). Strictly keep response under 2 sentences and under 50 words. Do NOT generate a long itinerary or article.\n"
        "4. GROUNDED & SAFE: Never invent fake prices. Remind about daylight mountain driving when relevant.\n"
        "5. LANGUAGE MATCHING: Respond in the same language/tone (clean Hinglish if user asks in Hindi/Hinglish, friendly conversational English if in English).\n"
        "6. ACTIONABLE NEXT STEP: Highlight 2 key practical tips and end with ONE clear follow-up question.\n\n"
        f"ACTIVE TRIP CONTEXT:\n{chr(10).join(context_lines) if context_lines else 'No destination set yet.'}\n"
        f"MISSING SLOTS: {', '.join(missing) if missing else 'None'}\n"
        f"{budget_conflict_note}\n\n"
        f"VERIFIED DATA & KNOWLEDGE:\n{chr(10).join(trusted_sections)}"
    )

    messages = list(state.get("history", []))
    messages.append({"role": "user", "content": msg})

    provider = await resolve_provider()
    res = None
    try:
        res = await provider.chat(system_prompt, messages)
    except Exception as err:
        print(f"[Graph] Primary provider {provider.name} failed: {err}. Attempting Groq fallback...")
        from ..llm.groq import GroqProvider
        from ..llm.gemini import GeminiProvider
        from ..llm.fallback import DeterministicFallbackProvider
        
        if provider.name != "groq":
            try:
                groq = GroqProvider()
                res = await groq.chat(system_prompt, messages)
                provider = groq
            except Exception as gErr:
                print(f"[Graph] Groq fallback failed: {gErr}. Trying Gemini...")
                try:
                    gemini = GeminiProvider()
                    res = await gemini.chat(system_prompt, messages)
                    provider = gemini
                except Exception as gmErr:
                    print(f"[Graph] Gemini failed: {gmErr}. Using deterministic fallback.")
                    fb = DeterministicFallbackProvider()
                    res = await fb.chat(system_prompt, messages)
                    provider = fb
        else:
            fb = DeterministicFallbackProvider()
            res = await fb.chat(system_prompt, messages)
            provider = fb

    return {
        "final_response": res.get("text", "") if res else "",
        "provider_used": provider.name,
        "fallback_used": provider.name == "deterministic",
        "runtime": "python_fastapi_langgraph",
        "confidence": "grounded"
    }

async def ui_action_node(state: Dict[str, Any]) -> Dict[str, Any]:
    msg = state.get("user_message", "").lower()
    dest = state.get("destination")
    orig = state.get("origin")
    ui_actions = []
    suggested = []

    # Map / Route UI Action
    if any(k in msg for k in ["route", "road", "map", "map dikhao", "map kholo", "show map"]):
        if dest:
            ui_actions.append({"type": "OPEN_MAP", "origin": orig or "Delhi", "destination": dest})

    # Explore Destination UI Action
    if any(k in msg for k in ["explore", "what to do", "things to do", "kya dekh"]):
        if dest:
            slug = dest.lower().replace(" ", "-")
            ui_actions.append({"type": "OPEN_DESTINATION", "destination": slug, "slug": slug, "explore": True})

    # Prefill Planner UI Action
    prefill = {}
    if dest: prefill["destination"] = dest
    if orig: prefill["origin"] = orig
    if state.get("start_date"): prefill["startDate"] = state["start_date"]
    if state.get("duration_days"): prefill["duration"] = state["duration_days"]
    if state.get("travelers"): prefill["travelers"] = state["travelers"]
    if state.get("budget"): prefill["budget"] = state["budget"]
    if prefill:
        ui_actions.append({"type": "PREFILL_TRIP_PLANNER", "fields": prefill})

    # Contextual Recommendation Chips
    b_card = state.get("structured_cards", {}).get("budget", {})
    user_b = state.get("budget")
    est_b = b_card.get("totalEstimatedCost") if isinstance(b_card, dict) else None
    is_over_budget = (isinstance(b_card, dict) and b_card.get("status") == "OVER_BUDGET") or (user_b and est_b and user_b < est_b)

    if is_over_budget:
        suggested.append({
            "id": "chip_day_trip",
            "label": "Day trip bana do",
            "type": "SET_TRIP_DURATION",
            "payload": {"days": 1},
            "message": f"I want to convert this {dest or 'Uttarakhand'} trip into a 1-day trip."
        })
        suggested.append({
            "id": "chip_opt_budget",
            "label": f"Budget ₹{user_b:,} mein optimize karo" if user_b else "Budget optimize karo",
            "type": "OPTIMIZE_BUDGET",
            "payload": {"targetBudget": user_b or 2000},
            "message": f"Please optimize the trip plan strictly within ₹{user_b:,} budget." if user_b else "Please optimize the trip within budget."
        })
        suggested.append({
            "id": "chip_cheap_stays",
            "label": "Cheapest stays dhoondo",
            "type": "FIND_STAYS",
            "payload": {"destination": dest, "budget_tier": "Budget"},
            "message": f"Find the cheapest budget homestays and dharamshalas in {dest}."
        })
        suggested.append({
            "id": "chip_public_transport",
            "label": "Public transport use karo",
            "type": "UPDATE_TRANSPORT",
            "payload": {"mode": "bus"},
            "message": "Can we plan using UTC state buses and shared transport?"
        })

    if dest and not orig:
        kumaon_destinations = ["nainital", "bhimtal", "almora", "ranikhet", "kausani", "mukteshwar", "pithoragarh", "munsiyari", "binsar", "bageshwar"]
        if dest.lower() in kumaon_destinations:
            suggested.append({
                "id": "chip_from_haldwani",
                "label": "From Haldwani / Kathgodam",
                "type": "SET_ORIGIN",
                "payload": {"origin": "Haldwani"},
                "message": f"I am starting from Haldwani to visit {dest}."
            })
            suggested.append({
                "id": "chip_from_delhi",
                "label": "From Delhi NCR",
                "type": "SET_ORIGIN",
                "payload": {"origin": "Delhi"},
                "message": f"I am traveling from Delhi to {dest}."
            })
        else:
            suggested.append({
                "id": "chip_from_dehradun",
                "label": "From Dehradun",
                "type": "SET_ORIGIN",
                "payload": {"origin": "Dehradun"},
                "message": f"I will be starting from Dehradun."
            })
            suggested.append({
                "id": "chip_from_delhi",
                "label": "From Delhi",
                "type": "SET_ORIGIN",
                "payload": {"origin": "Delhi"},
                "message": f"I am traveling from Delhi to {dest}."
            })

    if not state.get("duration_days"):
        suggested.append({
            "id": "chip_dur_3",
            "label": "3-Day Itinerary",
            "type": "SET_TRIP_DURATION",
            "payload": {"days": 3},
            "message": f"Let's plan for 3 days in {dest or 'Uttarakhand'}."
        })
        suggested.append({
            "id": "chip_dur_5",
            "label": "5-Day Detailed Plan",
            "type": "SET_TRIP_DURATION",
            "payload": {"days": 5},
            "message": f"I have 5 days to explore {dest or 'Uttarakhand'}."
        })

    if dest and orig:
        suggested.append({
            "id": "chip_view_route",
            "label": f"View Route ({orig} to {dest})",
            "type": "SHOW_ROUTE",
            "payload": {"origin": orig, "destination": dest},
            "message": f"Show route details from {orig} to {dest}."
        })
        suggested.append({
            "id": "chip_find_stays",
            "label": f"Verified Stays in {dest}",
            "type": "FIND_STAYS",
            "payload": {"destination": dest},
            "message": f"What are the best stays in {dest}?"
        })

    if not suggested:
        suggested = [
            {"id": "chip_nainital", "label": "Nainital Lake Tour", "type": "EXPLORE_DESTINATION", "payload": {"destination": "Nainital"}, "message": "Tell me about visiting Nainital."},
            {"id": "chip_rishikesh", "label": "Rishikesh Adventure", "type": "EXPLORE_DESTINATION", "payload": {"destination": "Rishikesh"}, "message": "I want to explore Rishikesh."},
            {"id": "chip_chopta", "label": "Chopta Tungnath Trek", "type": "EXPLORE_DESTINATION", "payload": {"destination": "Chopta"}, "message": "Plan a trek to Chopta."}
        ]

    for s in suggested:
        if "action" not in s:
            s["action"] = s.get("type", "CHAT")
        if "type" not in s:
            s["type"] = s.get("action", "CHAT")

    return {
        "ui_actions": ui_actions,
        "suggested_actions": suggested
    }

# Build LangGraph Workflow
workflow = StateGraph(AgentState)
workflow.add_node("understand", understand_node)
workflow.add_node("slot_analysis", slot_analysis_node)
workflow.add_node("tool_execution", tool_execution_node)
workflow.add_node("rag_retrieval", rag_retrieval_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("ui_actions", ui_action_node)

workflow.set_entry_point("understand")
workflow.add_edge("understand", "slot_analysis")
workflow.add_edge("slot_analysis", "tool_execution")
workflow.add_edge("tool_execution", "rag_retrieval")
workflow.add_edge("rag_retrieval", "synthesis")
workflow.add_edge("synthesis", "ui_actions")
workflow.add_edge("ui_actions", END)

AGENT_GRAPH = workflow.compile(checkpointer=CHECKPOINTER)
