#!/usr/bin/env python3
"""
INDEPENDENT VALIDATOR for Discovery Uttarakhand dataset.
Does not reuse build logic — re-derives every check from scratch.
Validates data/ (analysis layer) and seed/ (application layer).
"""
import json, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
SEED = os.path.join(ROOT, "seed")

UT_LAT, UT_LON = (28.4, 31.7), (77.4, 81.1)   # generous state bounds (Gangotri NP 31.63 allowed)
DISTRICTS = {"Almora","Bageshwar","Chamoli","Champawat","Dehradun","Haridwar","Nainital",
             "Pauri Garhwal","Pithoragarh","Rudraprayag","Tehri Garhwal","Udham Singh Nagar",
             "Uttarkashi","Multiple (Uttarakhand)"}
REGIONS = {"Garhwal","Kumaon","Multiple (Uttarakhand)"}
VEHICLE_ENUM = {"Scooter","Motorcycle","Hatchback","Sedan","SUV","MPV"}
VALID_LIC = re.compile(r"^(CC0|Public domain|CC BY(?:-SA)? [1234]\.0(?: igo)?|CC BY(?:-SA)? [12]\.5)( \(.*\))?$", re.I)

errors, warnings = [], []
def E(msg): errors.append(msg)
def W(msg): warnings.append(msg)

def load(path):
    with open(path) as f: return json.load(f)

FILES = ["destinations","spiritual","culture","activities","stays","rentals","guides"]

# ================================================================ 1. JSON parse + counts
data = {}
for fn in FILES:
    data[fn] = load(os.path.join(DATA, fn + ".json"))
man = load(os.path.join(DATA, "image-manifest.json"))
summ = load(os.path.join(DATA, "data-summary.json"))
seed = {fn: load(os.path.join(SEED, fn + ".json")) for fn in FILES}
seed_man = load(os.path.join(SEED, "image-manifest.json"))

EXPECT = {"destinations":89,"spiritual":52,"culture":30,"activities":25,"stays":51,"rentals":9,"guides":190}
for fn, n in EXPECT.items():
    if len(data[fn]) != n: E(f"count: {fn} has {len(data[fn])}, expected {n}")
    if len(seed[fn]) != n: E(f"seed count: {fn} has {len(seed[fn])}, expected {n}")
if summ.get("destinations") != 89 or summ.get("spiritualPlaces") != 52 or summ.get("culturalPlaces") != 30 \
   or summ.get("activities") != 25 or summ.get("stays") != 51 or summ.get("rentals") != 9 or summ.get("guides") != 190:
    E(f"data-summary.json counts wrong: {summ}")
if summ.get("images") != len(man): E(f"summary images {summ.get('images')} != manifest {len(man)}")
if summ.get("duplicatesRemoved") != 6: W(f"summary duplicatesRemoved = {summ.get('duplicatesRemoved')}")
print(f"[1] counts: {sum(len(v) for v in data.values())} records — {'OK' if not any('count' in e for e in errors) else 'FAIL'}")

# ================================================================ 2. required fields + provenance
for fn, recs in data.items():
    for r in recs:
        for f in ["name","slug","sourceName","sourceUrl","sourcePageUrl","lastVerified"]:
            if not r.get(f): E(f"{fn}/{r.get('slug','?')}: missing {f}")
        if r.get("lastVerified") != "2026-09-09": W(f"{fn}/{r['slug']}: lastVerified={r.get('lastVerified')}")
        if not re.match(r"^https?://", r.get("sourceUrl") or ""): E(f"{fn}/{r['slug']}: bad sourceUrl")
        if not re.match(r"^https?://", r.get("sourcePageUrl") or ""): E(f"{fn}/{r['slug']}: bad sourcePageUrl")
        # name/slug sanity
        if not r.get("name") or len(r["name"]) < 2: E(f"{fn}/{r['slug']}: bad name")
        if not re.match(r"^[a-z0-9-]+$", r["slug"]): E(f"{fn}/{r['slug']}: slug not kebab-case")
        # description
        if fn != "guides" and not r.get("description"): E(f"{fn}/{r['slug']}: empty description")
        # district/region
        d = r.get("district")
        if fn != "guides":
            if d not in DISTRICTS: E(f"{fn}/{r['slug']}: invalid district {d!r}")
        if r.get("region") and r["region"] not in REGIONS: E(f"{fn}/{r['slug']}: invalid region {r['region']!r}")
