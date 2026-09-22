# MASTER PROMPT — Discovery Uttarakhand: Database + Application Layer

> **How to use:** Copy the `seed/` folder (7 JSON files) and `data/image-manifest.json` from the `discovery-uttarakhand` dataset folder into your backend repo (e.g. `backend/seed/`), then paste everything below this line into Antigravity as a single prompt.

---

## ROLE & CONTEXT

You are working on **Discovery Uttarakhand**, an existing MERN application:

- **Frontend:** React + Vite (pages for Destinations, Spiritual, Culture, Activities, Stays, Rentals, Guides, Trip Planner, User Panel, Admin Panel)
- **Backend:** Node.js + Express
- **Database:** MongoDB + Mongoose
- **Images:** Cloudinary (configured)
- **Existing Mongoose models:** `User`, `Destination`, `Stay`, `Rental`, `Guide`, `Review`, `Booking`

A fully-sourced, REAL-data-only dataset of **446 records** has already been scraped and validated (every record carries `sourceName`, `sourceUrl`, `sourcePageUrl`, `lastVerified`; every image carries `license`, `attribution`, `alt`). Your job is the **application layer**: seed this data, add the missing collections, wire relationships and indexes, and build auth + user features — **without breaking the existing frontend**.

### Input files (copy to `backend/seed/`)

| File | Collection | Docs | Notes |
|---|---|---:|---|
| `seed/destinations.json` | `destinations` | 89 | |
| `seed/spiritual.json` | `spiritual` | 52 | NEW collection |
| `seed/culture.json` | `culture` | 30 | NEW collection |
| `seed/activities.json` | `activities` | 25 | NEW collection |
| `seed/stays.json` | `stays` | 51 | 49 KMVN + 2 heritage |
| `seed/rentals.json` | `rentals` | 9 | 41 embedded vehicles |
| `seed/guides.json` | `guides` | 190 | UTDB-verified |
| `seed/image-manifest.json` | — | 668 | Cloudinary phase 2 only — DO NOT seed |

Expected totals: **89 + 52 + 30 + 25 + 51 + 9 + 190 = 446**. Slugs are globally unique across all 7 files.

---

## NON-NEGOTIABLE RULES

1. **REAL data only.** Never invent, default, or "fill in" values. `null` fields (e.g. `idealDuration`, `budgetLevel`, unpublished rental prices, 49 KMVN stay coordinates) must stay `null`.
2. **Provenance is immutable.** `sourceName`, `sourceUrl`, `sourcePageUrl`, `contentLicense`, `lastVerified` and every image's `license` / `attribution` / `alt` / `sourcePage` are display-only. Admin CRUD must never modify or drop them (legal requirement — CC BY-SA attribution).
3. **Do not break the existing frontend.** Additive changes only. Before renaming or removing any existing model field, grep the frontend for its usage. Existing tests/lint must pass and the app must boot.
4. **No Cloudinary uploads in this phase.** All image `publicId` fields are `null` by design; URLs point to Wikimedia. A later migration (phase 2) will upload from the manifest and fill `publicId`.
5. **No secrets in code.** Admin credentials come from env vars only.
6. **Guides' `location` is a plain string** (e.g. `"Dehradun, Tehri Garhwal"`), NOT GeoJSON. Only the 6 content collections listed below use GeoJSON `location`.

---

## 1. MONGOOSE MODELS

### Shared subdocument — `Image`

```js
const imageSchema = new mongoose.Schema({
  url:        { type: String, required: true },   // Wikimedia URL now, Cloudinary URL after phase 2
  publicId:   { type: String, default: null },    // null until Cloudinary upload
  source:     { type: String, default: "Wikimedia Commons" },
  sourcePage: { type: String },                   // licence page — immutable
  license:    { type: String },                   // e.g. "CC BY-SA 4.0 (...)" — immutable
  attribution:{ type: String },                   // e.g. "VK1983 — Own work" — immutable
  alt:        { type: String },
}, { _id: false });
```

### Shared subdocument — GeoJSON `location`

```js
const pointSchema = new mongoose.Schema({
  type:        { type: String, enum: ["Point"], default: "Point" },
  coordinates: { type: [Number] },                // [lng, lat] — GeoJSON order
}, { _id: false });
```
`location` is **nullable** (only 87/340 records have coordinates). Keep it `null` when unknown — never `[0,0]`.

