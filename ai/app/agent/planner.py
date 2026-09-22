"""
Discovery Uttarakhand - Dynamic Planner & Missing Slot Analyzer
Plans tools based strictly on active intents, verified slots, and operational requirements.
Prevents hallucinated or premature tool calls when basic slots (origin, duration) are missing.
"""
from typing import Dict, Any, List

def analyze_slots(intents: List[str], state: Dict[str, Any]) -> List[str]:
    missing = []
    
    # Trip planning requires destination, origin, start_date, and duration to compute routes & realistic budgets
    if "TRIP_PLANNING" in intents:
        if not state.get("destination"):
            missing.append("destination")
        if not state.get("origin"):
            missing.append("origin")
        if not state.get("start_date"):
            missing.append("start_date")
        if not state.get("duration_days"):
            missing.append("duration_days")
    else:
        # Factual intents only require destination
        if any(i in intents for i in ["WEATHER", "STAY_SEARCH", "ACTIVITY_SEARCH", "DESTINATION_DISCOVERY", "ROUTE"]):
            if not state.get("destination"):
                missing.append("destination")
            if "ROUTE" in intents and not state.get("origin"):
                missing.append("origin")
                
    return missing

def plan_tools(intents: List[str], state: Dict[str, Any]) -> List[Dict[str, Any]]:
    tools = []
    dest = state.get("destination")
    orig = state.get("origin")
    dur = state.get("duration_days")
    trav = state.get("travelers") or 2
    tier = state.get("budget_tier") or "Balanced"
    
    # If no destination is identified, do not execute destination-dependent tools
    if not dest:
        return tools

    # 1. Weather - when explicitly queried or destination is specified
    if "WEATHER" in intents:
        tools.append({"name": "getWeather", "args": {"location": dest}})
        
    # 2. Highway Routing - ONLY when BOTH origin and destination are explicitly known
    # Prevents false 350 km Delhi-fallback routes when origin is unspecified
    if ("ROUTE" in intents or "MAP" in intents or ("TRIP_PLANNING" in intents and orig)) and orig:
        tools.append({"name": "planRoute", "args": {"origin": orig, "destination": dest}})
        
    # 3. Road Advisory - safety checks for hill corridors
    if "ROAD_ADVISORY" in intents:
        tools.append({"name": "getRoadAdvisory", "args": {"destination": dest}})
        
    # 4. Verified Stays - if explicitly asked or full trip planning with duration
    if "STAY_SEARCH" in intents or ("TRIP_PLANNING" in intents and dur):
        tools.append({"name": "findStays", "args": {"destination": dest, "budget_tier": tier}})
        
    # 5. Destination Exploration
    if "ACTIVITY_SEARCH" in intents or "DESTINATION_DISCOVERY" in intents:
        tools.append({"name": "exploreDestination", "args": {"destination": dest}})
        
    # 6. Budget Calculation - only if user asks for budget or duration is known
    if "BUDGET" in intents or ("TRIP_PLANNING" in intents and (dur or state.get("budget"))):
        tools.append({
            "name": "calculateBudget",
            "args": {
                "destination": dest,
                "duration_days": dur or 3,
                "travelers": trav,
                "budget_tier": tier,
                "user_budget": state.get("budget")
            }
        })

    return tools
