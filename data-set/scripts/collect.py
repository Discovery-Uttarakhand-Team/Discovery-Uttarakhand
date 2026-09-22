# -*- coding: utf-8 -*-
"""
Collect Wikipedia article data + Wikimedia Commons images (with license metadata)
for all entities in config.py. Phased + batched + rate-limited to respect the
Wikimedia API etiquette. Cached under cache/ so re-runs are cheap.
"""
import json, os, re, sys, time, hashlib, html, random
import requests

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CACHE = os.path.join(ROOT, "cache")
RAW = os.path.join(ROOT, "raw")
for d in ["destination", "spiritual", "cultural", "activity"]:
    os.makedirs(os.path.join(RAW, d), exist_ok=True)
os.makedirs(CACHE, exist_ok=True)

UA = "DiscoveryUttarakhandDataset/1.0 (travel-research data collection; all sources attributed; non-commercial research use)"
S = requests.Session()
S.headers.update({"User-Agent": UA})

W_EN = "https://en.wikipedia.org/w/api.php"
W_COMMONS = "https://commons.wikimedia.org/w/api.php"
W_WV = "https://en.wikivoyage.org/w/api.php"
W_WD = "https://www.wikidata.org/w/api.php"

PAUSE = 1.1          # seconds between API calls
FLOOR = 0.9

def cache_key(url, params):
    return hashlib.sha256((url + "?" + "&".join(f"{k}={v}" for k, v in sorted(params.items()))).encode()).hexdigest()[:24]

def api_get(url, params, retries=6):
    key = cache_key(url, params)
    path = os.path.join(CACHE, key + ".json")
    if os.path.exists(path):
        try:
            with open(path) as f:
                return json.load(f)
        except Exception:
            pass
    for i in range(retries):
        try:
            r = S.get(url, params=params, timeout=40)
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", 0)) or (15 * (i + 1))
                print(f"  .. 429, waiting {wait}s")
                time.sleep(wait)
                continue
            r.raise_for_status()
            data = r.json()
            with open(path, "w") as f:
                json.dump(data, f)
            time.sleep(PAUSE + random.random() * 0.4)
            return data
        except Exception as e:
            if i == retries - 1:
                print(f"  !! FAILED {url} {str(params.get('titles'))[:60]}: {e}")
            time.sleep(3 * (i + 1))
    return None

STRIP_TAGS = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")

def strip_html(s):
    if not s:
        return ""
    s = html.unescape(s)
    s = STRIP_TAGS.sub(" ", s)
    return WS.sub(" ", s).strip()

BAD_FILE_PAT = re.compile(
    r"(flag|logo|coat[_ ]of[_ ]arms|seal|icon|symbol|locator|location[_ ]map|map[_ ]of|\.map|ambox|wiki(pedia|source|voyage|data|tionary)|commons-logo|edit-|padlock|question_book|star_|arrow|disambig|portal|sound|audio|speaker|loudspeaker|folder|nuvola|crystal|emblem|signature|magnify|increase|decrease|wikispecies|ombudsman|red[_ ]pencil|revert|merge|proposed|stamp)",
    re.I)
ACCEPT_EXT = (".jpg", ".jpeg", ".png")

def file_ok(title):
    t = title.strip()
    if not t.lower().endswith(ACCEPT_EXT):
        return False
    if BAD_FILE_PAT.search(t):
        return False
    return True

ACCEPT_LICENSE = re.compile(r"(cc[\s_-]*(by|by-sa)\s*\d|cc0|public[\s_-]*domain|^pd[\s_-]|pd[\s-]|attribution\s*\d)", re.I)
REJECT_LICENSE = re.compile(r"(nc|nd|non-commercial|no[\s_-]deriv|fair[\s_-]use|non-free|unknown|see[\s_-]below|google|copyrighted)", re.I)

def license_ok(short):
    if not short:
        return False
    if REJECT_LICENSE.search(short):
        return False
    return bool(ACCEPT_LICENSE.search(short))

def batched(lst, n):
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

