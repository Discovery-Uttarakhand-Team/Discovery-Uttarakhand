"""
Discovery Uttarakhand - Canonical Destination & Entity Resolver
Supports 219+ canonical destinations, multi-word aliases, and spatial pronoun resolution.
"""
import os
import re
import json
from pathlib import Path
from typing import Optional, Dict, Any, List

from ..config import settings

DESTINATION_CACHE: List[Dict[str, Any]] = []
ALIAS_MAP: Dict[str, str] = {}
IS_INITIALIZED = False

STATIC_ALIASES = {
    "vof": "Valley of Flowers",
    "valley of flower": "Valley of Flowers",
    "valley of flowers": "Valley of Flowers",
    "flowers valley": "Valley of Flowers",
    "phoolon ki ghati": "Valley of Flowers",
    "corbett": "Jim Corbett National Park",
    "jim corbett": "Jim Corbett National Park",
    "badri": "Badrinath",
    "badrinath dham": "Badrinath",
    "kedar": "Kedarnath",
    "kedarnath dham": "Kedarnath",
    "gangotri dham": "Gangotri",
    "yamunotri dham": "Yamunotri",
    "hemkund": "Hemkund Sahib",
    "hemkund sahib": "Hemkund Sahib",
    "roop kund": "Roopkund",
    "adi kailash": "Adi Kailash",
    "om parvat": "Om Parvat",
    "chopta tungnath": "Chopta",
    "tungnath temple": "Tungnath",
    "chandrashila": "Chopta",
    "kanatal hill": "Kanatal",
    "dhanaulti eco park": "Dhanaulti",
    "george everest": "Mussoorie",
    "surkanda devi": "Dhanaulti",
    "kempty falls": "Mussoorie",
    "robbers cave": "Dehradun",
    "sahastradhara": "Dehradun",
    "triveni ghat": "Rishikesh",
    "ram jhula": "Rishikesh",
    "lakshman jhula": "Rishikesh",
    "har ki pauri": "Haridwar",
    "naini lake": "Nainital",
    "naina peak": "Nainital",
    "bhimtal lake": "Bhimtal",
    "naukuchiatal lake": "Naukuchiatal",
    "sattal lake": "Sattal"
}

SPATIAL_PRONOUN_REGEX = re.compile(r"\b(wahan|vahan|udhar|uske paas|wahi|nearby|there|around there|same place|that place|wahan ka|wahan ke|vahan ka|vahan ke|udhar ka|udhar ke)\b", re.IGNORECASE)

ORIGIN_HUBS = [
    "Delhi", "New Delhi", "Noida", "Gurgaon", "Agra", "Chandigarh", "Jaipur", "Mumbai",
    "Lucknow", "Dehradun", "Haridwar", "Rishikesh", "Meerut", "Haldwani", "Bangalore",
    "Kolkata", "Pune", "Ahmedabad", "Hyderabad", "Chennai"
]

def init_destination_registry():
    global DESTINATION_CACHE, ALIAS_MAP, IS_INITIALIZED
    if IS_INITIALIZED and len(DESTINATION_CACHE) > 0:
        return

    dest_map = {}
    seed_dir = settings.SEED_DIR
    seed_files = ["destinations.json", "spiritual.json", "activities.json", "culture.json"]

    for fname in seed_files:
        fpath = seed_dir / fname
        if fpath.exists():
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    items = json.load(f)
                    if isinstance(items, list):
                        for item in items:
                            name = item.get("name")
                            if name and isinstance(name, str):
                                clean = name.strip()
                                key = clean.lower()
                                if key not in dest_map:
                                    dest_map[key] = {
                                        "name": clean,
                                        "slug": item.get("slug") or re.sub(r"[^a-z0-9]+", "-", key).strip("-"),
                                        "district": item.get("district"),
                                        "region": item.get("region"),
                                        "category": item.get("category", "destination")
                                    }
            except Exception as e:
                print(f"[DestinationResolver] Warning reading {fname}: {e}")

    # Sort descending by length so multi-word names match first
    DESTINATION_CACHE = sorted(dest_map.values(), key=lambda d: len(d["name"]), reverse=True)

    ALIAS_MAP.clear()
    for alias, canonical in STATIC_ALIASES.items():
        ALIAS_MAP[alias.lower()] = canonical

    for d in DESTINATION_CACHE:
        ALIAS_MAP[d["name"].lower()] = d["name"]
        if d.get("slug"):
            ALIAS_MAP[d["slug"].replace("-", " ").lower()] = d["name"]

    IS_INITIALIZED = True
    print(f"[DestinationResolver] Initialized with {len(DESTINATION_CACHE)} canonical destinations.")

