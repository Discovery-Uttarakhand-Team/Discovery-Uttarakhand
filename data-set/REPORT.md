# Discovery Uttarakhand — Dataset Build Report

**Build date:** 2026-09-09 (base) · **2026-09-12: Expansion Batches 1+2 added** · **Principle enforced throughout:** REAL data only — every value is traceable to a fetched, permitted source; unverifiable fields are `null`, never invented.

---

## 1. Totals

| Category | File | Base | **+ Expansion** | **Final** |
|---|---|---:|---:|---:|
| Destinations | `data/destinations.json` | 37 | +52 | **89** |
| Spiritual places | `data/spiritual.json` | 26 | +26 | **52** |
| Cultural places | `data/culture.json` | 7 | +23 | **30** |
| Activities / experiences | `data/activities.json` | 20 | +5 | **25** |
| Stays (49 KMVN + 2 heritage) | `data/stays.json` | 51 | — | **51** |
| Rentals (5 bike, 4 car) | `data/rentals.json` | 9 | — | **9** |
| Guides (UTDB-verified) | `data/guides.json` | 190 | — | **190** |
| **Total records** | | **340** | **+106** | **446** |
| Unique images (manifest) | `data/image-manifest.json` | 668 | +552 | **1220** |

## 1b. EXPANSION BATCH 2 (added 2026-09-12) — TripAdvisor gap-fill

Benchmarked against TripAdvisor's "THE 30 BEST Things to Do in Uttarakhand" (tripadvisor.in, viewed once for comparison only — no scraping, no TripAdvisor content or images copied) and discover-uttarakhand.com (a Haridwar travel-agency site — structure reviewed, nothing copied).

