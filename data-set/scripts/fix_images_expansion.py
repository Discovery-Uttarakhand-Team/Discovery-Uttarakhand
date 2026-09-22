#!/usr/bin/env python3
"""Fix wrong/no images for expansion-batch records.
Wrong images found by post-run audit (wrong state/country matches):
  Chamba (HP museum art), Someshwar (Nashik/Pune), Hanumangarhi (Cologne
  Cathedral), Khalanga (Taj Mahal - but gallery correct), Khatling (Kafni),
  Virasat (Alva's, Karnataka), Kumaoni Holi (generic), Mana (NZ/Croatia junk).
Plus relaxed retries for 8 records with no cover."""
import json, re, glob, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from images import (api_get, W_COMMONS, commons_search, imageinfo, img_rec,
                    file_ok, license_ok)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw")

def rec_path(kind, name):
    slug = name.lower().replace(", ", "-").replace(" ", "-").replace("'", "").replace("–", "-").replace(",", "")
    for f in glob.glob(os.path.join(RAW, kind, "*.json")):
        if json.load(open(f))["name"] == name:
            return f
    return None

def info_ok(i, relaxed=False):
    return (i.get("mime") in ("image/jpeg", "image/png")
            and (i.get("width") or 0) >= (700 if relaxed else 900)
            and (i.get("height") or 0) >= (420 if relaxed else 500)
            and (max(i["width"], i["height"]) / max(1, min(i["width"], i["height"]))) <= 3.2
            and license_ok(i["licenseShort"]))

def search_pick(queries, must_any, must_none, relaxed=True, alt_default=""):
    """Search Commons, filter by title constraints, return img_recs."""
    cands = []
    for q in queries:
        for t in commons_search(q, limit=16):
            tl = t.lower().replace("_", " ")
            if t in cands or not file_ok(t):
                continue
            if any(b in tl for b in must_none):
                continue
            if must_any and not any(m in tl for m in must_any):
                continue
            cands.append(t)
    if not cands:
        return []
    info = imageinfo(cands[:30])
    good = [info[t] for t in cands[:30] if t in info and info_ok(info[t], relaxed)]
    return [img_rec(i, alt_default) for i in good[:8]]

def set_images(kind, name, cover, gallery):
    p = rec_path(kind, name)
    if not p:
        print(f"  !! record not found: {name}"); return
    r = json.load(open(p))
    r["coverImage"] = cover
    r["gallery"] = gallery
    json.dump(r, open(p, "w"), indent=1, ensure_ascii=False)

def get_images(kind, name):
    p = rec_path(kind, name)
    return json.load(open(p)) if p else None

print("=== 1) re-search fixes ===")
# Chamba (Tehri Garhwal) — exclude Bhuri Singh / Himachal
res = search_pick(["Chamba Tehri Garhwal", "Chamba Uttarakhand town", "Chamba Tehri dam"],
                  must_any=["tehri", "uttarakhand", "garhwal"], must_none=["bhuri", "himachal", "chamba style"],
                  alt_default="Chamba, Tehri Garhwal, Uttarakhand")
set_images("destination", "Chamba", res[0] if res else None, res[1:])
print(f"  Chamba: {len(res)} images" + (f" cover={res[0]['url'].split('/')[-1][:45]}" if res else " -> NULL"))

# Someshwar (Almora) — exclude nashik/pune/beach
res = search_pick(["Someshwar Almora", "Someshwar Uttarakhand", "Someshwar valley Kumaon"],
                  must_any=["almora", "uttarakhand", "kumaon"], must_none=["nashik", "pune", "beach", "someshwar mahadev mandir ,nashik"],
                  alt_default="Someshwar, Almora district, Uttarakhand")
set_images("destination", "Someshwar", res[0] if res else None, res[1:])
print(f"  Someshwar: {len(res)} images" + (f" cover={res[0]['url'].split('/')[-1][:45]}" if res else " -> NULL"))

# Hanumangarhi, Nainital — exclude Cologne
res = search_pick(["Hanumangarhi Nainital", "Hanuman Garhi Nainital", "Hanumangarhi temple Nainital"],
                  must_any=["nainital", "hanumangarh", "hanuman garhi"], must_none=["kölner", "kolner", "cologne", "dom"],
                  alt_default="Hanumangarhi temple, Nainital, Uttarakhand")
set_images("spiritual", "Hanumangarhi, Nainital", res[0] if res else None, res[1:])
print(f"  Hanumangarhi: {len(res)} images" + (f" cover={res[0]['url'].split('/')[-1][:45]}" if res else " -> NULL"))

# Khatling Glacier Trek — exclude Kafni
res = search_pick(["Khatling glacier", "Khatling", "Khatling glacier trek"],
                  must_any=["khatling"], must_none=["kafni", "pindari"],
                  alt_default="Khatling Glacier, Tehri Garhwal, Uttarakhand")
set_images("activity", "Khatling Glacier Trek", res[0] if res else None, res[1:])
print(f"  Khatling: {len(res)} images" + (f" cover={res[0]['url'].split('/')[-1][:45]}" if res else " -> NULL"))