# Auto-initialize
init_destination_registry()

def resolve_destination(text: str, context: Optional[Dict[str, Any]] = None) -> Optional[Dict[str, Any]]:
    if not text or not isinstance(text, str):
        return None
    clean = text.strip()
    lower = clean.lower()

    # 1. Direct Alias Check
    for alias, canonical_name in ALIAS_MAP.items():
        pattern = rf"\b{re.escape(alias)}\b"
        if re.search(pattern, lower):
            found = next((d for d in DESTINATION_CACHE if d["name"].lower() == canonical_name.lower()), None)
            if found:
                return {
                    "name": found["name"],
                    "slug": found["slug"],
                    "id": found["slug"] or found["name"].lower(),
                    "district": found.get("district"),
                    "region": found.get("region")
                }
            return {
                "name": canonical_name,
                "slug": re.sub(r"[^a-z0-9]+", "-", canonical_name.lower()).strip("-"),
                "id": canonical_name.lower(),
                "district": None,
                "region": None
            }

    # 2. Canonical substring match in descending length order
    for dest in DESTINATION_CACHE:
        pattern = rf"\b{re.escape(dest['name'])}\b"
        if re.search(pattern, clean, re.IGNORECASE):
            return {
                "name": dest["name"],
                "slug": dest["slug"],
                "id": dest["slug"] or dest["name"].lower(),
                "district": dest.get("district"),
                "region": dest.get("region")
            }

    # 3. Spatial Pronoun Resolution ("wahan", "udhar", "uske paas")
    if context and SPATIAL_PRONOUN_REGEX.search(clean):
        ctx_dest = context.get("destination") or context.get("last_destination")
        if ctx_dest:
            return resolve_destination(ctx_dest)

    return None

