"""
Chat request and turn schemas
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant' or 'model'")
    content: str = Field(..., description="Message text")
    provenance: Optional[str] = "GROUNDED"
    evidenceRefs: Optional[List[str]] = []
    metadata: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    chatId: Optional[str] = None
    sessionId: Optional[str] = None
    tripId: Optional[str] = None
    requestId: Optional[str] = None
    pageContext: Optional[Dict[str, Any]] = None
    tripContext: Optional[Dict[str, Any]] = None
    history: Optional[List[ChatMessage]] = []
