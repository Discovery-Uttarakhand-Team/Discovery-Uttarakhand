"""
Discovery Uttarakhand - Direct Groq Cloud Provider
Connects directly to api.groq.com with high throughput and native tool calling
"""
import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from .base import BaseProvider
from ..config import settings

class GroqProvider(BaseProvider):
    def __init__(self):
        super().__init__("groq")
        self.base_url = settings.GROQ_BASE_URL.rstrip("/")
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL

    async def is_healthy(self) -> bool:
        if not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=1.2) as client:
                res = await client.get(
                    f"{self.base_url}/models",
                    headers={"Authorization": f"Bearer {self.api_key}"}
                )
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

        payload: Dict[str, Any] = {
            "model": self.model,
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

        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            res.raise_for_status()
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
        formatted = [{"role": "system", "content": system_prompt}]
        for m in messages:
            formatted.append({"role": m.get("role", "user"), "content": m.get("content", "")})

        payload: Dict[str, Any] = {
            "model": self.model,
            "messages": formatted,
            "temperature": temperature,
            "stream": True
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", f"{self.base_url}/chat/completions", headers=headers, json=payload) as response:
                response.raise_for_status()
                tool_call_accumulator: Dict[int, Dict[str, Any]] = {}
                
                async for line in response.aiter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0].get("delta", {})
                        
                        if delta.get("content"):
                            yield {"type": "text", "text": delta["content"]}
                            
                        if delta.get("tool_calls"):
                            for tc_chunk in delta["tool_calls"]:
                                idx = tc_chunk.get("index", 0)
                                if idx not in tool_call_accumulator:
                                    tool_call_accumulator[idx] = {
                                        "name": tc_chunk.get("function", {}).get("name", ""),
                                        "args_str": tc_chunk.get("function", {}).get("arguments", ""),
                                        "id": tc_chunk.get("id")
                                    }
                                else:
                                    if tc_chunk.get("function", {}).get("name"):
                                        tool_call_accumulator[idx]["name"] = tc_chunk["function"]["name"]
                                    if tc_chunk.get("function", {}).get("arguments"):
                                        tool_call_accumulator[idx]["args_str"] += tc_chunk["function"]["arguments"]
                    except Exception:
                        continue

                for tc in tool_call_accumulator.values():
                    try:
                        args = json.loads(tc["args_str"])
                    except Exception:
                        args = {}
                    yield {"type": "tool_call", "tool_call": {"name": tc["name"], "args": args, "id": tc.get("id")}}
