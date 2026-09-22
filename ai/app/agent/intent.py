"""
Discovery Uttarakhand - Multi-Intent Understanding
Classifies primary and secondary intents from natural language query and context
"""
import re
from typing import List, Dict, Any

def classify_intents(text: str, entities: Dict[str, Any], context: Dict[str, Any]) -> List[str]:
    clean = (text or "").strip().lower()
    intents = []

    # 1. Greetings
    if re.search(r"^(hello|hi|hey|namaste|pranam|good morning|good evening)\b", clean) and len(clean.split()) <= 4:
        return ["GREETING"]

    # 2. Weather
    if re.search(r"\b(weather|temperature|mausam|rain|snow|barish|baraf|climate)\b", clean):
        intents.append("WEATHER")

    # 3. Route / Road Advisory / Map
    if re.search(r"\b(route|road|highway|map|rasta|kaise jaa?u|how to reach|show map|map dikhao|map kholo)\b", clean):
        if re.search(r"\b(map|map dikhao|map kholo|show map)\b", clean):
            intents.append("MAP")
        if re.search(r"\b(road|highway|condition|closed|landslide|advisory|safe|safety)\b", clean):
            intents.append("ROAD_ADVISORY")
        if re.search(r"\b(route|kaise jaa?u|how to reach|rasta|distance|dur)\b", clean):
            intents.append("ROUTE")

    # 4. Stay Search
    if re.search(r"\b(stay|stays|hotel|hotels|resort|resorts|lodge|homestay|room|accommodation|dharmashala|gmvn|kmvn)\b", clean):
        intents.append("STAY_SEARCH")

    # 5. Activity / Sightseeing / Destination Discovery
    if re.search(r"\b(explore|things to do|kya dekh sakte|places to visit|attractions|trek|trekking|boating|rafting|sightseeing)\b", clean):
        if re.search(r"\b(trek|trekking|boating|rafting|adventure)\b", clean):
            intents.append("ACTIVITY_SEARCH")
        else:
            intents.append("DESTINATION_DISCOVERY")

    # 6. Rental & Guides
    if re.search(r"\b(rental|rent|scooty|bike|car hire|taxi booking|cab)\b", clean):
        intents.append("RENTAL_SEARCH")
    if re.search(r"\b(guide|local guide|escort|trek leader)\b", clean):
        intents.append("GUIDE_SEARCH")

    # 7. Budget Modification or Calculation
    is_budget_modification = re.search(r"\b(budget\s*(kam|badha|change|update|kar do|rakho)|kam\s*karo|thoda\s*sasta|reduce\s*budget|sasta\s*rakhna)\b", clean)
    if is_budget_modification:
        intents.append("TRIP_MODIFICATION")
        intents.append("BUDGET")
    elif re.search(r"\b(budget|kharcha|cost|price|estimate)\b", clean) or entities.get("budget"):
        intents.append("BUDGET")

    # 8. Itinerary Modification
    if re.search(r"\b(day \d+|add karo|hata do|remove|itinerary badlo|change stay|replace)\b", clean):
        intents.append("TRIP_MODIFICATION")

    # 9. Booking information (READ-ONLY)
    if re.search(r"\b(book kar do|book this|booking|reserve)\b", clean):
        intents.append("BOOKING_INFO")

    # 10. General Trip Planning
    is_planning_lang = re.search(r"\b(trip|plan|itinerary|jana hai|jaana hai|want to go|ghoomna|travel|bana do|chalo)\b", clean)
    has_destination = bool(entities.get("destination") or (context and context.get("destination")))
    if is_planning_lang or (has_destination and not intents):
        intents.append("TRIP_PLANNING")

    if not intents:
        intents.append("GENERAL_CHAT")

    return intents
