# Discovery Uttarakhand — Real Partner Marketplace Architecture & Workflow Report

## Executive Summary
This document provides an exhaustive technical and architectural audit of the **Real Partner Marketplace** subsystem in Discovery Uttarakhand. The platform enables genuine local tourism providers (homestay hosts, hoteliers, bike rental operators, trekking guides, and transport providers) to manage their business profiles, create rich listings with Cloudinary-backed images and GeoJSON locations, undergo admin verification with immutable on-chain Web3 attestation, become discoverable in public marketplaces and AI Travel Copilot, and accept secure bookings with immutable snapshots.

---

## 1. Unified Domain Model (`Partner` & `PartnerListing`)

Instead of creating separate, redundant models (`HotelOwner.js`, `BikeOwner.js`, `GuideOwner.js`), the architecture strictly follows the unified pattern:

- **`Partner` Profile**: Defines **who owns the business** (business name, legal registration, partner type, phone, email, district, city, locality, GeoJSON location, verification status).
- **`PartnerListing`**: Defines **what the business offers** (Stays, Rentals, Guides, Activities). One partner can host multiple distinct listings across categories.

```text
REAL PARTNER
   ↓
Partner Profile (Partner.js)
   ↓
Create Stay / Rental Listing (PartnerListing.js)
   ↓
Upload Own Images (Cloudinary Multi-Photo)
   ↓
Set Real Location + Pricing (GeoJSON [lon, lat] + PARTNER_CLAIMED)
   ↓
Submit for Verification (PENDING_VERIFICATION)
   ↓
ADMIN REVIEW & APPROVAL
   ↓
WEB3 ATTESTATION (Hardhat Local / Ethereum)
   ↓
ACTIVE + VERIFIED Pricing
   ↓
Location-Aware Marketplace Discovery
   ↓
AI Copilot Discovery (findStays / findRentals)
   ↓
Authoritative Booking & Immutable Snapshot
```

---

## 2. Hardening & Security Measures Verified

### 1. Canonical GeoJSON Coordinate Integrity
- **Standard**: Always stored as `[longitude, latitude]`.
- **Validation**: Enforced via Mongoose `pointSchema`:
  - Longitude bounded within `[-180, 180]`
  - Latitude bounded within `[-90, 90]`
- **Coordinate Inversion Prevention**: Out-of-range coordinates are rejected with descriptive validation errors.

### 2. Canonical Destination Mapping
- When a partner registers or creates a listing specifying a Uttarakhand district, city, or locality (e.g. *Joshimath*, *Badrinath*, *Tapovan, Rishikesh*), the backend runs `destinationResolver.js` to automatically attach canonical `destination` (`ObjectId`) and `destinationSlug` (`String`), while preserving human-readable text.

### 3. Location Hierarchy & Distance Labeling
- Location discovery follows a strict tiered hierarchy:
  $$\text{Tier 1: Locality} \longrightarrow \text{Tier 2: City/Town} \longrightarrow \text{Tier 3: District} \longrightarrow \text{Tier 4: Spatial Proximity}$$
- Proximity distances are calculated via Haversine and explicitly labeled as `Approx. X km away` (never claiming "driving distance" without a routing engine).
- Non-local categories (e.g., localized trekking or city rentals) preserve `STRICT_LOCAL` separation.

### 4. Pricing Provenance State Machine
- Listings start with `provenance: 'PARTNER_CLAIMED'`.
- Partners cannot inject `VERIFIED` or `ACTIVE` directly.
- Admin review transitions status to `ACTIVE` and attests `provenance: 'VERIFIED'`.
- AI Copilot and UI cards display distinct badges:
  - `✓ VERIFIED` (Official verification passed)
  - `Partner Listed · Price not independently verified` (`PARTNER_CLAIMED`)

### 5. Multi-Tenant Isolation
- Endpoint `/api/partners/me/listings/:id` enforces strict ownership: Partner A cannot read, modify, or delete Partner B's listings or business metrics.
- Financial records (earnings, expenses, analytics) are strictly scoped to the authenticated user's partner ID.

### 6. Public PII Sanitization
- Public marketplace and Copilot query responses strip all private partner data:
  - Phone number $\rightarrow$ **Redacted**
  - Email address $\rightarrow$ **Redacted**
  - KYC / Verification documents $\rightarrow$ **Redacted**
  - Admin reviewer ID and internal review notes $\rightarrow$ **Redacted**

