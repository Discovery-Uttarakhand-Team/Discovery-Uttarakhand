/**
 * Discovery Uttarakhand — Strict AI Context Builder
 * The single authoritative layer responsible for assembling bounded, sanitized,
 * and verified factual context for the AI Trip Planner reasoning engine.
 * 
 * Rules:
 * 1. Zero secrets, passwords, tokens, or PII exposed.
 * 2. Only bounded, relevant candidates (stays, guides, activities, transports) are supplied.
 * 3. Builds a strict Candidate-ID Allowlist for post-generation hallucination validation.
 * 4. Preserves immutable data provenance (STATIC_VERIFIED, ESTIMATED, UNKNOWN, LIVE).
 */

import Stay from '../models/Stay.js';
import Guide from '../models/Guide.js';
import Activity from '../models/Activity.js';
import Destination from '../models/Destination.js';
import Transport from '../models/Transport.js';
import { RecommendationEngine } from './recommendationService.js';
import { BudgetEngine } from './budgetEngine.js';
import AdvisoryEngine from './advisoryEngine.js';

export class AiContextBuilder {
  /**
   * Builds bounded factual context for a trip (saved or transient).
   * @param {Object} tripData Normalized trip object
   * @param {Object} [options]
   * @returns {Promise<{ context: Object, allowlist: Object }>}
   */
  static async buildContext(tripData, options = {}) {
    if (!tripData) {
      throw new Error('Trip data is required to build AI context');
    }

    // 1. Sanitize Trip Metadata
    const itinerary = (Array.isArray(tripData.generatedItinerary) && tripData.generatedItinerary.length > 0)
      ? tripData.generatedItinerary
      : (Array.isArray(tripData.dayPlans) && tripData.dayPlans.length > 0 ? tripData.dayPlans : []);

    const durationDays = itinerary.length > 0 
      ? itinerary.length 
      : Math.min(14, Math.max(1, parseInt(tripData.duration) || 7));

    const travelersCount = Math.min(20, Math.max(1, parseInt(tripData.travelers) || 2));
    const pace = ['Relaxed', 'Balanced', 'Fast'].includes(tripData.pace) ? tripData.pace : 'Balanced';
    const budgetTier = ['Budget', 'Balanced', 'Luxury'].includes(tripData.budget) ? tripData.budget : 'Balanced';

    const origin = {
      name: tripData.startingLocation?.name || 'Starting Point',
      coordinates: Array.isArray(tripData.startingLocation?.coordinates)
        ? [tripData.startingLocation.coordinates[0], tripData.startingLocation.coordinates[1]]
        : [30.3165, 78.0322]
    };

    // Primary destination resolution
    let destinationDoc = null;
    const destRef = Array.isArray(tripData.destinations) && tripData.destinations.length > 0
      ? tripData.destinations[0]
      : tripData.destination;

    if (destRef && (typeof destRef === 'string' || destRef._bsontype)) {
      destinationDoc = await Destination.findById(destRef).lean();
    } else if (destRef && destRef.name) {
      destinationDoc = destRef;
    }

    const destination = {
      id: destinationDoc?._id ? destinationDoc._id.toString() : 'dest-primary',
      name: destinationDoc?.name || tripData.title?.replace(/^My\s+|\s+Adventure$/gi, '') || 'Uttarakhand Destination',
      district: destinationDoc?.district || 'Garhwal/Kumaon',
      coordinates: destinationDoc?.coordinates || destinationDoc?.location?.coordinates || [30.0, 79.0],
      altitudeMeters: destinationDoc?.altitude || 2000,
      category: destinationDoc?.category || 'Nature'
    };

    // Sanitize user notes (limit to 500 chars to avoid prompt bloat/injection)
    const sanitizedNotes = tripData.notes 
      ? String(tripData.notes).slice(0, 500).replace(/[<>]/g, '') 
      : '';

    // 3. Extract Allowlist Sets
    const allowlist = {
      destinations: new Set([destination.id]),
      stays: new Set(),
      activities: new Set(),
      guides: new Set(),
      transports: new Set(),
      routeLegs: new Set()
    };

    // 4. Fetch Candidate Pool in proximity to destination / bases
    const destDistrict = destination.district || '';
    const [candidateStays, candidateGuides, candidateActivities, candidateTransports] = await Promise.all([
      Stay.find(
        destDistrict 
          ? { $or: [{ district: new RegExp(destDistrict, 'i') }, { isKMVN: true }, { isGMVN: true }] }
          : { $or: [{ isKMVN: true }, { isGMVN: true }] }
      ).limit(6).lean().catch(() => []),

      Guide.find(
        destDistrict 
          ? { location: new RegExp(destDistrict, 'i') } 
          : { available: true }
      ).limit(6).lean().catch(() => []),

      Activity.find(
        destDistrict 
          ? { district: new RegExp(destDistrict, 'i') } 
          : {}
      ).limit(8).lean().catch(() => []),

      Transport.find({ isActive: true }).limit(8).lean().catch(() => [])
    ]);

    // Populate candidate pool & allowlist
    const boundedCandidates = {
      stays: candidateStays.map(s => {
        const id = s._id.toString();
        allowlist.stays.add(id);
        return {
          id,
          name: s.name,
          propertyType: s.propertyType || 'Hotel',
          tariffPerNight: s.pricePerNight || (s.rooms && s.rooms[0]?.price) || null,
          provenance: (s.isKMVN || s.isGMVN) ? 'STATIC_VERIFIED' : (s.pricePerNight ? 'STATIC_VERIFIED' : 'UNKNOWN'),
          isGovernmentRestHouse: !!(s.isKMVN || s.isGMVN)
        };
      }),

      guides: candidateGuides.map(g => {
        const id = g._id.toString();
        allowlist.guides.add(id);
        return {
          id,
          name: g.name,
          languages: g.languages || ['Hindi', 'English'],
          dailyRate: g.pricePerDay || null,
          specialty: g.specialties?.[0] || 'Trek & Heritage',
          verifiedBadge: g.verified ? 'VERIFIED_LOCAL' : 'LOCAL'
        };
      }),

      activities: candidateActivities.map(a => {
        const id = a._id.toString();
        allowlist.activities.add(id);
        return {
          id,
          name: a.name,
          category: a.category || 'Sightseeing',
          durationHours: a.durationHours || 2,
          difficulty: a.difficulty || 'Easy',
          provenance: 'STATIC_VERIFIED'
        };
      }),

      transports: candidateTransports.map(t => {
        const id = t._id.toString();
        allowlist.transports.add(id);
        return {
          id,
          corridor: `${t.origin} → ${t.destination}`,
          mode: t.mode,
          operator: t.operator,
          fare: t.fareRange?.minFare || null,
          provenance: t.fareRange?.minFare ? 'STATIC_VERIFIED' : 'UNKNOWN'
        };
      })
    };

    // 5. Structure Itinerary Context Days & Journey Segments
    const itineraryContext = [];
    const numDays = itinerary.length > 0 ? itinerary.length : durationDays;

    for (let d = 0; d < numDays; d++) {
      const dayItem = itinerary[d] || {};
      const dayNum = d + 1;
      const legId = `leg-day-${dayNum}`;
      allowlist.routeLegs.add(legId);

      // Check if day has a selected stay
      let stayRef = null;
      if (dayItem.stay && dayItem.stay.name) {
        const matchingStay = candidateStays.find(s => s.name === dayItem.stay.name) || dayItem.stay;
        const sId = matchingStay._id ? matchingStay._id.toString() : `stay-day-${dayNum}`;
        allowlist.stays.add(sId);
        stayRef = {
          stayId: sId,
          name: matchingStay.name,
          propertyType: matchingStay.propertyType || 'Tourist Lodge',
          tariffPerNight: matchingStay.pricePerNight || matchingStay.tariff || null,
          provenance: matchingStay.isKMVN ? 'STATIC_VERIFIED' : (matchingStay.pricePerNight ? 'STATIC_VERIFIED' : 'UNKNOWN')
        };
      }

      // Check journey segments
      const segments = Array.isArray(dayItem.journeySegments) ? dayItem.journeySegments : (dayItem.transportSegment ? [dayItem.transportSegment] : []);
      const sanitizedSegments = segments.map((seg, sIdx) => {
        const segId = `seg-d${dayNum}-${sIdx + 1}`;
        return {
          segmentId: segId,
          mode: seg.mode || tripData.transport || 'Road',
          from: seg.from || (d === 0 ? origin.name : destination.name),
          to: seg.to || destination.name,
          operator: seg.operator || 'Local Mountain Taxi / Bus',
          fare: seg.fare || null,
          provenance: seg.isVerified ? 'STATIC_VERIFIED' : (seg.fare ? 'ESTIMATED' : 'UNKNOWN'),
          bookingType: seg.bookingType || 'COUNTER_ONLY'
        };
      });

      itineraryContext.push({
        dayNumber: dayNum,
        base: {
          name: dayItem.where || (d === 0 ? origin.name : destination.name),
          district: destination.district
        },
        dayType: dayItem.type || (d === 0 ? 'transit' : d === numDays - 1 ? 'return' : 'exploration'),
        where: dayItem.where || destination.name,
        routeLeg: {
          legId,
          from: d === 0 ? origin.name : destination.name,
          to: destination.name,
          distanceKm: dayItem.distanceKm || (tripData.routeData?.totalDistanceKm ? Math.round(tripData.routeData.totalDistanceKm / numDays) : 60),
          durationHours: dayItem.driveTimeHours || 3,
          isRoadRoute: true,
          provenance: 'STATIC_VERIFIED'
        },
        journeySegments: sanitizedSegments,
        selectedStayCandidate: stayRef
      });
    }

    // 6. Calculate or Include Authoritative Budget Context
    let budgetSummary = null;
    try {
      const stayIds = Array.from(allowlist.stays).filter(id => id.match(/^[0-9a-fA-F]{24}$/));
      const transportSegments = itineraryContext.flatMap(d => d.journeySegments);

      const bRes = await BudgetEngine.calculateBudget({
        durationDays: numDays,
        travelersCount,
        budgetPreference: budgetTier,
        stayIds,
        transportSegments,
        guideDays: itineraryContext.filter(d => d.dayType === 'trek').length
      });

      const bData = (bRes && bRes.data) ? bRes.data : bRes;
      const bSum = (bData && bData.summary) ? bData.summary : bData;

      budgetSummary = {
        knownCost: bSum?.totalKnownCost || 0,
        estimatedCost: bSum?.totalEstimatedCost || 0,
        unknownCost: bSum?.hasUnknownCosts ? 1 : 0,
        minCost: bSum?.minCost || (1500 * numDays * travelersCount),
        maxCost: bSum?.maxCost || (4000 * numDays * travelersCount),
        totalEstimatedCost: bSum?.totalEstimatedCost || (2500 * numDays * travelersCount),
        budgetStatus: bSum?.budgetStatus || 'NEAR_BUDGET',
        assumptions: bData?.assumptions || [],
        provenance: { stays: 'UNKNOWN', transport: 'UNKNOWN', food: 'ESTIMATED' }
      };
    } catch (err) {
      // Fallback budget structure if budget engine cannot run
      budgetSummary = {
        knownCost: 0,
        estimatedCost: 15000 * travelersCount,
        unknownCost: 2000,
        minCost: 12000 * travelersCount,
        maxCost: 22000 * travelersCount,
        totalEstimatedCost: 17000 * travelersCount,
        budgetStatus: 'NEAR_BUDGET',
        assumptions: ['Default approximation based on duration and travelers'],
        provenance: { stays: 'UNKNOWN', transport: 'UNKNOWN', food: 'ESTIMATED' }
      };
    }

    // 7. Mountain Constraints & Hazards
    const mountainHazards = [
      'Night driving on high mountain passes (beyond 5:30 PM in winter/monsoon) is prohibited for safety.',
      'High altitude (>2,500m) requires daytime hydration and adequate acclimatization before physical exertion.',
      'Monsoon season (July-August) causes localized landslides; monitor local Uttarakhand disaster management updates.'
    ];

    let liveAdvisories = [];
    try {
      if (options.includeLiveAdvisories) {
        const evalResult = await AdvisoryEngine.evaluateTrip(tripData);
        if (evalResult && Array.isArray(evalResult.advisories)) {
          liveAdvisories = evalResult.advisories.map(a => `[${a.severity}] ${a.title}: ${a.message}`);
        }
      }
    } catch (err) {
      // Graceful fallback: live advisory failure does not break AI context
    }

    const context = {
      tripMetadata: {
        tripId: tripData._id ? tripData._id.toString() : undefined,
        title: tripData.title || `Trip to ${destination.name}`,
        origin,
        destination,
        durationDays: numDays,
        travelersCount,
        pace,
        budgetTier,
        tripType: tripData.tripType || ['Nature'],
        interests: tripData.interests || [],
        notes: sanitizedNotes
      },
      itineraryContext,
      candidatePool: boundedCandidates,
      budgetSummary,
      knownConstraints: {
        mountainHazards,
        liveAdvisories,
        paceLimitsKmPerDay: pace === 'Relaxed' ? 40 : pace === 'Balanced' ? 75 : 110,
        curfews: ['No mountain transit after 6:00 PM on high ghat roads']
      }
    };

    return { context, allowlist };
  }
}
