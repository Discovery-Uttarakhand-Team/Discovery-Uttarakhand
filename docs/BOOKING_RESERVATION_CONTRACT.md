# DISCOVERY UTTARAKHAND — BOOKING & RESERVATION CONTRACT
**Document:** `docs/BOOKING_RESERVATION_CONTRACT.md`  
**Version:** 1.0.0  
**Date:** September 13, 2026  
**Phase:** Phase 4 — Booking & Reservation Engine  

---

## 1. Executive Summary & Purpose

The Booking & Reservation Engine connects verified, publication-grade marketplace inventory (`PartnerListing` where `status === 'ACTIVE'`) as well as existing static heritage inventory (`Stay`, `Rental`, `Guide`) to a standardized, authenticated reservation lifecycle.

### Core Architectural Invariants:
1. **Active Inventory Requirement**: A partner listing can **ONLY** be booked if its status is strictly `ACTIVE`. Any booking attempt against `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED` (alone/unpublished), `REJECTED`, or `SUSPENDED` inventory is rejected server-side with `400 Bad Request`.
2. **Verified Pricing Requirement**: Only listings with `pricing.provenance === 'VERIFIED'` are eligible for reservation. Listings with `PARTNER_CLAIMED` or `UNKNOWN` pricing are rejected with `400 Bad Request`.
3. **Deterministic Server-Side Pricing**: The server is the sole source of truth for tariffs and totals. Any client-supplied price, total, totalAmount, status, or bookingReference is ignored or recalculated.
4. **Immutable Historical Snapshots**: Every reservation captures `pricingSnapshot` and `listingSnapshot` at booking creation time so that future partner edits never alter historical reservations.
5. **Human-Readable Unique Booking Reference**: Server generates human-friendly booking references (`DU-YYYYMMDD-XXXXXX`).
6. **Multi-Tenant Ownership Isolation**: Travelers can only inspect and cancel their own bookings (`403 Forbidden` for cross-user attempts).
7. **Explicit Payment Exclusion**: Phase 4 does **NOT** process financial transactions, gateway integrations, or monetary refunds. All monetary transactions and Razorpay integrations are isolated to Phase 8.

---

## 2. Booking State Machine

```text
       Traveler Creation (POST /api/bookings)
                     │
                     ▼
               [ PENDING ] ──────────┐
                     │               │
      Host/Admin     │               │ Traveler/Admin
      Confirmation   │               │ Cancellation
                     ▼               ▼
               [ CONFIRMED ] ──► [ CANCELLED ]
                     │
        Journey      │
       Completion    │
                     ▼
               [ COMPLETED ]
```

### State Transitions:
- `PENDING` ➔ `CONFIRMED` (Admin or Partner Confirmation)
- `PENDING` ➔ `CANCELLED` (Traveler or Admin Cancellation)
- `CONFIRMED` ➔ `CANCELLED` (Traveler or Admin Cancellation)
- `CONFIRMED` ➔ `COMPLETED` (Completed Journey)

### Forbidden State Transitions (Return `400 Bad Request`):
- `CANCELLED` ➔ `CONFIRMED` / `PENDING`
- `COMPLETED` ➔ `CANCELLED` / `PENDING`
- Direct creation of `CONFIRMED` or `COMPLETED` from client

---

## 3. Domain Model Schema

```javascript
{
  user: ObjectId,              // ref: 'User' (Traveler)
  type: String,                // enum: ['partner_listing', 'stay', 'rental', 'guide', 'transport']
  
  // Associated references
  partnerListing: ObjectId,    // ref: 'PartnerListing' (null if static)
  stay: ObjectId,              // ref: 'Stay' (null if partner)
  rental: ObjectId,            // ref: 'Rental'
  guide: ObjectId,             // ref: 'Guide'
  trip: ObjectId,              // ref: 'SavedTrip' (optional)
  
  bookingReference: String,    // Unique human-readable code: DU-YYYYMMDD-XXXXXX
  status: String,              // enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
  
  // Primary date window
  startDate: Date,
  endDate: Date,
  guests: Number,

  // Financial & Snapshot Details
  amount: Number,              // Total calculated amount
  currency: "INR",
  
  pricingSnapshot: {
    amount: Number,            // Base rate per unit
    unit: "night" | "day" | "person" | "trip" | "custom",
    currency: "INR",
    quantity: Number,
    subtotal: Number,
    total: Number,
    provenance: "VERIFIED"
  },

  listingSnapshot: {
    title: String,
    category: String,
    district: String,
    listingType: String,
    location: String
  },

  traveler: {
    name: String,
    email: String,
    phone: String,
    guests: Number
  },

  reservation: {
    checkIn: Date,
    checkOut: Date,
    startDate: Date,
    endDate: Date
  },

  specialRequest: String,

  cancellation: {
    cancelledAt: Date,
    cancelledBy: ObjectId,
    reason: String
  }
}
```

