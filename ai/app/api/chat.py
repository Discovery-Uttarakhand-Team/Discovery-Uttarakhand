"""
Discovery Uttarakhand - Chat API Endpoint
Supports SSE Streaming and standard JSON output with LangGraph state checkpointing
"""
import json
import asyncio
from fastapi import APIRouter, Request, Header, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from ..schemas.chat import ChatRequest
from ..agent.graph import AGENT_GRAPH
from ..agent.state import AgentState

router = APIRouter(tags=["Chat"])

@router.post("/chat")
async def chat_endpoint(request: Request, body: ChatRequest, x_internal_secret: str = Header(None)):
    is_sse = "text/event-stream" in request.headers.get("accept", "")
    thread_id = body.chatId or body.sessionId or "default_thread"
    config = {"configurable": {"thread_id": thread_id}}

    # Initial State for turn
    initial_dest = None
    if body.tripContext:
        if isinstance(body.tripContext, dict):
            d_names = body.tripContext.get("destinationNames")
            if d_names and len(d_names) > 0:
                initial_dest = d_names[0]
            elif body.tripContext.get("destination"):
                initial_dest = body.tripContext.get("destination")

    initial_input = {
        "user_message": body.message,
        "chat_id": body.chatId,
        "session_id": body.sessionId,
        "trip_id": body.tripId,
        "trip_context": body.tripContext or {},
        "request_id": body.requestId or f"req_{int(asyncio.get_event_loop().time()*1000)}",
        "page_context": body.pageContext,
        "history": [m.dict() for m in (body.history or [])]
    }
    if initial_dest:
        initial_input["destination"] = initial_dest

    if is_sse:
        async def event_generator():
            yield f"data: {json.dumps({'type': 'status', 'message': 'Thinking...'})}\n\n"
            
            # Run LangGraph
            state = await AGENT_GRAPH.ainvoke(initial_input, config=config)

            # Emit tools status events
            for tool_name, res in state.get("tool_results", {}).items():
                if res.get("success"):
                    yield f"data: {json.dumps({'type': 'tool_status', 'tool': tool_name, 'message': f'Executed {tool_name}...'})}\n\n"

            # Emit UI action events
            for action in state.get("ui_actions", []):
                yield f"data: {json.dumps({'type': 'ui_action', 'action': action, 'requestId': state.get('request_id')})}\n\n"

            # Stream response chunks
            text = state.get("final_response", "")
            words = text.split(" ")
            for w in words:
                yield f"data: {json.dumps({'type': 'chunk', 'text': w + ' '})}\n\n"
                await asyncio.sleep(0.02)

            # Canonical Execution Telemetry
            canon_tools = state.get("tools_used", [k for k, v in state.get("tool_results", {}).items() if v.get("success")])
            canon_tool_count = state.get("tool_count", len(canon_tools))
            canon_citations = state.get("citations", state.get("evidence_refs", []))
            canon_citation_count = state.get("citation_count", len(canon_citations))
            canon_provider = state.get("provider_used", "auto")
            canon_fallback = state.get("fallback_used", False)
            canon_confidence = state.get("confidence", "grounded")

            # Emit Done
            done_payload = {
                "type": "done",
                "chatId": body.chatId,
                "sessionId": body.sessionId,
                "response": {
                    "type": "answer",
                    "message": text,
                    "toolsUsed": canon_tools,
                    "toolCount": canon_tool_count,
                    "citations": canon_citations,
                    "citationCount": canon_citation_count,
                    "suggestedActions": state.get("suggested_actions", []),
                    "uiActions": state.get("ui_actions", []),
                    "structuredCards": state.get("structured_cards", {}),
                    "tripContext": {
                        "destination": state.get("destination"),
                        "origin": state.get("origin"),
                        "startDate": state.get("start_date"),
                        "duration": state.get("duration_days"),
                        "travelers": state.get("travelers"),
                        "budget": state.get("budget"),
                        "budgetTier": state.get("budget_tier")
                    },
                    "confidence": canon_confidence,
                    "meta": {
                        "runtime": "python_fastapi_langgraph",
                        "provider": canon_provider,
                        "fallbackUsed": canon_fallback,
                        "threadId": thread_id,
                        "toolsUsed": canon_tools,
                        "toolCount": canon_tool_count,
                        "citations": canon_citations,
                        "citationCount": canon_citation_count,
                        "confidence": canon_confidence
                    }
                }
            }
            yield f"data: {json.dumps(done_payload)}\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    else:
        state = await AGENT_GRAPH.ainvoke(initial_input, config=config)
        canon_tools = state.get("tools_used", [k for k, v in state.get("tool_results", {}).items() if v.get("success")])
        canon_tool_count = state.get("tool_count", len(canon_tools))
        canon_citations = state.get("citations", state.get("evidence_refs", []))
        canon_citation_count = state.get("citation_count", len(canon_citations))
        canon_provider = state.get("provider_used", "auto")
        canon_fallback = state.get("fallback_used", False)
        canon_confidence = state.get("confidence", "grounded")

        return {
            "success": True,
            "chatId": body.chatId,
            "sessionId": body.sessionId,
            "response": {
                "type": "answer",
                "message": state.get("final_response", ""),
                "toolsUsed": canon_tools,
                "toolCount": canon_tool_count,
                "citations": canon_citations,
                "citationCount": canon_citation_count,
                "suggestedActions": state.get("suggested_actions", []),
                "uiActions": state.get("ui_actions", []),
                "structuredCards": state.get("structured_cards", {}),
                "tripContext": {
                    "destination": state.get("destination"),
                    "origin": state.get("origin"),
                    "startDate": state.get("start_date"),
                    "duration": state.get("duration_days"),
                    "travelers": state.get("travelers"),
                    "budget": state.get("budget"),
                    "budgetTier": state.get("budget_tier")
                },
                "confidence": canon_confidence,
                "meta": {
                    "runtime": "python_fastapi_langgraph",
                    "provider": canon_provider,
                    "fallbackUsed": canon_fallback,
                    "threadId": thread_id,
                    "toolsUsed": canon_tools,
                    "toolCount": canon_tool_count,
                    "citations": canon_citations,
                    "citationCount": canon_citation_count,
                    "confidence": canon_confidence
                }
            }
        }