# ---------------------------------------------------------------- phase 1
def resolve_entities(entities):
    """Batched: resolve redirects, check existence, get qid, coords, images."""
    titles = []
    for e in entities:
        if e.get("wikivoyage"):
            continue
        titles.extend(e["titles"])
    title2ent = {}
    for e in entities:
        for t in e.get("titles", []):
            title2ent.setdefault(t, e)
    meta = {}
    for batch in batched(titles, 10):
        params = {
            "action": "query", "format": "json", "titles": "|".join(batch), "redirects": 1,
            "prop": "coordinates|pageprops|images|pageimages",
            "coprop": "type|name|lat|lon|primary", "imlimit": 500, "piprop": "name",
        }
        while True:
            data = api_get(W_EN, params)
            if not data:
                break
            q = data.get("query", {})
            redir = {}
            for r in q.get("redirects", []):
                redir[r["from"]] = r["to"]
            for pid, p in q.get("pages", {}).items():
                m = meta.setdefault(p["title"], {
                    "title": p["title"], "missing": "missing" in p,
                    "qid": (p.get("pageprops") or {}).get("wikibase_item"),
                    "coords": (p.get("coordinates") or [None])[0],
                    "images": [], "pageimage": p.get("pageimage"),
                })
                m["images"].extend(im["title"] for im in (p.get("images") or []) if im.get("ns") == 6)
            for orig, final in redir.items():
                if final in meta and orig not in meta:
                    meta[orig] = dict(meta[final])
                    meta[orig]["redirectedFrom"] = orig
            cont = data.get("continue")
            if not cont:
                break
            params.update(cont)
    return meta

def pick_article(ent, meta):
    """Pick the first existing, sensible title for the entity."""
    if ent.get("wikivoyage"):
        return ("wikivoyage", ent["wikivoyage"])
    for t in ent["titles"]:
        m = meta.get(t)
        if m and not m["missing"]:
            # sanity: avoid redirect to a district/state overview
            if ("district" in m["title"].lower() or "state of" in m["title"].lower()) and "district" not in t.lower():
                continue
            return ("wikipedia", m["title"])
    return None

# ---------------------------------------------------------------- phase 2
def fetch_full_extract(title, site=W_EN):
    data = api_get(site, {
        "action": "query", "format": "json", "titles": title, "redirects": 1,
        "prop": "extracts", "explaintext": 1, "exsectionformat": "plain",
    })
    if not data:
        return ""
    for pid, p in data.get("query", {}).get("pages", {}).items():
        if "missing" not in p:
            return p.get("extract") or ""
    return ""

def fetch_wikivoyage_extract(title):
    return fetch_full_extract(title, site=W_WV)

# ---------------------------------------------------------------- commons
def commons_imageinfo(file_titles, urlwidth=1600):
    out = {}
    titles = [t if t.startswith("File:") else "File:" + t for t in file_titles]
    for batch in batched(titles, 20):
        data = api_get(W_COMMONS, {
            "action": "query", "format": "json", "titles": "|".join(batch), "redirects": 1,
            "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": urlwidth,
        })
        if not data:
            continue
        q = data.get("query", {})
        redir = {r["from"]: r["to"] for r in q.get("redirects", [])}
        for pid, p in q.get("pages", {}).items():
            if "imageinfo" not in p:
                continue
            info = p["imageinfo"][0]
            md = info.get("extmetadata", {})
            def mdv(k):
                return strip_html((md.get(k) or {}).get("value", ""))
            out[p["title"]] = {
                "title": p["title"], "url": info.get("thumburl") or info.get("url"),
                "originalUrl": info.get("url"), "page": info.get("descriptionurl"),
                "width": info.get("width"), "height": info.get("height"), "mime": info.get("mime"),
                "licenseShort": mdv("LicenseShortName"),
                "licenseUrl": (md.get("LicenseUrl") or {}).get("value", ""),
                "artist": mdv("Artist"), "credit": mdv("Credit"),
                "description": mdv("ImageDescription"),
                "date": mdv("DateTimeOriginal") or mdv("DateTime"),
            }
        for frm, to in redir.items():
            if to in out:
                out[frm] = dict(out[to]); out[frm]["title"] = frm
    return out

def commons_search(query, limit=24):
    data = api_get(W_COMMONS, {
        "action": "query", "format": "json", "list": "search",
        "srsearch": query, "srnamespace": 6, "srlimit": limit, "srprop": "",
    })
    if not data:
        return []
    return [r["title"] for r in data.get("query", {}).get("search", [])]

