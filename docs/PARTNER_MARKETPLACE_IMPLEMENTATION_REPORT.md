# Discovery Uttarakhand — Partner & Owner Marketplace Implementation Report
**Document Version:** 1.0.0  
**Status:** Complete & Fully Validated  
**Test Suite Coverage:** 30/30 Tests Passed (100%)

---

## 1. Executive Summary & Architectural Overview

The Discovery Uttarakhand platform has been upgraded to support a **Real Partner/Owner Marketplace & Location-Aware Listing Management System**. This implementation directly resolves the gap between static dataset exploration and dynamic owner-submitted inventory without creating redundant models or duplicate login systems.

### Core Architectural Decisions
1. **Model Reuse (Zero Duplication):**
   - No separate `HotelOwner` or `BikeOwner` models were created.
   - The canonical `Partner` and `PartnerListing` models were extended with GeoJSON `location: { type: "Point", coordinates: [longitude, latitude] }`, canonical `destination` references, `locality`, and category-specific metadata.
2. **True Location Awareness:**
   - Spatial indexing using MongoDB `2dsphere` on `[longitude, latitude]`.
   - Dynamic location ingestion: owners select city, district, locality, address, and coordinates with zero hardcoded test coordinates in production logic.
   - Canonical destination integration via `backend/services/destinationResolver.js` (`destination` ObjectId ref and `destinationSlug`).
3. **Category-Specific Location Hierarchy:**
   - **Stays (Hotels/Homestays):** Exact Locality / Destination $\rightarrow$ Operating City $\rightarrow$ District $\rightarrow$ Bounded Proximity.
   - **Bike/Car Rentals:** Pickup Hub / Operating City $\rightarrow$ Operating District.
   - **Guides / Trek Hosts:** Service Area / Canonical Destination $\rightarrow$ Operating District.
4. **Strict Pricing Provenance & AI Integrity:**
   - `VERIFIED`: Elevated only by platform administrators upon credential verification and smart-contract attestation. AI Copilot presents these as `"Verified stay ₹1500/night"`.
   - `PARTNER_CLAIMED`: Initial state for owner-submitted pricing. AI Copilot strictly displays `"Partner-listed price: ₹1500/night (Price verification status: unverified)"`.
   - Booking Gate: Only `ACTIVE` listings with `VERIFIED` pricing provenance can be booked.
5. **Security & PII Protection:**
   - Client role escalation attacks rejected (server-controlled role elevation).
   - Server-side listing ownership checks prevent cross-partner edits and cross-partner image deletions (403 Forbidden).
   - Public marketplace APIs strictly scrub partner PII (`phone`, `email`, KYC documents).

---

## 2. Data Model Extensions

### 2.1 `Partner` Model (`backend/models/Partner.js`)
- **Location Fields Added:**
  ```javascript
  locality: { type: String, trim: true },
  location: { type: pointSchema, default: null } // GeoJSON Point: [lng, lat]
  ```
- **Indexes:**
  ```javascript
  partnerSchema.index({ location: '2dsphere' });
  partnerSchema.index({ city: 1, locality: 1 });
  ```

### 2.2 `PartnerListing` Model (`backend/models/PartnerListing.js`)
- **Canonical Destination & Location Fields Added:**
  ```javascript
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    default: null
  },
  destinationSlug: {
    type: String,
    trim: true,
    lowercase: true,
    default: null
  },
  locality: {
    type: String,
    trim: true,
    default: null
  },
  location: {
    type: pointSchema,
    default: null
  }
  ```
- **Availability & Provenance Tracking:**
  ```javascript
  availabilityDetails: {
    totalUnits: { type: Number, default: 1 },
    availableUnits: { type: Number, default: 1 },
    statusReason: { 
      type: String, 
      enum: ['Available', 'Rented', 'Maintenance', 'Blocked'],
      default: 'Available'
    },
    blockedDates: [{ type: Date }]
  },
  pricing: {
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    unit: { type: String, enum: ['night', 'day', 'hour', 'session', 'service', 'trip'], default: 'night' },
    provenance: { type: String, enum: ['PARTNER_CLAIMED', 'VERIFIED'], default: 'PARTNER_CLAIMED' },
    lastVerifiedAt: { type: Date, default: null }
  }
  ```
- **Indexes:**
  ```javascript
  partnerListingSchema.index({ location: '2dsphere' });
  partnerListingSchema.index({ destinationSlug: 1, status: 1 });
  partnerListingSchema.index({ destination: 1, status: 1 });
  partnerListingSchema.index({ city: 1, locality: 1, status: 1 });
  ```

---

## 3. Owner Content & Image Management

### 3.1 Listing-Scoped Image Endpoints
1. `POST /api/partners/me/listings/:id/images`:
   - Handles multi-file uploads (up to 5 images per request) via Multer memory storage.
   - Uploads directly to Cloudinary folder `discovery_uttarakhand/listings` with fallback to local mock storage.
   - Strict server-side ownership: checks `listing.ownerUser.equals(req.user._id)`.
2. `DELETE /api/partners/me/listings/:id/images/:imageId`:
   - Strips image by `publicId` or `_id` from the listing document.
   - Invokes `cloudinary.uploader.destroy` for Cloudinary-hosted assets.
   - Returns 403 Forbidden if another partner attempts deletion.

---

## 4. Location Ingestion & Canonical Resolution

