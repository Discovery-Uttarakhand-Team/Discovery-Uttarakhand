/**
 * Discovery Uttarakhand - Phase 7 Agent Tools
 * 14 grounded tools wrapping Phase 0-6 deterministic services.
 */
import mongoose from "mongoose";
import Destination from "../models/Destination.js";
import Stay from "../models/Stay.js";
import Guide from "../models/Guide.js";
import Activity from "../models/Activity.js";
import Rental from "../models/Rental.js";
import Transport from "../models/Transport.js";
import Partner from "../models/Partner.js";
import PartnerListing from "../models/PartnerListing.js";
import SavedTrip from "../models/SavedTrip.js";
import { RecommendationEngine } from "./recommendationService.js";
import { BudgetEngine } from "./budgetEngine.js";
import WeatherAdapter from "./adapters/openMeteoAdapter.js";
import RoadAdvisoryAdapter from "./adapters/roadAdvisoryAdapter.js";
import TransitLiveAdapter from "./adapters/transitLiveAdapter.js";
import { mergeAllowlist } from "./agentSessionStore.js";
import { resolveDestination } from "./destinationResolver.js";
import { applyTripMutation } from "./tripMutationService.js";

const TOOL_TIMEOUT_MS = 8000;

async function withTimeout(promise, ms, toolName) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${toolName} timed out after ${ms}ms`)), ms)
    )
  ]);
}

export function successResult(data, provenance = "VERIFIED", citations = []) {
  const refs = (citations || []).map(c => typeof c === "string" ? c : (c.title || c.source || JSON.stringify(c)));
  return {
    success: true,
    data,
    provenance,
    evidenceRefs: refs,
    citations,
    status: "OK",
    error: null,
    timestamp: new Date().toISOString()
  };
}

export function failureResult(reason, code = "TOOL_ERROR") {
  return {
    success: false,
    data: null,
    provenance: "UNKNOWN",
    evidenceRefs: [],
    status: "ERROR",
    error: reason,
    code,
    timestamp: new Date().toISOString()
  };
}

function isValidObjectId(id) {
  return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
}

export const TOOL_SCHEMAS = [
  {
    name: "getTripContext",
    description: "Retrieve the user s current saved trip context including destinations itinerary and preferences. Requires authentication.",
    parameters: { type: "object", properties: { tripId: { type: "string", description: "The saved trip ID" } }, required: ["tripId"] },
    isStateChanging: false, requiresAuth: true
  },
  {
    name: "exploreDestination",
    description: "Explore everything a tourist can do at a specific destination (activities, boating, trekking, nature, temples, stays, rentals, guides). Grounded against real verified database records.",
    parameters: { type: "object", properties: {
      destination: { type: "string", description: "Name or slug of the destination (e.g. 'Bhimtal', 'Rishikesh')" },
      interest: { type: "string", description: "Optional activity/interest filter: 'trekking', 'boating', 'nature', 'spiritual', 'adventure', 'stays', 'rentals', 'guides'" }
    }, required: ["destination"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "searchDestinations",
    description: "Search verified Uttarakhand destinations by name category or interests.",
    parameters: { type: "object", properties: {
      query: { type: "string" }, category: { type: "string" }, district: { type: "string" }, limit: { type: "number" }
    }, required: [] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "getRecommendations",
    description: "Get personalized recommendations for stays activities and guides based on trip preferences.",
    parameters: { type: "object", properties: {
      destination: { type: "string" }, interests: { type: "array", items: { type: "string" } },
      budget: { type: "string" }, pace: { type: "string" }, travelers: { type: "number" }
    }, required: ["destination"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "calculateBudget",
    description: "Calculate trip budget using the deterministic budget engine. Preserves VERIFIED ESTIMATED UNKNOWN provenance.",
    parameters: { type: "object", properties: {
      durationDays: { type: "number" }, travelers: { type: "number" }, budgetTier: { type: "string" }, destination: { type: "string" }
    }, required: ["durationDays", "travelers"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "planRoute",
    description: "Calculate route between two Uttarakhand locations. Returns estimated distance and duration.",
    parameters: { type: "object", properties: { from: { type: "string" }, to: { type: "string" } }, required: ["from", "to"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "getItinerary",
    description: "Retrieve the generated day-by-day itinerary for the current saved trip.",
    parameters: { type: "object", properties: { tripId: { type: "string" }, day: { type: "number" } }, required: ["tripId"] },
    isStateChanging: false, requiresAuth: true
  },
  {
    name: "modifyItinerary",
    description: "PROPOSE a modification to the itinerary. Creates a confirmation_required response - user must confirm before any change is saved.",
    parameters: { type: "object", properties: {
      tripId: { type: "string" }, operation: { type: "string" }, day: { type: "number" },
      removeCandidateId: { type: "string" }, addCandidateId: { type: "string" }, reason: { type: "string" }
    }, required: ["tripId", "operation", "day"] },
    isStateChanging: true, requiresAuth: true
  },
  {
    name: "getWeather",
    description: "Get current weather using Phase 6 weather adapter. Discloses LIVE STALE UNKNOWN status.",
    parameters: { type: "object", properties: { location: { type: "string" }, lat: { type: "number" }, lon: { type: "number" } }, required: ["location"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "getRoadAdvisory",
    description: "Get road safety advisory using Phase 6 advisory engine.",
    parameters: { type: "object", properties: { corridor: { type: "string" }, origin: { type: "string" }, destination: { type: "string" } }, required: [] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "getTransitStatus",
    description: "Get transit status using Phase 6 ethical transit adapter. No scraping - returns official portals.",
    parameters: { type: "object", properties: { origin: { type: "string" }, destination: { type: "string" }, mode: { type: "string" } }, required: ["origin", "destination"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "findStays",
    description: "Find accommodation near a destination. Only returns verified active stays.",
    parameters: { type: "object", properties: { destination: { type: "string" }, budget: { type: "string" }, limit: { type: "number" } }, required: ["destination"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "findRentals",
    description: "Find vehicle rentals from verified listings.",
    parameters: { type: "object", properties: { destination: { type: "string" }, vehicleType: { type: "string" }, limit: { type: "number" } }, required: ["destination"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "findGuides",
    description: "Find verified local guides for a destination.",
    parameters: { type: "object", properties: { destination: { type: "string" }, specialty: { type: "string" }, limit: { type: "number" } }, required: ["destination"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "checkBookingEligibility",
    description: "Check if a listing is eligible for booking. READ-ONLY - does NOT create a booking.",
    parameters: { type: "object", properties: { listingId: { type: "string" }, travelers: { type: "number" } }, required: ["listingId"] },
    isStateChanging: false, requiresAuth: false
  },
  {
    name: "modifyTripPlan",
    description: "PROPOSE a structured modification to the active trip or session (budget, duration, travelers, transport, activities, stays). Changes are applied deterministically via tripMutationService.",
    parameters: {
      type: "object",
      properties: {
        mutationType: {
          type: "string",
          enum: ["UPDATE_BUDGET", "UPDATE_DURATION", "UPDATE_TRAVELERS", "CHANGE_TRANSPORT", "ADD_ACTIVITY", "REMOVE_ACTIVITY", "REPLACE_STAY", "MOVE_ACTIVITY"],
          description: "Type of trip modification"
        },
        payload: {
          type: "object",
          description: "Modification payload object, e.g. { budget: 25000 }, { durationDays: 5 }, { transport: 'cab' }, { day: 2, activity: { name: 'Boating' } }"
        },
        reason: {
          type: "string",
          description: "User-facing reason for modification"
        }
      },
      required: ["mutationType", "payload"]
    },
    isStateChanging: true,
    requiresAuth: false
  }
];

export const TOOL_MAP = Object.fromEntries(TOOL_SCHEMAS.map(t => [t.name, t]));
export const STATE_CHANGING_TOOLS = new Set(TOOL_SCHEMAS.filter(t => t.isStateChanging).map(t => t.name));

export function validateToolCall(toolName, args = {}) {
  const schema = TOOL_MAP[toolName];
  if (!schema) return { valid: false, reason: `Unknown tool: ${toolName}` };
  const required = schema.parameters.required || [];
  for (const field of required) {
    if (args[field] === undefined || args[field] === null || args[field] === "") {
      return { valid: false, reason: `Missing required argument: ${field}` };
    }
  }
  if (args.travelers !== undefined) { const t = parseInt(args.travelers); if (isNaN(t)||t<1||t>20) return { valid: false, reason: "travelers must be between 1 and 20" }; args.travelers = t; }
  if (args.durationDays !== undefined) { const d = parseInt(args.durationDays); if (isNaN(d)||d<1||d>14) return { valid: false, reason: "durationDays must be between 1 and 14" }; args.durationDays = d; }
  if (args.limit !== undefined) { const l = parseInt(args.limit); args.limit = Math.min(Math.max(isNaN(l)?5:l,1),10); }
  if (args.day !== undefined) { const day = parseInt(args.day); if (isNaN(day)||day<1) return { valid: false, reason: "day must be >= 1" }; args.day = day; }
  for (const f of ["tripId","listingId","removeCandidateId","addCandidateId"]) {
    if (args[f] && !isValidObjectId(args[f])) return { valid: false, reason: `Invalid ${f} format` };
  }
  for (const key of Object.keys(args)) {
    if (typeof args[key] === "string") args[key] = args[key].slice(0,500).replace(/[<>]/g,"");
  }
  return { valid: true, args };
}
export async function executeTool(toolName, args, { session, user } = {}) {
  const start = Date.now();
  try {
    let result;
    switch (toolName) {
      case "getTripContext":          result = await _getTripContext(args, user); break;
      case "exploreDestination":      result = await _exploreDestination(args, session); break;
      case "searchDestinations":      result = await _searchDestinations(args, session); break;
      case "getRecommendations":      result = await _getRecommendations(args, session); break;
      case "calculateBudget":         result = await _calculateBudget(args); break;
      case "planRoute":               result = await _planRoute(args); break;
      case "getItinerary":            result = await _getItinerary(args, user); break;
      case "modifyItinerary":         result = await _proposeModifyItinerary(args, user, session); break;
      case "modifyTripPlan":          result = await _modifyTripPlan(args, session, user); break;
      case "getWeather":              result = await _getWeather(args); break;
      case "getRoadAdvisory":         result = await _getRoadAdvisory(args); break;
      case "getTransitStatus":        result = await _getTransitStatus(args); break;
      case "findStays":               result = await _findStays(args, session); break;
      case "findRentals":             result = await _findRentals(args, session); break;
      case "findGuides":              result = await _findGuides(args, session); break;
      case "checkBookingEligibility": result = await _checkBookingEligibility(args, session); break;
      default: result = failureResult(`Unknown tool: ${toolName}`, "UNKNOWN_TOOL");
    }
    result._durationMs = Date.now() - start;
    return result;
  } catch (err) {
    return { ...failureResult(err.message || "Tool execution error"), _durationMs: Date.now() - start };
  }
}

async function _getTripContext(args, user) {
  if (!user) return failureResult("Authentication required", "AUTH_REQUIRED");
  const trip = await withTimeout(SavedTrip.findById(args.tripId).populate("destinations").lean(), TOOL_TIMEOUT_MS, "getTripContext");
  if (!trip) return failureResult("Trip not found", "NOT_FOUND");
  if (String(trip.user) !== String(user._id)) return failureResult("Access denied", "FORBIDDEN");
  return successResult({
    tripId: String(trip._id), title: trip.title, duration: trip.duration, travelers: trip.travelers,
    pace: trip.pace, budget: trip.budget, transport: trip.transport, interests: trip.interests || [],
    tripType: trip.tripType || [], status: trip.status, startDate: trip.startDate, endDate: trip.endDate,
    destinationNames: (trip.destinations || []).map(d => d.name || d),
    hasGeneratedItinerary: !!(trip.generatedItinerary && trip.generatedItinerary.length > 0),
    notes: trip.notes ? String(trip.notes).slice(0, 200) : null
  }, "saved_trip");
}

async function _exploreDestination(args, session) {
  const destName = (args.destination || "").trim();
  const interest = (args.interest || "").trim().toLowerCase();
  if (!destName) return failureResult("Destination name is required", "INVALID_ARGUMENTS");

  const dest = await Destination.findOne({
    $or: [
      { slug: destName.toLowerCase() },
      { name: new RegExp(`^${destName}$`, "i") },
      { name: new RegExp(destName, "i") }
    ]
  }).lean();

  if (!dest) {
    return failureResult(`Destination '${destName}' not found in Uttarakhand verified dataset.`, "NOT_FOUND");
  }

  // Use internal HTTP call to getDestinationExplore so we share 100% the exact same logic
  try {
    const { default: axios } = await import('axios');
    const port = process.env.PORT || 5000;
    const url = `http://127.0.0.1:${port}/api/destinations/${dest.slug}/explore`;
    const res = await withTimeout(axios.get(url, { params: interest ? { interest } : {} }), TOOL_TIMEOUT_MS, "exploreDestination");
    const d = res.data;

    const stays = (d.stays || []).slice(0, 5).map(s => ({
      id: String(s._id), name: s.name, category: s.category, district: s.district,
      price: s.price ? `₹${s.price}` : null, priceProvenance: s.priceProvenance
    }));
    const activities = (d.activities || []).slice(0, 5).map(a => ({
      id: String(a._id), name: a.name, category: a.category,
      price: a.price ? `₹${a.price}` : null, priceProvenance: a.priceProvenance
    }));
    const places = (d.placesToVisit || []).slice(0, 6).map(p => ({
      id: String(p._id), name: p.name, category: p.category, distanceKm: p.distanceKm
    }));
    const matching = (d.matchingResults || []).slice(0, 6).map(m => ({
      id: String(m._id), name: m.name, category: m.category,
      price: m.price ? `₹${m.price}` : null, priceProvenance: m.priceProvenance,
      distanceKm: m.distanceKm || null
    }));

    if (session) {
      mergeAllowlist(session, {
        destinations: [String(dest._id)],
        stays: stays.map(s => s.id),
        activities: activities.map(a => a.id)
      });
    }

    return successResult({
      destination: d.destination?.name,
      district: d.destination?.district,
      availableCategories: d.availableCategories?.map(c => `${c.label} (${c.count})`) || [],
      activeInterest: interest || null,
      matchingResults: matching,
      emptyStateMessage: d.emptyStateMessage || null,
      placesCount: places.length,
      staysCount: stays.length
    }, "destination_discovery_engine", [
      { source: "Discovery Uttarakhand Verified Database", freshness: "VERIFIED" }
    ]);
  } catch (err) {
    return failureResult(`Failed to explore ${destName}: ${err.message}`, "EXPLORE_ERROR");
  }
}

