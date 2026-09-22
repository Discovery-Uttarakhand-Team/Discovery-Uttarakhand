"""
Discovery Uttarakhand - Deterministic Budget Calculator Tool
"""
import time
from typing import Dict, Any, Optional
from .base import success_result
from ..agent.mutations import recalculate_budget

async def calculate_budget(
    duration_days: int = 3,
    travelers: int = 2,
    budget_tier: str = "Balanced",
    destination: Optional[str] = None,
    user_budget: Optional[int] = None
) -> Dict[str, Any]:
    t0 = time.time()
    
    # Base rates per tier
    per_day_base = 2500
    if budget_tier.lower() == "budget":
        per_day_base = 1500
    elif budget_tier.lower() == "luxury":
        per_day_base = 6500
        
    total = per_day_base * max(1, duration_days) * max(1, travelers)
    calc = recalculate_budget(total, duration_days, travelers)
    calc["destination"] = destination or "Uttarakhand"
    
    # Budget Conflict Detection
    if user_budget and user_budget > 0:
        calc["userBudget"] = user_budget
        if user_budget < total:
            calc["status"] = "OVER_BUDGET"
            calc["budgetStatus"] = "OVER_BUDGET"
            calc["budgetDeficit"] = total - user_budget
            calc["warning"] = f"Current plan aapke budget (₹{user_budget:,}) se upar ja raha hai. Realistic minimum estimate: ₹{total:,}."
        else:
            calc["status"] = "OPTIMAL"
            calc["budgetStatus"] = "OPTIMAL"
            calc["budgetSurplus"] = user_budget - total
    else:
        calc["status"] = calc["budgetTier"]
        calc["budgetStatus"] = calc["budgetTier"]
    
    dur_ms = int((time.time() - t0) * 1000)
    return success_result(
        data=calc,
        provenance="ESTIMATED",
        evidence_refs=["Discovery Uttarakhand Tariff Standard Engine", "Regional Homestay & Taxi Union Tariffs"],
        duration_ms=dur_ms
    )