### Shared provenance fields (append to every content model)

```js
sourceName: String, sourceUrl: String, sourcePageUrl: String,
contentLicense: String, lastVerified: Date        // "2026-09-09" ISO strings in the JSON
```

### Place models — `Destination`, `Spiritual`, `Culture`, `Activity` (one shape, 4 collections)

Fields present in the JSON: `name`, `slug`, `description`, `shortDescription`, `district`, `region`, `location` (Point|null), `locationSource`, `bestTimeToVisit` (String|null), `bestTimeSourceSentence` (String|null), `idealDuration` (null), `budgetLevel` (null), `experiences` [String], `highlights` [String], `nearbyPlaces` [String], `coverImage` (Image|null), `gallery` [Image], and provenance.

- `Activity` additionally has `category` (String): one of `Trekking`, `Wildlife Safari`, `River Rafting`, `Skiing`, `Boating`, `Adventure Sports`, `Pilgrimage`, `Pilgrimage / Festival`, `Waterfalls & Sightseeing`.
- `Spiritual` and `Culture` have **no** `category` — don't add one.
- `slug`: required, unique, immutable (used in URLs).

### `Stay`

`name`, `slug`, `description`, `shortDescription`, `city`, `district`, `address`, `location` (Point|null), `locationSource`, `category` (enum: `Government Tourist Rest House`, `Government Eco Camp`, `Heritage Luxury Hotel`, `Luxury Destination Spa Resort`), `phone` (String|null), `email` (String|null), `website` (String|null), `facilities` [String], `roomTypes` [String], `price` (`{ amount: Number, currency: "INR" }`|null), `priceNotes` (String), `priceLastChecked` (Date), `rating` (Number|null — null in seed), `reviewCount` (Number|null), `images` [Image] (empty for the 49 KMVN properties — no reuse licence), + provenance.

### `Rental`

`name`, `slug`, `description`, `city`, `district`, `address`, `location` (Point|null), `locationNotes` (String|null — A-One has a note), `category` (enum: `Bike & Scooter Rental`, `Self-Drive Car Rental`), `phone`, `website`, `vehicles`:

```js
vehicles: [{
  name: String,                       // "Honda Activa 6G"
  type: { type: String, enum: ["Scooter","Motorcycle","Hatchback","Sedan","SUV","MPV"] },
  typeDetail: String,                 // original precise label from research
  pricePerDay: { type: Number, default: null },   // null when not published — DO NOT invent
  priceNotes: String,
}]
```

Plus business-level `priceNotes` (verbatim published range, e.g. "Rs 1,399-4,599/day"), `priceLastChecked`, `currency` ("INR"), `rating` + `reviewCount` + `ratingSource` (self-reported caveat — keep all three together), `images` [], + provenance.

### `Guide`

`name`, `slug`, `bio`, `location` (**String**), `districts` [String], `languages` [String], `specialties` [String], `experience` (String, e.g. "14 years"), `phone`, `profileUrl` (UTDB profile), `profileImage` (null), `rating` (null), `reviewCount` (null), `verifiedByGovt` (Boolean, true), `verificationStatus` ("verified"), + provenance.

### `User` (extend existing)

`name`, `email` (unique, lowercase), `passwordHash` (bcrypt, never plain), `role` (enum `user`|`admin`, default `user`), `profileImage` (Image|null), timestamps. If your current model differs, migrate additively.

### NEW `Favorite`

```js
user:     { type: ObjectId, ref: "User", required: true },
itemType: { type: String, enum: ["destination","spiritual","culture","activity","stay","rental","guide"], required: true },
item:     { type: ObjectId, required: true, refPath: "itemType" },   // polymorphic ref
createdAt
```
Unique compound index `{ user: 1, itemType: 1, item: 1 }` (one favorite per user per item).

### `Review` (extend existing)

`user` (ref User), `targetType` (same enum as itemType), `target` (ObjectId, refPath `targetType`), `rating` (Number, min 1, max 5, required), `comment` (String, maxLength 2000), `status` (enum `pending`|`approved`|`hidden`, default `pending` — admin moderates), timestamps.

