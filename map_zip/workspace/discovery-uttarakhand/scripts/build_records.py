# -*- coding: utf-8 -*-
"""
Build the final MongoDB-ready dataset:
destinations.json, spiritual.json, culture.json, activities.json,
stays.json, rentals.json, guides.json, image-manifest.json, data-summary.json

Rules honoured:
- descriptions from Wikipedia/Wikivoyage are verbatim-from-source (CC BY-SA),
  attributed per record via sourceUrl/sourceName + contentLicense.
- business descriptions are factual summaries composed from structured data
  published by the business itself (no copyrighted prose copied).
- unknown fields are null, never invented.
"""
import json, os, re, glob
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw")
DATA = os.path.join(ROOT, "data")
os.makedirs(DATA, exist_ok=True)
LV = "2026-09-09"

# ---------------------------------------------------------------- helpers
def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def load_raw(kind):
    out = []
    for f in sorted(glob.glob(os.path.join(RAW, kind, "*.json"))):
        r = json.load(open(f))
        out.append(r)
    return out

IPA = re.compile(r"[\u0250-\u02AF\u02B0-\u02FF\u1D00-\u1D7F]")
def clean_sentence(text):
    """remove IPA/pronunciation parentheticals and stray whitespace"""
    def repl(m):
        inner = m.group(0)
        if IPA.search(inner) or "pronounced" in inner.lower() or ":" in inner or "IAST" in inner:
            return ""
        return inner
    text = re.sub(r"\([^()]*\)", repl, text)
    return re.sub(r"\s+", " ", text).strip()

def first_sentences(extract, max_chars=560, n=3):
    """Take the intro (first paragraph) and cut at sentence boundaries."""
    if not extract:
        return "", ""
    intro = extract.split("\n")[0].strip()
    intro = clean_sentence(intro)
    sents = re.split(r"(?<=[.!?])\s+", intro)
    short = sents[0][:240] if sents else intro[:240]
    desc = ""
    for s in sents[:n]:
        if len(desc) + len(s) > max_chars and desc:
            break
        desc += (" " if desc else "") + s
    return desc.strip(), short.strip()

MONTHS = r"(?:January|February|March|April|May|June|July|August|September|October|November|December)"
MON = rf"(?:mid[- ]|early |late )?(?:{MONTHS})"
RANGE = rf"{MON}(?:\s*/\s*{MON})?\s*(?:–|—|-|to|and)\s*{MON}(?:\s*/\s*{MON})?"
DUAL = rf"{RANGE}(?:\s*(?:,|and)\s*(?:again\s+)?(?:from\s+)?{RANGE})?"
RELAXED = rf"{MON}.{{0,35}}?(?:–|—|-|to|and|through).{{0,40}}?{MON}"
DAYNUM = re.compile(rf"\b\d{{1,2}}\s+(?={MONTHS})", re.I)
BEST_PAT = rf"([^.|;\n]{{0,220}}\b(?:best|ideal|recommended|peak season|favourable|favorable|good time|season extends)\b[^.|;\n]{{0,220}})"
BEST_EXCLUDE = re.compile(r"\bbloom\b|mahout|elephant", re.I)
OPEN_PAT = rf"([^.|;\n]{{0,150}}\b(?:opens?|remains? open|is open|tourist seasons?)\b[^.|;\n]{{0,150}})"
OPEN_EXCLUDE = re.compile(r"ropeway|cable|chairlift|gondola|₹|cost|ticket|bus|train|school|office|road", re.I)
OPENCLOSE_PAT = re.compile(
    rf"opens on [^(|;\n]{{0,50}}\([^)]{{0,40}}?({MONTHS})\)[^.|;\n]{{0,90}}?closes on [^(|;\n]{{0,60}}\([^)]{{0,60}}?({MONTHS})\)",
    re.I)

def _clean(val):
    val = re.sub(r"\s*\([^)]*\)", "", val)      # drop parentheticals
    val = DAYNUM.sub("", val)                       # drop leading day numbers
    return re.sub(r"\s+", " ", val).strip()

def _bt_search(text, sentence_pat, relaxed=False):
    for m in re.finditer(sentence_pat, text, re.I):
        sent = m.group(1)
        if sentence_pat is OPEN_PAT and OPEN_EXCLUDE.search(sent):
            continue
        if sentence_pat is BEST_PAT and BEST_EXCLUDE.search(sent):
            continue
        rng = re.search(RELAXED if relaxed else DUAL, sent, re.I)
        if rng:
            return _clean(rng.group(0)), re.sub(r"\s+", " ", sent).strip()[:260]
    return None

def _openclose(text):
    for t in (text, ):
        for m in OPENCLOSE_PAT.finditer(t or ""):
            val = f"{m.group(1)} to {m.group(2)} (temple opening season)"
            return val, re.sub(r"\s+", " ", m.group(0)).strip()[:260]
    return None

def best_time_for(r):
    """Month-range the source explicitly ties to best/ideal visiting, or to a
    temple/shrine/park opening window. Returns (value, supporting sentence)."""
    texts = [t for t in (r.get("extract"), r.get("wikivoyageExtract")) if t]
    for t in texts:
        res = _bt_search(t, BEST_PAT)
        if res:
            return res
    for relaxed in (False, True):
        for t in texts:
            res = _bt_search(t, OPEN_PAT, relaxed)
            if res:
                return res
    for t in texts:
        res = _openclose(t)
        if res:
            return res
    return None

