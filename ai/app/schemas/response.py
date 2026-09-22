"""
Agent structured response schema
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class SuggestedAction(BaseModel):
    label: str
    action: str

class UiAction(BaseModel):
    type: str
    origin: Optional[str] = None
    destination: Optional[str] = None
    slug: Optional[str] = None
    destinationId: Optional[str] = None
    explore: Optional[bool] = None
    fields: Optional[Dict[str, Any]] = None

class AgentResponse(BaseModel):
    type: str = "answer"
    message: str
    toolsUsed: List[str] = Field(default_factory=list)
    citations: List[Any] = Field(default_factory=list)
    suggestedActions: List[SuggestedAction] = Field(default_factory=list)
    uiActions: List[UiAction] = Field(default_factory=list)
    structuredCards: Optional[Dict[str, Any]] = Field(default_factory=dict)
    tripContext: Optional[Dict[str, Any]] = None
    confidence: str = "grounded"
    meta: Dict[str, Any] = Field(default_factory=dict)