**Important:** the scraped `rating`/`reviewCount` on stays/rentals are *source-published business ratings* (with `ratingSource` caveat) — they are NOT user reviews. Keep them on the business document; user reviews start empty.

### `Booking` (extend existing)

```js
user:     { type: ObjectId, ref: "User", required: true },
type:     { type: String, enum: ["stay","rental","guide"], required: true },
stay:     { type: ObjectId, ref: "Stay" },      // required when type="stay"
rental:   { type: ObjectId, ref: "Rental" },    // required when type="rental"
guide:    { type: ObjectId, ref: "Guide" },     // required when type="guide"
vehicle:  { name: String, type: String, pricePerDay: Number },  // snapshot for rental bookings
startDate: { type: Date, required: true },       // check-in / pickup
endDate:   { type: Date, required: true },       // check-out / return
guests:   { type: Number, min: 1 },              // stay bookings
amount:   { type: Number },                      // snapshot at booking time
currency: { type: String, default: "INR" },
amountNotes: String,   // e.g. "From KMVN published tariff — confirm with property"
status:   { type: String, enum: ["pending","confirmed","cancelled","completed"], default: "pending" },
notes:    String,
```
Validate: `endDate > startDate`; conditional-required refs per `type`; snapshot `amount` from the document's current price (stay: `price.amount × nights`; rental: `vehicle.pricePerDay × days`; guide: amount null — negotiate directly).

### NEW `SavedTrip`

```js
user:         { type: ObjectId, ref: "User", required: true },
title:        { type: String, required: true },
destinations: [{ type: ObjectId, ref: "Destination" }],
activities:   [{ type: ObjectId, ref: "Activity" }],
stays:        [{ type: ObjectId, ref: "Stay" }],
startDate: Date, endDate: Date, notes: String, timestamps
```

---

## 2. INDEXES

```js
// every content collection
slug: unique
district: 1
// geo (sparse — most stays have no coordinates)
destinations/spiritual/culture/activities/stays/rentals: { location: "2dsphere" } (sparse)
// search
destinations: { name: "text", description: "text", highlights: "text" }
// guides
guides: { districts: 1 }, { languages: 1 }, { specialties: 1 }, { verificationStatus: 1 }
// users
users: { email: 1 } unique
// favorites
favorites: { user: 1, itemType: 1, item: 1 } unique
// reviews
reviews: { targetType: 1, target: 1, status: 1 }, { user: 1 }
// bookings
bookings: { user: 1, createdAt: -1 }, { status: 1 }
// savedTrips
savedtrips: { user: 1 }
```

---

## 3. SEED SCRIPT (`backend/scripts/seed.js`)

1. Read the 7 JSON files from `backend/seed/`.
2. **Idempotent upsert:** `bulkWrite` with `updateOne({ slug }, { $set: doc }, { upsert: true })` per collection. Re-running must never create duplicates.
3. Optional `--fresh` flag: drops only the 7 content collections first. **Never drop `users`, `bookings`, `reviews`, `favorites`, `savedtrips`.**
4. **Admin bootstrap:** if a user with `ADMIN_EMAIL` (env) doesn't exist, create `{ email: ADMIN_EMAIL, passwordHash: bcrypt(ADMIN_PASSWORD), role: "admin", name: "Admin" }`. If env vars are missing, print a warning and skip (never hardcode credentials).
5. Print a per-collection report and **fail loudly if any count differs**: destinations 37, spiritual 26, culture 7, activities 20, stays 51, rentals 9, guides 190.
6. Run automatically on first boot in dev (`npm run seed`), documented in README.

---

## 4. API SURFACE (Express)

**Public — no auth (browsing must work logged-out):**

```
GET /api/destinations|spiritual|culture|activities|stays|rentals|guides
    ?page=&limit=&district=&category=&q=            (q = text search where indexed)
    &near=lng,lat&maxDistance=                      (geo query where location exists)
GET /api/<collection>/:slug                         (single by slug)
GET /api/<collection>/:id/reviews                   (approved reviews only)
```

**Auth (JWT):**

