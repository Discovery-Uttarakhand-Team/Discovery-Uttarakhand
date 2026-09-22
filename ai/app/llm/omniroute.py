"""
Discovery Uttarakhand - OmniRoute Local Gateway Provider
Connects to local gateway at http://localhost:20128/v1
"""
import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from .base import BaseProvider
from ..config import settings

class OmniRouteProvider(BaseProvider):
    def __init__(self):
        super().__init__("omniroute")
        self.base_url = settings.OMNIROUTE_BASE_URL.rstrip("/")
        self.api_key = settings.OMNIROUTE_API_KEY
        self.model = settings.OMNIROUTE_MODEL

    async def is_healthy(self) -> bool:
        if not settings.OMNIROUTE_ENABLED or not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=1.2) as client:
                res = await client.get(f"{self.base_url}/models", headers={"Authorization": f"Bearer {self.api_key}"})
                return res.status_code == 200
        except Exception:
            return False

    async def chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        formatted = [{"role": "system", "content": system_prompt}]
        for m in messages:
            formatted.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        model = "auto/best-chat" if self.model.startswith("openai/") or not self.model else self.model
        payload: Dict[str, Any] = {
            "model": model,
            "messages": formatted,
            "temperature": temperature
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
            text_body = res.text.strip()
            
            # Handle streaming SSE responses (which OmniRoute often returns by default)
            if "data: " in text_body:
                accumulated_text = ""
                finish_reason = "stop"
                for line in text_body.splitlines():
                    line = line.strip()
                    if line.startswith("data: ") and not line.endswith("[DONE]"):
                        try:
                            chunk = json.loads(line[6:])
                            delta = chunk.get("choices", [{}])[0].get("delta", {})
                            accumulated_text += delta.get("content", "")
                        except Exception:
                            pass
                return {
                    "text": accumulated_text,
                    "tool_calls": [],
                    "finish_reason": finish_reason
                }

            # Handle standard JSON response
            data = res.json()
            choice = data["choices"][0]
            msg = choice["message"]
            
            tool_calls = []
            if msg.get("tool_calls"):
                for tc in msg["tool_calls"]:
                    fn = tc.get("function", {})
                    try:
                        args = json.loads(fn.get("arguments", "{}"))
                    except Exception:
                        args = {}
                    tool_calls.append({"name": fn.get("name"), "args": args, "id": tc.get("id")})

            return {
                "text": msg.get("content") or "",
                "tool_calls": tool_calls,
                "finish_reason": choice.get("finish_reason")
            }

    async def chat_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> AsyncGenerator[Dict[str, Any], None]:
        # For simplicity and robustness with tools, fall back to chat output streaming chunks
        res = await self.chat(system_prompt, messages, tools, temperature)
        if res.get("text"):
            for word in res["text"].split(" "):
                yield {"type": "text", "text": word + " "}
        for tc in res.get("tool_calls", []):
            yield {"type": "tool_call", "tool_call": tc}