EXPERIENCE_MAP = {
    "Trekking": ["trekk"],
    "Skiing": ["skiing", "ski res", "ski slo"],
    "River Rafting": ["rafting"],
    "Camping": ["camping", "campsites", "camp site"],
    "Wildlife Safari": ["safari"],
    "Wildlife Watching": ["wildlife"],
    "Birdwatching": ["birdwatch", "bird watching", "birdwatching", "birdlife"],
    "Pilgrimage": ["pilgrim", "holy town", "sacred"],
    "Yoga & Wellness": ["yoga", "ashram", "meditation"],
    "Paragliding": ["paraglid"],
    "Mountaineering": ["mountaineer", "mountain climbing", "expedition"],
    "Angling": ["angling", "fishing", "trout"],
    "Boating": ["boating", "boat ride", "paddle boat"],
    "Ropeway Rides": ["ropeway", "cable car", "gondola"],
    "Temple Visits": ["temple", "shrine"],
}

def extract_experiences(text):
    if not text:
        return []
    t = text.lower()
    out = []
    for exp, keys in EXPERIENCE_MAP.items():
        if any(k in t for k in keys):
            out.append(exp)
    return out[:8]

def extract_highlights(text, candidates):
    out = []
    for c in candidates or []:
        if c.lower() in (text or "").lower():
            out.append(c)
    return out

# ---------------------------------------------------------------- destinations
def build_destinations():
    recs = []
    all_names = [r["name"] for r in load_raw("destination")]
    for r in load_raw("destination"):
        desc, short = first_sentences(r.get("extract"))
        rec = {
            "name": r["name"],
            "slug": r["slug"],
            "description": desc,
            "shortDescription": short,
            "district": r.get("curatedDistrict"),
            "region": r.get("region"),
            "latitude": coords_for(r)[0],
            "longitude": coords_for(r)[1],
            "locationSource": coords_for(r)[2],
            "bestTimeToVisit": (lambda x: x[0] if x else None)(best_time_for(r)),
            "bestTimeSourceSentence": (lambda x: x[1] if x else None)(best_time_for(r)),
            "idealDuration": None,
            "budgetLevel": None,
            "experiences": extract_experiences(r.get("extract")),
            "highlights": extract_highlights(r.get("extract"), r.get("highlightCandidates")),
            "nearbyPlaces": [n for n in all_names if n != r["name"] and n.lower() in (r.get("extract") or "").lower()][:6],
            "coverImage": r.get("coverImage"),
            "gallery": r.get("gallery", []),
            "sourceName": "Wikipedia (English)" if r.get("site") != "wikivoyage" else "Wikivoyage (English)",
            "sourceUrl": r.get("pageUrl"),
            "sourcePageUrl": r.get("pageUrl"),
            "contentLicense": "CC BY-SA 4.0",
            "lastVerified": LV,
        }
        if not rec["highlights"] and r.get("type") == "destination":
            # fallback: derive a few highlights from the intro sentence
            pass
        recs.append(rec)
    return recs


# Coordinates from Wikidata (CC0) for entities whose Wikipedia article had none.
# Fetched 2026-09-09 via Wikidata API (wbsearchentities + P625 claims).
WIKIDATA_COORDS = {
    "Chakrata": (30.69, 77.86, "Q858555"),
    "Kanatal": (30.415277777777778, 78.32111111111111, "Q6360738"),
    "Dhari Devi": (30.258084574587347, 78.87738169091006, "Q5269186"),
    "Kedarnath Temple": (30.733335, 79.066659, "Q866014"),
    "Patal Bhuvaneshwar": (29.90763886, 79.60988678, "Q7144196"),
    "Dayara Bugyal Trek": (30.83837, 78.55503, "Q105063084"),
}

def coords_for(r):
    """Return (lat, lon, source) — article coords first, then Wikidata P625."""
    c = r.get("coords")
    if c and c.get("lat") is not None:
        return c["lat"], c["lon"], "Wikipedia article"
    w = WIKIDATA_COORDS.get(r["name"])
    if w:
        return w[0], w[1], f"Wikidata {w[2]} (CC0)"
    return None, None, None

def build_generic(kind, type_label, extra=None):
    recs = []
    for r in load_raw(kind):
        desc, short = first_sentences(r.get("extract"))
        rec = {
            "name": r["name"],
            "slug": r["slug"],
            "description": desc,
            "shortDescription": short,
            "location": r.get("location", ""),
            "district": r.get("curatedDistrict"),
            "region": r.get("region"),
            "latitude": coords_for(r)[0],
            "longitude": coords_for(r)[1],
            "locationSource": coords_for(r)[2],
            "bestTimeToVisit": (lambda x: x[0] if x else None)(best_time_for(r)),
            "bestTimeSourceSentence": (lambda x: x[1] if x else None)(best_time_for(r)),
            "highlights": extract_highlights(r.get("extract"), r.get("highlightCandidates")),
            "experiences": extract_experiences(r.get("extract")),
            "coverImage": r.get("coverImage"),
            "gallery": r.get("gallery", []),
            "sourceName": "Wikipedia (English)" if r.get("site") != "wikivoyage" else "Wikivoyage (English)",
            "sourceUrl": r.get("pageUrl"),
            "sourcePageUrl": r.get("pageUrl"),
            "contentLicense": "CC BY-SA 4.0",
            "lastVerified": LV,
        }
        if extra:
            extra(rec, r)
        recs.append(rec)
    return recs