# Virasat (Dehradun festival) — exclude Alva's (Karnataka)
res = search_pick(["Virasat festival Dehradun", "Virasat Uttarakhand festival", "Virasat heritage festival Dehradun"],
                  must_any=["virasat", "dehradun", "uttarakhand"], must_none=["alva"],
                  alt_default="Virasat festival, Dehradun, Uttarakhand")
set_images("cultural", "Virasat", res[0] if res else None, res[1:])
print(f"  Virasat: {len(res)} images" + (f" cover={res[0]['url'].split('/')[-1][:45]}" if res else " -> NULL"))

print("=== 2) gallery reorder/cleanup (no new search) ===")
# Khalanga War Memorial: cover Taj -> use correct Khalanga images from gallery
r = get_images("cultural", "Khalanga War Memorial")
if r:
    good = [g for g in r["gallery"] if "khalanga" in g["url"].lower() or "nalapani" in g["url"].lower()]
    cover = next((g for g in good if "memorial" in g["url"].lower()), good[0] if good else None)
    if cover:
        rest = [g for g in good if g is not cover]
        set_images("cultural", "Khalanga War Memorial", cover, rest)
        print(f"  Khalanga: cover={cover['url'].split('/')[-1][:45]} gallery={len(rest)}")

# Kumaoni Holi: use Haldwani image as cover (UK-verifiable), drop generic
r = get_images("cultural", "Kumaoni Holi")
if r:
    haldwani = next((g for g in r["gallery"] if "haldwani" in g["url"].lower()), None)
    if haldwani:
        set_images("cultural", "Kumaoni Holi", haldwani, [])
        print(f"  Kumaoni Holi: cover={haldwani['url'].split('/')[-1][:45]}")

# Mana: drop NZ/Croatia junk from gallery
r = get_images("destination", "Mana")
if r:
    bad = ["porirua", "kornati"]
    gal = [g for g in r["gallery"] if not any(b in g["url"].lower() for b in bad)]
    # cover "India_lsat_village.jpg" - verify alt mentions Mana/village
    cov = r["coverImage"]
    alt = (cov or {}).get("alt", "").lower() + (cov or {}).get("url", "").lower()
    if cov and "mana" not in alt and "village" not in alt:
        # replace with first good gallery image
        if gal:
            newcov = next((g for g in gal if "mana village" in g["url"].lower()), gal[0])
            gal = [g for g in gal if g is not newcov]
            set_images("destination", "Mana", newcov, gal)
            print(f"  Mana: cover swapped -> {newcov['url'].split('/')[-1][:45]}")
    else:
        set_images("destination", "Mana", cov, gal)
        print(f"  Mana: cover kept, gallery {len(gal)} (junk removed)")

print("=== 3) relaxed retries for no-cover records ===")
RETRY = [
    ("destination", "Govind Pashu Vihar National Park",
     ["Govind Pashu Vihar", "Govind National Park Uttarkashi", "Govind Wildlife Sanctuary"],
     ["govind", "uttarkashi"], ["pashu", "pathiv"], "Govind Pashu Vihar National Park, Uttarkashi"),
    ("destination", "Jeolikot", ["Jeolikot", "Jeolikote Nainital"], ["jeolikot"], [],
     "Jeolikot, Nainital district, Uttarakhand"),
    ("destination", "Sonprayag", ["Sonprayag", "Son Prayag Uttarakhand", "Sonprayag Kedarnath"],
     ["sonprayag", "son prayag"], [], "Sonprayag, Rudraprayag district, Uttarakhand"),
    ("spiritual", "Gurdwara Gyan Godri Sahib", ["Gyan Godri Haridwar", "Gyan Godri gurdwara"],
     ["gyan godri", "haridwar"], [], "Gurdwara Gyan Godri Sahib, Haridwar"),
    ("spiritual", "Jwalpa Devi Temple", ["Jwalpa Devi temple", "Jwalpa Devi Pauri"],
     ["jwalpa"], [], "Jwalpa Devi Temple, Pauri Garhwal"),
    ("cultural", "Bal mithai", ["Bal mithai", "Balmithai sweet"], ["mithai", "bal mithai"], [],
     "Bal mithai, sweet of Almora, Kumaon"),
    ("cultural", "Kandali Festival", ["Kandali festival", "Kandali Uttarakhand"], ["kandali"], [],
     "Kandali festival, Pithoragarh"),
    ("activity", "Bungee Jumping at Mohan Chatti", ["Mohan Chatti bungee", "Jumpin Heights Mohan Chatti", "bungee jumping Rishikesh"],
     ["mohan chatti", "jumpin", "bungee", "rishikesh"], [], "Bungee jumping at Mohan Chatti, near Rishikesh"),
]
for kind, name, queries, must_any, must_none, alt in RETRY:
    res = search_pick(queries, must_any, must_none, relaxed=True, alt_default=alt)
    if res:
        set_images(kind, name, res[0], res[1:])
        print(f"  {name[:36]:<38} -> {len(res)} imgs, cover={res[0]['url'].split('/')[-1][:40]}")
    else:
        print(f"  {name[:36]:<38} -> still none (null)")

print("\ndone")
