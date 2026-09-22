# DISCOVERY UTTARAKHAND — API CONTRACT SPECIFICATION
**Document:** `docs/API_CONTRACTS.md`  
**Version:** 3.0.0  
**Date:** September 13, 2026

All endpoints return standardized JSON envelopes:
```json
// Standard Success Response (HTTP 200, 201)
{
  "success": true,
  "data": {},
  "count": 1,
  "message": "Operation completed successfully",
  "meta": { "timestamp": "2026-09-13T07:30:00Z", "freshness": "STATIC_VERIFIED" }
}

// Standard Error Response (HTTP 400, 401, 403, 404, 500)
{
  "success": false,
  "message": "Descriptive human-readable error",
  "code": "RESOURCE_NOT_FOUND",
  "errors": []
}
```

---

## 1. AUTHENTICATION & USERS (`/api/auth`, `/api/users`)

### `POST /api/auth/register`
* **Access:** Public
* **Request Body:**
  ```json
  { "name": "Aarav Sharma", "email": "aarav@example.com", "password": "SecurePassword123", "role": "user" }
  ```
* **Response (201 Created):**
  ```json
  { "success": true, "data": { "_id": "65b...", "name": "Aarav Sharma", "email": "aarav@example.com", "role": "user", "token": "jwt_token_here" } }
  ```

### `POST /api/auth/login`
* **Access:** Public
* **Request Body:**
  ```json
  { "email": "aarav@example.com", "password": "SecurePassword123" }
  ```
* **Response (200 OK):** User object with signed JWT.

### `GET /api/auth/me`
* **Access:** Private (`protect` middleware)
* **Response (200 OK):** Sanitized User profile (excluding password).

---

## 2. CATALOG APIS (`/api/destinations`, `/api/stays`, `/api/rentals`, `/api/guides`, `/api/activities`, `/api/spiritual`, `/api/culture`)

### `GET /api/destinations`
* **Access:** Public
* **Query Params:** `?district=Pithoragarh&region=Kumaon&search=Adi`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [{
      "_id": "65a...",
      "name": "Adi Kailash",
      "slug": "adi-kailash",
      "district": "Pithoragarh",
      "region": "Kumaon",
      "location": { "type": "Point", "coordinates": [80.6385, 30.3165] },
      "highlights": ["Parvati Sarovar", "Gauri Kund", "Om Parvat Viewpoint"]
    }]
  }
  ```

### `GET /api/stays`
* **Access:** Public
* **Query Params:** `?district=Nainital&category=Government+Tourist+Rest+House`
* **Response (200 OK):** Array of verified stay records with rates and KMVN attribution.

### `GET /api/rentals`
* **Access:** Public
* **Query Params:** `?district=Dehradun&type=SUV`
* **Response (200 OK):** Fleet listings with verified vehicle daily rates.

### `GET /api/guides`
* **Access:** Public
* **Query Params:** `?district=Pithoragarh&verified=true`
* **Response (200 OK):** Certified local guides with specialties and languages.

### `GET /api/activities`
* **Access:** Public
* **Query Params:** `?category=Trekking&difficulty=Challenging`
* **Response (200 OK):** Treks and adventures with altitude and permit requirements.

---

## 3. TRANSPORT REGISTRY (`/api/transports`)

### `GET /api/transports`
* **Access:** Public
* **Response (200 OK):** All verified corridors.

### `GET /api/transports/corridor`
* **Access:** Public
* **Query Params:** `?from=Delhi&to=Haldwani`
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "count": 1,
    "data": [{
      "_id": "65c...",
      "mode": "Bus",
      "routingType": "road",
      "operator": "Uttarakhand Transport Corporation (UTC)",
      "serviceName": "UTC Interstate Express",
      "origin": { "name": "Delhi", "stationCode": "ISBT-ANAND-VIHAR" },
      "destination": { "name": "Haldwani", "stationCode": "ISBT-HALDWANI" },
      "departureTime": null,
      "price": null,
      "bookingUrl": "https://www.utconline.uk.gov.in/",
      "source": "UTC Route Registry"
    }]
  }
  ```

