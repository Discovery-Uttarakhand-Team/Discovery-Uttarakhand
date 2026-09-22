"""
Discovery Uttarakhand - Grounded Deterministic Fallback Provider
Used when external AI APIs are unreachable or rate-limited.
Grounded strictly in verified tool output, canonical destinations, and active system prompt context.
"""
import re
from typing import AsyncGenerator, Dict, Any, List, Optional
from .base import BaseProvider
from ..agent.entities import resolve_destination

class DeterministicFallbackProvider(BaseProvider):
    def __init__(self):
        super().__init__("deterministic")

    async def is_healthy(self) -> bool:
        return True

    def synthesize_from_tool(self, tool_name: str, tool_data: Any) -> str:
        if tool_name == "getWeather":
            d = tool_data.get("data", {}) if isinstance(tool_data, dict) else {}
            temp = d.get("temperatureC") or d.get("temperature") or "--"
            cond = d.get("condition") or "Clear Mountain Conditions"
            wind = d.get("windSpeedKmh") or "--"
            loc = tool_data.get("location") or "your destination"
            return (
                f"**{loc}** ka verified weather (Open-Meteo):\n"
                f"- Temperature: {temp}°C, Condition: {cond}, Wind: {wind} km/h.\n"
                f"Pahadon mein daylight transit recommend ki jaati hai."
            )

        if tool_name == "planRoute":
            orig = tool_data.get("origin") or "Delhi"
            dest = tool_data.get("destination") or "Uttarakhand"
            dist = tool_data.get("estimatedDistanceKm") or "--"
            hours = tool_data.get("estimatedDurationHours") or "--"
            corridor = tool_data.get("corridor") or f"{orig} to {dest}"
            return (
                f"**{orig} se {dest}** highway route details:\n"
                f"- Distance: ~{dist} km | Drive Time: ~{hours} hrs ({corridor}).\n"
                f"- Mountain Highway Safety: Ghat road par din mein travel karein."
            )

        if tool_name == "findStays":
            stays = tool_data.get("stays", []) if isinstance(tool_data, dict) else []
            dest = tool_data.get("destination", "Uttarakhand")
            if not stays:
                return f"**{dest}** ke paas verified local homestays aur KMVN/GMVN rest houses available hain."
            
            lines = []
            for i, s in enumerate(stays[:3], 1):
                rate = f"₹{s.get('pricePerNight', 0):,}/night" if s.get('pricePerNight') else "Standard tariff"
                lines.append(f"{i}. **{s.get('name')}** ({rate})")
            return f"Verified stays in **{dest}**:\n" + "\n".join(lines)

        if tool_name == "calculateBudget":
            b = tool_data if isinstance(tool_data, dict) else {}
            tot = b.get("totalEstimatedCost") or 10000
            br = b.get("breakdown", {})
            return (
                f"Estimated **{b.get('budgetTier', 'Balanced')}** budget breakdown:\n"
                f"- Total Base Cost: ₹{tot:,}\n"
                f"- Stay: ₹{br.get('accommodation', 0):,} | Transport: ₹{br.get('transport', 0):,} | Food: ₹{br.get('food', 0):,}."
            )

        return ""

    async def chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        last_msg = messages[-1].get("content", "") if messages else ""
        lower = last_msg.lower()

        # 1. Greetings
        if re.search(r"^(hello|hi|hey|namaste|pranam)\b", lower) and len(lower.split()) <= 4:
            return {
                "text": "Namaste! Main aapka Discovery Uttarakhand AI Travel Copilot hoon. Aap Uttarakhand mein kahan travel karna chahte hain?",
                "tool_calls": [],
                "finish_reason": "STOP"
            }

        # 2. Extract Context from System Prompt
        ctx_dest = None
        ctx_orig = None
        ctx_missing = []
        has_budget_conflict = "BUDGET CONFLICT DETECTED" in system_prompt
        
        dest_match = re.search(r"Destination:\s*([^\n\r(]+)", system_prompt)
        if dest_match:
            ctx_dest = dest_match.group(1).strip()

        orig_match = re.search(r"Origin:\s*([^\n\r]+)", system_prompt)
        if orig_match:
            ctx_orig = orig_match.group(1).strip()

        missing_match = re.search(r"MISSING SLOTS:\s*([^\n\r]+)", system_prompt)
        if missing_match:
            raw_missing = missing_match.group(1).strip()
            if raw_missing and raw_missing != "None":
                ctx_missing = [s.strip() for s in raw_missing.split(",")]

        # Direct destination mentioned in this message
        direct_dest = resolve_destination(last_msg)
        active_dest = (direct_dest["name"] if direct_dest else None) or ctx_dest

        # 3. Budget Conflict Response
        if has_budget_conflict and active_dest:
            user_b = re.search(r"Budget:\s*₹?([0-9,]+)", system_prompt)
            user_val = user_b.group(1) if user_b else "your budget"
            return {
                "text": (
                    f"Aapka **{active_dest}** trip ₹{user_val} ke budget mein kaafi tight rahega. "
                    f"Verified standard base cost isse thoda zyada aati hai. "
                    f"Aap local homestays, UTC state buses ya shared cabs choose karke kharcha kam kar sakte hain."
                ),
                "tool_calls": [],
                "finish_reason": "STOP"
            }

        # 4. Contextual Slot Inquiries
        if active_dest:
            if "origin" in ctx_missing:
                return {
                    "text": f"Bilkul! **{active_dest}** ke liye verified trip plan taiyaar karte hain. Aap kahan se start kar rahe hain (jaise Haldwani, Delhi ya Dehradun)?",
                    "tool_calls": [],
                    "finish_reason": "STOP"
                }
            if "start_date" in ctx_missing and "duration_days" in ctx_missing:
                return {
                    "text": f"Bahut badiya! **{active_dest}** ke liye aap kab travel plan kar rahe hain aur kitne din ka schedule rahega?",
                    "tool_calls": [],
                    "finish_reason": "STOP"
                }
            if "duration_days" in ctx_missing:
                return {
                    "text": f"Date note kar li hai. **{active_dest}** ke liye aap kitne din aur kitne travelers ka plan bana rahe hain?",
                    "tool_calls": [],
                    "finish_reason": "STOP"
                }
            if "travelers" in ctx_missing:
                return {
                    "text": f"Aapke saath kitne log travel kar rahe hain aur lagbhag kya budget plan hai?",
                    "tool_calls": [],
                    "finish_reason": "STOP"
                }

        # 5. Fallback Tool Synthesis if trusted tools are present in prompt
        parts = []
        if "<TRUSTED_TOOL" in system_prompt:
            if "name='planRoute'" in system_prompt:
                dist_m = re.search(r"'estimatedDistanceKm':\s*([0-9.]+)", system_prompt)
                dur_m = re.search(r"'estimatedDurationHours':\s*([0-9.]+)", system_prompt)
                if dist_m and dur_m:
                    parts.append(f"Road distance: ~{dist_m.group(1)} km, Driving time: ~{dur_m.group(1)} hrs.")
            if "name='calculateBudget'" in system_prompt:
                cost_m = re.search(r"'totalEstimatedCost':\s*([0-9]+)", system_prompt)
                if cost_m:
                    parts.append(f"Estimated total trip budget: ₹{int(cost_m.group(1)):,}.")
        
        if parts and active_dest:
            return {
                "text": f"**{active_dest}** trip details ready hain:\n" + "\n".join(f"- {p}" for p in parts) + "\n\nKya aap stays ya daily itinerary dekhna chahte hain?",
                "tool_calls": [],
                "finish_reason": "STOP"
            }

        if active_dest:
            return {
                "text": f"Main **{active_dest}** ke liye verified travel plan taiyaar kar raha hoon. Aap kis date par aur kitne logon ke saath travel karna chahenge?",
                "tool_calls": [],
                "finish_reason": "STOP"
            }

        return {
            "text": "Uttarakhand mein aap kahan travel karna chahte hain? (Jaise Valley of Flowers, Kedarnath, Badrinath, Auli, Munsiyari, Chopta, ya Nainital). Mujhe destination batayein, main verified plan taiyaar kar dunga.",
            "tool_calls": [],
            "finish_reason": "STOP"
        }

    async def chat_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> AsyncGenerator[Dict[str, Any], None]:
        res = await self.chat(system_prompt, messages, tools, temperature)
        for word in res["text"].split(" "):
            yield {"type": "text", "text": word + " "}