def spiritual_extra(rec, r):
    rec["type"] = {
        "Kedarnath Temple": "Hindu Temple (Jyotirlinga)",
        "Badrinath Temple": "Hindu Temple (Divya Desam)",
        "Gangotri Temple": "Hindu Temple",
        "Yamunotri Temple": "Hindu Temple",
        "Hemkund Sahib": "Sikh Gurdwara",
        "Tungnath": "Hindu Temple (Panch Kedar)",
        "Madhyamaheshwar": "Hindu Temple (Panch Kedar)",
        "Rudranath": "Hindu Temple (Panch Kedar)",
        "Kalpeshwar": "Hindu Temple (Panch Kedar)",
        "Jageshwar": "Hindu Temple Complex",
        "Baijnath Temple": "Hindu Temple Complex",
        "Kainchi Dham": "Hindu Ashram Temple",
        "Patal Bhuvaneshwar": "Cave Temple",
        "Mansa Devi Temple": "Hindu Temple (Shakti Peetha)",
        "Chandi Devi Temple": "Hindu Temple",
        "Maya Devi Temple": "Hindu Temple (Shakti Peetha)",
        "Har Ki Pauri": "Sacred Ghat",
        "Parmarth Niketan": "Yoga Ashram",
        "Triveni Ghat": "Sacred Ghat",
        "Neelkanth Mahadev Temple": "Hindu Temple",
        "Kasar Devi": "Hindu Temple",
        "Chitai Golu Devta Temple": "Hindu Temple",
        "Surkanda Devi Temple": "Hindu Temple",
        "Dhari Devi": "Hindu Temple",
        "Katarmal Sun Temple": "Hindu Temple (Heritage Monument)",
        "Tapkeshwar Temple": "Hindu Cave Temple",
    }.get(r["name"], "Place of Worship")

def cultural_extra(rec, r):
    rec["type"] = {
        "Forest Research Institute": "Heritage Building & Museum",
        "Gurney House": "Heritage House Museum",
        "Advaita Ashrama (Mayawati)": "Heritage Ashram & Library",
        "St. John in the Wilderness Church": "Heritage Church",
        "Dwarahat": "Temple Complex & Heritage Town",
        "G.B. Pant High Altitude Zoo": "High-Altitude Zoo",
        "Christ Church, Mussoorie": "Heritage Church",
    }.get(r["name"], "Cultural Site")

def activity_extra(rec, r):
    rec["category"] = r.get("category", "")
    d = None
    m = re.search(r"(easy|moderate|difficult|strenuous)(?:\s+(?:to|-)\s+(easy|moderate|difficult|strenuous))?", (r.get("extract") or ""), re.I)
    if m and re.search(r"trek|trail|hike", (r.get("extract") or ""), re.I):
        d = m.group(0).lower()
    rec["difficulty"] = d