---

## 4. TRIP WORKSPACE (`/api/trips`)

### `POST /api/trips`
* **Access:** Private (`protect` middleware)
* **Request Body:** Full trip payload including `startingLocation`, `destination`, `duration`, `travelers`, `pace`, `routeData`, and `itinerary`.
* **Response (201 Created):** Persisted `SavedTrip` document with unique `_id`.

### `GET /api/trips/:id`
* **Access:** Private (`protect` middleware)
* **Security Rule:** Enforces `trip.user.equals(req.user._id)`.
* **Response (200 OK):** Full persisted itinerary and journey segments.
* **Error Response (403 Forbidden):** `{ "success": false, "message": "Not authorized to access this trip" }`.

### `PATCH /api/trips/:id`
* **Access:** Private (`protect` middleware)
* **Request Body:** Partial updates (`duration`, `pace`, `itinerary`, `budgetPreference`).
* **Response (200 OK):** Updated trip document.

---

## 5. RECOMMENDATION ENGINE V2 (`/api/recommendations`) — NEW PHASE 1

### `POST /api/recommendations`
* **Access:** Public / Optional Auth
* **Request Body:**
  ```json
  {
    "destinationId": "65a...",
    "district": "Pithoragarh",
    "coordinates": [80.6385, 30.3165],
    "tripType": ["Trek", "Spiritual"],
    "interests": ["High Altitude", "Photography"],
    "pace": "Balanced",
    "dayNumber": 2,
    "durationDays": 7
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "stays": [{
        "item": { "_id": "65b...", "name": "KMVN Tourist Rest House Dharchula" },
        "score": 92,
        "matchReason": "Recommended because it is 8 km from your Day 2 transit roadhead and verified by KMVN"
      }],
      "guides": [{
        "item": { "_id": "65c...", "name": "Virendra Singh Rawat" },
        "score": 88,
        "matchReason": "Recommended because he holds Inner Line Permit certification for Pithoragarh alpine treks"
      }],
      "activities": [{
        "item": { "_id": "65d...", "name": "Parvati Sarovar Ridge Walk" },
        "score": 95,
        "matchReason": "Recommended because it aligns with your Spiritual + High Altitude interests"
      }]
    }
  }
  ```

---

## 6. DETERMINISTIC BUDGET ENGINE (`/api/budget`) — NEW PHASE 1

### `POST /api/budget/calculate`
* **Access:** Public / Optional Auth
* **Request Body:**
  ```json
  {
    "durationDays": 7,
    "travelersCount": 2,
    "budgetTier": "Balanced",
    "stayIds": ["65b...", "65b..."],
    "transportLegs": [
      { "from": "Delhi", "to": "Kathgodam", "mode": "rail" },
      { "from": "Kathgodam", "to": "Dharchula", "mode": "road" }
    ],
    "guideIds": ["65c..."]
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "categories": {
        "transport": { "knownCost": 1840, "estimatedCost": 2200, "unknownLegsCount": 1, "currency": "INR" },
        "stay": { "knownCost": 14000, "estimatedCost": 0, "currency": "INR" },
        "food": { "knownCost": 0, "estimatedCost": 7000, "ratePerDayPerPerson": 500, "currency": "INR" },
        "activities": { "knownCost": 0, "estimatedCost": 1500, "currency": "INR" },
        "emergencyBuffer": { "estimatedCost": 3000, "currency": "INR" }
      },
      "summary": {
        "totalKnownCost": 15840,
        "totalEstimatedCost": 29540,
        "minEstimatedCost": 26000,
        "maxEstimatedCost": 34000,
        "budgetStatus": "NEAR_BUDGET",
        "hasUnverifiedCosts": true,
        "unverifiedNotice": "Transit leg Dharchula -> Gunji price is negotiated locally at checkpoint."
      }
    }
  }
  ```