---

## 4. REST API Specification

### 4.1 Create Reservation
- **Endpoint:** `POST /api/bookings`
- **Auth:** Private (`protect` middleware required)
- **Request Payload:**
  ```json
  {
    "type": "partner_listing",
    "partnerListing": "673...",
    "startDate": "2026-10-15",
    "endDate": "2026-10-18",
    "guests": 2,
    "traveler": {
      "name": "Aarav Sharma",
      "email": "aarav@example.com",
      "phone": "+91 9876543210",
      "guests": 2
    },
    "specialRequest": "Quiet room facing the valley"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Reservation created successfully",
    "data": {
      "_id": "674...",
      "bookingReference": "DU-20260913-B196E7",
      "status": "PENDING",
      "type": "partner_listing",
      "startDate": "2026-10-15T00:00:00.000Z",
      "endDate": "2026-10-18T00:00:00.000Z",
      "guests": 2,
      "amount": 9600,
      "currency": "INR",
      "pricingSnapshot": {
        "amount": 3200,
        "unit": "night",
        "currency": "INR",
        "quantity": 1,
        "subtotal": 9600,
        "total": 9600,
        "provenance": "VERIFIED"
      },
      "listingSnapshot": {
        "title": "Pine Haven Homestay",
        "category": "Homestay",
        "district": "Almora",
        "listingType": "Stay",
        "location": "Binsar, Almora"
      }
    }
  }
  ```

### 4.2 List Traveler Bookings
- **Endpoint:** `GET /api/bookings` (or `GET /api/bookings/my`)
- **Auth:** Private (`protect` middleware required)
- **Query Parameters:** `?status=PENDING` (optional filter)
- **Response (200 OK):** Array of bookings belonging strictly to the authenticated user.

### 4.3 Get Booking Detail
- **Endpoint:** `GET /api/bookings/:id`
- **Auth:** Private (`protect` middleware required)
- **Security Check:** Returns `403 Forbidden` if `booking.user !== req.user.id` and user is not an admin.
- **Response (200 OK):** Populated booking record with immutable snapshots.

### 4.4 Cancel Booking
- **Endpoint:** `PATCH /api/bookings/:id/cancel`
- **Auth:** Private (`protect` middleware required)
- **Security Check:** Ownership enforced (`403 Forbidden` for non-owners).
- **State Check:** Only `PENDING` or `CONFIRMED` can be cancelled. `CANCELLED` or `COMPLETED` return `400 Bad Request`.
- **Request Payload:**
  ```json
  {
    "reason": "Change in Himalayan mountain transit itinerary"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Booking cancelled successfully. Payment/refund processing is not enabled in this phase.",
    "data": {
      "_id": "674...",
      "status": "CANCELLED",
      "cancellation": {
        "cancelledAt": "2026-09-13T03:10:00.000Z",
        "cancelledBy": "672...",
        "reason": "Change in Himalayan mountain transit itinerary"
      }
    }
  }
  ```

---

## 5. Verified External Booking Fallbacks

Where inventory is not hosted as a direct partner listing in the Discovery Uttarakhand database, the platform provides authentic external deep links:
- **KMVN Tourist Rest Houses:** `https://www.kmvn.in`
- **Uttarakhand Transport Corporation (UTC):** `https://www.utconline.uk.gov.in/`
- **Indian Railways (IRCTC):** `https://www.irctc.co.in/`
- **Uttarakhand e-District Inner Line Permits:** `https://eservices.uk.gov.in/`

No mock local booking records are generated for external redirect actions.