async function _searchDestinations(args, session) {
  const limit = args.limit || 5;
  const query = {};
  if (args.query) query.$or = [{ name: new RegExp(args.query, "i") }, { description: new RegExp(args.query, "i") }];
  if (args.category) query.category = new RegExp(args.category, "i");
  if (args.district) query.district = new RegExp(args.district, "i");
  const dests = await withTimeout(Destination.find(query).limit(limit).lean(), TOOL_TIMEOUT_MS, "searchDestinations");
  if (!dests.length) return successResult({ destinations: [], message: "No destinations found for that query." });
  const results = dests.map(d => ({
    id: String(d._id), name: d.name, district: d.district, category: d.category,
    altitude: d.altitude, description: d.description ? String(d.description).slice(0, 300) : null,
    slug: d.slug, coordinates: d.location?.coordinates || null
  }));
  if (session) mergeAllowlist(session, { destinations: results.map(d => d.id) });
  return successResult({ destinations: results, count: results.length }, "verified_dataset",
    [{ source: "Discovery Uttarakhand Verified Dataset", freshness: "VERIFIED" }]);
}

async function _getRecommendations(args, session) {
  const recResult = await withTimeout(
    RecommendationEngine.getRecommendations({ destination: args.destination, interests: args.interests || [],
      budget: args.budget || "Balanced", pace: args.pace || "Balanced", travelers: args.travelers || 2 }),
    TOOL_TIMEOUT_MS, "getRecommendations");
  const data = recResult?.data || recResult || {};
  const stays = (data.stays || []).slice(0, 5).map(s => ({
    id: String(s._id || s.id), name: s.name, district: s.district, pricePerNight: s.pricePerNight || null,
    provenance: (s.isKMVN || s.isGMVN) ? "VERIFIED" : (s.pricePerNight ? "ESTIMATED" : "UNKNOWN")
  }));
  const activities = (data.activities || []).slice(0, 5).map(a => ({
    id: String(a._id || a.id), name: a.name, category: a.category, difficulty: a.difficulty
  }));
  const guides = (data.guides || []).slice(0, 5).map(g => ({
    id: String(g._id || g.id), name: g.name, specialty: g.specialties?.[0] || "General", verified: g.verifiedByGovt || false
  }));
  if (session) mergeAllowlist(session, { stays: stays.map(s => s.id), activities: activities.map(a => a.id), guides: guides.map(g => g.id) });
  return successResult({ stays, activities, guides }, "recommendation_engine",
    [{ source: "Discovery Uttarakhand Recommendation Engine", freshness: "VERIFIED" }]);
}

