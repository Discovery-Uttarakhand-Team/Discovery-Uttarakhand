# True Travel Building Experience Implementation

## Existing UX Problems
- **Form-First Approach**: The previous planner forced users to immediately fill out a long form (Origin, Destination, Dates, Budget, Pace, etc.) before they could even browse the destination.
- **Budget Gatekeeping**: The system aggressively judged the user's budget against an estimated total before they had even seen what was available, creating a stressful and restrictive UX.
- **Fragmented "Add to Trip"**: Users could add items to a trip while browsing, but the planner didn't fully integrate this "basket" state, asking them to select a destination again.

## New Discovery Flow
The user journey now aligns with natural travel planning mental models:

1. **Explore & Discover**:
   - The user browses destination pages (e.g. "Nainital").
   - They use the `DestinationDiscoveryWorkspace` to find real, verified places to visit, stays, rentals, and activities.
2. **Build Trip Basket**:
   - Users click `[+ Add to Trip]` on items they like.
   - The items are saved in a persistent `tripDestinations` store (accessible to guests).
   - A `FloatingTripBasket` widget appears, summarizing the selected items and offering a quick link to "Build Trip".
3. **Streamlined Planning**:
   - The user navigates to `/trip-planner`.
   - Instead of a blank origin/destination search, the form displays their `Trip Basket` prominently.
   - Destination selection is skipped if the basket is populated, and Origin becomes strictly optional (used only for routing).
   - The form prioritizes the remaining inputs: Dates, Duration, Travelers, and Budget.
4. **Context-Aware Recommendations**:
   - Once the itinerary is built (`/my-trip/:id`), the user sees the generated day-by-day plan.
   - **Stays and Rentals** dynamically filter to show recommendations matching the specific trip destination/district.
   - **Availability States** (`AVAILABLE`, `UNAVAILABLE`, `UNKNOWN`) are surfaced for these recommendations to prevent hallucinated availability.

## AI Copilot Enhancements
- The `tripDestinations` basket is now injected directly into the `pageContext` sent to the AI Copilot.
- This allows the AI to recommend items that aren't already in the basket and to adopt a `DISCOVERY` mode instead of immediately prompting the user to fill out a form when they mention a location.

## Acceptance Criteria
- [x] Users can add places to a trip basket without logging in.
- [x] A floating widget clearly shows the basket size.
- [x] The `TripPlanner` hides the destination search when basket items are present.
- [x] The `MyTripPage` includes stay and vehicle rental recommendations mapped to the trip context.
- [x] Availability badges correctly display the item's live status.
- [x] AI Copilot context includes the basket state.
