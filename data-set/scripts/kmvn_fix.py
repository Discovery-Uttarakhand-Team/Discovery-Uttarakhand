# -*- coding: utf-8 -*-
"""Re-fetch KMVN hotel pages, extracting description, address, phone, email properly."""
import json, os, re, time
import requests
from bs4 import BeautifulSoup

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = requests.Session()
S.headers.update({"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) DiscoveryUttarakhandDataset/1.0 (travel research; sources attributed)"})
BASE = "https://www.kmvn.in"

props = json.load(open(os.path.join(ROOT, "raw", "kmvn", "kmvn_properties.json")))
named = [p for p in props if p["name"].strip()]

# verified district mapping (from KMVN district pages, official hotel-page addresses,
# and Wikidata P131 cross-checks of the destination articles)
DISTRICTS = {
    "nine-corner-retreat-trh-naukuchiyatal": "Nainital",
    "sarovar-bliss-trh-bhimtal": "Nainital",
    "holiday-home-almora": "Almora",
    "trh-bhikiyasen": "Almora",
    "trh-bhowali": "Nainital",
    "trh-birthi": "Pithoragarh",
    "trh-chaukori": "Pithoragarh",
    "trh-deenapani": "Almora",
    "trh-dharchula": "Pithoragarh",
    "trh-didihat": "Pithoragarh",
    "mahaashay-trh-dudhauli": "Almora",
    "trh-jageshwar": "Almora",
    "trh-munsyari": "Pithoragarh",
    "trh-ramnagar": "Nainital",
    "trh-snow-view-nainital-snow-view-heritage": "Nainital",
    "trh-sukhatal-nainital-mount-view": "Nainital",
    "trh-tallital-nainital-sarovar": "Nainital",
}

out = []
for p in named:
    slug = p["slug"]
    try:
        r = S.get(f"{BASE}/hotels/{slug}", timeout=30)
        time.sleep(0.7)
        s = BeautifulSoup(r.text, "html.parser")
        text_all = s.get_text("\n", strip=True)
        # description: longest paragraph that is not UI text
        paras = [re.sub(r"\s+", " ", x.get_text(" ", strip=True)) for x in s.find_all("p")]
        paras = [x for x in paras if len(x) > 120 and "password" not in x.lower()
                 and "e-mail address" not in x.lower() and "required field" not in x.lower()
                 and "privacy policy" not in x.lower()]
        paras.sort(key=len, reverse=True)
        p["description"] = paras[0] if paras else ""
        # contact block: look for a line containing PIN code or 'Distt'
        addr, phone, email = None, None, None
        m = re.search(r"([A-Z][^\n]*?(?:Uttarakhand\)?\s*[-:]?\s*\d{6}|Distt[^\n]*))", text_all)
        if m:
            addr = re.sub(r"\s+", " ", m.group(1)).strip()
        m = re.search(r"(\b[6-9]\d{9}\b)", text_all)
        if m:
            phone = m.group(1)
        m = re.search(r"([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})", text_all, re.I)
        if m:
            email = m.group(1)
        p["address"] = addr
        p["phone"] = phone
        p["email"] = email
        # facilities dedupe
        seen = set(); facs = []
        for f in p.get("facilities", []):
            if f not in seen:
                seen.add(f); facs.append(f)
        p["facilities"] = facs
        p["district"] = DISTRICTS.get(slug) or ({"us-nagar": "Udham Singh Nagar"}.get(p.get("districtPage")) or (p.get("districtPage") or "").title()) or None
        out.append(p)
        print(f"  {p['name'][:44]:<46} dist={str(p['district']):<12} addr={'Y' if addr else 'N'} ph={phone or '-'} em={'Y' if email else 'N'} desc={len(p['description'])}")
    except Exception as e:
        print("  FAIL", slug, str(e)[:80])
        p["district"] = DISTRICTS.get(slug) or ({"us-nagar": "Udham Singh Nagar"}.get(p.get("districtPage")) or (p.get("districtPage") or "").title()) or None
        out.append(p)

json.dump(out, open(os.path.join(ROOT, "raw", "kmvn", "kmvn_properties_v2.json"), "w"), ensure_ascii=False, indent=1)
print(f"saved {len(out)}")
