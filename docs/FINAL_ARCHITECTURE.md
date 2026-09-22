# DISCOVERY UTTARAKHAND — FINAL SYSTEM ARCHITECTURE
**Document:** `docs/FINAL_ARCHITECTURE.md`  
**Version:** 3.0.0 (Master Architecture Blueprint Alignment)  
**Date:** September 13, 2026  
**System Classification:** Enterprise Hybrid Travel Ecosystem (Deterministic Core + AI Reasoning + Web3 Verification + Real Marketplace)

---

## 1. ARCHITECTURAL TOPOLOGY

The system follows a strict, non-negotiable multi-tier topology where deterministic logic, structured MongoDB data, verifiable partner credentials, and AI reasoning are decoupled cleanly:

```
                            DISCOVERY UTTARAKHAND
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
          FRONTEND                 BACKEND                 AI LAYER
        React 19 / Vite          Node / Express           AI Trip Planner (Phase 2)
        React Router 7           REST APIs / JWT Auth     Grounded RAG Context
        Zustand Stores           Joi/Express Validation   AI Companion Copilot (Phase 7)
        Axios Services           Rate Limiting / Helmet   Zero-Hallucination Sandbox
              │                       │                       │
              └───────────────────────┼───────────────────────┘
                                      │
                                MongoDB Atlas
                                      │
     ┌─────────────┬───────────┬──────┴───────┬───────────┬─────────────┐
     │             │           │              │           │             │
Destinations     Stays      Rentals         Guides    Activities    Transports
 (89 Records)  (51 Records) (Vehicles)   (190 Records)(35 Records)  (8 Corridors)
     │             │           │              │           │             │
     └─────────────┴───────────┬──────────────┴───────────┴─────────────┘
                               │
                         TRAVEL ENGINES
                               │
       ┌───────────────┬───────┴────────┬───────────────┬───────────────┐
       │               │                │               │               │
 Recommendation     Budget            Route         Itinerary       Transport
   Engine V2        Engine            Engine          Engine         Registry
(Deterministic) (Deterministic)    (OSRM / Poly)  (7-Day Parser) (Verified Legs)
       │               │                │               │               │
       └───────────────┴───────┬────────┴───────────────┴───────────────┘
                               │
                       AI TRIP PLANNER
                 (Structured Narrative on Verified Data)
                               │
                       MY TRIP WORKSPACE
                       (`/my-trip/:tripId`)
                               │
              ┌────────────────┼────────────────┐
              │                │                │
             MAP            TIMELINE         JOURNEY
          (Leaflet)      (5-Part Cards)   (Multi-Segment)
              │                │                │
              └────────────────┼────────────────┘
                               │
                          MARKETPLACE
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    PARTNER SYSTEM          BOOKING            VERIFICATION
(Partner Verification) (Reservation Engine) (Web3 Tamper-Proof)
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                        TRAVEL & REVIEW
                               │
                          USER PROFILE
```

---

## 2. SUBSYSTEM ARCHITECTURAL SPECIFICATIONS

### 2.1 Frontend Subsystem
* **Core Stack:** React 19, Vite, Tailwind CSS (Vanilla utilities + CSS variables), React Router v7, Zustand, Axios, React-Leaflet.
* **Aesthetic Standard:** Forest green (`#1b4332`), Warm cream/off-white (`#faf9f6`), subtle gold/earth-brown (`#b08968`), crisp typography, rounded cards (`rounded-2xl`, `rounded-3xl`), micro-interactions, responsive layouts.
* **Component Deconstruction Policy (Phase 0 Fix):**
  - Extract monolithic logic from [`MyTripPage.jsx`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/Frontend/src/pages/MyTripPage.jsx) into modular components:
    - `Frontend/src/components/planner/DayCard.jsx` (5-part day card structure).
    - `Frontend/src/components/planner/JourneySegmentStepper.jsx` (transit legs, changeover notes).
    - `Frontend/src/components/planner/BudgetBreakdownCard.jsx` (deterministic cost display).
    - `Frontend/src/components/planner/WorkspaceAdvisories.jsx` (ILP, AMS, daylight rules).
    - `Frontend/src/components/planner/ModifyTripModal.jsx` (recalculation & auto-sync).
* **State Management:**
  - `mapStore.js`: Active session, day index, map tile layer, ephemeral draft buffer.
  - Ephemeral drafts live in `localStorage` (`trip_${Date.now()}`); **never automatically POSTed to MongoDB**.
  - `SavedTrip` persistence requires explicit user action gated by `requireAuth()`.

### 2.2 Backend Subsystem
* **Core Stack:** Node.js, Express.js (ES Modules), Mongoose, JWT, bcryptjs, Multer + Cloudinary.
* **Routing Architecture:** Standardized REST endpoints mounted in [`server.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/server.js).
* **Response Envelope Standard:**
  ```json
  {
    "success": true,
    "data": {},
    "count": 0,
    "message": "Descriptive message",
    "meta": { "freshness": "STATIC_VERIFIED", "timestamp": "2026-09-13T07:30:00Z" }
  }
  ```
* **Error Handling:** Centralized `errorHandler` middleware. No stack traces leaked in production.

### 2.3 MongoDB Atlas Persistence Layer
* **Clean Single-Entity Principle:**
  - Resolve `Trip.js` vs `SavedTrip.js` duplicate debt: [`backend/models/SavedTrip.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/models/SavedTrip.js) is canonical; `Trip.js` is deprecated/aliased.
  - Distinct collections with 2dsphere indexes for spatial queries:
    - `destinations`, `stays`, `rentals`, `guides`, `activities`, `spirituals`, `cultures`, `transports`, `savedtrips`, `bookings`, `reviews`, `favorites`, `partners`, `verificationrecords`.

