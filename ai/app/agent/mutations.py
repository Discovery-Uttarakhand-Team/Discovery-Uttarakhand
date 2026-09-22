"""
Discovery Uttarakhand - Deterministic Trip Mutation Engine
Validates, mutates, and recalculates trip state with before/after diffs and rollback.
"""
import copy
from typing import Dict, Any, Tuple

VALID_TRANSPORTS = ['cab', 'taxi', 'bus', 'tempo', 'self-drive', 'train', 'flight', 'shared-jeep']

def recalculate_budget(total_amount: int, duration_days: int = 3, travelers: int = 2) -> Dict[str, Any]:
    total = max(1000, int(total_amount))
    days = max(1, int(duration_days))
    people = max(1, int(travelers))
    
    per_person = round(total / people)
    per_day = round(total / days)
    per_person_per_day = round(total / (people * days))
    
    tier = "Balanced"
    if per_person_per_day < 1800:
        tier = "Budget"
    elif per_person_per_day > 5000:
        tier = "Luxury"
        
    return {
        "totalEstimatedCost": total,
        "budgetTier": tier,
        "perPerson": per_person,
        "perDay": per_day,
        "breakdown": {
            "accommodation": round(total * 0.40),
            "transport": round(total * 0.30),
            "food": round(total * 0.20),
            "activitiesAndBuffer": round(total * 0.10)
        }
    }

def apply_mutation(state: Dict[str, Any], mutation_type: str, payload: Dict[str, Any]) -> Tuple[bool, Dict[str, Any], Dict[str, Any], str]:
    """
    Returns (success, new_state, diff, error_message)
    """
    working = copy.deepcopy(state or {})
    m_type = (mutation_type or "").upper()
    diff = {"mutationType": m_type, "fieldsChanged": [], "before": {}, "after": {}}
    
    try:
        if m_type == "UPDATE_BUDGET":
            raw = payload.get("budget") or payload.get("amount") or payload.get("value")
            try:
                new_budget = int(str(raw).replace(",", "").replace("₹", "").strip())
            except Exception:
                return False, state, diff, f"Invalid budget value: {raw}"
                
            if new_budget < 500 or new_budget > 2000000:
                return False, state, diff, f"Budget out of realistic range (₹500 - ₹20,00,000): {new_budget}"
                
            diff["before"]["budget"] = working.get("budget")
            diff["fieldsChanged"].append("budget")
            working["budget"] = new_budget
            
            dur = working.get("duration_days") or working.get("duration") or 3
            trav = working.get("travelers") or 2
            recalc = recalculate_budget(new_budget, dur, trav)
            working["budget_summary"] = recalc
            working["budget_tier"] = recalc["budgetTier"]
            
            diff["after"]["budget"] = new_budget
            diff["after"]["budgetSummary"] = recalc
            return True, working, diff, ""

        elif m_type == "UPDATE_DURATION":
            raw = payload.get("duration_days") or payload.get("days") or payload.get("duration") or payload.get("value")
            try:
                days = int(str(raw).replace("days", "").replace("din", "").strip())
            except Exception:
                return False, state, diff, f"Invalid duration value: {raw}"
                
            if days < 1 or days > 30:
                return False, state, diff, f"Duration must be between 1 and 30 days: {days}"
                
            diff["before"]["duration_days"] = working.get("duration_days")
            diff["fieldsChanged"].append("duration_days")
            working["duration_days"] = days
            working["duration"] = f"{days} Days"
            
            if working.get("budget"):
                working["budget_summary"] = recalculate_budget(working["budget"], days, working.get("travelers") or 2)
                
            diff["after"]["duration_days"] = days
            return True, working, diff, ""

        elif m_type == "UPDATE_TRAVELERS":
            raw = payload.get("travelers") or payload.get("count") or payload.get("value")
            try:
                trav = int(str(raw).strip())
            except Exception:
                return False, state, diff, f"Invalid travelers value: {raw}"
                
            if trav < 1 or trav > 50:
                return False, state, diff, f"Travelers must be between 1 and 50: {trav}"
                
            diff["before"]["travelers"] = working.get("travelers")
            diff["fieldsChanged"].append("travelers")
            working["travelers"] = trav
            
            if working.get("budget"):
                working["budget_summary"] = recalculate_budget(working["budget"], working.get("duration_days") or 3, trav)
                
            diff["after"]["travelers"] = trav
            return True, working, diff, ""

        elif m_type == "CHANGE_TRANSPORT":
            mode = str(payload.get("transport") or payload.get("mode") or "").lower().strip()
            matched = next((t for t in VALID_TRANSPORTS if t in mode), "cab")
            
            diff["before"]["transport"] = working.get("transport")
            diff["fieldsChanged"].append("transport")
            working["transport"] = matched
            working["transport_mode"] = matched
            
            diff["after"]["transport"] = matched
            return True, working, diff, ""

        elif m_type == "ADD_ACTIVITY":
            day_num = int(payload.get("day", 1))
            activity = payload.get("activity") or {"name": payload.get("name", "Scenic Sightseeing"), "category": "Sightseeing"}
            
            diff["fieldsChanged"].append("itinerary")
            if "generated_itinerary" not in working or not isinstance(working["generated_itinerary"], list):
                working["generated_itinerary"] = []
                
            target_day = next((d for d in working["generated_itinerary"] if d.get("day") == day_num), None)
            if not target_day:
                target_day = {"day": day_num, "title": f"Day {day_num} Exploration", "activities": []}
                working["generated_itinerary"].append(target_day)
                working["generated_itinerary"].sort(key=lambda d: d.get("day", 1))
                
            if "activities" not in target_day:
                target_day["activities"] = []
            target_day["activities"].append(activity)
            
            diff["after"]["addedActivity"] = activity
            diff["after"]["day"] = day_num
            return True, working, diff, ""

        elif m_type == "REMOVE_ACTIVITY":
            day_num = payload.get("day")
            name_to_remove = str(payload.get("activity_name") or payload.get("name") or "").lower()
            diff["fieldsChanged"].append("itinerary")
            
            if "generated_itinerary" in working and isinstance(working["generated_itinerary"], list):
                for day in working["generated_itinerary"]:
                    if not day_num or day.get("day") == int(day_num):
                        if "activities" in day and isinstance(day["activities"], list):
                            day["activities"] = [
                                a for a in day["activities"]
                                if name_to_remove not in (a if isinstance(a, str) else a.get("name", "")).lower()
                            ]
            diff["after"]["removedActivity"] = name_to_remove
            return True, working, diff, ""

        else:
            return False, state, diff, f"Unknown mutation type: {mutation_type}"

    except Exception as e:
        return False, state, diff, f"Mutation error: {str(e)}"