print(f"[2] required+provenance fields: {len(errors)} errors so far")

# ================================================================ 3. uniqueness
slugs = [r["slug"] for recs in data.values() for r in recs]
dup_slugs = {s for s in slugs if slugs.count(s) > 1}
if dup_slugs: E(f"duplicate slugs: {dup_slugs}")
# near-duplicate names WITHIN a category (normalized)
def norm_name(s): return re.sub(r"[^a-z0-9]", "", s.lower())
for fn, recs in data.items():
    seen = {}
    for r in recs:
        nn = norm_name(r["name"])
        if nn in seen:
            other = next(x for x in recs if norm_name(x["name"]) == nn and x is not r)
            # same name is acceptable ONLY for guides who are distinct people (different phone/profile)
            if fn == "guides" and r.get("phone") != other.get("phone") and r.get("website") != other.get("website"):
                W(f"guides: same-name distinct people: {r['name']!r} ({r['slug']}, {other['slug']})")
            else:
                E(f"{fn}: near-duplicate name: {r['name']!r} == {seen[nn]!r}")
        seen[nn] = r["name"]
    # fuzzy: containment of one full name in another (same category) — e.g. "X" vs "X Temple"
    names = [r["name"] for r in recs]
    for a in names:
        for b in names:
            if a != b and norm_name(b) in norm_name(a) and len(norm_name(b)) >= 6:
                W(f"{fn}: name containment: {a!r} ⊃ {b!r}")
print(f"[3] uniqueness: {len(dup_slugs)} dup slugs, errors={len(errors)}")

# ================================================================ 4. coordinates
n_coord = 0
for fn, recs in data.items():
    for r in recs:
        lat, lon = r.get("latitude"), r.get("longitude")
        if lat is None and lon is None: continue
        if lat is None or lon is None:
            E(f"{fn}/{r['slug']}: only one of lat/lon present"); continue
        n_coord += 1
        if not (UT_LAT[0] <= lat <= UT_LAT[1]): E(f"{fn}/{r['slug']}: lat {lat} out of bounds")
        if not (UT_LON[0] <= lon <= UT_LON[1]): E(f"{fn}/{r['slug']}: lon {lon} out of bounds")
        if abs(lat - round(lat, 5)) > 1e-9: pass  # precision fine
# seed: GeoJSON order
for fn, recs in seed.items():
    for r in recs:
        loc = r.get("location")
        if loc is None or isinstance(loc, str):
            if isinstance(loc, str) and fn != "guides":
                E(f"seed/{fn}/{r['slug']}: location is string, expected Point")
            continue
        elif loc.get("type") != "Point" or not isinstance(loc.get("coordinates"), list) or len(loc["coordinates"]) != 2:
            E(f"seed/{fn}/{r['slug']}: malformed GeoJSON")
        else:
            lng, lat = loc["coordinates"]
            if not (77.0 <= lng <= 81.5 and 28.0 <= lat <= 32.0): E(f"seed/{fn}/{r['slug']}: [lng,lat]=({lng},{lat}) looks swapped/out of UK")
print(f"[4] coordinates: {n_coord} points checked")

# ================================================================ 5. images
def imgs_of(r):
    out = []
    if r.get("coverImage"): out.append(r["coverImage"])
    out += r.get("gallery") or []
    out += r.get("images") or []
    return out
url_owner = defaultdict(list)
n_slots = 0
for fn, recs in data.items():
    for r in recs:
        for im in imgs_of(r):
            if not isinstance(im, dict): E(f"{fn}/{r['slug']}: bare string image"); continue
            n_slots += 1
            for f in ["url","source","sourcePage","license","attribution","alt"]:
                if not im.get(f): E(f"{fn}/{r['slug']}: image missing {f}")
            if not re.match(r"^https://(upload|thumb)\.wikimedia\.org/", im["url"]):
                E(f"{fn}/{r['slug']}: non-Wikimedia image URL {im['url'][:60]}")
            if not VALID_LIC.match((im["license"] or "").strip()):
                E(f"{fn}/{r['slug']}: unrecognized license {im['license']!r}")
            url_owner[im["url"]].append(f"{fn}/{r['slug']}")
        # gallery size
        g = len(r.get("gallery") or [])
        if fn in ("destinations","spiritual","culture","activities") and r.get("coverImage") and not (0 <= g <= 8):
            W(f"{fn}/{r['slug']}: gallery size {g} outside 0-8")