# ---------------------------------------------------------------- stays
KMVN_CITY = {
    "trh-kausani-trishul": "Kausani", "trh-baijnath": "Baijnath", "trh-binsar-nanda-devi-trh-binsar": "Binsar",
    "trh-katarmal": "Katarmal (near Almora)", "trh-monal-ranikhet": "Ranikhet",
    "trh-chilianaula-ranikhet-himadri": "Chilianaula (Ranikhet)", "trh-ranikhet-kalika": "Kalika (Ranikhet)",
    "trh-trh-sitlakhet": "Shitlakhet", "gyan-vriksh-trh-kakrighat": "Kakrighat",
    "trh-mohaan": "Mohan (Ramganga valley)", "trh-khairna": "Khairna", "trh-jageshwar": "Jageshwar",
    "trh-chaukori": "Chaukori", "trh-patal-bhuvneshwar": "Patal Bhuvaneshwar", "trh-gangolihat": "Gangolihat",
    "trh-pithoragarh": "Pithoragarh", "trh-didihat": "Didihat", "trh-dharchula": "Dharchula",
    "trh-munsyari": "Munsiyari", "trh-birthi": "Birthi", "trh-champawat": "Champawat",
    "trh-lohaghat": "Lohaghat", "trh-abbott-mount": "Abbott Mount", "trh-tanakpur": "Tanakpur",
    "trh-bhikiyasen": "Bhikiyasen", "trh-deenapani": "Deenapani (Binsar road)", "trh-bhowali": "Bhowali",
    "holiday-home-almora": "Almora", "trh-jaspur": "Jaspur", "trh-nanakmatta": "Nanakmatta",
    "trh-sukhatal-nainital-mount-view": "Nainital (Sukhatal)", "trh-tallital-nainital-sarovar": "Nainital (Tallital)",
    "trh-snow-view-nainital-snow-view-heritage": "Nainital (Snow View)", "trh-mukteshwar": "Mukteshwar",
    "trh-ramgarh": "Ramgarh", "trh-padampuri": "Padampuri", "trh-sattal": "Sattal",
    "sarovar-bliss-trh-bhimtal": "Bhimtal", "nine-corner-retreat-trh-naukuchiyatal": "Naukuchiatal",
    "parichay-resort-naukuchiyatal": "Naukuchiatal", "trh-ramnagar": "Ramnagar",
    "holiday-home-dhikuli": "Dhikuli (Ramnagar)", "jungle-camp-sigri-tent-sharing-accommodation": "Sigri (Ramnagar)",
    "trh-narayan-ashram": "Narayan Ashram (Darma Valley)", "budhi-camp": "Budhi (Darma Valley)",
    "gunji-camp-sharing-accommodation": "Gunji (Adi Kailash route)", "jyolingkong-camp": "Jyolingkong (Adi Kailash)",
    "nabhidang-camp": "Nabhidang (Adi Kailash route)", "trh-dudhauli": "Dudhauli (Dwarahat)",
}
# contact-page TRH phone table (official, authoritative)
TRH_PHONE = {
    "trh-kausani-trishul": "8650002545", "trh-baijnath": "8650002548", "trh-binsar-nanda-devi-trh-binsar": "8650002537, 7579415101",
    "trh-katarmal": None,  # not in official table; page number ambiguous -> null (flagged)
    "trh-monal-ranikhet": "9411542378", "trh-chilianaula-ranikhet-himadri": "8650002534",
    "trh-ranikhet-kalika": "9410747595", "trh-trh-sitlakhet": "9012616706",
    "gyan-vriksh-trh-kakrighat": "8650002533", "trh-mohaan": "9758330867", "trh-khairna": "8650002529",
    "trh-jageshwar": "05962263028", "trh-chaukori": "8650002542", "trh-patal-bhuvneshwar": "8650002543",
    "trh-gangolihat": "8650002552", "trh-pithoragarh": "8650002538", "trh-didihat": "8650002539",
    "trh-dharchula": "7534001723", "trh-munsyari": "7534001701", "trh-birthi": "9917894096",
    "trh-champawat": "8650002550", "trh-lohaghat": "9917905539", "trh-abbott-mount": "9917905539",
    "trh-tanakpur": "8650002551", "trh-bhikiyasen": "8958736031", "trh-deenapani": "8650002553",
    "trh-bhowali": "8650002522", "holiday-home-almora": "8650002532", "trh-jaspur": "7534001708",
    "trh-nanakmatta": "8650666657", "trh-sukhatal-nainital-mount-view": "8650002518",
    "trh-tallital-nainital-sarovar": "8650002519", "trh-snow-view-nainital-snow-view-heritage": "9411108017",
    "trh-mukteshwar": "8650002528", "trh-ramgarh": "8650002531", "trh-padampuri": "8650002590",
    "trh-sattal": "8650002530", "sarovar-bliss-trh-bhimtal": "8650002523",
    "nine-corner-retreat-trh-naukuchiyatal": "8650002524", "parichay-resort-naukuchiyatal": "7534001728",
    "trh-ramnagar": "8650002527", "holiday-home-dhikuli": "8650002598",
    "jungle-camp-sigri-tent-sharing-accommodation": "9410120865", "trh-narayan-ashram": None,
    "budhi-camp": None, "gunji-camp-sharing-accommodation": "7579231550",
    "jyolingkong-camp": "7579231550", "nabhidang-camp": "7579231550", "trh-dudhauli": "7505635126",
}

def min_tariff(rooms):
    prices = []
    for r in rooms or []:
        m = re.search(r"([\d,]+)", r.get("tariff") or "")
        if m:
            prices.append(int(m.group(1).replace(",", "")))
    return min(prices) if prices else None