def extract_entities_from_text(text: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    entities: Dict[str, Any] = {}
    if not text or not isinstance(text, str):
        return entities
    clean = text.strip()

    # 0. Route pair extraction: "Haldwani to Nainital", "Delhi se Nainital", "London to Munsiyari"
    pair_match = re.search(r"\b([A-Za-z]+)\s+(?:to|se|-|->)\s+([A-Za-z]+)", clean, re.IGNORECASE)
    if pair_match:
        c_orig = pair_match.group(1).strip()
        c_dest = pair_match.group(2).strip()
        if not re.match(r"^(main|hum|aap|wahan|yahan|kal|aaj|kahan|travel|please|actually|mujhe|trip)$", c_orig, re.IGNORECASE):
            res_dest = resolve_destination(c_dest, context)
            if res_dest:
                entities["destination"] = res_dest["name"]
                entities["destination_id"] = res_dest["id"]
                if res_dest.get("district"):
                    entities["district"] = res_dest["district"]
                if res_dest.get("region"):
                    entities["region"] = res_dest["region"]
                entities["origin"] = c_orig.capitalize()

    # Destination
    resolved = resolve_destination(clean, context)
    if resolved:
        is_answering_origin = False
        if context and context.get("destination") and not context.get("origin"):
            for hub in ORIGIN_HUBS:
                if clean.lower() == hub.lower() or re.search(rf"^{re.escape(hub)}$", clean, re.IGNORECASE):
                    is_answering_origin = True
                    break
        
        if not is_answering_origin:
            entities["destination"] = resolved["name"]
            entities["destination_id"] = resolved["id"]
            if resolved.get("district"):
                entities["district"] = resolved["district"]
            if resolved.get("region"):
                entities["region"] = resolved["region"]

    # Origin Hubs
    for hub in ORIGIN_HUBS:
        if re.search(rf"\b{re.escape(hub)}\b", clean, re.IGNORECASE):
            is_explicit = re.search(rf"(?:from|start from|starting from)\s+{re.escape(hub)}|{re.escape(hub)}\s+se\b", clean, re.IGNORECASE)
            if is_explicit or clean.lower() == hub.lower() or (context and context.get("destination") and not context.get("origin")):
                entities["origin"] = hub
                break

    if not entities.get("origin"):
        from_match = re.search(r"(?:from|start from|starting from)\s+([A-Za-z]+)", clean, re.IGNORECASE)
        se_match = re.search(r"([A-Za-z]+)\s+se\b", clean, re.IGNORECASE)
        candidate = from_match.group(1).strip() if from_match else (se_match.group(1).strip() if se_match else None)
        if candidate and not re.match(r"^(main|hum|aap|wahan|yahan|kal|aaj|kahan|travel|please|actually|mujhe)$", candidate, re.IGNORECASE):
            is_dest = resolve_destination(candidate)
            if not is_dest or candidate.lower() == "delhi":
                entities["origin"] = candidate.capitalize()

    # Disambiguate if destination was assigned to the origin place (e.g. "Haldwani se Nainital")
    origin_name = entities.get("origin")
    if origin_name and entities.get("destination") and entities["destination"].lower() == origin_name.lower():
        for dest in DESTINATION_CACHE:
            if dest['name'].lower() != origin_name.lower():
                pattern = rf"\b{re.escape(dest['name'])}\b"
                if re.search(pattern, clean, re.IGNORECASE):
                    entities["destination"] = dest["name"]
                    entities["destination_id"] = dest["slug"] or dest["name"].lower()
                    if dest.get("district"):
                        entities["district"] = dest["district"]
                    if dest.get("region"):
                        entities["region"] = dest["region"]
                    break

    # Dates
    month_names = {
        "jan": "01", "january": "01", "feb": "02", "february": "02", "mar": "03", "march": "03",
        "apr": "04", "april": "04", "may": "05", "jun": "06", "june": "06", "jul": "07", "july": "07",
        "aug": "08", "august": "08", "sep": "09", "sept": "09", "september": "09", "oct": "10", "october": "10",
        "nov": "11", "november": "11", "dec": "12", "december": "12"
    }
    date_match = re.search(r"(\d{1,2})\s*(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:\s*(\d{4}))?", clean, re.IGNORECASE)
    if date_match:
        day = date_match.group(1).zfill(2)
        m_str = date_match.group(2).lower()
        month = month_names.get(m_str, "10")
        year = date_match.group(3) or "2026"
        entities["start_date"] = f"{year}-{month}-{day}"
    elif re.search(r"\b(kal|tomorrow)\b", clean, re.IGNORECASE):
        entities["start_date"] = "2026-09-17"
    elif re.search(r"\bnext weekend\b", clean, re.IGNORECASE):
        entities["start_date"] = "2026-09-19"
    elif re.search(r"\bnext month\b", clean, re.IGNORECASE):
        entities["start_date"] = "2026-10-01"

    # Duration
    range_match = re.search(r"(\d+)\s*(?:-|–|to|se)\s*(\d+)\s*(?:days?|din)", clean, re.IGNORECASE)
    if range_match:
        d1 = int(range_match.group(1))
        d2 = int(range_match.group(2))
        entities["duration_min"] = min(d1, d2)
        entities["duration_max"] = max(d1, d2)
        entities["duration_days"] = entities["duration_max"]
    else:
        single_dur = re.search(r"(?:around|approx|about)?\s*(\d+)\s*(?:days?|din)", clean, re.IGNORECASE)
        if single_dur:
            d = int(single_dur.group(1))
            entities["duration_days"] = d
            entities["duration_min"] = d
            entities["duration_max"] = d

    # Travelers
    trav_match = re.search(r"(\d+)\s*(?:person|people|traveler|adult|log(?:on)?)\b", clean, re.IGNORECASE)
    if trav_match:
        entities["travelers"] = int(trav_match.group(1))
    elif re.search(r"\b(hum dono|me and my friend|two of us)\b", clean, re.IGNORECASE):
        entities["travelers"] = 2
    elif re.search(r"\b(solo|alone|single traveler)\b", clean, re.IGNORECASE):
        entities["travelers"] = 1

    # Budget
    budget_k = re.search(r"(?:budget\s*)?(\d+)\s*(?:k|hazar|thousand)\b", clean, re.IGNORECASE)
    if budget_k:
        entities["budget"] = int(budget_k.group(1)) * 1000
    else:
        exp_budget = re.search(r"(?:budget|cost|₹|rs\.?|inr)\s*[:=]?\s*([0-9,]+)", clean, re.IGNORECASE) or \
                     re.search(r"([0-9,]+)\s*(?:rupees?|rs\.?|inr)\b", clean, re.IGNORECASE)
        if exp_budget:
            num = int(exp_budget.group(1).replace(",", ""))
            if num >= 500:
                entities["budget"] = num
        else:
            standalone = re.search(r"\b([1-9]\d{3,6})\b", clean)
            if standalone:
                num = int(standalone.group(1))
                if num >= 1000 and num not in [2026, 2027]:
                    entities["budget"] = num

    if entities.get("budget"):
        b = entities["budget"]
        entities["budget_tier"] = "Budget" if b < 15000 else ("Luxury" if b > 40000 else "Balanced")
    elif re.search(r"\b(cheap|cheaper|low\s*cost)\b", clean, re.IGNORECASE):
        entities["budget_tier"] = "Budget"
    elif re.search(r"\b(luxury|premium|high\s*end)\b", clean, re.IGNORECASE):
        entities["budget_tier"] = "Luxury"

    return entities
