# PHASE 7 AI TRAVEL COPILOT — AGENT CONTRACT
## Discovery Uttarakhand v3.7.0

---

## 1. Agent Decision Policy

Before any tool call, the agent reasons through:

1. **Can it be answered from trusted context already available?** → Answer directly.
2. **Does it require fresh/live data?** → Use appropriate live-data tool.
3. **Does it require database information?** → Use appropriate database tool.
4. **Is information missing or ambiguous?** → Ask a clarification question.
5. **Is this a state-changing operation?** → Require confirmation.
6. **Does a trusted tool exist for this factual info?** → Prefer tool over LLM knowledge.
7. **No trusted evidence exists?** → Explicitly say: "I don't have verified information for that."

**NEVER:** Call random tools, invent parameters, invent IDs, fabricate answers.

---

## 2. Tool Selection Rules (14 Tools)

| Intent | Tool | State-Changing |
|--------|------|----------------|
| Trip context | getTripContext | No |
| Search destinations | searchDestinations | No |
| Recommendations | getRecommendations | No |
| Budget calculation | calculateBudget | No |
| Route planning | planRoute | No |
| Read itinerary | getItinerary | No |
| **Propose itinerary change** | **modifyItinerary** | **YES (proposal only)** |
| Weather | getWeather | No |
| Road safety | getRoadAdvisory | No |
| Transit status | getTransitStatus | No |
| Find accommodation | findStays | No |
| Find rentals | findRentals | No |
| Find guides | findGuides | No |
| Booking eligibility check | checkBookingEligibility | No |

---

## 3. Agent Tool Trace (Internal)

Every request internally tracks:

```json
{
  "requestId": "...",
  "sessionId": "...",
  "provider": "gemini | deterministic",
  "toolCallCount": 2,
  "fallbackUsed": false,
  "injectionBlocked": false,
  "tools": [
    {
      "name": "getWeather",
      "validated": true,
      "authorized": true,
      "success": true,
      "durationMs": 420
    }
  ],
  "totalDurationMs": 850
}
```

**NEVER exposed to frontend:** Internal prompts, system instructions, raw tool arguments, DB internals, secrets, tokens.

---

## 4. Provenance Rules (Immutable)

| State | Meaning | Agent Behavior |
|-------|---------|----------------|
| VERIFIED | Confirmed from official source | Report as confirmed |
| ESTIMATED | Calculated approximation | Report as estimate |
| LIVE | Real-time data just fetched | Report as live |
| STALE | Data older than freshness window | Disclose explicitly |
| UNKNOWN | Data not available | Say "I don't have verified information" |
| UNAVAILABLE | Service is down | Say service is unavailable, suggest alternatives |

**Never:** Change STALE to VERIFIED, ESTIMATED to VERIFIED, invent missing values.

---

## 5. Context Conflict Rules

When user's message conflicts with saved trip:

```
Saved trip: travelers = 4
User: "We are 6 people now."
```

Agent MUST NOT silently modify the trip. Response:
> "Your saved trip currently has travelers: 4. You mentioned 6. Would you like to update it?"

Applies to: destination, dates, duration, travelers, budget, transport, trip type, interests, pace.

Read-only reasoning may use proposed value. Persistent changes require explicit confirmation.

---

## 6. Confirmation Security

Pending confirmations are bound to:
- Session ID
- User ID
- Trip ID
- Action type + exact payload
- 5-minute expiry

A confirmation from another session/user → REJECTED.
A stale confirmation → REJECTED.
A modified payload → REJECTED (re-validated server-side).

Random "yes" without pending confirmation → REJECTED.

---

## 7. Modify Itinerary Mutation Boundary

```
User request
     ↓
Agent (LLM)
     ↓
modifyItinerary tool → PROPOSAL ONLY (no DB write)
     ↓
Backend setPendingConfirmation()
     ↓
confirmation_required → User
     ↓
User confirms
     ↓
consumeConfirmation() [validates session+user+trip+expiry]
     ↓
_applyItineraryMutation() [re-fetches from DB, re-validates ownership]
     ↓
SavedTrip.save()
```

**LLM never has direct DB mutation capability.**

---

## 8. Booking Safety

For "Book this" requests:
1. Identify exact listing
2. Validate ACTIVE status
3. Check VERIFIED pricing
4. Check eligibility
5. Generate booking summary
6. Require explicit confirmation
7. Send user through existing BookingController flow

**Never:** Invent price, mark listing ACTIVE/VERIFIED, bypass BookingController, auto-create booking records.

---

## 9. Error Recovery

| Failure | Agent Response |
|---------|----------------|
| Weather API fails | "Weather data currently unavailable. Check local sources." |
| Transit unknown | "Schedule not available. Visit official portals: UPSRTC, IRCTC." |
| Provider timeout | Deterministic fallback activates automatically |
| Tool execution error | Graceful message, no fabricated result |
| Max iterations (4) reached | Safe fallback response |

---

## 10. Performance Rules

- Max 4 tool iterations per request
- Provider timeout: 10,000ms
- Tool timeout: 8,000ms
- Agent total timeout: 30,000ms
- Session TTL: 30 minutes
- Confirmation TTL: 5 minutes
- Max history: 20 turns (summarized after 8)
- Rate limit: 20 requests per user per 15 minutes

---

## 11. Session Store

- In-memory (not persisted to MongoDB)
- Per-session candidate allowlist
- Server-side pending confirmation storage
- Auto-eviction of expired sessions
- Summary compression for long conversations