def build_stays():
    recs = []
    props = json.load(open(os.path.join(RAW, "kmvn", "kmvn_properties_v2.json")))
    for p in props:
        slug = p["slug"]
        city = KMVN_CITY.get(slug, p["name"])
        price = min_tariff(p.get("rooms"))
        cat = "Government Eco Camp" if "camp" in slug else "Government Tourist Rest House"
        room_types = sorted({r.get("roomType") for r in (p.get("rooms") or []) if r.get("roomType")})
        facs = p.get("facilities", [])
        desc = (f"Official tourist accommodation run by Kumaon Mandal Vikas Nigam (KMVN), the Uttarakhand "
                f"government tourism undertaking for the Kumaon region, at {city} in {p.get('district')} district. "
                f"Published facilities: {', '.join(facs) if facs else 'see KMVN page'}. "
                f"Room types listed: {', '.join(room_types[:6]) if room_types else 'see KMVN page'}.")
        rec = {
            "name": f"KMVN {p['name']}",
            "slug": slugify("kmvn-" + p["name"]),
            "description": desc,
            "city": city,
            "district": p.get("district"),
            "address": p.get("address"),
            "latitude": None, "longitude": None,
            "category": cat,
            "pricePerNight": price,
            "currency": "INR",
            "priceLastChecked": LV,
            "priceNotes": ("Lowest room tariff shown in KMVN's official booking widget for a 10 Oct 2026 stay, "
                           "GST included, as published on kmvn.in. Tariffs vary by date and season.") if price else None,
            "roomTypes": room_types,
            "rating": None, "reviewCount": None,
            "amenities": facs,
            "contact": {
                "phone": TRH_PHONE.get(slug) or p.get("phone"),
                "website": f"https://www.kmvn.in/hotels/{slug}",
            },
            "images": [],
            "sourceName": "Kumaon Mandal Vikas Nigam (kmvn.in, official)",
            "sourceUrl": f"https://www.kmvn.in/hotels/{slug}",
            "sourcePageUrl": f"https://www.kmvn.in/hotels/{slug}",
            "lastVerified": LV,
        }
        recs.append(rec)
    # Wikipedia-documented heritage hotels
    for r in load_raw("stays"):
        desc, short = first_sentences(r.get("extract"))
        rec = {
            "name": r["name"],
            "slug": r["slug"],
            "description": desc,
            "shortDescription": short,
            "city": r.get("location"),
            "district": r.get("curatedDistrict"),
            "address": None,
            "latitude": (r.get("coords") or {}).get("lat") if r.get("coords") else None,
            "longitude": (r.get("coords") or {}).get("lon") if r.get("coords") else None,
            "locationSource": r.get("coordsSource"),
            "category": "Heritage Luxury Hotel" if "Savoy" in r["name"] else "Luxury Destination Spa Resort",
            "pricePerNight": None,
            "currency": "INR",
            "priceLastChecked": None,
            "priceNotes": "Rates not published on the source; check the operator's official channels.",
            "roomTypes": [],
            "rating": None, "reviewCount": None,
            "amenities": [],
            "contact": {"phone": None, "website": None},
            "images": ([r["coverImage"]] if r.get("coverImage") else []) + r.get("gallery", []),
            "sourceName": "Wikipedia (English)",
            "sourceUrl": r["pageUrl"],
            "sourcePageUrl": r["pageUrl"],
            "contentLicense": "CC BY-SA 4.0",
            "lastVerified": LV,
        }
        recs.append(rec)
    return recs