---

## 7. AI TRIP PLANNER (`/api/ai/plan`) — NEW PHASE 2

### `POST /api/ai/plan`
* **Access:** Public / Optional Auth
* **Request Body:**
  ```json
  {
    "structuredTrip": {
      "origin": "Agra",
      "destination": "Adi Kailash",
      "duration": "7 Days",
      "days": [...]
    },
    "budgetSummary": { ... },
    "recommendations": { ... }
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "overallRationale": "Personalized 7-day high-altitude journey structured around gradual acclimatization...",
      "dayInsights": [
        { "day": 1, "advice": "Take an early start from Agra to beat the NCR highway rush before climbing into Kumaon foothills." },
        { "day": 2, "advice": "Ensure physical permit verification at SDM Dharchula before ascending to Gunji." }
      ],
      "safetyAdvisories": ["Hydration protocol at 3,000m+", "Daylight travel only on Pithoragarh border routes"]
    }
  }
  ```

---

## 8. BOOKING ENGINE (`/api/bookings`) — PHASE 4 (STANDARDIZED CONTRACT)

### `POST /api/bookings`
* **Access:** Private (`protect` middleware)
* **Request Body (Unified DTO):**
  ```json
  {
    "type": "stay",
    "stay": "65b...",
    "startDate": "2026-10-01",
    "endDate": "2026-10-04",
    "guests": 2,
    "notes": "Request room with mountain view"
  }
  ```
* **Response (201 Created):**
  ```json
  {
    "success": true,
    "data": {
      "_id": "65e...",
      "user": "65a...",
      "type": "stay",
      "stay": "65b...",
      "amount": 7500,
      "status": "pending",
      "paymentStatus": "pending"
    }
  }
  ```

### `GET /api/bookings/my`
* **Access:** Private
* **Response (200 OK):** Populated array of user's active and completed bookings.

### `PATCH /api/bookings/:id/cancel`
* **Access:** Private (Ownership enforced)
* **Response (200 OK):** Booking with status marked `cancelled`.

---

## 9. REVIEWS & FAVORITES (`/api/reviews`, `/api/favorites`)

### `POST /api/reviews`
* **Access:** Private
* **Request Body:**
  ```json
  { "targetType": "Stay", "target": "65b...", "rating": 5, "comment": "Authentic KMVN hospitality with breathtaking valley views." }
  ```
* **Response (201 Created):** Review recorded with `status: 'pending'` (moderation queue).

### `POST /api/favorites/toggle`
* **Access:** Private
* **Request Body:** `{ "itemType": "Destination", "item": "65a..." }`
* **Response (200 OK):** `{ "isFavorite": true, "favoriteId": "65f..." }`

---

## 10. WEB3 VERIFICATION (`/api/verification`) — NEW PHASE 5

### `GET /api/verification/:entityType/:entityId`
* **Access:** Public
* **Response (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "isVerified": true,
      "partnerName": "Himalayan Ridge Retreat",
      "blockchainTxHash": "0x4f8b...",
      "contractAddress": "0x1234...",
      "verificationHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "verifiedAt": "2026-05-10T11:00:00Z",
      "qrCodeDataUri": "data:image/png;base64,..."
    }
  }
  ```

---

## 11. ADMIN MANAGEMENT (`/api/admin`)

### `GET /api/admin/stats`
* **Access:** Private Admin (`adminOnly` middleware)
* **Response (200 OK):** Counts of users, partners, stays, bookings, and unmoderated reviews.

### `PATCH /api/admin/verify-partner/:partnerId`
* **Access:** Private Admin
* **Request Body:** `{ "status": "VERIFIED", "notes": "Physical inspection passed" }`
* **Response (200 OK):** Triggers smart contract minting and returns verification record.