- **Top-12 coverage: 10/12 already present** (Triveni Ghat, Nainital Lake, Ganga Aarti via Har Ki Pauri, Kainchi Dham, Har Ki Pauri, Parmarth Niketan, Kedarnath, Beatles Ashram, Valley of Flowers, Lal Tibba via Landour/Mussoorie highlights).
- **11 new Wikipedia-documented records added:** Om Parvat, Adi Kailash, Kuthi Valley, Dunagiri, Binsar Wildlife Sanctuary, Panchachuli, Tiger Falls, Robber's Cave (destinations); Lakshman Jhula, Ram Jhula, Winterline (culture).
- **Known gaps deliberately NOT added** (no permitted-source documentation exists — only third-party travel sites with unclear reuse terms and inconsistent data): **Vashishta Gufa (TA #6)**, Kunjapuri Temple, Corbett Falls, Gartang Gali, Jhilmil Jheel, Naina Devi Temple (Nainital), Neer Garh Falls, Snow View Point. These need manual verification against an official/ashram source before inclusion.
- Batch-2 image audit: Tiger Falls initially matched a "Tiger Falls, Whipsnade Zoo (UK)" photo — caught and replaced; Om Parvat's first cover was an ambiguous Auli-view photo — replaced with a verified Om Parvat image; Binsar WLS cover switched to a sanctuary forest photo.

## 1a. EXPANSION BATCH 1 (added 2026-09-12) — CURRENT / NEW / FINAL

- **CURRENT (base):** 340 records · **NEW (+95):** 44 destinations, 26 spiritual, 20 cultural, 5 activities · **FINAL: 446 records, 1220 unique images**
- All 95 new entities are Wikipedia-documented, sourced via systematic category mining (Tourist attractions in Uttarakhand tree, hill stations, valleys, passes, protected areas, temples, museums, festivals, hiking trails).
- **Duplicates:** 6 duplicate image URLs removed at manifest level; 0 duplicate slugs; every new name cross-checked against existing entities before adding.
- **Coordinate validation:** all 148 records with coordinates pass bounds checks; 1 flagged for manual review — Gangotri National Park (article publishes 31.63°N, slightly beyond the commonly-cited state boundary; kept verbatim with `locationSource: "Wikipedia article"`).
- **Records missing cover images:** 60 (49 KMVN stays + 11 wiki entities listed in §12a).
- **District audit:** every new record's curated district cross-checked against Wikidata P131. Two corrections found and fixed: Binsar Mahadev Temple → Pauri Garhwal (article documents the Bisaona/Thalisain temple, not the Ranikhet-area one); Mindrolling Monastery re-sourced to the Clement Town article (the "Mindrolling Monastery" article covers the Tibet original). Kedarnath Wildlife Sanctuary flagged as genuinely multi-district (Rudraprayag primary).
- **Full independent validation (scripts/validate.py, 2026-09-12): PASS, 0 errors.** Checks: counts, required+provenance fields, slug/name uniqueness, 148 coordinate bounds + GeoJSON [lng,lat] order in seed, 1160 image slots ↔ manifest reconciliation (0 orphans, 0 missing, **0 images shared across records**), 30 bestTimeToVisit verbatim-integrity checks, vehicle type enum, price sanity, guides' string location, seed↔data record-level consistency, live URL spot-checks (28/28 images, 12/12 source pages HTTP 200). 12 benign warnings (same-name distinct guides, entity-name containment like "Gangotri NP" ⊃ "Gangotri").
- **Image quality audit (post-run):** 7 wrong-place covers caught and fixed/nulled — Chamba (HP museum art), Someshwar (Nashik), Hanumangarhi (Cologne Cathedral), Khalanga (Taj Mahal — correct image was in its gallery), Khatling (Kafni), Virasat (Alva's, Karnataka), Kumaoni Holi (generic — replaced with a verifiable Haldwani photo), Neelkanth Mahadev (Kumbhalgarh, Rajasthan). Mana's gallery junk (NZ/Croatia files) removed. Cross-record duplicate images eliminated (Gaumukh/Gaumukh trek, Kedarnath/Char Dham yatra, Yamunotri/Yamunotri Temple, Satopanth Tal/Satopanth Tal Trek — the trek now uses the distinct ridge-route photo); Kedartal photo removed from Satopanth Tal records (different lake). Where no properly-licensed image of the right place exists, cover is `null` — no wrong-place image is ever kept.
- **bestTimeToVisit:** 30 records now carry a sourced value (was 23), each with its supporting sentence in `bestTimeSourceSentence`.

All 340 records carry `name`, `slug` (unique across all files), `sourceName`, `sourceUrl`, `sourcePageUrl`, `lastVerified` (2026-09-09).

## 2. Destinations detail
- 37/37 have district, region, coordinates, description and cover image.
- `bestTimeToVisit` populated for 12/37 — each value is a verbatim month-range extracted from a source sentence, and every record also stores that supporting sentence in `bestTimeSourceSentence`. The other 25 are honestly `null` (the sources make no explicit best-time claim; climate descriptions were deliberately *not* used).
- `experiences` (keyword-derived, e.g. Rishikesh: Trekking, River Rafting, Yoga & Wellness…), `highlights` (verified landmark mentions, e.g. Mussoorie: Kempty Falls, Gun Hill, Lal Tibba, Landour), `nearbyPlaces` (cross-mentions within the same source article).
- Auli was re-sourced from the correct article `Auli, India` (the bare `Auli` article is a disambiguation page — caught and fixed).

## 3. Spiritual places detail
26 temples/shrines/ghats/ashrams, all with district, coords, descriptions and images. 7/26 have sourced `bestTimeToVisit` (e.g. Badrinath Temple "late April to early November" — temple open season; Yamunotri Temple "May to November (temple opening season)" derived from its documented Akshaya Tritiya → Yama Dwitiya opening cycle).

## 4. Cultural places detail
7 records (Forest Research Institute, G.B. Pant High Altitude Zoo, Christ Church Mussoorie, St. John in the Wilderness, Gurney House, Dwarahat, Advaita Ashrama Mayawati). 5/7 have coordinates; the two churches have no coordinates on Wikipedia/Wikidata (left null rather than approximated).

## 5. Activities detail
20 records (treks, rafting, safaris, skiing, yatras). 15/20 have coordinates (Dayara Bugyal recovered from Wikidata Q105063084). 4/20 have sourced `bestTimeToVisit`. 1 record (Bungee Jumping at Mohan Chatti) has no cover image — no freely licensed photo could be found (see §12).

## 6. Stays detail
- **49 KMVN (Kumaon Mandal Vikas Nigam) properties** — official Uttarakhand government tourism accommodation: district (all 49 assigned via hand-verified mapping), postal address, 48/49 phone (from KMVN's authoritative /contact TRH table), email, deduplicated facilities, room types, and **lowest published tariff** (₹, GST-in, queried for a 10 Oct 2026 stay; `priceNotes` documents this and `priceLastChecked` recorded).
- **2 heritage hotels** documented on Wikipedia: Savoy Hotel, Mussoorie (1902, ITC-managed) and Ananda in the Himalayas (Narendra Nagar). Both have CC BY-SA images (8 each). Ananda's district corrected to **Tehri Garhwal** (Wikidata P131 = Narendranagar) and its coordinates sourced from OpenStreetMap (`locationSource` field cites ODbL). Prices not published on Wikipedia → `null` with explanatory `priceNotes`.
- 49 KMVN properties have no images — KMVN website photos carry no reuse licence (see §13).

## 7. Rentals detail
9 businesses, all with published business phone numbers verified on their official websites (robots.txt checked permissively before fetching): Himanshu Bike Rent (Rishikesh), Tour On 2 Wheelers (Rishikesh), Dehradun Bike Rentals, Nainital Biker, Kathgodam Bike Rental, Roadcrafts, Car Starq, Finchant, A-One Self Drive (Dehradun). Per-model `pricePerDay` only where published (26 of 41 vehicle entries); where only a range is advertised it is preserved verbatim in `priceNotes` (e.g. Roadcrafts "Rs 1,399–4,599/day"). Three businesses publish self-reported schema.org ratings — included **only** with an explicit `ratingSource` caveat flag. Nainital Biker and nainitalbikerent.com were identified as the same business (shared phone) and merged. All rental/stay business photos excluded for licensing reasons (see §13).

## 8. Guides detail
190 guides from the **official UTDB Tourist Guide Platform** (touristguide.uttarakhandtourism.gov.in) — all `verificationStatus: "verified"`, `verifiedByGovt: true`, with languages, specialties, experience, districts, bio, phone (published by UTDB expressly for tourist contact) and profile URL. Emails are deliberately omitted (privacy-minimising); profile photos excluded (no reuse licence).

## 9. Images & manifest
- **668 unique images**, all in `data/image-manifest.json` with `imageUrl`, `sourcePage`, `license`, `attribution`, `alt`, `entityId`, `entityType` — and the same metadata is embedded inline on each record's `coverImage`/`gallery`/`images`.
- **duplicatesRemoved: 2** — cross-record duplicate URLs removed at manifest level.
- Every image URL is a stable Wikimedia Commons URL (23/24 sampled returned HTTP 200 live; 1 returned 429 rate-limit to my checker, not a dead link).
- recordsWithMissingImages: 50 (49 KMVN stays + 1 activity).
- No Cloudinary uploads have been made — the manifest is awaiting your approval, per instructions.

## 10. Sources used (in priority order)
1. **Official Uttarakhand tourism/government**: KMVN (kmvn.in) — 49 stays; UTDB Tourist Guide Platform — 190 guides.
2. **Wikipedia (English)** — 90 entities (text extracts, coordinates, images); **Wikivoyage (English)** — 2 primary + extracts supplements for best-time data.
3. **Wikimedia Commons** — all 668 images (licence metadata from each file page).
4. **Wikidata (CC0)** — coordinates for 6 entities whose articles had none (Chakrata, Kanatal, Dhari Devi, Kedarnath Temple, Patal Bhuvaneshwar, Dayara Bugyal) + Ananda district verification.
5. **OpenStreetMap via Nominatim (ODbL)** — Ananda in the Himalayas coordinates (single respectful query).
6. **Business official websites** — 9 rental businesses (robots.txt verified permissive; one site explicitly welcomes AI citation).

## 11. Licenses encountered (668 images)
| Licence | Count |
|---|---|
| CC BY-SA 4.0 | 439 |
| CC BY-SA 3.0 | 88 |
| CC0 | 40 |
| CC BY 2.0 | 30 |
| CC BY 4.0 | 26 |
| CC BY 3.0 | 15 |
| Public domain | 14 |
| CC BY-SA 2.0 | 14 |
| CC BY-SA 3.0 igo | 1 |
| CC BY-SA 2.5 | 1 |

All permit reuse with attribution; per-image `attribution` strings are carried in the manifest. Text content from Wikipedia/Wikivoyage is CC BY-SA 4.0 (recorded per record in `contentLicense`); Wikidata data is CC0; OSM data is ODbL (cited per record in `locationSource`).

## 12. Records needing manual verification
1. **KMVN Monal (Ranikhet)** phone — official /contact table says 9411542378; property page shows 9411306241. Contact-table value used.
2. **KMVN Shitalakhet** phone — /contact table 9012616706 vs property page 7534001730. Table value used.
3. **KMVN Jageshwar** phone 05962263028 (landline format, from /contact table) — worth a call test.
4. **KMVN Katarmal** phone — property page displays Deenapani's number (demonstrable site error); value nulled.
5. **KMVN Narayan Ashram** phone — page displays Dharchula's number; nulled.
6. **A-One Self Drive** coordinates — the site's own schema.org coordinates resolve to Ludhiana, Punjab; nulled with explanatory `locationNotes`.
7. **Rental ratings** (Himanshu 4.9/200, Finchant 4.9/286, A-One 4.9/11) — self-reported, flagged in `ratingSource`.
8. **Christ Church, Mussoorie** — cover image is low resolution (best available under free licence).
9. **Bungee Jumping at Mohan Chatti** — no free-licence image found; cover null.
10. **KMVN tariffs** — snapshot for a 10 Oct 2026 query date; re-verify seasonally before price-dependent features go live.

## 12a. No-cover records (honest nulls)
Chamba, Someshwar, Sonprayag, Govind Pashu Vihar NP, Gurdwara Gyan Godri Sahib, Jwalpa Devi Temple, Bal mithai, Kandali Festival, Virasat, Khatling Glacier Trek, Bungee Jumping at Mohan Chatti — no freely-licensed image of the correct place could be verified on Wikimedia Commons (wrong-place matches were deliberately rejected).

## 13. Limitations
1. **49 unnamed KMVN records dropped**: the original scrape contained 98 property entries; 49 were tariff links with no property name/details on their pages. Final set is the 49 fully documented properties.
2. **GMVN (Garhwal Mandal Vikas Nigam) absent**: gmvnonline.com is behind a Cloudflare challenge that cannot be respected-ly bypassed → zero Garhwal-region government rest houses. Garhwal coverage relies on the 2 heritage hotels.
3. **No photos for KMVN stays, rentals, or guide profiles** — none of those sources grant image reuse rights, so `images: []` rather than licence violations.
4. **bestTimeToVisit null for 67/90 wiki entities** — no explicit best-time claim in the source (a data-honesty choice, not an oversight).
5. **idealDuration / budgetLevel null everywhere** — no source met the no-fabrication bar.
6. **7 records without coordinates** (2 churches, 5 multi-point activities like Chota Char Dham Yatra and rafting stretches — a single point would misrepresent them).
7. **Heritage hotel prices null** — not published on their Wikipedia sources.
8. Wikivoyage's Nainital best-time ("May to July") is the source's own claim and is attributed as such; mainstream advice often differs.
9. 4 candidate heritage hotels (Claridges Nabha, Taj Corbett, Crystal Palace, Jim's Jungle Retreat) have no Wikipedia article → excluded; only Wikipedia-documented hotels included.
10. KMVN district assignments for a handful of remote camps (Adi Kailash route) rest on KMVN's own district booking pages.

## 14. Files created
```
discovery-uttarakhand/
├── data/
│   ├── destinations.json      (208 KB, 37 records)
│   ├── spiritual.json         (139 KB, 26)
│   ├── culture.json           ( 36 KB,  7)
│   ├── activities.json        (101 KB, 20)
│   ├── stays.json             ( 90 KB, 51)
│   ├── rentals.json           ( 16 KB,  9)
│   ├── guides.json            (201 KB, 190)
│   ├── image-manifest.json    (402 KB, 668 images)
│   └── data-summary.json      (counts, duplicatesRemoved, recordsWithMissingImages, lastVerified)
├── raw/                       (source snapshots: 90 wiki entities, kmvn v2, guides, rentals, stays)
├── scripts/                   (config, collect, images v4, kmvn_fix, build_records — reproducible pipeline)
└── REPORT.md                  (this file)
```

## 15. Errors encountered & resolutions
1. Auli article was a disambiguation page → re-sourced to `Auli, India` + Wikivoyage extract.
2. Best-time regex initially produced truncated ranges ("December to") and false positives (monsoon seasons, a ropeway schedule, a 2005 tiger-hunting quote) → replaced with a 3-tier extractor (best/ideal → open-season → opens/closes calendar) with keyword exclusions and manual sentence-level review of all 23 final values.
3. Regex capture-group collision produced "May to May" for Yamunotri Temple → non-capturing month group; now "May to November (temple opening season)".
4. Manifest skipped heritage-hotel images (singular/plural key mismatch) → fixed; manifest and records now reconcile exactly (668 = 668).
5. A-One schema.org coordinates resolved to another state → nulled with `locationNotes`.
6. UTDB guide API endpoints 404 → parsed the server-rendered RSC payload across 10 paginated pages instead (190 unique guides).
7. GMVN Cloudflare block, roadcrafts fleet-page 404, finchant contact-page 500 → skipped/permitted alternatives used.
8. KMVN v1 scrape defects (login-modal text in descriptions, duplicated facilities, 17 unmapped districts) → rebuilt in kmvn_fix.py v2.

## 16. Compliance notes
- robots.txt checked (and honoured) for every non-API site fetched; no logins, CAPTCHAs, paywalls or anti-bot systems bypassed (GMVN skipped for this reason).
- No private personal data: guide phones are business-contact details published by the government platform for tourist contact; emails omitted.
- Dedupe: normalised name/phone/website matching (Nainital Biker merger); no auto-merging of possibly-distinct businesses.
- Source URLs verified reachable (12/12 sample, HTTP 200).

## 17. Recommended next steps
1. Review `image-manifest.json` and approve the Cloudinary upload list.
2. Review the §12 manual-verification list (esp. the two KMVN phone conflicts).
3. Seed MongoDB from `data/*.json` (records are schema-ready; `slug` fields are globally unique and indexable).
4. Consider a follow-up pass for GMVN stays via a different permitted source, and re-verify KMVN tariffs closer to launch.