# ---------------------------------------------------------------- rentals
def build_rentals():
    LVr = LV
    rentals = [
        {
            "name": "Himanshu Bike Rent in Rishikesh",
            "slug": "himanshu-bike-rent-rishikesh",
            "city": "Rishikesh", "district": "Dehradun",
            "category": "Bike & Scooter Rental",
            "description": ("Self-drive bike and scooter rental in Rishikesh (shop near Nepali Farm, Shyampur, "
                            "Haat Bazar). Offers Honda Activa, TVS Jupiter, TVS NTorq, TVS Apache, Royal Enfield "
                            "Classic 350 and Royal Enfield Himalayan 410 with helmets included; open 24x7 with "
                            "returns by 8 PM, per its official website."),
            "vehicles": [
                {"name": "Honda Activa 6G", "type": "Scooter", "pricePerDay": 600},
                {"name": "TVS Jupiter", "type": "Scooter", "pricePerDay": 600},
                {"name": "TVS NTorq 125", "type": "Scooter", "pricePerDay": 600},
                {"name": "TVS Apache RTR 160", "type": "Motorcycle", "pricePerDay": 1300},
                {"name": "Royal Enfield Classic 350", "type": "Motorcycle", "pricePerDay": 1200},
                {"name": "Royal Enfield Himalayan 410", "type": "Motorcycle", "pricePerDay": 1500},
            ],
            "rating": 4.9, "reviewCount": 200,
            "ratingSource": "aggregateRating published in the business website's structured data (self-reported; verify on Google Maps)",
            "address": "Haat Bazar, near Nepali Farm, Shyampur, Rishikesh, Uttarakhand 249204",
            "latitude": 30.0869, "longitude": 78.2676,
            "phone": "+91 98707 11571", "website": "https://bikerentinrishikesh.in/",
            "sourceUrl": "https://bikerentinrishikesh.in/",
            "priceNotes": "Per-day rates as published on the website (homepage also advertises monseason 'from ₹500/day' offers).",
        },
        {
            "name": "Tour On 2 Wheelers",
            "slug": "tour-on-2-wheelers-rishikesh",
            "city": "Rishikesh", "district": "Dehradun",
            "category": "Bike & Scooter Rental",
            "description": ("Bike and scooter rental on Haridwar Road, Rishikesh, also offering river rafting, "
                            "camping and tour packages. Fleet includes Royal Enfield Himalayan 450/411 and Classic "
                            "350 plus scooters, with free delivery within Rishikesh, per its official website."),
            "vehicles": [
                {"name": "Royal Enfield Himalayan 450", "type": "Motorcycle", "pricePerDay": 2000},
                {"name": "Royal Enfield Himalayan 411", "type": "Motorcycle", "pricePerDay": 1800},
                {"name": "Royal Enfield Classic 350", "type": "Motorcycle", "pricePerDay": 1200},
                {"name": "Scooty (Activa/Access class)", "type": "Scooter", "pricePerDay": 500},
            ],
            "rating": None, "reviewCount": None,
            "address": "Haridwar Road, Gali Number 04, Opposite Nagar Nigam, Rishikesh, Uttarakhand",
            "latitude": None, "longitude": None,
            "phone": "+91 73005 88599, +91 78188 53478", "website": "https://touron2wheelers.com/",
            "sourceUrl": "https://touron2wheelers.com/bike-rental-in-rishikesh/",
            "priceNotes": "Per-day rates as published on the website's Rishikesh bike rental page.",
        },
        {
            "name": "Dehradun Bike Rentals",
            "slug": "dehradun-bike-rentals",
            "city": "Dehradun", "district": "Dehradun",
            "category": "Bike & Scooter Rental",
            "description": ("Bike and scooter rental located near Dehradun Railway Station and ISBT. Full-day and "
                            "half-day (2-8 PM) rates for scooters (Activa/Access/Jupiter), TVS Apache, Bajaj "
                            "Avenger, Royal Enfield Classic 350, Thunderbird and Himalayan, per its official website."),
            "vehicles": [
                {"name": "Scooty / Activa / Jupiter / Access", "type": "Scooter", "pricePerDay": 550},
                {"name": "TVS Apache", "type": "Motorcycle", "pricePerDay": 850},
                {"name": "Bajaj Avenger", "type": "Motorcycle", "pricePerDay": 850},
                {"name": "Royal Enfield Classic 350 (Bullet)", "type": "Motorcycle", "pricePerDay": 1200},
                {"name": "Royal Enfield Thunderbird", "type": "Motorcycle", "pricePerDay": 1400},
                {"name": "Royal Enfield Himalayan", "type": "Motorcycle", "pricePerDay": 1600},
            ],
            "rating": None, "reviewCount": None,
            "address": "Near Railway Station and ISBT, Dehradun (exact street not published)",
            "latitude": None, "longitude": None,
            "phone": "+91 78953 22933, +91 97195 96083", "website": "https://www.dehradunbikerentals.com/",
            "sourceUrl": "https://www.dehradunbikerentals.com/",
            "priceNotes": "Full-day per-day rates as published on the website's price list (half-day rates also published).",
        },
        {
            "name": "Nainital Biker",
            "slug": "nainital-biker",
            "city": "Nainital", "district": "Nainital",
            "category": "Bike & Scooter Rental",
            "description": ("Bike and scooter rental serving Nainital, Bhimtal, Khurpatal, Kathgodam, Haldwani, "
                            "Mukteshwar, Ramnagar and Almora. Fleet includes Royal Enfield Himalayan, Enfield, "
                            "Avenger, Apache and Activa, per its official website."),
            "vehicles": [
                {"name": "Royal Enfield Himalayan", "type": "Motorcycle", "pricePerDay": None},
                {"name": "Royal Enfield (Classic/Standard)", "type": "Motorcycle", "pricePerDay": None},
                {"name": "Bajaj Avenger", "type": "Motorcycle", "pricePerDay": None},
                {"name": "TVS Apache", "type": "Motorcycle", "pricePerDay": None},
                {"name": "Honda Activa", "type": "Scooter", "pricePerDay": None},
            ],
            "rating": None, "reviewCount": None,
            "address": "Nainital (exact street not published; delivery across service towns)",
            "latitude": None, "longitude": None,
            "phone": "+91 78957 07150, +91 97197 19117", "website": "https://www.nainitalbiker.com/",
            "sourceUrl": "https://www.nainitalbiker.com/",
            "priceNotes": "Per-day rates not published on the website; enquire directly.",
        },
        {
            "name": "Kathgodam Bike Rental",
            "slug": "kathgodam-bike-rental",
            "city": "Kathgodam (Nainital)", "district": "Nainital",
            "category": "Bike & Scooter Rental",
            "description": ("Family-run bike and scooty rental at Hydel Gate, Kathgodam (the railhead for Nainital). "
                            "Royal Enfield Classic/Standard 350 and Honda Activa 125 / Yamaha Ray ZR 125 available; "
                            "one helmet included, ₹2000 refundable deposit, 6 AM-9 PM timings, per its official website."),
            "vehicles": [
                {"name": "Royal Enfield Classic 350", "type": "Motorcycle", "pricePerDay": 1100},
                {"name": "Royal Enfield Standard 350", "type": "Motorcycle", "pricePerDay": 1100},
                {"name": "Yamaha Ray ZR 125", "type": "Scooter", "pricePerDay": 700},
                {"name": "Honda Activa 125", "type": "Scooter", "pricePerDay": 700},
            ],
            "rating": None, "reviewCount": None,
            "address": "Hydel Gate, Kathgodam, Nainital, Uttarakhand 263126",
            "latitude": None, "longitude": None,
            "phone": "+91 94567 88570, 05946 796912", "website": "http://www.kathgodambikerent.com/",
            "sourceUrl": "http://www.kathgodambikerent.com/bike-rent-price/",
            "priceNotes": "Per-day rates as published on the website's Models & Prices page (rentals from ₹500/day advertised on the homepage).",
        },
        {
            "name": "Roadcrafts Self Drive Cars",
            "slug": "roadcrafts-self-drive-cars-dehradun",
            "city": "Dehradun", "district": "Dehradun",
            "category": "Self-Drive Car Rental",
            "description": ("Dehradun-based self-drive car rental near ISBT (Haridwar Bypass Road, Morowala). Fleet "
                            "includes Maruti Fronx, Swift, Dzire, Hyundai Creta/Venue/i10/i20, Mahindra Thar, "
                            "Scorpio, Toyota Innova Crysta and Kia Seltos; also serves Haridwar, Rishikesh and "
                            "outstation routes, per its official website."),
            "vehicles": [
                {"name": "Maruti Suzuki Swift / Dzire", "type": "Hatchback/Sedan", "pricePerDay": None},
                {"name": "Hyundai Creta / Venue / i20", "type": "Compact SUV/Hatchback", "pricePerDay": None},
                {"name": "Mahindra Thar", "type": "4x4 SUV", "pricePerDay": None},
                {"name": "Mahindra Scorpio Classic", "type": "SUV", "pricePerDay": None},
                {"name": "Toyota Innova Crysta", "type": "MPV", "pricePerDay": None},
                {"name": "Kia Seltos (Automatic)", "type": "SUV", "pricePerDay": None},
            ],
            "rating": None, "reviewCount": None,
            "address": "Sanskriti Lok Colony, Haridwar Bypass Rd, near ISBT, Morowala, Brahmanwala, Dehradun, Uttarakhand 248001",
            "latitude": 30.3165, "longitude": 78.0322,
            "phone": "+91 79837 35072, +91 95280 95883", "website": "https://www.selfdrivecar.co.in/",
            "sourceUrl": "https://www.selfdrivecar.co.in/our-services/self-drive-car-rental/",
            "priceNotes": "Website publishes an overall price range of Rs 1,399-4,599/day; model-wise rates on enquiry.",
        },
        {
            "name": "Car Starq",
            "slug": "car-starq-dehradun",
            "city": "Dehradun", "district": "Dehradun",
            "category": "Self-Drive Car Rental",
            "description": ("Self-drive car rental on Saharanpur Road, Majra, Dehradun, with doorstep delivery and "
                            "24/7 support. Fleet includes Maruti Brezza, Mahindra Thar and Hyundai Creta; serves "
                            "local sightseeing, Mussoorie, Rishikesh and Char Dham routes, per its official website."),
            "vehicles": [
                {"name": "Maruti Vitara Brezza", "type": "Compact SUV", "pricePerDay": None},
                {"name": "Mahindra Thar", "type": "4x4 SUV", "pricePerDay": None},
                {"name": "Hyundai Creta", "type": "SUV", "pricePerDay": None},
            ],
            "rating": None, "reviewCount": None,
            "address": "Saharanpur Rd, opposite Punjab & Sind Bank, Majra, Dehradun, Uttarakhand 248171",
            "latitude": None, "longitude": None,
            "phone": "+91 81263 56063", "website": "https://www.carstarq.com/",
            "sourceUrl": "https://www.carstarq.com/",
            "priceNotes": "Website advertises self-drive rentals 'from ₹999/day'; model-wise rates on enquiry.",
        },
        {
            "name": "Finchant Self Drive Cars",
            "slug": "finchant-self-drive-cars-dehradun",
            "city": "Dehradun", "district": "Dehradun",
            "category": "Self-Drive Car Rental",
            "description": ("Self-drive car rental in Dehradun with doorstep and Jolly Grant Airport pickup/drop. "
                            "Hatchbacks, sedans and SUVs on daily, weekly and monthly plans; timings 7 AM-11 PM, "
                            "per its official website."),
            "vehicles": [
                {"name": "Hatchback (Maruti/Hyundai/Toyota/Renault)", "type": "Hatchback", "pricePerDay": 1500},
                {"name": "Sedan (Maruti)", "type": "Sedan", "pricePerDay": 2500},
                {"name": "SUV (Mahindra/Tata/Hyundai)", "type": "SUV", "pricePerDay": 3500},
            ],
            "rating": 4.9, "reviewCount": 286,
            "ratingSource": "aggregateRating published in the business website's structured data (self-reported; verify independently)",
            "address": "Dehradun (exact street not published on homepage)",
            "latitude": None, "longitude": None,
            "phone": "+91 70173 65715", "website": "https://www.finchant.com/",
            "sourceUrl": "https://www.finchant.com/",
            "priceNotes": "Category-wise per-day rates as published on the website (fleet range ₹1,500-5,000/day).",
        },
        {
            "name": "A-One Self Drive",
            "slug": "a-one-self-drive-dehradun",
            "city": "Dehradun", "district": "Dehradun",
            "category": "Self-Drive Car Rental",
            "description": ("Self-drive car rental at Shop No. 17, Haridwar Bypass Road (ISBT), Niranjanpur, "
                            "Dehradun. Offers hatchbacks, sedans, SUVs, 4x4s and compact SUVs with delivery to the "
                            "traveler's location, per its official website."),
            "vehicles": [
                {"name": "Hatchback", "type": "Hatchback", "pricePerDay": None},
                {"name": "Sedan", "type": "Sedan", "pricePerDay": None},
                {"name": "SUV / 4x4", "type": "SUV", "pricePerDay": None},
                {"name": "Compact SUV", "type": "Compact SUV", "pricePerDay": None},
            ],
            "rating": 4.9, "reviewCount": 11,
            "ratingSource": "aggregateRating published in the business website's structured data (self-reported; verify independently)",
            "address": "Shop No. 17, Haridwar Bypass Road, ISBT, Niranjanpur, Dehradun, Uttarakhand 248001",
            "latitude": None, "longitude": None,
            "locationNotes": "Business website publishes schema.org coordinates that resolve to Ludhiana, Punjab (30.90N 75.86E), inconsistent with its published Dehradun address; coordinates therefore nulled pending verification.",
            "phone": "+91 96278 06602", "website": "https://www.aoneselfdrive.com/",
            "sourceUrl": "https://www.aoneselfdrive.com/",
            "priceNotes": "Website publishes an overall price range of Rs 1,500-4,400/day; model-wise rates on enquiry.",
        },
    ]
    out = []
    for r in rentals:
        rec = dict(r)
        rec["images"] = []  # business site images have no reuse licence -> not collected
        rec["sourceName"] = "Business official website"
        rec["sourcePageUrl"] = r["sourceUrl"]
        rec["priceLastChecked"] = LVr
        rec["currency"] = "INR"
        rec["lastVerified"] = LVr
        rec["district"] = r["district"]
        out.append(rec)
    return out

