# DISCOVERY UTTARAKHAND — PHASE 2 ENGINEERING REPORT
## Grounded AI Trip Planner MVP (Reasoning & Personalization Layer)
**Document:** `docs/PHASE_2_REPORT.md`  
**Date:** September 13, 2026  
**System Version:** 3.2.0 (Phase 2 Complete — Grounded AI Reasoning & Acclimatization Engine)  
**Status:** ✅ Production Build Passed (1.64s) • 🔒 Multi-Tenant Secured • 🛡️ Candidate Allowlist Enforced • 📊 All 18 Phase 2 Tests Passed

---

## 1. Executive Summary

In strict accordance with the **Startup Blueprint** and the approved **Phase 2 Directives**, Phase 2 has been completed. The AI Trip Planner is implemented as a **pure reasoning, personalization, and acclimatization layer** sitting atop the deterministic route, recommendation, transport, and budget engines.

**The AI is NOT the source of truth.** MongoDB and the deterministic engines remain the authoritative foundation. Factual data (prices, room availability, transport schedules, route geometries) cannot be fabricated by the model. If a data point is missing from the verified context, it remains strictly `UNKNOWN` or `UNAVAILABLE`.

```text
User Trip Input
      ↓
Deterministic Route Engine (OSRM + Mountain Curvature Fallback)
      ↓
Deterministic Recommendation Engine V2 (Spatial Proximity + Pace)
      ↓
Deterministic Transport Engine (Static Registry Corridors)
      ↓
Deterministic Budget Engine (Multi-Tier Provenance)
      ↓
Deterministic Itinerary / Trip Workspace
      ↓
aiContextBuilder.js (Restricted Bounded Context Selection)
      ↓
AI Provider Layer (GeminiProvider / OpenAIProvider / DeterministicFallbackProvider)
      ↓
Structured Output Validation & Schema Enforcement
      ↓
Candidate-ID Allowlist & Provenance Validation
      ↓
AI Insights Layer (Non-destructive Proposed Guidance)
      ↓
MyTripPage (Trip Companion Workspace)
```

---

## 2. Key Files Created and Modified

### A. New Architecture & Specification Documents
1. [`docs/AI_PLANNER_CONTRACT.md`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/docs/AI_PLANNER_CONTRACT.md)
   - Canonical contract defining input context, structured output JSON schema, candidate-ID allowlist rules, immutable provenance rules, prompt-injection protections, and timeout boundaries.
2. [`docs/PHASE_2_REPORT.md`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/docs/PHASE_2_REPORT.md)
   - Detailed technical verification report.

### B. New Backend Services & Providers
1. [`backend/services/aiContextBuilder.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/services/aiContextBuilder.js)
   - Authoritative context assembly layer. Extracts bounded candidates (stays, guides, activities, transports) and builds strict `allowlist` sets. Zero secrets, tokens, or PII exposed.
2. [`backend/services/ai/providers/BaseAiProvider.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/services/ai/providers/BaseAiProvider.js)
   - Abstract base class declaring the standard `generatePlan(context, options)` interface.
3. [`backend/services/ai/providers/GeminiProvider.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/services/ai/providers/GeminiProvider.js)
   - Google Gemini REST integration (`gemini-1.5-flash` / `gemini-1.5-pro`) with structured JSON mode and system instruction grounding.
4. [`backend/services/ai/providers/OpenAIProvider.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/services/ai/providers/OpenAIProvider.js)
   - OpenAI chat completions integration (`gpt-4o-mini` / `gpt-4o`) with `response_format: { type: "json_object" }`.
5. [`backend/services/ai/providers/DeterministicFallbackProvider.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/services/ai/providers/DeterministicFallbackProvider.js)
   - High-performance, zero-network rule-based reasoning engine. Synthesizes day-by-day narratives, acclimatization guidance, and budget explanations strictly from verified context.
6. [`backend/services/aiPlannerService.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/services/aiPlannerService.js)
   - Core orchestrator: provider resolution, 8,000 ms timeout guard, schema validation, candidate-ID allowlist enforcement, price hallucination sanitization, and fallback failover.