### 7. Authoritative Server-Side Booking & Immutable Snapshots
- Client-sent prices are completely ignored during booking creation.
- Server calculates authoritative subtotals and totals based on verified listing prices.
- An immutable snapshot of the listing (`pricingSnapshot` + `listingSnapshot`) is permanently stored with the booking.

---

## 3. Automated Test Verification Results

### A. Partner Marketplace Comprehensive Test Suite (`backend/test_partner_marketplace.js`)
**Result: 29 / 29 PASSED (100%)**

| Test # | Category | Test Assertion | Result |
|---|---|---|---|
| 1 | GeoJSON | Valid coordinates `[79.566, 30.556]` stored successfully | ✅ PASS |
| 2 | GeoJSON | Longitude `> 180` rejected with validation error | ✅ PASS |
| 3 | GeoJSON | Latitude `> 90` rejected with validation error | ✅ PASS |
| 4 | Destination | Canonical destination identifier & slug `joshimath` resolved | ✅ PASS |
| 5 | Isolation | Partner A vs Partner B ownership strictly isolated | ✅ PASS |
| 6 | Provenance | Initial pricing provenance defaults to `PARTNER_CLAIMED` | ✅ PASS |
| 7 | State Machine | Initial listing status defaults to `DRAFT` | ✅ PASS |
| 8 | Lifecycle | Submission transitions status to `PENDING_VERIFICATION` | ✅ PASS |
| 9 | Gating | Non-active / draft listings hidden from public search | ✅ PASS |
| 10 | Admin Review | Admin approval activates listing and sets `VERIFIED` pricing | ✅ PASS |
| 11 | Audit Trail | `VerificationAuditLog` created with immutable approval record | ✅ PASS |
| 12 | Public Discovery | Active verified hotel appears in public search | ✅ PASS |
| 13 | Sanitization | Public response strips partner phone | ✅ PASS |
| 14 | Sanitization | Public response strips partner email | ✅ PASS |
| 15 | Sanitization | Public response strips partner KYC documents | ✅ PASS |
| 16 | Sanitization | Public response strips internal admin notes | ✅ PASS |
| 17 | Bike Rental E2E | Rental listing created with complete vehicle specifications | ✅ PASS |
| 18 | Bike Rental E2E | Rental listing verified and active | ✅ PASS |
| 19 | Location Tier | Search for Joshimath matches Joshimath hotel | ✅ PASS |
| 20 | Location Tier | Dehradun search excludes Chamoli/Joshimath stays | ✅ PASS |
| 21 | Location Tier | Search for Rishikesh matches Rishikesh bike rental | ✅ PASS |
| 22 | Copilot | `executeTool('findStays')` executes without error | ✅ PASS |
| 23 | Copilot | Copilot discovers active partner hotel in Joshimath | ✅ PASS |
| 24 | Copilot | `executeTool('findRentals')` executes without error | ✅ PASS |
| 25 | Copilot | Copilot discovers active partner bike rental in Rishikesh | ✅ PASS |
| 26 | Booking Security | Server calculates ₹7,500 total, rejects fake client price | ✅ PASS |
| 27 | Booking Security | Booking snapshot captures `VERIFIED` pricing provenance | ✅ PASS |
| 28 | Booking Security | Booking snapshot stores immutable listing copy | ✅ PASS |
| 29 | Booking Gate | Draft / unverified listing blocked from booking | ✅ PASS |

### B. AI Travel Copilot 9-Turn Regression Test (`backend/test_copilot_flow.js`)
**Result: 9 / 9 PASSED (100%)**
- Progressive dialogue turns 1–5: ✅ PASS
- Natural language reference ("wahan weather kaisa hai?"): ✅ PASS
- Budget modification ("budget 15k kar do"): ✅ PASS
- All-in-one single-turn extraction: ✅ PASS
- Prompt injection defense: ✅ PASS

### C. Live Data Adapters & Safety Engine (`backend/test_phase6_live_data.js`)
**Result: 26 / 26 PASSED (100%)**
- Open-Meteo weather adapter, TTL cache, road advisory bulletins, transit live adapters, deterministic advisory engine: ✅ PASS

### D. Frontend Compilation
**Result: Built in 2.26s with 0 errors**

---

## 4. Conclusion & Readiness
The real partner marketplace workflow is fully implemented, verified, hardened, and regression-tested. Both Hotel/Stay owners and Bike Rental owners can onboard, upload media, set real locations and prices, receive admin verification with Web3 attestation, be discovered through public search and AI Travel Copilot, and accept secure bookings.
