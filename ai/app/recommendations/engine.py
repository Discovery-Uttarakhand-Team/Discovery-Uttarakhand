"""
Discovery Uttarakhand - Deterministic Recommendation Engine
Scores and ranks candidates based on budget, location relevance, and verified provenance.
Provides verifiable matching factors for LLM grounded explanation.
"""
from typing import List, Dict, Any, Optional

def score_and_rank_stays(
    stays: List[Dict[str, Any]],
    user_budget: Optional[int] = None,
    budget_tier: str = "Balanced",
    duration_days: int = 3,
    travelers: int = 2
) -> List[Dict[str, Any]]:
    target_nightly = 2500
    if user_budget:
        target_nightly = round((user_budget * 0.40) / max(1, duration_days))
    elif budget_tier.lower() == "budget":
        target_nightly = 1500
    elif budget_tier.lower() == "luxury":
        target_nightly = 6000

    ranked = []
    for s in stays:
        score = 50
        factors = []
        
        price = s.get("pricePerNight") or s.get("price")
        if price:
            if price <= target_nightly * 1.15:
                score += 30
                factors.append("within allocated stay budget")
            elif price <= target_nightly * 1.4:
                score += 10
                factors.append("slightly above target budget")
            else:
                score -= 20
                factors.append("premium tier rate")

        if s.get("provenance") == "VERIFIED" or s.get("isGMVN") or s.get("isKMVN"):
            score += 20
            factors.append("verified regional accommodation")
            
        if s.get("rating") and s.get("rating") >= 4.2:
            score += 10
            factors.append("highly rated by Himalayan travelers")

        scored_item = dict(s)
        scored_item["matchScore"] = score
        scored_item["matchingFactors"] = factors
        ranked.append(scored_item)

    ranked.sort(key=lambda x: x["matchScore"], reverse=True)
    return ranked