### C. Backend API & Routes
1. [`backend/controllers/aiController.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/controllers/aiController.js)
   - Handles `POST /api/ai/plan`.
   - Supports **Mode A (Saved Trip)**: Validates JWT token and enforces multi-tenant ownership (`req.user._id === trip.user`).
   - Supports **Mode B (Transient Trip)**: Public unauthenticated planning with strict input size validation (max 14 days, max 20 travelers, max 500 char notes).
2. [`backend/routes/aiRoutes.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/routes/aiRoutes.js)
   - Mounts `POST /api/ai/plan` with in-memory IP rate limiter (30 requests per 15-minute window).
3. [`backend/server.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/backend/server.js)
   - Registered `/api/ai` route.

### D. Frontend Companion Workspace Layer
1. [`Frontend/src/api/aiApi.js`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/Frontend/src/api/aiApi.js)
   - Client API function `generateAiPlan({ tripId, tripData, provider })`.
2. [`Frontend/src/components/planner/AiTripPlanCard.jsx`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/Frontend/src/components/planner/AiTripPlanCard.jsx)
   - Additive AI reasoning card in My Trip Companion Workspace.
   - Features:
     - Executive trip strategy summary.
     - Pacing & Acclimatization advisory box (elevation advice, daylight transit warning).
     - Collapsible Day-by-Day strategic rationale (explaining why each day base was chosen).
     - Verified recommended stays & guides.
     - Grounded budget rationale with uncertainty notes.
     - Factual grounding badge & transparent disclaimer.
     - Graceful loading state and retryable error state.
3. [`Frontend/src/pages/MyTripPage.jsx`](file:///c:/Users/ak/Desktop/DISCOVERY%20UTTARAKHAND/Frontend/src/pages/MyTripPage.jsx)
   - Integrated `AiTripPlanCard` smoothly into the left column timeline without altering or breaking existing `DayCard`, `JourneySegmentStepper`, `BudgetBreakdownCard`, or Leaflet Map components.

---

## 3. Strict Grounding & Hallucination Safeguards

| Threat Vector | Defense Mechanism | Verified Behavior |
| :--- | :--- | :--- |
| **Phantom Entity Injection** | Hard Candidate-ID Allowlist | Any returned stay, activity, or guide ID not present in `allowlist` is immediately discarded (`null` / filtered). |
| **Price Hallucination** | Context Price Cross-Check | If context has no verified price for a stay, any model-invented price is stripped to *"Counter enquiry required"* and tagged `UNKNOWN`. |
| **Provenance Escalation** | Immutable Provenance Enforcement | Model output cannot promote `UNKNOWN` or `ESTIMATED` to `STATIC_VERIFIED` or `LIVE`. |
| **Prompt Injection** | Untrusted Boundary Tagging | User notes wrapped in `<UNTRUSTED_USER_NOTES>` delimiters; instructions attempting to override prices, safety rules, or schema are neutralized. |
| **Provider Outage / Timeout** | 8-Second Race & Fallback | If external LLM times out or errors, automatically failover to `DeterministicFallbackProvider` (zero UI failure). |
| **Cross-User Data Leakage** | Strict JWT Ownership | Requests for saved trips verify `trip.user.equals(req.user._id)`; 403 Forbidden returned for unauthorized users. |

---

## 4. Automated Test Results (18 Passed, 0 Failed)

The complete Phase 2 test suite was executed via:
```bash
node backend/scripts/test_phase2_ai_planner.js
```

```
===============================================================
DISCOVERY UTTARAKHAND — PHASE 2 AI PLANNER TEST SUITE (18 TESTS)
===============================================================

MongoDB Connected: 127.0.0.1
  ✅ [TEST 1] Valid Context Generation with Bounded Candidates & Allowlist
     Destination: Nainital, Days: 5, Stays in Allowlist: 7
  ✅ [TEST 2] Missing Budget Graceful Handling (Fallback Envelope)
     Assigned budget status: NEAR_BUDGET, Total: ₹12,595
  ✅ [TEST 3] Unknown Transport Data Preserves UNKNOWN Provenance (Zero Fabricated Fares)
     Segment Pithoragarh → Dharchula provenance: UNKNOWN, fare: null
  ✅ [TEST 4] Unavailable Recommendation Handled Honestly without Crash
     Candidate stays returned safely as array (0 items)
  ✅ [TEST 5] Provider Timeout Graceful Failover to Deterministic Engine
     Timeout caught after 8s; result meta: mode=fallback, provider=deterministic
  ✅ [TEST 6] Malformed Provider JSON Safely Rejected & Replaced with Grounded Fallback
     Rejected invalid object; returned valid fallback with 5 days.
  ✅ [TEST 7] Schema Rejection for Non-Object Model Output
     Error correctly flagged: "Output is not an object"
  ✅ [TEST 8] Saved-Trip Ownership Check: User B Blocked from User A Trip (403)
     Trip Owner: 6aa60a945b1b1fb99a9823a9, User B: 6aa60a945b1b1fb99a9823aa (Matches: false)
  ✅ [TEST 9] Unauthenticated Saved-Trip Request Denied (401 Requirement)
     Requests without Bearer token properly intercepted
  ✅ [TEST 10] Hallucinated Price Attack Stripped & Normalized to UNKNOWN
     Resulting quote: "Counter enquiry required (Tariff unverified)", Provenance: UNKNOWN
  ✅ [TEST 11] UNKNOWN → VERIFIED Provenance Escalation Attack Prevented
     Sanitization guaranteed provenance remained UNKNOWN
  ✅ [TEST 12] Phantom Candidate-ID Rejection (Allowlist Enforcement)
     Phantom stay set to: null, Phantom activities filtered: 0
  ✅ [TEST 13] Evidence References Present in Structured Plan Segments
     All daily journey segments contain evidenceRefs linking back to context
  ✅ [TEST 14] Deterministic Fallback Completeness & Schema Conformity
     Generated 5 days with summary: "Structured 5-day balanced-paced Himalayan journey from Delhi..."
  ✅ [TEST 15] Provider Switching Mechanism Resolution
     Resolved provider: [deterministic]
  ✅ [TEST 16] Transient Unauthenticated Planning Operates Seamlessly Without DB Save
     Transient plan generated 3 days with tone: Relaxed Himalayan Explorer
  ✅ [TEST 17] Prompt-Injection Input Neutralized Inside Untrusted Boundary
     Prompt injection ignored; grounded state: true, zero-price attack thwarted: true
  ✅ [TEST 18] Input Boundary Limit Enforcement (Notes Truncated to <= 500 Chars)
     Original note length: 800 -> Truncated note length: 500

===============================================================
PHASE 2 TEST SUMMARY: 18 PASSED, 0 FAILED (TOTAL: 18)
===============================================================
```

### Regression Verification
- `test_phase1_recommendation_budget.js`: **8 PASSED, 0 FAILED**
- `test_transport_engine.js`: **3 PASSED, 0 FAILED**
- `test_itinerary_segments.js`: **PASSED (7 Days Generated Strictly)**
- `npm run build` in `Frontend`: **✓ built in 1.64s (0 errors)**

---

## 5. Web3 / Verification Terminology Compliance

All documentation and code comments have been cleansed of generic "KYC blockchain" references. In accordance with Section 12 & 23:
- **Approved Terminology:** `Partner Verification`, `Credential Verification`, `Verification Proof`, `Blockchain Hash`, `QR Verification`.
- **Sensitive Identity Isolation:** Identity documents (Aadhaar, passports, bank proofs) remain **strictly off-chain in MongoDB**. The blockchain acts solely as an immutable public notary storing SHA-256 verification hashes and status timestamps.

---

## 6. Known Limitations & Next Steps

1. **AI Travel Copilot (Conversational Chat)**: Intentionally deferred to Phase 6; Phase 2 delivers the structured Grounded AI Planner MVP.
2. **Live Transport Telemetry**: Unverified local mountain shared cabs and counter buses remain flagged as `UNKNOWN` pending real-time API integrations in Phase 4.
3. **External LLM Keys**: System defaults gracefully to `DeterministicFallbackProvider` when `GEMINI_API_KEY` or `OPENAI_API_KEY` is not present in `.env`, providing 100% operational reliability.

---

### Phase 2 Implementation Complete. Stopped and awaiting review.
