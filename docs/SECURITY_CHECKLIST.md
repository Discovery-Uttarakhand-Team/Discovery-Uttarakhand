# Discovery Uttarakhand - Security Checklist

## Pre-Deployment Verification

### 1. Environment & Credentials
- [x] No secrets committed to source control.
- [x] `.env.example` scrubbed of real credentials.
- [x] Secrets are isolated to the production environment file.
- [x] Web3 private keys (if any) are fully segregated.
- [x] No private secrets (Razorpay Webhook/Keys, JWT secrets) exposed to the frontend bundle.

### 2. Network & Application Security
- [x] CORS strictly bounded to the authorized production frontend origin (`FRONTEND_URL`).
- [x] `helmet` implemented for baseline HTTP security headers.
- [x] HTTP request payloads bounded (e.g., 2MB) to prevent large payload Denial of Service.
- [x] Razorpay webhook endpoint correctly isolates `express.raw` payload parsing to preserve cryptographic signature verifiability.

### 3. Authentication & Authorization
- [x] JWT token validations are enforcing proper signature checks and expirations.
- [x] Role-Based Access Control verified: 
  - Admin boundaries restricted to admins.
  - Partner operations restricted to partners and strictly isolated across tenant boundaries.
- [x] Insecure IDOR (Insecure Direct Object Reference) access prevented in Bookings, Trips, Payments, and Reviews.

### 4. Payments Security
- [x] Razorpay Amount verification rigorously enforced: the Razorpay paid amount must structurally match the server-side Booking snapshot minor-unit calculation.
- [x] Ownership bounds: User `A` cannot fulfill the payment order of User `B`.
- [x] Webhook Idempotency: Duplicate webhooks or out-of-order webhooks (e.g., AUTHORIZED arriving after CAPTURED) are safely discarded.
- [x] Agent boundary: AI Copilot explicitly blocked from formulating, fulfilling, or mutating payment/checkout operations.

### 5. AI & Extensibility
- [x] AI input boundaries enforced against prompt injection strings.
- [x] Live Data adapters enforce safe degradation policies (failure of an external weather/road API does not crash the system).
- [x] PII strictly scrubbed from Blockchain anchors.
