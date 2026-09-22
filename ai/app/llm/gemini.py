"""
Discovery Uttarakhand - Direct Gemini Provider
"""
import json
import httpx
from typing import AsyncGenerator, Dict, Any, List, Optional
from .base import BaseProvider
from ..config import settings

class GeminiProvider(BaseProvider):
    def __init__(self):
        super().__init__("gemini")
        self.api_key = settings.GEMINI_API_KEY
        self.model = settings.GEMINI_MODEL
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def is_healthy(self) -> bool:
        if not self.api_key:
            return False
        try:
            url = f"{self.base_url}/models/{self.model}?key={self.api_key}"
            async with httpx.AsyncClient(timeout=1.2) as client:
                res = await client.get(url)
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
        contents = []
        for m in messages:
            role = "user" if m.get("role") in ["user", "human"] else "model"
            contents.append({
                "role": role,
                "parts": [{"text": m.get("content", "")}]
            })

        payload = {
            "contents": contents,
            "systemInstruction": {
                "parts": [{"text": system_prompt}]
            },
            "generationConfig": {
                "temperature": temperature
            }
        }

        url = f"{self.base_url}/models/{self.model}:generateContent?key={self.api_key}"
        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.post(url, json=payload)
            res.raise_for_status()
            data = res.json()
            
            candidates = data.get("candidates", [])
            if not candidates:
                return {"text": "I could not generate a response. Please try again.", "tool_calls": [], "finish_reason": "STOP"}
                
            parts = candidates[0].get("content", {}).get("parts", [])
            text = "".join([p.get("text", "") for p in parts if "text" in p])
            return {
                "text": text,
                "tool_calls": [],
                "finish_reason": candidates[0].get("finishReason", "STOP")
            }

    async def chat_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> AsyncGenerator[Dict[str, Any], None]:
        res = await self.chat(system_prompt, messages, tools, temperature)
        if res.get("text"):
            for word in res["text"].split(" "):
                yield {"type": "text", "text": word + " "}