shared = {u: owners for u, owners in url_owner.items() if len(owners) > 1}
if shared:
    for u, owners in list(shared.items())[:10]:
        W(f"image shared across records: {u.split('/')[-1][:45]} -> {owners}")
# manifest reconciliation
murls = [im["imageUrl"] for im in man]
if len(murls) != len(set(murls)): E("manifest has duplicate URLs")
if set(murls) != set(url_owner.keys()):
    E(f"manifest/records mismatch: only-in-manifest={len(set(murls)-set(url_owner))}, only-in-records={len(set(url_owner)-set(murls))}")
for im in man:
    for f in ["imageUrl","sourcePage","license","attribution","alt"]:
        if not im.get(f): E(f"manifest {im.get('entityId')}: missing {f}")
    if not VALID_LIC.match((im["license"] or "").strip()): E(f"manifest {im['entityId']}: bad license")
    if im.get("entityType") not in ("destination","spiritual","cultural","activity","stay"):
        E(f"manifest {im['entityId']}: bad entityType {im.get('entityType')}")
# seed manifest identical
if seed_man != man: E("seed/image-manifest.json differs from data/image-manifest.json")
print(f"[5] images: {n_slots} slots, {len(url_owner)} unique, {len(shared)} shared, manifest {len(man)}")

# ================================================================ 6. bestTimeToVisit verbatim integrity
n_bt = 0
for fn in ["destinations","spiritual","culture","activities"]:
    for r in data[fn]:
        bt, src = r.get("bestTimeToVisit"), r.get("bestTimeSourceSentence")
        if bt is None:
            if src: W(f"{fn}/{r['slug']}: source sentence but null value")
            continue
        n_bt += 1
        if not src: E(f"{fn}/{r['slug']}: bestTimeToVisit without source sentence")
        else:
            # month tokens of value must appear in sentence
            months_v = re.findall(r"January|February|March|April|May|June|July|August|September|October|November|December", bt)
            months_s = re.findall(r"January|February|March|April|May|June|July|August|September|October|November|December", src, re.I)
            if [m[:3] for m in months_v] not in ([m[:3] for m in months_s],
                                                 [m[:3] for m in months_s][:len(months_v)]):
                # allow subset (cleaned day numbers/parentheticals)
                if not all(m in [x[:3] for x in months_s] for m in [m[:3] for m in months_v]):
                    E(f"{fn}/{r['slug']}: value months {months_v} not in source sentence")
print(f"[6] bestTimeToVisit: {n_bt} values checked for verbatim integrity")

# ================================================================ 7. category-specific
# stays
for r in data["stays"]:
    if r.get("pricePerNight") is not None:
        if not (100 <= r["pricePerNight"] <= 50000): E(f"stays/{r['slug']}: price {r['pricePerNight']} implausible")
        if not r.get("priceLastChecked"): E(f"stays/{r['slug']}: price without priceLastChecked")
        if not r.get("priceNotes"): E(f"stays/{r['slug']}: price without priceNotes")
    ph = (r.get("contact") or {}).get("phone")
    if ph and not re.match(r"^(\+91[\s-]?)?[0-9][0-9\s,-]{7,14}$", ph): W(f"stays/{r['slug']}: odd phone {ph!r}")
# rentals (price sanity on data; type enum is a seed-layer rule)
for r in data["rentals"]:
    for v in r.get("vehicles") or []:
        if v.get("pricePerDay") is not None and not (100 <= v["pricePerDay"] <= 20000):
            E(f"rentals/{r['slug']}: price {v['pricePerDay']} implausible")
