# -*- coding: utf-8 -*-
"""
Image selection v3 — relevance-scored.
Candidates = on-page article images + multi-query Commons search (token filtered).
Scoring: images whose *title* contains the entity's primary name tokens rank
first (this kills unrelated on-page illustrations); description matches add
score; wider images break ties. Strict license filter; global dedup; relaxed
threshold pass for entities that would otherwise have no image.
"""
import json, os, re, sys, time, hashlib, html, random, glob
import requests

BASE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(BASE)
CACHE = os.path.join(ROOT, "cache")
RAW = os.path.join(ROOT, "raw")

UA = "DiscoveryUttarakhandDataset/1.0 (travel-research data collection; all sources attributed)"
S = requests.Session()
S.headers.update({"User-Agent": UA})
W_EN = "https://en.wikipedia.org/w/api.php"
W_COMMONS = "https://commons.wikimedia.org/w/api.php"
PAUSE = 1.15

def api_get(url, params, retries=6):
    key = hashlib.sha256((url + "?" + "&".join(f"{k}={v}" for k, v in sorted(params.items()))).encode()).hexdigest()[:24]
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
                print(f"  .. 429, waiting {wait}s", flush=True)
                time.sleep(wait)
                continue
            r.raise_for_status()
            data = r.json()
            with open(path, "w") as f:
                json.dump(data, f)
            time.sleep(PAUSE + random.random() * 0.35)
            return data
        except Exception as e:
            if i == retries - 1:
                print(f"  !! FAILED {str(params.get('titles') or params.get('srsearch'))[:70]}: {e}", flush=True)
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
    r"(flag|logo|coat[_ ]of[_ ]arms|seal|icon|symbol|locator|location[_ ]map|map[_ ]of|\.map|[_\s\-.]maps?[_\s\-.]|\bmap\b|[_\s]plans?[_\s]|plan[_ ]of|ambox|wiki(pedia|source|voyage|data|tionary)|commons-logo|edit-|padlock|question_book|star_|arrow|disambig|portal|sound|audio|speaker|loudspeaker|folder|nuvola|crystal|emblem|signature|magnify|increase|decrease|wikispecies|ombudsman|red[_ ]pencil|revert|merge|proposed|stamp)",
    re.I)
# images clearly depicting OTHER regions – never relevant for Uttarakhand entities
WRONG_REGION_PAT = re.compile(
    r"(dharamsala|dharamshala|himachal|varanasi|banaras|uttar[_ ]pradesh|kashmir|nepal|sikkim|darjeeling|shimla|manali|london|hampstead|puri|odisha|orissa)", re.I)
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

def clean_url(u):
    if not u:
        return u
    return u.split("?utm_")[0].split("&utm_")[0]