```
POST /api/auth/register | /api/auth/login
GET  /api/auth/me                PATCH /api/auth/profile
GET/POST/DELETE /api/favorites   (populate item by itemType; 409 on duplicate)
GET/POST /api/bookings           PATCH /api/bookings/:id/cancel
GET/POST /api/reviews            (own reviews; created with status "pending")
GET/POST/PATCH/DELETE /api/trips (saved trips)
```

**Admin (role middleware `requireRole('admin')`):**

```
POST/PATCH/DELETE /api/admin/<collection>           (7 content collections)
GET  /api/admin/bookings   PATCH /api/admin/bookings/:id/status
GET  /api/admin/reviews    PATCH /api/admin/reviews/:id/status   DELETE /api/admin/reviews/:id
GET  /api/admin/stats      (counts per collection, bookings by status, reviews by status)
```

Admin PATCH on content collections must not accept changes to provenance fields (`sourceName`, `sourceUrl`, `sourcePageUrl`, `contentLicense`, `lastVerified`, and image `license`/`attribution`/`sourcePage`) — strip them from the update payload.

---

## 5. FRONTEND INTEGRATION RULES

- Render `null` gracefully: `idealDuration`, `budgetLevel`, `bestTimeToVisit` → show **"Not specified"**; never block rendering.
- KMVN stays have `images: []` → styled placeholder (e.g. district map illustration or branded banner), never a broken image.
- Rental vehicles: show "Price on request" when `pricePerDay` is `null`.
- Rental/stay `rating` from the dataset: display with the `ratingSource` caveat text.
- Guides: `location` is a string; `profileImage` is null → initials avatar.
- Public pages (browse/search/detail) must work without login. Require login only for: favorite, book, review, save trip, profile — redirect to login with a `returnTo` path.
- User Panel tabs: Bookings · Favorites · Reviews · Saved Trips · Profile.
- Admin Panel sections: Destinations · Spiritual · Culture · Activities · Stays · Rentals · Guides · Bookings · Reviews (CRUD per §4, with moderation UI for reviews).

---

## 6. PHASE 2 (DO NOT IMPLEMENT YET — note only)

Cloudinary upload is pending manifest approval. When approved, a migration script will: read `backend/seed/image-manifest.json` (1220 images with `imageUrl`, `license`, `attribution`), upload each to Cloudinary under `discovery-uttarakhand/<entityType>/<entityId>`, then update every document's `Image.url` → Cloudinary URL and `Image.publicId` → the new ID, while **keeping `license`/`attribution` intact** (attribution obligations survive re-hosting). Design image fields now so this is a pure data migration.

---

## 7. ACCEPTANCE CHECKLIST

- [ ] `npm run seed` → 7 collections with exact counts 89/52/30/25/51/9/190; re-run creates no duplicates
- [ ] Admin user exists (from env), `role: "admin"`; no hardcoded credentials anywhere
- [ ] Logged-out browsing works: list + detail pages for all 7 sections, with `?district=`, `?q=`, `?near=` filters
- [ ] Register → login → JWT; favorites/bookings/reviews/trips return 401 when logged out
- [ ] Favorite → appears in User Panel; duplicate favorite → 409
- [ ] Booking created with amount snapshot + notes; cancel works; admin can change status
- [ ] Review created as `pending`; admin can approve/hide/delete; only approved render publicly
- [ ] Saved trip with destinations + activities renders in User Panel
- [ ] Geo query: `?near=78.29,30.11` returns Rishikesh-area places
- [ ] Every seeded doc still has `sourceName`/`sourceUrl`/`lastVerified`; every image still has `license` + `attribution`
- [ ] Existing frontend pages still render (no regression); lint/tests pass

---

## DATA QUALITY NOTES (for the Admin Panel UI)

These known data caveats should eventually surface in the admin UI as a "needs verification" badge:

- 2 KMVN phone conflicts (Monal Ranikhet, Shitalakhet — contact-table value used; property page disagrees)
- KMVN Katarmal + Narayan Ashram + Budhi Camp: phone null (site shows wrong/other numbers)
- A-One Self Drive: coordinates null (site's own coordinates point to Ludhiana, Punjab)
- 3 rental businesses have self-reported ratings (flagged via `ratingSource`)
- KMVN tariffs are a snapshot for a 10 Oct 2026 stay (`priceLastChecked`) — re-verify seasonally