for r in seed["rentals"]:
    for v in r.get("vehicles") or []:
        if v.get("type") not in VEHICLE_ENUM: E(f"seed/rentals/{r['slug']}: vehicle type {v.get('type')!r} not in enum")
    if not r.get("phone"): E(f"rentals/{r['slug']}: no phone")
    if r.get("rating") and not r.get("ratingSource"): E(f"rentals/{r['slug']}: rating without ratingSource caveat")
# guides
for r in data["guides"]:
    if r.get("verificationStatus") != "verified": E(f"guides/{r['slug']}: status {r.get('verificationStatus')}")
    if not r.get("phone"): W(f"guides/{r['slug']}: no phone")
    if not isinstance(r.get("location"), str): E(f"guides/{r['slug']}: location not a string")
    if r.get("profileImage"): E(f"guides/{r['slug']}: profileImage should be null")
# spiritual/culture: no category field by design
for fn in ["spiritual","culture"]:
    for r in data[fn]:
        if r.get("category"): W(f"{fn}/{r['slug']}: unexpected category field {r['category']!r}")
# activities: category allowed set
ACT_CATS = {"Trekking","Wildlife Safari","River Rafting","Skiing","Boating","Adventure Sports",
            "Pilgrimage","Pilgrimage / Festival","Waterfalls & Sightseeing"}
for r in data["activities"]:
    if r.get("category") not in ACT_CATS: E(f"activities/{r['slug']}: category {r['category']!r}")
# seed specifics
for r in seed["rentals"]:
    for v in r["vehicles"]:
        if v.get("publicId"): pass
for r in seed["stays"]:
    pr = r.get("price")
    if pr and (not isinstance(pr, dict) or set(pr) != {"amount","currency"} or pr["currency"] != "INR"):
        E(f"seed/stays/{r['slug']}: malformed price object")
    for im in r.get("images") or []:
        if im.get("publicId") is not None: E(f"seed/stays/{r['slug']}: publicId should be null")
for fn, recs in seed.items():
    for r in recs:
        ci = r.get("coverImage")
        if ci and ci.get("publicId") is not None: E(f"seed/{fn}/{r['slug']}: cover publicId not null")
print("[7] category-specific rules checked")

# ================================================================ 8. seed <-> data record-level consistency
def img_eq(a, b, mapping):
    return a == b
mismatch = 0
for fn in FILES:
    dmap = {r["slug"]: r for r in data[fn]}
    smap = {r["slug"]: r for r in seed[fn]}
    if set(dmap) != set(smap): E(f"seed/{fn}: slug sets differ"); continue
    for slug in dmap:
        d, s = dmap[slug], smap[slug]
        if d.get("name") != s.get("name"): E(f"seed/{fn}/{slug}: name differs"); mismatch += 1
        sloc = s.get("location")
        if isinstance(sloc, str):
            if fn != "guides": E(f"seed/{fn}/{slug}: location is a string but should be Point")
            continue
        if isinstance(sloc, dict):
            try:
                slng, slat = sloc["coordinates"]
                if abs((d.get("longitude") or 0) - slng) > 1e-6 or abs((d.get("latitude") or 0) - slat) > 1e-6:
                    E(f"seed/{fn}/{slug}: coords not mapped to [lng,lat] correctly"); mismatch += 1
            except (KeyError, TypeError, ValueError):
                E(f"seed/{fn}/{slug}: malformed coordinates"); mismatch += 1
        elif d.get("latitude") is not None:
            E(f"seed/{fn}/{slug}: data has coords but seed location is not a Point"); mismatch += 1
        if fn == "guides" and s.get("profileUrl") != d.get("website"): E(f"seed/guides/{slug}: profileUrl mapping")
print(f"[8] seed<->data consistency: {mismatch} mismatches")

# ================================================================ RESULT
print("\n" + "="*60)
print(f"ERRORS: {len(errors)}")
for e in errors[:40]: print("  ✗", e)
print(f"WARNINGS: {len(warnings)}")
for w in warnings[:40]: print("  ⚠", w)
print("="*60)
print("VERDICT:", "PASS — production-ready" if not errors else f"FAIL — {len(errors)} errors must be fixed")
sys.exit(1 if errors else 0)
