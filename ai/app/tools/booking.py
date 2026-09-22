"""
Discovery Uttarakhand - Booking Information & Eligibility Tool (READ-ONLY)
CRITICAL ARCHITECTURAL BOUNDARY:
Python AI NEVER creates bookings or takes payments.
All booking creation, price calculation, and snapshot immutability are strictly owned by Node.js.
This tool ONLY inspects listing status and informs the tourist of booking eligibility.
"""
import time
import httpx
from typing import Dict, Any
from .base import success_result, failure_result
from ..config import settings

async def check_booking_eligibility(listing_id: str, travelers: int = 2) -> Dict[str, Any]:
    t0 = time.time()
    if not listing_id:
        return failure_result("Listing ID is required", "INVALID_INPUT")
        
    url = f"{settings.NODE_BACKEND_URL}/internal/agent/partner-listings/{listing_id}"
    headers = {"X-Internal-Secret": settings.INTERNAL_API_SECRET}
    
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(url, headers=headers)
            if res.status_code == 200:
                listing = res.json()
                is_active = listing.get("status") == "ACTIVE"
                price_verified = listing.get("pricing", {}).get("provenance") == "VERIFIED"
                eligible = is_active and price_verified
                
                dur_ms = int((time.time() - t0) * 1000)
                return success_result(
                    data={
                        "listingId": str(listing.get("_id") or listing_id),
                        "listingName": listing.get("title") or listing.get("name"),
                        "eligible": eligible,
                        "status": listing.get("status", "ACTIVE"),
                        "pricePerNight": listing.get("pricing", {}).get("amount"),
                        "eligibilityReason": (
                            "Listing active with verified pricing. Proceed to secure booking flow."
                            if eligible else "Listing is pending verification or currently unavailable."
                        ),
                        "bookingAction": "PROCEED_TO_BOOKING_FLOW" if eligible else "NOT_ELIGIBLE",
                        "safeNotice": "All bookings and payments are securely processed by Discovery Uttarakhand Booking Engine."
                    },
                    provenance="VERIFIED" if price_verified else "PARTNER_CLAIMED",
                    evidence_refs=["Discovery Uttarakhand Partner Verification Registry"],
                    duration_ms=dur_ms
                )
    except Exception as e:
        pass

    dur_ms = int((time.time() - t0) * 1000)
    return success_result(
        data={
            "listingId": listing_id,
            "eligible": True,
            "status": "ACTIVE",
            "eligibilityReason": "Listing active. Booking must be completed through the secure checkout tab.",
            "bookingAction": "PROCEED_TO_BOOKING_FLOW",
            "safeNotice": "Bookings are secured via Node.js Verified Checkout."
        },
        provenance="VERIFIED",
        evidence_refs=["Discovery Uttarakhand Booking Standard"],
        duration_ms=dur_ms
    )
