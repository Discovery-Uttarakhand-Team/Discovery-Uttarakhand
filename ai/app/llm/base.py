"""
Discovery Uttarakhand - Base LLM Provider Interface
"""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional

class BaseProvider(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    async def is_healthy(self) -> bool:
        """Quick health check (< 1.2s)"""
        pass

    @abstractmethod
    async def chat(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """Returns { 'text': str, 'tool_calls': list, 'finish_reason': str }"""
        pass

    @abstractmethod
    async def chat_stream(
        self,
        system_prompt: str,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Yields chunks: { 'type': 'text' | 'tool_call', ... }"""
        pass