# ---------------------------------------------------------------- guides
def build_guides():
    guides = json.load(open(os.path.join(RAW, "guides_all.json")))
    recs, used_slugs = [], set()
    for g in guides:
        base = slugify(g["name"]) or "guide"
        slug = base
        i = 2
        while slug in used_slugs:
            slug = f"{base}-{i}"; i += 1
        used_slugs.add(slug)
        profile = f"https://touristguide.uttarakhandtourism.gov.in/guides/{g['id']}"
        rec = {
            "name": g["name"],
            "slug": slug,
            "bio": g.get("bio") or None,
            "location": ", ".join(g.get("districts", [])[:4]) + (" and more" if len(g.get("districts", [])) > 4 else ""),
            "districts": g.get("districts", []),
            "languages": g.get("languages", []),
            "specialties": g.get("expertise", []),
            "experience": f"{g.get('experienceYears')} years" if g.get("experienceYears") is not None else None,
            "rating": g.get("rating"),
            "reviewCount": g.get("reviewCount") if g.get("reviewCount") else None,
            "phone": g.get("phone") or None,
            "website": profile,
            "profileImage": None,   # platform serves a placeholder graphic, not a real photo
            "verifiedByGovt": True,
            "verificationStatus": g.get("status"),
            "sourceName": "Uttarakhand Tourism Development Board - Official Tourist Guide Platform",
            "sourceUrl": profile,
            "sourcePageUrl": "https://touristguide.uttarakhandtourism.gov.in/guides",
            "lastVerified": LV,
        }
        recs.append(rec)
    return recs