### 4.1 Zero Hardcoded Coordinates
Coordinates are never hardcoded. In `backend/controllers/partnerController.js`:
- Ingestion accepts `latitude`, `longitude`, `locality`, `city`, `district`, and optional `destinationId`.
- Coordinate validation:
  ```javascript
  if (latitude !== undefined && longitude !== undefined) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      resolvedLocation = { type: 'Point', coordinates: [lng, lat] };
    }
  }
  ```
- Canonical Fallback: If the owner inputs an address or city without GPS coordinates, the system resolves against the canonical `Destination` collection via `destinationResolver.js` to derive canonical coordinates and link `destination` ObjectId and `destinationSlug`.

---

## 5. Location-Aware Marketplace Discovery

### 5.1 Category-Specific Hierarchical Queries
Implemented in `backend/controllers/marketplaceController.js`:
- **Stays:**
  1. Exact canonical destination (`destinationSlug` or `destination`).
  2. Exact locality match (`locality: new RegExp('^' + locality + '$', 'i')`).
  3. Operating city match (`city: new RegExp('^' + city + '$', 'i')`).
  4. Operating district match.
  5. Proximity search (`$near` bounded within 30km of anchor coordinates).
- **Vehicle Rentals:**
  1. Pickup location match (`specifications.pickupLocation`).
  2. Operating city match (`city: new RegExp('^' + city + '$', 'i')`).
  3. Operating district match.
- **Guides:**
  1. Service destination match (`destinationSlug` or `destination`).
  2. Operating district match.
- **Honest Empty State:**
  - If zero listings are found for a remote location, the endpoint returns:
    `{ success: true, count: 0, data: [], message: "Is location ke liye abhi verified listing available nahi hai." }`

### 5.2 Public Privacy Scrubbing
Public queries populate partner summary fields only:
```javascript
.populate('partner', 'businessName partnerType rating reviewCount district city')
```
Fields such as `phone`, `email`, `bankDetails`, and `kycDocuments` are never sent to unauthenticated or tourist clients.

---

## 6. AI Copilot & Recommendation Engine Integration

### 6.1 Strict Provenance in AI Tools (`backend/services/agentTools.js`)
- `findStays`:
  - Simultaneously retrieves static GMVN/KMVN stays and active verified `PartnerListing` inventory.
  - Labels provenance clearly:
    - If `listing.pricing.provenance === 'VERIFIED'`, sets `provenance: 'VERIFIED'`.
    - If `listing.pricing.provenance === 'PARTNER_CLAIMED'`, sets `provenance: 'PARTNER_CLAIMED'`.
- `findRentals`:
  - Retrieves active partner vehicles and specifies pickup location and owner terms.
- `findGuides`:
  - Retrieves active local guides with government license numbers and verified badges.
- `checkBookingEligibility`:
  - Rejects partner listings if `listing.status !== 'ACTIVE'` or `listing.pricing?.provenance !== 'VERIFIED'`.

### 6.2 Provenance Labeling in AI Responses (`backend/services/agentService.js`)
The synthesis prompt enforces honest trust labels:
- **Verified Listing:** `"✓ Verified [Title] — ₹[Amount]/night (Platform verified)"`
- **Partner-Claimed Listing:** `"[Title] — ₹[Amount]/night (Partner-listed price; verification status: unverified)"`

### 6.3 Recommendation Engine (`backend/services/recommendationService.js`)
- `scoreStays` and `scoreRentals` score active partner listings alongside static datasets.
- Proximity scoring based on Haversine distance from overnight itinerary hubs.
- Graceful empty-state handling ensures partner listings are scored even if static collections have no records in that valley.

---

## 7. Web3 Smart Contract Attestation & Fail-Safe Semantics

### 7.1 Lifecycle State Transitions
1. `DRAFT`: Owner creates and refines listing details, uploads images.
2. `PENDING_VERIFICATION`: Owner submits listing for platform review.
3. `VERIFIED`: Platform admin reviews property documents and approves listing.
4. `ACTIVE`: Web3 smart contract (`PartnerVerification.sol`) successfully records on-chain attestation hash.
5. `FAILED / VERIFIED (Off-Chain Only)`: If Ethereum/Hardhat RPC is offline or transaction reverts, fail-safe semantics ensure the listing remains `VERIFIED` off-chain but booking is safely blocked until on-chain attestation succeeds.

---

## 8. Automated Verification Suite (`test_partner_marketplace.js`)

The test suite exercises all 6 key areas through 30 end-to-end assertions:

| Section | Tests | Status |
|---|---|:---:|
| 1. Security & Role Boundaries | 1.1–1.4 | PASS |
| 2. Hotel Owner Workflow & State Machine | 2.1–2.12 | PASS |
| 3. Rental Owner Workflow & Category Isolation | 3.1 | PASS |
| 4. Location-Aware Hierarchical Discovery | 4.1–4.3 | PASS |
| 5. AI Copilot Tools & Recommendation Integration | 5.1–5.6 | PASS |
| 6. Booking System Integration & Snapshots | 6.1–6.4 | PASS |
| **Total Test Suite Score** | **30 / 30** | **100% PASS** |

---

## 9. Frontend Integration & Build Verification

- **API Layer:** `Frontend/src/api/partnerApi.js` updated with `uploadListingImages` and `deleteListingImage`.
- **Listing Form:** `Frontend/src/components/partner/tabs/ListingFormTab.jsx` enhanced with Uttarakhand district dropdowns, city, locality, dynamic coordinates (`latitude`, `longitude`), and category-specific inputs.
- **Production Build:** `npm run build` completed cleanly in 2.71s with zero errors.