### 2.4 Travel Engines (Deterministic Core)
1. **Transport Registry & Journey Engine:**
   - Pre-populated with verified mountain corridors (Kathgodam Shatabdi, Dehradun Jan Shatabdi, UTC Interstate Express buses, Dharchula-Gunji 4x4 high altitude link).
   - Decomposes travel into distinct legs (`routingType`: `road`, `rail`, `trek`, `local_transfer`).
   - Transfer alerts (`transferNote`) alert travelers to vehicle switches and permit checkpoints.
2. **Route Engine:**
   - Road transit: Real OSRM driving geometry.
   - Non-road / high-altitude trailheads: Sets `geometry: null`, displays honest warning: *"⚠️ Road routing unavailable for extreme high-altitude trails. Waypoints displayed."* Zero fake straight lines.
3. **Recommendation Engine V2 (Phase 1):**
   - Deterministic multi-factor scoring:
     $$\text{Score} = w_1 S_{\text{loc}} + w_2 S_{\text{int}} + w_3 S_{\text{type}} + w_4 S_{\text{pace}} + w_5 S_{\text{season}} + w_6 S_{\text{time}}$$
   - Generates deterministic rationale string (e.g. *"Recommended because it is 12 km from Day 2 base and aligns with Relaxed Nature preferences"*).
4. **Deterministic Budget Engine (Phase 1):**
   - Categorizes costs: Transport, Stay, Food, Activities, Guide, Permits, Emergency Buffer.
   - Segregates `knownCost`, `estimatedCost`, and `unknownCost`.
   - Budget Status: `UNDER_BUDGET`, `NEAR_BUDGET`, `OVER_BUDGET`, `INSUFFICIENT_DATA`.
   - Zero hallucinated exact prices.

### 2.5 AI Trip Planner & AI Reasoning Layer (Phase 2 & Phase 7)
* **Rule of Law:** AI is **never** the factual source of truth.
* **Phase 2 (Grounded AI Trip Planner):**
  - Receives structured output from Deterministic Itinerary, Recommendation, and Budget engines.
  - Generates personalized contextual rationale, day summaries, and acclimatization guidance.
  - Injected via backend service abstraction (`aiPlannerService.js`) using pluggable Gemini/OpenAI drivers. UI never calls LLMs directly.
* **Phase 7 (AI Travel Copilot):**
  - Conversational assistant with access to current trip context and verified knowledge base (RAG).

### 2.6 Marketplace & Partner Architecture (Phase 3)
* **Partner Roles:** `user`, `partner_owner` (stay/rental), `partner_guide`, `admin`.
* **Lifecycle State Machine:**
  $$\text{DRAFT} \longrightarrow \text{PENDING\_VERIFICATION} \longrightarrow \text{VERIFIED} \longleftrightarrow \text{ACTIVE} \longrightarrow \text{SUSPENDED}$$
* Admin approval required before any partner listing displays the verified partner badge.

### 2.7 Booking & Reservation Engine (Phase 4)
* **Standardized DTO Contract:**
  - Entity payload: `{ type: 'stay' | 'rental' | 'guide', stayId, rentalId, guideId, startDate, endDate, guests, notes }`.
  - Fixes the current mismatch where `DetailPage.jsx` sent `{ bookingType, item }`.
* **Reservation Lifecycle:**
  $$\text{PENDING} \longrightarrow \text{CONFIRMED} \longleftrightarrow \text{CANCELLED} \longrightarrow \text{COMPLETED}$$
* **Official Fallbacks:** If a partner has no direct booking API, UI renders verified deep link buttons (`utconline.uk.gov.in`, `kmvn.in`, `irctc.co.in`). Zero fake in-app booking illusions.

### 2.8 Web3 Trust & Verification Layer (Phase 5)
* **Architecture:** Blockchain as a tamper-proof public notary, **not** a database.
* **Sensitive Data Isolation:** No Aadhaar, passport, or private personal data on-chain.
* **Verification Pipeline:**
  $$\text{Partner Credential Verification} \longrightarrow \text{Admin Verify} \longrightarrow \text{SHA-256 Hash} \longrightarrow \text{Blockchain Proof Mint} \longrightarrow \text{Tx Hash} \longrightarrow \text{QR Code Verification}$$
  *(Identity documents remain strictly off-chain in MongoDB; only cryptographic verification hashes are anchored).*
* **Contracts:** `PartnerVerification.sol`, `VehicleRegistry.sol` (Hardhat + ethers.js).
* **Tourist UX:** Zero crypto wallet requirement. Tourists see a clean "Verified Partner" badge with a scannable verification proof modal.

### 2.9 Live Data Adapters (Phase 6)
* **Decoupled Service Adapters:** `weatherAdapter.js`, `roadAdvisoryAdapter.js`, `transitLiveAdapter.js`.
* **Freshness Metadata:** Every record returns `{ freshness: 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN', lastUpdated, sourceUrl }`.
* **Zero Scraping:** Never scrape protected government or commercial sites without API contracts.

### 2.10 Security Architecture
* JWT authentication with HTTP-only cookies / Authorization Bearer headers.
* Password hashing with bcryptjs (salt rounds 10).
* Multi-tenant data isolation: Every `GET /api/trips/:id`, `PATCH /api/trips/:id`, `GET /api/bookings/:id` enforces authenticated ownership (`trip.user.equals(req.user._id)`).
* Role-based access control (`adminOnly`, `partnerOnly`).