def imageinfo(titles):
    out = {}
    for i in range(0, len(titles), 20):
        batch = titles[i:i + 20]
        data = api_get(W_EN, {
            "action": "query", "format": "json", "titles": "|".join(batch), "redirects": 1,
            "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1600,
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
                "title": p["title"],
                "url": clean_url(info.get("thumburl") or info.get("url")),
                "originalUrl": clean_url(info.get("url")),
                "page": info.get("descriptionurl"),
                "width": info.get("width"), "height": info.get("height"), "mime": info.get("mime"),
                "repo": p.get("imagerepository"),
                "licenseShort": mdv("LicenseShortName"),
                "licenseUrl": (md.get("LicenseUrl") or {}).get("value", ""),
                "artist": mdv("Artist"), "credit": mdv("Credit"),
                "description": mdv("ImageDescription"),
            }
        for frm, to in redir.items():
            if to in out:
                out[frm] = dict(out[to]); out[frm]["title"] = frm
    return out

def commons_search(query, limit=20):
    data = api_get(W_COMMONS, {
        "action": "query", "format": "json", "list": "search",
        "srsearch": query, "srnamespace": 6, "srlimit": limit, "srprop": "",
    })
    if not data:
        return []
    return [r["title"] for r in data.get("query", {}).get("search", [])]

GENERIC = {"in","on","at","of","the","and","near","national","park","temple","trek","lake","fall","falls",
           "safari","boating","yatra","skiing","wildlife","jeep","bungee","jumping","white","water","rafting",
           "devi","sahib","gurdwara","church","ashram","zoo","institute","house","india","mountain","hill","visit",
           "uttarakhand","uttrakhand","garhwal","kumaon","himalaya","himalayas","peak","glacier","pass","kund","mandir","range","view"}

def name_tokens(name, extra=None):
    words = re.findall(r"[a-zA-Z]{3,}", name)
    toks = {w.lower() for w in words if w.lower() not in GENERIC}
    for e in (extra or []):
        if e:
            toks.add(e.lower())
    return toks

def tok_match(tok, text):
    """word-boundary match; a token ending in 's' may also match its stem"""
    variants = {tok}
    if len(tok) >= 5 and tok.endswith("s"):
        variants.add(tok[:-1])
    pat = r"\b(" + "|".join(re.escape(v) for v in variants) + r")\b"
    return re.search(pat, text) is not None

def img_rec(info, alt_default):
    attr_parts = []
    if info.get("artist"):
        attr_parts.append(info["artist"])
    if info.get("credit"):
        attr_parts.append(info["credit"])
    attribution = " — ".join(attr_parts) if attr_parts else "See file page for author/credits"
    lic = info.get("licenseShort") or "Unverified"
    if info.get("licenseUrl"):
        lic = f"{lic} ({info['licenseUrl']})"
    alt = (info.get("description") or alt_default or info["title"].replace("File:", "").replace("_", " "))[:250]
    return {
        "url": info["url"],
        "source": "Wikimedia Commons",
        "sourcePage": info["page"],
        "license": lic,
        "attribution": attribution,
        "alt": alt,
    }

def load_config_maps():
    sys.path.insert(0, BASE)
    import config as C
    extra, ctx = {}, {}
    for ents in (C.DESTINATIONS, C.SPIRITUAL, C.CULTURAL, C.ACTIVITIES):
        for e in ents:
            extra[e["name"]] = e.get("extra_tokens", [])
            ctx[e["name"]] = e.get("search_ctx", e["name"])
    return extra, ctx

def score_image(info, toks, sec_toks=None, pageimage=None):
    t = info["title"].lower().replace("_", " ")
    d = (info.get("description") or "").lower()
    if WRONG_REGION_PAT.search(t):
        return -100
    matched = sum(1 for tok in toks if tok_match(tok, t))
    score = 0
    if toks and matched == len(toks):
        score += 10
    elif matched > 0:
        score += 4 + min(matched, 3)
    if any(tok_match(tok, d) for tok in toks):
        score += 3
    for st in (sec_toks or set()):
        if tok_match(st, t):
            score += 2
    if pageimage and info["title"].split("File:")[-1].replace("_", " ").lower() == pageimage.replace("_", " ").lower():
        score += 15
    if re.search(r"\b(flood|landslide|damaged?|debris|wreck|2013 disaster)\b", t):
        score -= 8
    w = info.get("width") or 0
    if w >= 2500:
        score += 2
    elif w >= 1500:
        score += 1
    return score

def pick_for(r, extra, ctx, used, strict=True, use_pageimage=True):
    name = r["name"]
    toks = name_tokens(name, extra.get(name))
    # secondary tokens: location + district words (so e.g. the Hampstead
    # "Gurney Drive" photo can never beat the Nainital "Gurney House")
    sec_toks = set()
    for srcstr in [r.get("location", ""), r.get("curatedDistrict", "")]:
        for w in re.findall(r"[a-zA-Z]{4,}", srcstr):
            if w.lower() not in GENERIC and w.lower() not in toks:
                sec_toks.add(w.lower())
    pageimage = r.get("pageimage") if use_pageimage else None
    onpage = [t for t in r.get("onPageImages", []) if file_ok(t)][:25]
    queries = []
    for q in [ctx.get(name), r.get("articleTitle"), name, name + " Uttarakhand"]:
        if q and q not in queries:
            queries.append(q)
    sres = []
    for q in queries[:3]:
        if len(sres) >= 20:
            break
        for t in commons_search(q, limit=16):
            if file_ok(t) and any(tok_match(tok, t.lower().replace("_", " ")) for tok in toks) and t not in sres:
                sres.append(t)
    candidates = onpage + [t for t in sres if t not in onpage]
    info = imageinfo(candidates)
    def ok(i):
        return (i.get("mime") in ("image/jpeg", "image/png")
                and (i.get("width") or 0) >= (900 if strict else 700)
                and (i.get("height") or 0) >= (500 if strict else 420)
                and (max(i["width"], i["height"]) / max(1, min(i["width"], i["height"]))) <= 3.2
                and license_ok(i["licenseShort"]))
    scored = []
    for idx, t in enumerate(candidates):
        i = info.get(t)
        if i and ok(i):
            scored.append((score_image(i, toks, sec_toks, pageimage), -idx, i))   # -idx: earlier (on-page) wins ties
    scored = [s for s in scored if s[0] >= 0]
    scored.sort(key=lambda x: (-x[0], x[1]))
    uniq, seen_titles = [], set()
    for sc, negidx, i in scored:
        if i["title"] in seen_titles:
            continue
        seen_titles.add(i["title"])
        uniq.append(i)
    fresh = [i for i in uniq if i["title"] not in used]
    chosen = fresh[:8]
    if len(chosen) < 3:
        chosen += [i for i in uniq if i not in chosen][:3 - len(chosen)]
    for i in chosen:
        used.add(i["title"])
    return chosen, len(onpage), len(sres), len(uniq)

def main():
    extra_map, ctx_map = load_config_maps()
    files = []
    for kind in ["destination", "spiritual", "cultural", "activity", "stays"]:
        files += sorted(glob.glob(os.path.join(RAW, kind, "*.json")))
    recs = [json.load(open(f)) for f in files]
    order = {"destination": 0, "spiritual": 1, "cultural": 2, "activity": 3}
    recs.sort(key=lambda r: (order.get(r["type"], 9), r["name"]))
    used = set()
    no_cover = []
    for r in recs:
        chosen, n_on, n_sr, n_lic = pick_for(r, extra_map, ctx_map, used, strict=True)
        cover, gallery = None, []
        if chosen:
            cover = chosen[0]
            for i in chosen:
                if (i.get("width") or 0) > (i.get("height") or 0):
                    cover = i
                    break
            gallery = [i for i in chosen if i["title"] != cover["title"]]
        lowres = False
        if not cover:
            # relaxed pass for entities with nothing
            chosen2, _, _, _ = pick_for(r, extra_map, ctx_map, set(), strict=False, use_pageimage=False)
            if chosen2:
                cover = chosen2[0]
                lowres = True
        r["coverImage"] = img_rec(cover, f"{r['name']}, Uttarakhand") if cover else None
        r["coverImageLowerResolution"] = lowres
        r["gallery"] = [img_rec(i, f"{r['name']}, Uttarakhand") for i in gallery]
        if not cover:
            no_cover.append(name := r["name"])
        with open(os.path.join(RAW, "stays" if r["type"] == "stay" else r["type"], r["slug"] + ".json"), "w") as f:
            json.dump(r, f, ensure_ascii=False)
        cov_url = r["coverImage"]["url"].split("/")[-1][:44] if r["coverImage"] else "NONE"
        print(f"  {r['type'][:4]} {r['name'][:36]:<38} lic={n_lic:<3} cover={cov_url}", flush=True)
    print(f"\nunique images used: {len(used)}")
    print("NO COVER:", no_cover)

if __name__ == "__main__":
    main()