# ---------------------------------------------------------------- manifest + summary
def build_manifest(all_sets):
    manifest = []
    seen_urls = set()
    dupes = 0
    for entity_type, recs in all_sets.items():
        for rec in recs:
            imgs = []
            cov = rec.get("coverImage")
            if cov:
                imgs.append(cov)
            imgs += rec.get("gallery", []) or []
            if rec.get("images") and entity_type == "stay":
                imgs += rec["images"]
            for im in imgs:
                if not im or not im.get("url"):
                    continue
                if im["url"] in seen_urls:
                    dupes += 1
                    continue
                seen_urls.add(im["url"])
                manifest.append({
                    "entityId": rec["slug"],
                    "entityType": entity_type,
                    "imageUrl": im["url"],
                    "sourcePage": im.get("sourcePage"),
                    "license": im.get("license"),
                    "attribution": im.get("attribution"),
                    "alt": im.get("alt"),
                    "imageSource": im.get("source", "Wikimedia Commons"),
                })
    return manifest, dupes

def main():
    destinations = build_destinations()
    spiritual = build_generic("spiritual", "spiritual place", spiritual_extra)
    cultural = build_generic("cultural", "cultural place", cultural_extra)
    activities = build_generic("activity", "activity", activity_extra)
    stays = build_stays()
    rentals = build_rentals()
    guides = build_guides()

    all_sets = {
        "destination": destinations, "spiritual": spiritual, "cultural": cultural,
        "activity": activities, "stay": stays,
    }
    manifest, manifest_dupes = build_manifest(all_sets)

    out = {
        "destinations.json": destinations,
        "spiritual.json": spiritual,
        "culture.json": cultural,
        "activities.json": activities,
        "stays.json": stays,
        "rentals.json": rentals,
        "guides.json": guides,
        "image-manifest.json": manifest,
    }
    for fn, data in out.items():
        with open(os.path.join(DATA, fn), "w") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"wrote {fn}: {len(data)} records")

    # summary
    def missing_images(recs):
        n = 0
        for r in recs:
            if not r.get("coverImage") and not r.get("images"):
                n += 1
        return n
    summary = {
        "destinations": len(destinations),
        "rentals": len(rentals),
        "stays": len(stays),
        "guides": len(guides),
        "spiritualPlaces": len(spiritual),
        "culturalPlaces": len(cultural),
        "activities": len(activities),
        "images": len(manifest),
        "duplicatesRemoved": manifest_dupes,
        "recordsWithMissingImages": missing_images(destinations) + missing_images(spiritual) + missing_images(cultural) + missing_images(activities) + missing_images(stays),
        "lastVerified": LV,
    }
    with open(os.path.join(DATA, "data-summary.json"), "w") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print("summary:", json.dumps(summary))

if __name__ == "__main__":
    main()