async function _calculateBudget(args) {
  const budgetResult = await withTimeout(
    BudgetEngine.calculateBudget({ durationDays: args.durationDays, travelersCount: args.travelers || 2,
      budgetPreference: args.budgetTier || "Balanced", stayIds: [], transportSegments: [] }),
    TOOL_TIMEOUT_MS, "calculateBudget");
  const data = budgetResult?.data || budgetResult || {};
  const summary = data.summary || data || {};
  return successResult({
    minCost: summary.minCost || null, maxCost: summary.maxCost || null,
    totalEstimatedCost: summary.totalEstimatedCost || null, budgetStatus: summary.budgetStatus || "NEAR_BUDGET",
    breakdown: { accommodation: summary.accommodationCost || null, transport: summary.transportCost || null,
      food: summary.foodCost || null, misc: summary.miscCost || null },
    assumptions: data.assumptions || [],
    provenance: { accommodation: "UNKNOWN", transport: "ESTIMATED", food: "ESTIMATED" }
  }, "budget_engine", [{ source: "Discovery Uttarakhand Budget Engine", freshness: "ESTIMATED" }]);
}

async function _planRoute(args) {
  const KNOWN = {
    "delhi":[77.209,28.6139],"dehradun":[78.0322,30.3165],"haridwar":[78.1642,29.9457],
    "rishikesh":[78.2676,30.0869],"nainital":[79.4636,29.3919],"mussoorie":[78.0648,30.4548],
    "kedarnath":[79.0669,30.7352],"badrinath":[79.4935,30.7433],"auli":[79.5616,30.5218],
    "gangotri":[79.0776,30.9953],"yamunotri":[78.4605,30.9657],"uttarkashi":[78.4354,30.7268],
    "almora":[79.6466,29.5971],"haldwani":[79.5130,29.2183],"pithoragarh":[80.2180,29.5832],
    "chamoli":[79.3214,30.3998],"lansdowne":[78.6869,29.8388],"chopta":[79.25,30.4167]
  };
  const fk = (args.from || "").toLowerCase().trim();
  const tk = (args.to || "").toLowerCase().trim();
  const fc = KNOWN[fk]; const tc = KNOWN[tk];
  if (!fc || !tc) {
    return successResult({
      from: args.from,
      to: args.to,
      routeAvailable: false,
      geometry: null,
      message: `Route details for ${args.from} to ${args.to} are not in the current road dataset. Consult official local maps.`,
      provenance: "UNKNOWN"
    }, "UNKNOWN");
  }

  // Attempt real OSRM driving calculation
  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fc[0]},${fc[1]};${tc[0]},${tc[1]}?overview=false`;
    const res = await withTimeout(fetch(osrmUrl).then(r => r.json()), 3000, "osrmRoute");
    if (res?.code === "Ok" && res.routes?.[0]) {
      const r = res.routes[0];
      const distKm = Math.round(r.distance / 1000);
      const hrs = Math.round((r.duration / 3600) * 10) / 10;
      return successResult({
        from: args.from,
        to: args.to,
        routeAvailable: true,
        estimatedDistanceKm: distKm,
        estimatedDurationHours: hrs,
        geometry: null, // strictly NO fake straight-line geometry
        provenance: "LIVE",
        note: "Verified OSRM driving route."
      }, "LIVE", [{ source: "OSRM Routing Engine", freshness: "LIVE" }]);
    }
  } catch {
    // OSRM failed or offline - do NOT fabricate straight-line geometry
  }

  return successResult({
    from: args.from,
    to: args.to,
    routeAvailable: false,
    geometry: null,
    message: `Live routing service unavailable for ${args.from} to ${args.to}. Check local road signages or transit desks.`,
    provenance: "UNAVAILABLE"
  }, "UNAVAILABLE");
}

async function _getItinerary(args, user) {
  if (!user) return failureResult("Authentication required", "AUTH_REQUIRED");
  const trip = await withTimeout(SavedTrip.findById(args.tripId).lean(), TOOL_TIMEOUT_MS, "getItinerary");
  if (!trip) return failureResult("Trip not found", "NOT_FOUND");
  if (String(trip.user) !== String(user._id)) return failureResult("Access denied", "FORBIDDEN");
  const itinerary = trip.generatedItinerary || [];
  if (!itinerary.length) return successResult({ tripId: String(trip._id), hasItinerary: false, message: "No itinerary generated yet." });
  let days = itinerary;
  if (args.day) { days = itinerary.filter(d => (d.dayNumber||d.day) === args.day); }
  const sanitizedDays = days.map(d => ({
    dayNumber: d.dayNumber || d.day, title: d.title, where: d.where || d.baseLocation, type: d.type,
    activities: (d.activities||[]).slice(0,5).map(a => ({ name: a.name||a, timing: a.timing||null })),
    stay: d.stay ? { name: d.stay.name, type: d.stay.propertyType||"Hotel" } : null,
    journeySegmentsCount: (d.journeySegments||[]).length
  }));
  return successResult({ tripId: String(trip._id), title: trip.title, totalDays: itinerary.length, days: sanitizedDays }, "saved_trip_itinerary");
}

async function _proposeModifyItinerary(args, user, session) {
  if (!user) return failureResult("Authentication required", "AUTH_REQUIRED");
  const SUPPORTED = ["replace_activity","remove_activity","reorder_day","update_pace"];
  if (!SUPPORTED.includes(args.operation)) return failureResult(`Unsupported operation. Supported: ${SUPPORTED.join(", ")}`, "INVALID_OP");
  if (args.removeCandidateId && session && !session.allowlist.activities.has(args.removeCandidateId))
    return failureResult("removeCandidateId not in trusted candidate list", "ALLOWLIST_VIOLATION");
  if (args.addCandidateId && session && !session.allowlist.activities.has(args.addCandidateId))
    return failureResult("addCandidateId not in trusted candidate list", "ALLOWLIST_VIOLATION");
  return { success: true, isProposal: true, requiresConfirmation: true,
    proposal: { tripId: args.tripId, operation: args.operation, day: args.day,
      removeCandidateId: args.removeCandidateId||null, addCandidateId: args.addCandidateId||null,
      reason: args.reason||"User requested modification" },
    message: `Proposed: ${args.operation} on Day ${args.day}. Awaiting user confirmation.`,
    timestamp: new Date().toISOString() };
}

async function _modifyTripPlan(args, session, user) {
  const currentEntities = session?.contextEntities || {};
  const tripId = args.payload?.tripId || session?.tripId;

  // If there's an authenticated user and saved trip, create a proposal requiring confirmation
  if (tripId && user && /^[0-9a-fA-F]{24}$/.test(tripId)) {
    return {
      success: true,
      isProposal: true,
      requiresConfirmation: true,
      proposal: {
        tripId,
        operation: args.mutationType,
        mutationType: args.mutationType,
        payload: args.payload,
        reason: args.reason || "User requested modification"
      },
      message: `Proposed ${args.mutationType} for your saved trip: ${args.reason || "Awaiting confirmation"}. Please confirm.`,
      status: "PENDING_CONFIRMATION",
      provenance: "GROUNDED",
      evidenceRefs: ["SavedTrip Mutation Policy"]
    };
  }

  // Transient conversational state mutation
  const result = await applyTripMutation(currentEntities, { type: args.mutationType, payload: args.payload }, { tripId: null, user: null });
  if (!result.success) {
    return failureResult(result.error || "Failed to apply trip modification", "MUTATION_FAILED");
  }

  // Sync back into session contextEntities
  if (session && session.contextEntities) {
    Object.assign(session.contextEntities, result.state);
  }

  return successResult({
    applied: true,
    mutationType: args.mutationType,
    updatedState: result.state,
    diff: result.diff,
    message: `Applied ${args.mutationType} successfully.`
  }, "GROUNDED", [{ source: "TripMutationService", freshness: "LIVE" }]);
}

async function _getWeather(args) {
  const COORDS = {
    "kedarnath":[30.7352,79.0669],"badrinath":[30.7433,79.4935],"rishikesh":[30.0869,78.2676],
    "haridwar":[29.9457,78.1642],"nainital":[29.3919,79.4636],"mussoorie":[30.4548,78.0648],
    "dehradun":[30.3165,78.0322],"auli":[30.5218,79.5616],"gangotri":[30.9953,79.0776],
    "uttarkashi":[30.7268,78.4354],"almora":[29.5971,79.6466],"pithoragarh":[29.5832,80.2180],
    "chopta":[30.4167,79.25],"lansdowne":[29.8388,78.6869]
  };
  let lat = args.lat; let lon = args.lon;
  if (!lat || !lon) {
    const k = (args.location||"").toLowerCase().trim();
    const c = COORDS[k]; if (c) { lat=c[0]; lon=c[1]; } else { lat=30.0869; lon=78.2676; }
  }
  try {
    const envelope = await withTimeout(WeatherAdapter.getWeather(lat, lon, { name: args.location }), TOOL_TIMEOUT_MS, "getWeather");
    return successResult({ location: args.location, status: envelope.status, data: envelope.data,
      observedAt: envelope.observedAt, provenance: envelope.status||"UNKNOWN" }, envelope.status||"UNKNOWN",
      [{ source: envelope.source||"Open-Meteo", freshness: envelope.status, url: "https://open-meteo.com" }]);
  } catch {
    return successResult({ location: args.location, status: "UNAVAILABLE", data: null,
      message: "Weather data currently unavailable. Check local sources.", provenance: "UNAVAILABLE" }, "UNAVAILABLE");
  }
}

async function _getRoadAdvisory(args) {
  const corridor = args.corridor || (args.origin && args.destination ? `${args.origin} -> ${args.destination}` : "General Uttarakhand");
  try {
    const envelope = await withTimeout(RoadAdvisoryAdapter.getAdvisory({ corridor }), TOOL_TIMEOUT_MS, "getRoadAdvisory");
    return successResult({ corridor, status: envelope.status, data: envelope.data,
      observedAt: envelope.observedAt, provenance: envelope.status||"UNKNOWN" }, envelope.status||"UNKNOWN",
      [{ source: envelope.source||"Uttarakhand Road Safety Department", freshness: envelope.status }]);
  } catch {
    return successResult({ corridor, status: "UNAVAILABLE", data: null,
      message: "Road advisory data currently unavailable.", provenance: "UNAVAILABLE" }, "UNAVAILABLE");
  }
}

async function _getTransitStatus(args) {
  try {
    const envelope = await withTimeout(
      TransitLiveAdapter.getTransitStatus({ origin: args.origin, destination: args.destination, mode: args.mode||"Bus" }),
      TOOL_TIMEOUT_MS, "getTransitStatus");
    return successResult({ origin: args.origin, destination: args.destination, mode: args.mode||"Bus",
      status: envelope.status, data: envelope.data, bookingPortal: envelope.data?.bookingPortal||null,
      provenance: envelope.status==="LIVE"?"LIVE":"UNKNOWN" }, envelope.status||"UNKNOWN",
      [{ source: envelope.source||"Official Booking Portal", freshness: envelope.status||"UNKNOWN" }]);
  } catch {
    return successResult({ origin: args.origin, destination: args.destination, status: "UNKNOWN", data: null,
      message: "Transit schedule not available. Visit UPSRTC or IRCTC official portals.", provenance: "UNKNOWN" }, "UNKNOWN");
  }
}

async function _findStays(args, session) {
  const limit = args.limit || 5;
  const destName = (args.destination || "").trim();

  // Resolve canonical destination info
  let targetDistrict = null;
  let canonicalSlug = null;
  const resolved = resolveDestination(destName);
  if (resolved) {
    targetDistrict = resolved.district;
    canonicalSlug = resolved.slug;
  }
  const destDoc = await Destination.findOne({
    $or: [
      { slug: destName.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
      { name: new RegExp(`^${destName}$`, "i") }
    ]
  }).lean();
  if (destDoc) {
    if (!targetDistrict && destDoc.district) targetDistrict = destDoc.district;
    canonicalSlug = destDoc.slug;
  }

  const stayQueryConditions = [];
  if (destName) {
    stayQueryConditions.push({ name: new RegExp(destName, "i") });
    stayQueryConditions.push({ city: new RegExp(destName, "i") });
  }
  if (targetDistrict) {
    stayQueryConditions.push({ district: new RegExp(targetDistrict, "i") });
  }

  // 1. Static Stays
  const staticStays = await withTimeout(
    Stay.find(stayQueryConditions.length > 0 ? { $or: stayQueryConditions } : {}).limit(limit).lean(),
    TOOL_TIMEOUT_MS,
    "findStays"
  );

  const results = staticStays.map(s => {
    const isGovt = s.isKMVN || s.isGMVN || (s.category && s.category.includes("Government"));
    return {
      id: String(s._id),
      name: s.name,
      district: s.district,
      propertyType: s.propertyType || s.category || "Hotel",
      pricePerNight: s.pricePerNight || s.price?.amount || null,
      isKMVN: s.isKMVN || false,
      isGMVN: s.isGMVN || false,
      provenance: isGovt ? "VERIFIED" : (s.pricePerNight ? "ESTIMATED" : "UNKNOWN"),
      provenanceLabel: isGovt ? "Verified government rest house" : (s.pricePerNight ? "Estimated catalog rate" : "Price not verified")
    };
  });

  // 2. Active Partner Stays
  try {
    const partnerConditions = [];
    if (canonicalSlug) partnerConditions.push({ destinationSlug: canonicalSlug });
    if (destName) {
      partnerConditions.push({ city: new RegExp(`^${destName}$`, "i") });
      partnerConditions.push({ locality: new RegExp(destName, "i") });
    }
    if (targetDistrict) {
      partnerConditions.push({ district: new RegExp(`^${targetDistrict}$`, "i") });
    }

    const partnerQuery = {
      listingType: "Stay",
      status: "ACTIVE",
      isActive: true,
      ...(partnerConditions.length > 0 ? { $or: partnerConditions } : {})
    };

    const partnerStays = await PartnerListing.find(partnerQuery)
      .limit(limit)
      .populate("partner", "businessName partnerType district city")
      .lean();

    for (const ps of partnerStays) {
      const isVerified = ps.pricing?.provenance === "VERIFIED";
      results.push({
        id: String(ps._id),
        name: ps.title,
        district: ps.district,
        city: ps.city || null,
        locality: ps.locality || null,
        propertyType: ps.category || "Partner Stay",
        pricePerNight: ps.pricing?.amount || null,
        provenance: isVerified ? "VERIFIED" : "PARTNER_CLAIMED",
        provenanceLabel: isVerified ? "Verified price" : "Partner-listed price (unverified)",
        source: "Partner Marketplace"
      });
    }
  } catch (pErr) {
    console.warn("[AgentTools] Partner stays query warning:", pErr.message);
  }

  // Deduplicate and cap
  const uniqueStays = Array.from(new Map(results.map(r => [r.id, r])).values()).slice(0, limit);

  if (session) mergeAllowlist(session, { stays: uniqueStays.map(s => s.id) });

  return successResult(
    { stays: uniqueStays, count: uniqueStays.length, destination: args.destination },
    "verified_dataset",
    [{ source: "Discovery Uttarakhand Stays & Partner Marketplace", freshness: "ACTIVE" }]
  );
}

async function _findRentals(args, session) {
  const limit = args.limit || 5;
  const destName = (args.destination || "").trim();

  let targetDistrict = null;
  const resolved = resolveDestination(destName);
  if (resolved && resolved.district) targetDistrict = resolved.district;

  const rentalQuery = {
    $or: [
      { district: new RegExp(destName, "i") },
      { city: new RegExp(destName, "i") }
    ]
  };
  if (targetDistrict) rentalQuery.$or.push({ district: new RegExp(targetDistrict, "i") });
  if (args.vehicleType) rentalQuery.vehicleType = new RegExp(args.vehicleType, "i");

  // 1. Static rentals
  const rentals = await withTimeout(Rental.find(rentalQuery).limit(limit).lean(), TOOL_TIMEOUT_MS, "findRentals");
  const results = rentals.map(r => ({
    id: String(r._id),
    name: r.name || r.vehicleName,
    vehicleType: r.vehicleType || r.category || "Vehicle",
    pricePerDay: r.pricePerDay || null,
    capacity: r.capacity || null,
    provenance: r.pricePerDay ? "ESTIMATED" : "UNKNOWN",
    provenanceLabel: r.pricePerDay ? "Estimated rate" : "Price not verified"
  }));

  // 2. Active Partner Rentals
  try {
    const pRentalQuery = {
      listingType: "Rental",
      status: "ACTIVE",
      isActive: true,
      $or: [
        { city: new RegExp(destName, "i") },
        { locality: new RegExp(destName, "i") },
        { "specifications.pickupLocation": new RegExp(destName, "i") }
      ]
    };
    if (targetDistrict) pRentalQuery.$or.push({ district: new RegExp(`^${targetDistrict}$`, "i") });

    const partnerRentals = await PartnerListing.find(pRentalQuery)
      .limit(limit)
      .populate("partner", "businessName partnerType district city")
      .lean();

    for (const pr of partnerRentals) {
      const isVerified = pr.pricing?.provenance === "VERIFIED";
      results.push({
        id: String(pr._id),
        name: pr.title,
        vehicleType: pr.specifications?.model ? `${pr.specifications.brand || ''} ${pr.specifications.model}`.trim() : (pr.category || "Rental"),
        pricePerDay: pr.pricing?.amount || null,
        pickupLocation: pr.specifications?.pickupLocation || pr.city || pr.district,
        provenance: isVerified ? "VERIFIED" : "PARTNER_CLAIMED",
        provenanceLabel: isVerified ? "Verified price" : "Partner-listed price (unverified)",
        source: "Partner Marketplace"
      });
    }
  } catch (prErr) {
    console.warn("[AgentTools] Partner rentals query warning:", prErr.message);
  }

  const uniqueRentals = Array.from(new Map(results.map(r => [r.id, r])).values()).slice(0, limit);
  if (session) mergeAllowlist(session, { rentals: uniqueRentals.map(r => r.id) });

  return successResult(
    { rentals: uniqueRentals, count: uniqueRentals.length },
    "verified_dataset",
    [{ source: "Discovery Uttarakhand Rentals & Partner Marketplace", freshness: "ACTIVE" }]
  );
}

async function _findGuides(args, session) {
  const limit = args.limit || 5;
  const destName = (args.destination || "").trim();

  let targetDistrict = null;
  const resolved = resolveDestination(destName);
  if (resolved && resolved.district) targetDistrict = resolved.district;

  const guideQuery = {
    $or: [
      { districts: new RegExp(destName, "i") },
      { location: new RegExp(destName, "i") }
    ]
  };
  if (targetDistrict) guideQuery.$or.push({ districts: new RegExp(targetDistrict, "i") });
  if (args.specialty) guideQuery.specialties = new RegExp(args.specialty, "i");

  const guides = await withTimeout(Guide.find(guideQuery).limit(limit).lean(), TOOL_TIMEOUT_MS, "findGuides");
  const results = guides.map(g => ({
    id: String(g._id),
    name: g.name,
    languages: g.languages || ["Hindi"],
    specialties: (g.specialties || []).slice(0, 3),
    experience: g.experience || null,
    verifiedByGovt: g.verifiedByGovt || false,
    provenance: g.verifiedByGovt ? "VERIFIED" : "ESTIMATED",
    provenanceLabel: g.verifiedByGovt ? "State Tourism Certified" : "Local mountain guide"
  }));

  // Active Partner Guides
  try {
    const pGuideQuery = {
      listingType: "Guide",
      status: "ACTIVE",
      isActive: true,
      $or: [
        { city: new RegExp(destName, "i") },
        { locality: new RegExp(destName, "i") }
      ]
    };
    if (targetDistrict) pGuideQuery.$or.push({ district: new RegExp(`^${targetDistrict}$`, "i") });

    const partnerGuides = await PartnerListing.find(pGuideQuery)
      .limit(limit)
      .populate("partner", "businessName partnerType district city")
      .lean();

    for (const pg of partnerGuides) {
      const isVerified = pg.pricing?.provenance === "VERIFIED";
      results.push({
        id: String(pg._id),
        name: pg.title,
        languages: pg.amenities || ["Hindi", "English"],
        specialties: [pg.category || "General Tour"],
        pricePerDay: pg.pricing?.amount || null,
        provenance: isVerified ? "VERIFIED" : "PARTNER_CLAIMED",
        provenanceLabel: isVerified ? "Verified guide fee" : "Partner-listed fee (unverified)",
        source: "Partner Marketplace"
      });
    }
  } catch (pgErr) {
    console.warn("[AgentTools] Partner guides query warning:", pgErr.message);
  }

  const uniqueGuides = Array.from(new Map(results.map(r => [r.id, r])).values()).slice(0, limit);
  if (session) mergeAllowlist(session, { guides: uniqueGuides.map(g => g.id) });

  return successResult(
    { guides: uniqueGuides, count: uniqueGuides.length },
    "verified_dataset",
    [{ source: "Uttarakhand Tourism Guide Platform & Partner Marketplace", freshness: "ACTIVE" }]
  );
}

async function _checkBookingEligibility(args, session) {
  if (!/^[0-9a-fA-F]{24}$/.test(args.listingId)) return failureResult("Invalid listing ID format", "INVALID_ID");
  const listing = await withTimeout(PartnerListing.findById(args.listingId).lean(), TOOL_TIMEOUT_MS, "checkBookingEligibility");
  if (!listing) return failureResult("Listing not found", "NOT_FOUND");
  const isActive = listing.status === "ACTIVE";
  const priceVerified = listing.pricing?.provenance === "VERIFIED" || listing.pricingVerificationStatus === "VERIFIED";
  const eligible = isActive && priceVerified;
  return successResult({
    listingId: String(listing._id), listingName: listing.name||listing.title, eligible,
    status: listing.status, priceVerificationStatus: listing.pricing?.provenance || "UNKNOWN",
    pricePerNight: priceVerified ? listing.pricing?.amount : null, currency: listing.pricing?.currency || "INR",
    eligibilityReason: !isActive ? "Listing is not currently active"
      : !priceVerified ? "Pricing not verified - booking unavailable until confirmed by admin"
      : "Listing active with verified pricing",
    provenance: priceVerified ? "VERIFIED" : (listing.pricing?.provenance || "UNKNOWN"),
    bookingAction: eligible ? "PROCEED_TO_BOOKING_FLOW" : "NOT_ELIGIBLE"
  }, priceVerified ? "VERIFIED" : (listing.pricing?.provenance || "UNKNOWN"));
}