def wikidata_claims(qid):
    data = api_get(W_WD, {"action": "wbgetentities", "format": "json", "ids": qid, "props": "claims"})
    if not data or "entities" not in data:
        return {}
    return data["entities"].get(qid, {}).get("claims", {})

def wikidata_labels(qids):
    out = {}
    for batch in batched(list(qids), 50):
        data = api_get(W_WD, {"action": "wbgetentities", "format": "json", "ids": "|".join(batch), "props": "labels", "languages": "en"})
        if not data:
            continue
        for qid, ent in data.get("entities", {}).items():
            lbl = (ent.get("labels") or {}).get("en", {}).get("label")
            if lbl:
                out[qid] = lbl
    return out

# ---------------------------------------------------------------- main
def main():
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import config as C
    entities = []
    for etype, ents in (("destination", C.DESTINATIONS), ("spiritual", C.SPIRITUAL),
                        ("cultural", C.CULTURAL), ("activity", C.ACTIVITIES)):
        for ent in ents:
            ent = dict(ent)
            ent["type"] = etype
            entities.append(ent)

    print("=== Phase 1: batched resolve (titles/meta/images) ===")
    meta = resolve_entities(entities)
    print(f"  resolved {len(meta)} title entries")

    print("=== Phase 2: pick articles + full extracts ===")
    results = []
    for ent in entities:
        picked = pick_article(ent, meta)
        if not picked and ent.get("wikivoyage"):
            picked = ("wikivoyage", ent["wikivoyage"])
        if not picked:
            print(f"  !! NO ARTICLE: {ent['name']}")
            continue
        site_kind, title = picked
        slug = re.sub(r"[^a-z0-9]+", "-", ent["name"].lower()).strip("-")
        rec = {"name": ent["name"], "slug": slug, "type": ent["type"],
               "curatedDistrict": ent.get("district"), "region": ent.get("region"),
               "location": ent.get("location", ""), "category": ent.get("category", ""),
               "highlightCandidates": ent.get("highlight_candidates", []),
               "articleTitle": title, "site": site_kind}
        if site_kind == "wikipedia":
            m = meta.get(title, {})
            rec["wikidataQid"] = m.get("qid")
            c = m.get("coords") or {}
            rec["coords"] = {"lat": c.get("lat"), "lon": c.get("lon")} if c else None
            rec["onPageImages"] = m.get("images", [])
            rec["pageimage"] = m.get("pageimage")
            rec["pageUrl"] = "https://en.wikipedia.org/wiki/" + title.replace(" ", "_")
            rec["extract"] = fetch_full_extract(title)
        else:
            rec["wikidataQid"] = None
            rec["coords"] = None
            rec["onPageImages"] = []
            rec["pageUrl"] = "https://en.wikivoyage.org/wiki/" + title.replace(" ", "_")
            rec["extract"] = fetch_wikivoyage_extract(title)
        # also fetch wikivoyage supplement for destinations that have one (for bestTime)
        if site_kind == "wikipedia" and not ent.get("wikivoyage"):
            wv = fetch_full_extract(ent["name"], site=W_WV)
            rec["wikivoyageExtract"] = wv if wv else None
        else:
            rec["wikivoyageExtract"] = None
        results.append(rec)
        print(f"  ok {rec['name']} -> {title} ({site_kind}) extract={len(rec['extract'])} imgs={len(rec['onPageImages'])} qid={rec.get('wikidataQid')}")

    print("=== Phase 3: Wikidata district cross-check ===")
    qids = {r["wikidataQid"] for r in results if r.get("wikidataQid")}
    p131 = {}
    for qid in qids:
        claims = wikidata_claims(qid)
        vals = []
        for c in claims.get("P131", []):
            try:
                vals.append(c["mainsnak"]["datavalue"]["value"]["id"])
            except Exception:
                pass
        if vals:
            p131[qid] = vals
    labels = wikidata_labels({v for vs in p131.values() for v in vs})
    for r in results:
        q = r.get("wikidataQid")
        if q and q in p131:
            r["wikidataDistrict"] = [labels.get(v, v) for v in p131[q]]

    print("=== Phase 4: save raw ===")
    for r in results:
        with open(os.path.join(RAW, r["type"], r["slug"] + ".json"), "w") as f:
            json.dump(r, f, ensure_ascii=False, indent=1)
    print(f"saved {len(results)} raw records")

if __name__ == "__main__":
    main()
