# DISCOVERY UTTARAKHAND — PARTNER MARKETPLACE & ADMIN VERIFICATION CONTRACT
**Document:** `docs/PARTNER_MARKETPLACE_CONTRACT.md`  
**Phase:** Phase 3 (Partner Marketplace Lifecycle & Admin Moderation)  
**Version:** 1.0.0  
**Status:** Canonical Engineering Specification  

---

## 1. Architectural Role & Boundary

The Partner Marketplace establishes a governed lifecycle for Uttarakhand homestays, local guides, trekking operators, and vehicle rentals.
**Zero Unverified Data Policy:** Partner-claimed listings and prices are **never** treated as verified public inventory until approved by an authorized administrator.

```text
       PARTNER
          ↓
  REGISTER / APPLY
          ↓
   PARTNER PROFILE
          ↓
    LISTING DRAFT (status: DRAFT, pricing: PARTNER_CLAIMED)
          ↓
SUBMIT FOR VERIFICATION (Partner Action)
          ↓
 PENDING_VERIFICATION
          ↓
 ADMIN AUDIT & REVIEW (Admin Action Only)
   ┌──────────────┴──────────────┐
   ↓                             ↓
REJECTED (With Reason)       VERIFIED + ACTIVE (Publication Decision)
   ↓                             ↓
CORRECTION & RESUBMIT    PUBLIC MARKETPLACE INVENTORY
 (Reopen to DRAFT)       (Discoverable by Travelers & AI)
```

---

## 2. Server-Enforced State Machine & Transitions

Every partner listing adheres strictly to the following discrete state machine:

| Initial State | Allowed Action / Transition | Actor | Next State |
| :--- | :--- | :--- | :--- |
| `DRAFT` | `SUBMIT_FOR_VERIFICATION` | Partner (Owner) | `PENDING_VERIFICATION` |
| `PENDING_VERIFICATION` | `ADMIN_APPROVE` | Admin | `VERIFIED` (and optionally `ACTIVE`) |
| `PENDING_VERIFICATION` | `ADMIN_REJECT` | Admin | `REJECTED` |
| `REJECTED` | `REOPEN_FOR_EDIT` | Partner (Owner) | `DRAFT` |
| `VERIFIED` | `ADMIN_PUBLISH` | Admin | `ACTIVE` |
| `ACTIVE` | `ADMIN_SUSPEND` | Admin | `REJECTED` / `DRAFT` |

### Strictly Forbidden Transitions (Blocked Server-Side with 400 Bad Request):
- `DRAFT` ➔ `VERIFIED` *(Blocked: Partner cannot self-verify)*
- `DRAFT` ➔ `ACTIVE` *(Blocked: Unverified listing cannot be published)*
- `PENDING_VERIFICATION` ➔ `ACTIVE` *(Blocked: Bypassing verification review)*
- `REJECTED` ➔ `ACTIVE` *(Blocked: Corrective fixes must be audited)*
- **Client Payload Role/Status Injection:** Any client request attempting to supply `{ status: 'VERIFIED' }`, `{ status: 'ACTIVE' }`, or `{ role: 'admin' }` has those fields rejected or stripped.

---

## 3. Data Provenance & Pricing Standards

Partner-submitted pricing is **not** automatically verified:

```typescript
interface ListingPricing {
  amount: number;
  unit: 'night' | 'day' | 'person' | 'trip' | 'custom';
  currency: 'INR';
  provenance: 'PARTNER_CLAIMED' | 'VERIFIED' | 'UNKNOWN';
  lastVerifiedAt?: Date;
}
```

1. **Initial Submission:** Always tagged `PARTNER_CLAIMED`.
2. **Admin Verification:** Upon physical document or portal verification, Admin upgrades price provenance to `VERIFIED`.
3. **Public Exposure:** Public cards display `PARTNER_CLAIMED` as *"Partner Tariff (Self-Reported)"* and `VERIFIED` as *"Verified Tariff"*.
4. **AI Context Grounding:** The Phase 2 AI Trip Planner will only receive partner pricing as trusted data if `provenance === 'VERIFIED'`.

---

## 4. Multi-Tenant Security & Isolation Matrix

| Action | Normal User | Partner (Owner) | Other Partner | Admin |
| :--- | :---: | :---: | :---: | :---: |
| Apply as Partner | ✅ | ⚠️ Already Partner | ⚠️ Already Partner | ⚠️ Admin |
| Create Listing Draft | ❌ (403) | ✅ | ❌ (403) | ✅ |
| View Own Drafts | ❌ (403) | ✅ | ❌ (403) | ✅ |
| Edit Own Draft | ❌ (403) | ✅ | ❌ (403) | ✅ |
| Submit Own Listing | ❌ (403) | ✅ | ❌ (403) | ✅ |
| View Pending Queue | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| Approve / Verify | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| Reject Listing | ❌ (403) | ❌ (403) | ❌ (403) | ✅ |
| View Public Inventory | ✅ (ACTIVE only) | ✅ (ACTIVE only) | ✅ (ACTIVE only) | ✅ (All) |

---

## 5. Verification Audit Trail Specification

Every administrative review action generates an immutable audit record:

```typescript
interface VerificationAuditLog {
  admin: ObjectId; // Ref User
  targetType: 'PartnerListing' | 'Partner';
  targetId: ObjectId;
  action: 'APPROVE' | 'REJECT' | 'PUBLISH' | 'SUSPEND';
  previousStatus: string;
  newStatus: string;
  reason: string; // Mandatory on REJECT
  verificationVersion: number; // Monotonically increasing submission version
  changedFields: string[];
  decisionSource: 'MANUAL_ADMIN_REVIEW' | 'GOVT_PORTAL_CROSS_CHECK';
  timestamp: Date;
}
```

**Zero Document Storage in Audit Logs:** Sensitive identity documents, Aadhaar cards, or banking documents are **never** stored inside audit records or on public networks.

---

## 6. Public Marketplace Visibility Rules

1. **Active Inventory Only:** Public queries filter strictly on `{ status: 'ACTIVE', isActive: true }`.
2. **Hidden Internal Fields:** Public responses strictly strip:
   - `verificationNotes`
   - `reviewedBy`
   - `auditLogs`
   - `credentialReference` (unless public registration ID like KMVN)
   - `adminNotes`
3. **Existing Dataset Safety:** Existing static verified records (89 destinations, 51 stays, 190 guides, 8 transport corridors) remain active and untouched. New partner listings complement the catalog without overwriting static data.
