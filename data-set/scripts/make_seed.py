#!/usr/bin/env python3
"""
Transform data/*.json (analysis-shaped) into seed/*.json (MongoDB-document-shaped)
matching the application architecture agreed with the user:

- GeoJSON `location: {type: "Point", coordinates: [lng, lat]}` (null when unknown)
- `coverImage` / `gallery` / `images`: {url, publicId: null, source, sourcePage,
  license, attribution, alt}  (publicId filled after Cloudinary upload)
- stays: top-level phone/email (email recovered from raw KMVN scrape),
  `price: {amount, currency}`, `facilities`
- rentals: vehicles with normalized `type` enum + `typeDetail` (original label)
- guides: `profileUrl` (renamed from website)

No values are invented: unknown fields are null/omitted, provenance preserved.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
SEED = os.path.join(ROOT, "seed")
LV_NOTE = "Set after Cloudinary upload"

os.makedirs(SEED, exist_ok=True)


def load(fn):
    with open(os.path.join(DATA, fn)) as f:
        return json.load(f)


def point(lat, lon):
    """GeoJSON Point with [lng, lat] order; None when coordinates unknown."""
    if lat is None or lon is None:
        return None
    return {"type": "Point", "coordinates": [round(lon, 7), round(lat, 7)]}


def img(im):
    """License-preserving image document; publicId null until Cloudinary upload."""
    if not im:
        return None
    return {
        "url": im.get("url"),
        "publicId": None,  # assigned by the Cloudinary migration (phase 2)
        "source": im.get("source", "Wikimedia Commons"),
        "sourcePage": im.get("sourcePage"),
        "license": im.get("license"),
        "attribution": im.get("attribution"),
        "alt": im.get("alt"),
    }


def provenance(r, out):
    for k in ["sourceName", "sourceUrl", "sourcePageUrl", "contentLicense", "lastVerified"]:
        if r.get(k) is not None:
            out[k] = r[k]
    return out


def place(r):
    """destinations / spiritual / culture / activities share one shape."""
    out = {
        "name": r["name"],
        "slug": r["slug"],
        "description": r.get("description"),
        "shortDescription": r.get("shortDescription"),
        "district": r.get("district"),
        "region": r.get("region"),
        "location": point(r.get("latitude"), r.get("longitude")),
        "locationSource": r.get("locationSource"),
        "bestTimeToVisit": r.get("bestTimeToVisit"),
        "bestTimeSourceSentence": r.get("bestTimeSourceSentence"),
        "idealDuration": r.get("idealDuration"),   # null — do not fabricate
        "budgetLevel": r.get("budgetLevel"),       # null — do not fabricate
        "experiences": r.get("experiences") or [],
        "highlights": r.get("highlights") or [],
        "nearbyPlaces": r.get("nearbyPlaces") or [],
        "coverImage": img(r.get("coverImage")),
        "gallery": [img(g) for g in (r.get("gallery") or [])],
        "category": r.get("category"),  # activities/culture/spiritual carry one
    }
    out = {k: v for k, v in out.items() if v is not None or k in
           ("location", "bestTimeToVisit", "idealDuration", "budgetLevel", "shortDescription",
            "locationSource", "bestTimeSourceSentence")}
    return provenance(r, out)


def stay(r, kmvn_email):
    out = {
        "name": r["name"],
        "slug": r["slug"],
        "description": r.get("description"),
        "shortDescription": r.get("shortDescription"),
        "city": r.get("city"),
        "district": r.get("district"),
        "address": r.get("address"),
        "location": point(r.get("latitude"), r.get("longitude")),
        "locationSource": r.get("locationSource"),
        "category": r.get("category"),  # Government Tourist Rest House / Eco Camp / Heritage...
        "phone": (r.get("contact") or {}).get("phone"),
        "email": kmvn_email.get(r["name"]),  # raw KMVN scrape; None for heritage hotels
        "website": (r.get("contact") or {}).get("website"),
        "facilities": r.get("amenities") or [],
        "roomTypes": r.get("roomTypes") or [],
        "price": ({"amount": r["pricePerNight"], "currency": r.get("currency") or "INR"}
                  if r.get("pricePerNight") is not None else None),
        "priceNotes": r.get("priceNotes"),
        "priceLastChecked": r.get("priceLastChecked"),
        "rating": r.get("rating"),          # null — no attributable rating source
        "reviewCount": r.get("reviewCount"),
        "images": [img(i) for i in (r.get("images") or [])],
    }
    return provenance(r, out)


VEHICLE_TYPE = {
    "Scooter": "Scooter", "Motorcycle": "Motorcycle", "Hatchback": "Hatchback",
    "Sedan": "Sedan", "SUV": "SUV", "Compact SUV": "SUV", "4x4 SUV": "SUV",
    "Compact SUV/Hatchback": "SUV", "Hatchback/Sedan": "Hatchback", "MPV": "MPV",
}


def rental(r):
    vehicles = []
    for v in r.get("vehicles") or []:
        vehicles.append({
            "name": v.get("name"),
            "type": VEHICLE_TYPE.get(v.get("type"), v.get("type")),  # clean enum
            "typeDetail": v.get("type"),   # original hand-assigned label preserved
            "pricePerDay": v.get("pricePerDay"),   # null when not published
            "priceNotes": None,            # business-level priceNotes carries the range
        })
    out = {
        "name": r["name"],
        "slug": r["slug"],
        "description": r.get("description"),
        "city": r.get("city"),
        "district": r.get("district"),
        "category": r.get("category"),   # Bike & Scooter Rental / Self Drive Car Rental
        "address": r.get("address"),
        "location": point(r.get("latitude"), r.get("longitude")),
        "locationNotes": r.get("locationNotes"),
        "phone": r.get("phone"),
        "website": r.get("website"),
        "vehicles": vehicles,
        "priceNotes": r.get("priceNotes"),
        "priceLastChecked": r.get("priceLastChecked"),
        "currency": r.get("currency") or "INR",
        "rating": r.get("rating"),
        "reviewCount": r.get("reviewCount"),
        "ratingSource": r.get("ratingSource"),  # caveat for self-reported ratings
        "images": [img(i) for i in (r.get("images") or [])],
    }
    return provenance(r, out)


def guide(r):
    out = {
        "name": r["name"],
        "slug": r["slug"],
        "bio": r.get("bio"),
        "location": r.get("location"),
        "districts": r.get("districts") or [],
        "languages": r.get("languages") or [],
        "specialties": r.get("specialties") or [],
        "experience": r.get("experience"),
        "phone": r.get("phone"),
        "profileUrl": r.get("website"),      # UTDB profile page
        "profileImage": r.get("profileImage"),  # null — no reuse licence
        "rating": r.get("rating"),
        "reviewCount": r.get("reviewCount"),
        "verifiedByGovt": r.get("verifiedByGovt"),
        "verificationStatus": r.get("verificationStatus"),
    }
    return provenance(r, out)


def main():
    # email map from the raw KMVN scrape, matched by stay name
    # (built stay slugs are name-derived and differ from KMVN site slugs for 8 properties)
    kmvn_raw = json.load(open(os.path.join(ROOT, "raw", "kmvn", "kmvn_properties_v2.json")))
    kmvn_email = {("KMVN " + p["name"]).strip(): p.get("email") for p in kmvn_raw}

    outputs = {
        "destinations": [place(r) for r in load("destinations.json")],
        "spiritual": [place(r) for r in load("spiritual.json")],
        "culture": [place(r) for r in load("culture.json")],
        "activities": [place(r) for r in load("activities.json")],
        "stays": [stay(r, kmvn_email) for r in load("stays.json")],
        "rentals": [rental(r) for r in load("rentals.json")],
        "guides": [guide(r) for r in load("guides.json")],
    }
    for name, docs in outputs.items():
        path = os.path.join(SEED, f"{name}.json")
        with open(path, "w") as f:
            json.dump(docs, f, ensure_ascii=False, indent=2)
        print(f"seed/{name}.json: {len(docs)} docs")

    # ---- validation ----
    print("\n--- validation ---")
    all_slugs = []
    for name, docs in outputs.items():
        all_slugs += [d["slug"] for d in docs]
    assert len(all_slugs) == len(set(all_slugs)), "DUPLICATE SLUGS ACROSS COLLECTIONS"
    print(f"slugs unique across all collections: {len(all_slugs)} ok")

    # GeoJSON order check: [lng, lat] — lng 77.4-81.1, lat 28.4-31.6
    bad = []
    n_points = 0
    for name, docs in outputs.items():
        for d in docs:
            loc = d.get("location")
            if isinstance(loc, dict) and loc.get("coordinates"):  # guides keep a string location
                n_points += 1
                lng, lat = loc["coordinates"]
                if not (77.0 <= lng <= 81.5 and 28.0 <= lat <= 32.0):
                    bad.append((d["slug"], loc["coordinates"]))
    assert not bad, f"COORDINATE ORDER WRONG: {bad[:3]}"
    print(f"GeoJSON points: {n_points}, order [lng,lat] verified, bounds ok")

    # license metadata preserved on every image
    n_imgs = 0
    for name, docs in outputs.items():
        for d in docs:
            for im in ([d.get("coverImage")] + (d.get("gallery") or []) + (d.get("images") or [])):
                if im:
                    n_imgs += 1
                    assert im.get("license") and im.get("attribution") and im.get("publicId") is None
    print(f"images with full licence metadata + publicId:null: {n_imgs}")

    # stays: price object sanity
    stays = outputs["stays"]
    priced = [d for d in stays if d.get("price")]
    assert all(d["price"]["amount"] > 0 and d["price"]["currency"] == "INR" for d in priced)
    emails = sum(1 for d in stays if d.get("email"))
    phones = sum(1 for d in stays if d.get("phone"))
    print(f"stays: {len(stays)} | with price: {len(priced)} | with email: {emails} | with phone: {phones}")

    # rentals: vehicle enum + count
    rentals = outputs["rentals"]
    vtotal = sum(len(d["vehicles"]) for d in rentals)
    enums = {v["type"] for d in rentals for v in d["vehicles"]}
    print(f"rentals: {len(rentals)} businesses, {vtotal} vehicles, type enum: {sorted(enums)}")

    print("\nALL SEED VALIDATION PASSED")


if __name__ == "__main__":
    main()
