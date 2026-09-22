"""
Trip mutation and state schemas
"""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TripEntities(BaseModel):
    destination: Optional[str] = None
    destinationId: Optional[str] = None
    district: Optional[str] = None
    region: Optional[str] = None
    origin: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    duration: Optional[int] = None
    durationDays: Optional[int] = None
    durationMin: Optional[int] = None
    durationMax: Optional[int] = None
    travelers: Optional[int] = None
    budget: Optional[int] = None
    budgetTier: Optional[str] = "Balanced"
    transport: Optional[str] = None
    interests: Optional[List[str]] = []
    tripType: Optional[List[str]] = []
    pace: Optional[str] = None

class TripMutationProposal(BaseModel):
    mutationType: str = Field(..., description="e.g. UPDATE_BUDGET, UPDATE_DURATION, ADD_ACTIVITY")
    payload: Dict[str, Any]
    reason: Optional[str] = "User requested trip modification"

class TripMutationResult(BaseModel):
    success: bool
    state: Dict[str, Any]
    diff: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
