"""
Strict tool output and definition schemas
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class ToolResult(BaseModel):
    success: bool
    data: Optional[Any] = None
    provenance: str = Field(default="VERIFIED", description="VERIFIED, ESTIMATED, LIVE, STALE, UNKNOWN, UNAVAILABLE")
    evidenceRefs: List[str] = Field(default_factory=list)
    status: str = Field(default="OK", description="OK, ERROR, PENDING_CONFIRMATION, UNAVAILABLE")
    error: Optional[str] = None
    durationMs: Optional[int] = 0
