"""
Discovery Uttarakhand - LangGraph Agent State
Typed conversation and execution state schema
"""
from typing import Optional, List, Dict, Any
from typing_extensions import TypedDict

class AgentState(TypedDict, total=False):
    # Identifiers
    chat_id: Optional[str]
    session_id: Optional[str]
    request_id: Optional[str]
    user_id: Optional[str]
    trip_id: Optional[str]
    
    # Input
    user_message: str
    history: List[Dict[str, Any]]
    page_context: Optional[Dict[str, Any]]
    
    # Intent & Understanding
    intents: List[str]
    primary_intent: str
    
    # Resolved Entities (Canonical)
    destination: Optional[str]
    destination_id: Optional[str]
    district: Optional[str]
    region: Optional[str]
    origin: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    duration_days: Optional[int]
    duration_min: Optional[int]
    duration_max: Optional[int]
    travelers: Optional[int]
    budget: Optional[int]
    budget_tier: Optional[str]
    transport_mode: Optional[str]
    interests: List[str]
    pace: Optional[str]
    
    # Dynamic Planning Slots
    missing_slots: List[str]
    pending_question: Optional[str]
    
    # Planned & Executed Tools
    tool_plan: List[Dict[str, Any]]
    tool_results: Dict[str, Any]
    structured_cards: Dict[str, Any]
    
    # RAG Context
    rag_documents: List[Dict[str, Any]]
    
    # Recommendation Candidates & Matching Factors
    recommendations: List[Dict[str, Any]]
    
    # Trip Mutation Proposal
    mutation_proposal: Optional[Dict[str, Any]]
    mutation_applied: Optional[Dict[str, Any]]
    
    # UI Actions & Navigation
    ui_actions: List[Dict[str, Any]]
    suggested_actions: List[Dict[str, Any]]
    
    # Output & Grounding
    final_response: str
    confidence: str
    evidence_refs: List[str]
    citations: List[Any]
    provider_used: Optional[str]
    model_used: Optional[str]
    fallback_used: bool
    
    # Timing & Trace (Dev Observability)
    trace: Dict[str, Any]

