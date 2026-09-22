# -*- coding: utf-8 -*-
"""
Collect KMVN (Kumaon Mandal Vikas Nigam — Uttarakhand govt tourism PSU) tourist
rest houses from their official website www.kmvn.in (robots.txt permits all but
/admin/). For each property: detail page (facilities, description), official
tariff via the public booking widget, and TRH phone from the contact page.
All images on kmvn.in are copyright (no reuse license stated) -> NOT collected.
"""
import json, os, re, time, html
import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "raw", "kmvn")
os.makedirs(OUT, exist_ok=True)
UA = "Mozilla/5.0 (X11; Linux x86_64) DiscoveryUttarakhandDataset/1.0 (travel research; sources attributed)"
S = requests.Session()
S.headers.update({"User-Agent": UA})
BASE = "https://www.kmvn.in"

def get(url, **kw):
    for i in range(4):
        r = S.get(url, timeout=30, **kw)
        if r.status_code in (429, 503):
            time.sleep(10); continue
        r.raise_for_status()
        time.sleep(0.7)
        return r
    raise RuntimeError(f"failed {url}")

def post(url, data):
    for i in range(4):
        r = S.post(url, data=data, timeout=30)
        if r.status_code in (429, 503):
            time.sleep(10); continue
        r.raise_for_status()
        time.sleep(0.7)
        return r
    raise RuntimeError(f"failed {url}")

def text_of(el):
    return re.sub(r"\s+", " ", el.get_text(" ", strip=True))

# 1) hotels listing -> all hotel slugs + ids
r = get(BASE + "/hotels")
soup = BeautifulSoup(r.text, "html.parser")
hotels = {}
for a in soup.find_all("a", href=True):
    m = re.match(r"/hotels/([a-z0-9\-]+)$", a["href"])
    if m:
        name = text_of(a) or m.group(1)
        hotels[m.group(1)] = re.sub(r"\s+", " ", name).strip()
# ids from tariff links
for a in soup.find_all("a", id="tarrif"):
    hid = a.get("hid"); hit = a.get("hit")
    if hid:
        hotels.setdefault(hit, "")
print(f"found {len(hotels)} hotel entries")

# 2) district booking pages -> district mapping
district_of = {}
for d in ["almora", "bageshwar", "champawat", "nainital", "pithoragarh", "us-nagar"]:
    try:
        r = get(f"{BASE}/booking/{d}")
        s = BeautifulSoup(r.text, "html.parser")
        for a in s.find_all("a", href=True):
            m = re.match(r"/hotels/([a-z0-9\-]+)$", a["href"])
            if m:
                district_of[m.group(1)] = d
    except Exception as e:
        print("district page fail", d, e)
print("district mapping:", len(district_of))

# 3) contact page -> TRH phones
r = get(BASE + "/contact")
cs = BeautifulSoup(r.text, "html.parser")
trh_phones = {}
for table in cs.find_all("table"):
    rows = table.find_all("tr")
    for row in rows:
        cells = [text_of(c) for c in row.find_all(["td", "th"])]
        if len(cells) >= 2 and re.search(r"\d{10}", cells[1] or ""):
            key = cells[0].strip().lower()
            val = re.findall(r"[\d\s,+]{10,}", cells[1])
            if val:
                trh_phones[key] = val[0].strip()
print("TRH phones:", len(trh_phones))
json.dump(trh_phones, open(os.path.join(OUT, "_phones.json"), "w"), indent=1)

# 4) per-hotel pages + tariffs
results = []
slug_ids = {}
for a in soup.find_all("a", id="tarrif"):
    if a.get("hid") and a.get("hit"):
        slug_guess = a["hit"].strip().lower().replace("(", "").replace(")", "")
        slug_ids[a["hit"].strip()] = a["hid"]

for slug, name in sorted(hotels.items()):
    rec = {"slug": slug, "name": name, "districtPage": district_of.get(slug)}
    try:
        r = get(f"{BASE}/hotels/{slug}")
        s = BeautifulSoup(r.text, "html.parser")
        # title
        h1 = s.find("h1")
        rec["name"] = re.sub(r"\s+", " ", h1.get_text(strip=True)) if h1 else name
        # facilities = images alt texts in the facility strip
        facs = []
        for img in s.find_all("img", src=True):
            if "/facility/" in img["src"]:
                alt = (img.get("alt") or "").strip()
                if alt:
                    facs.append(alt)
        rec["facilities"] = facs
        # description: first long paragraph
        paras = [text_of(p) for p in s.find_all("p")]
        paras = [p for p in paras if len(p) > 80]
        rec["description"] = paras[0] if paras else ""
        rec["srcImages"] = len([i for i in s.find_all("img", src=True) if "/medias/hotel/" in i["src"]])
    except Exception as e:
        rec["error"] = str(e)[:120]
    # tariff
    hid = None
    for hitname, h in slug_ids.items():
        if slug in hitname.lower().replace("(", "").replace(")", "").replace(" ", "-") or hitname.strip().lower() == rec["name"].strip().lower():
            hid = h; break
    if hid is None:
        # try matching by first word
        for hitname, h in slug_ids.items():
            if hitname.split()[0].lower() in rec["name"].lower():
                hid = h; break
    rec["hid"] = hid
    if hid:
        try:
            r = post(f"{BASE}/custom/ajax/getAvailByDate.php",
                     data={"id": hid, "hit": rec["name"], "start_time": "10/10/2026",
                           "end_time": "11/10/2026", "filter": "change_slot"})
            s = BeautifulSoup(r.text, "html.parser")
            rows = []
            for tr in s.find_all("tr"):
                cells = [text_of(c) for c in tr.find_all(["td", "th"])]
                if cells:
                    rows.append(cells)
            rooms = []
            for cells in rows:
                if len(cells) >= 8 and re.search(r"₹", " ".join(cells)):
                    rooms.append({"roomType": cells[1], "mealPlan": cells[2],
                                  "totalRooms": cells[3], "available": cells[4],
                                  "tariff": cells[5], "extraPerson": cells[6]})
            rec["rooms"] = rooms
        except Exception as e:
            rec["tariffError"] = str(e)[:120]
    results.append(rec)
    print(f"  {rec['name'][:44]:<46} dist={rec.get('districtPage') or '?':<12} facs={len(rec.get('facilities',[]))} rooms={len(rec.get('rooms',[]))}")

json.dump(results, open(os.path.join(OUT, "kmvn_properties.json"), "w"), ensure_ascii=False, indent=1)
print(f"saved {len(results)} KMVN properties")
