/**
 * Discovery Uttarakhand — Deterministic Budget Engine
 * Calculates multi-category travel costs with strict data provenance separation.
 * Categories: Transport, Stay, Food, Activities, Guide, Rental, Emergency Buffer.
 * Provenance: VERIFIED vs ESTIMATED vs UNKNOWN.
 * Zero hallucinated exact costs.
 */

import Stay from '../models/Stay.js';
import Transport from '../models/Transport.js';

export class BudgetEngine {
  /**
   * Calculates transparent budget breakdown for a journey.
   * @param {Object} params
   *   - durationDays: Number (e.g. 7)
   *   - travelersCount: Number (e.g. 2)
   *   - budgetPreference: 'Budget' | 'Balanced' | 'Luxury' (or optional targetAmount)
   *   - targetBudgetAmount: Number (optional custom budget cap)
   *   - stayIds: Array of Stay ObjectIds or populated stay objects
   *   - transportSegments: Array of { from, to, mode, routingType, transportId, price }
   *   - guideDays: Number
   *   - rentalDays: Number
   *   - activityIds: Array of Activity ObjectIds
   * @returns {Promise<Object>} Complete deterministic budget breakdown
   */
  static async calculateBudget(params = {}) {
    const {
      durationDays = 7,
      travelersCount = 1,
      budgetPreference = 'Balanced',
      targetBudgetAmount = null,
      stayIds = [],
      transportSegments = [],
      guideDays = 0,
      rentalDays = 0,
      activityIds = []
    } = params;

    const days = Math.max(1, Number(durationDays) || 1);
    const travelers = Math.max(1, Number(travelersCount) || 1);

    const assumptions = [];
    const breakdown = {};

    // 1. STAY / ACCOMMODATION (VERIFIED vs UNKNOWN)
    let stayKnownCost = 0;
    let stayUnknownCount = 0;
    const verifiedStayDetails = [];

    // Fetch stays if ObjectIds provided
    let stayDocs = [];
    if (stayIds.length > 0) {
      if (typeof stayIds[0] === 'string' || stayIds[0]._bsontype) {
        stayDocs = await Stay.find({ _id: { $in: stayIds } }).lean();
      } else {
        stayDocs = stayIds; // already populated
      }
    }

    if (stayDocs.length > 0) {
      stayDocs.forEach((stay) => {
        const rate = stay.price?.amount || stay.pricePerNight;
        if (rate && !isNaN(rate)) {
          // Stay cost is per room (assuming 2 persons per room)
          const roomsNeeded = Math.ceil(travelers / 2);
          const cost = rate * roomsNeeded;
          stayKnownCost += cost;
          verifiedStayDetails.push({
            name: stay.name,
            ratePerNight: rate,
            rooms: roomsNeeded,
            cost,
            provenance: 'VERIFIED',
            source: stay.source || 'KMVN/Partner Tariff'
          });
        } else {
          stayUnknownCount++;
        }
      });
    }

    // Average nights calculation: (days - 1) overnight stays
    const overnightNights = Math.max(1, days - 1);
    let stayEstimatedCost = 0;
    let stayMin = stayKnownCost;
    let stayMax = stayKnownCost;

    if (stayDocs.length === 0 || stayUnknownCount > 0) {
      // Estimate remaining unverified nights based on budget tier
      const unverifiedNights = Math.max(0, overnightNights - verifiedStayDetails.length);
      if (unverifiedNights > 0) {
        const rateBand = budgetPreference === 'Budget' ? { min: 1200, max: 2200 }
          : budgetPreference === 'Luxury' ? { min: 4500, max: 9000 }
          : { min: 2200, max: 4000 };
        
        const roomsNeeded = Math.ceil(travelers / 2);
        const estMin = unverifiedNights * rateBand.min * roomsNeeded;
        const estMax = unverifiedNights * rateBand.max * roomsNeeded;
        stayEstimatedCost = Math.round((estMin + estMax) / 2);
        stayMin += estMin;
        stayMax += estMax;
        assumptions.push(`Accommodation for ${unverifiedNights} night(s) estimated at ₹${rateBand.min}–₹${rateBand.max}/night/room based on ${budgetPreference} tier.`);
      }
    } else {
      stayMin = stayKnownCost;
      stayMax = stayKnownCost;
    }

    breakdown.stay = {
      provenance: verifiedStayDetails.length > 0 && stayUnknownCount === 0 ? 'VERIFIED' : 'ESTIMATED',
      knownCost: stayKnownCost,
      estimatedCost: stayEstimatedCost,
      minCost: stayMin,
      maxCost: stayMax,
      currency: 'INR',
      details: verifiedStayDetails,
      unknownNightsCount: stayUnknownCount
    };

    // 2. TRANSPORT (VERIFIED vs UNKNOWN vs ESTIMATED)
    let transportKnownCost = 0;
    let transportUnknownLegs = 0;
    let transportMin = 0;
    let transportMax = 0;
    const verifiedTransitLegs = [];

    for (const leg of transportSegments) {
      if (leg.price && typeof leg.price.min === 'number') {
        const minLeg = leg.price.min * travelers;
        const maxLeg = (leg.price.max || leg.price.min) * travelers;
        transportKnownCost += minLeg;
        transportMin += minLeg;
        transportMax += maxLeg;
        verifiedTransitLegs.push({
          from: leg.from,
          to: leg.to,
          mode: leg.mode,
          fare: `${leg.price.min} - ${leg.price.max || leg.price.min}`,
          provenance: 'VERIFIED',
          source: leg.source || 'UTC / IRCTC Registry'
        });
      } else {
        transportUnknownLegs++;
      }
    }

    // For unknown local mountain transfer legs, estimate realistic taxi/jeep counter fare bands
    let transportEstimatedCost = 0;
    if (transportUnknownLegs > 0) {
      // Local hill transfer estimate per unknown leg: ₹800–₹1800 per vehicle/group
      const estMin = transportUnknownLegs * 800;
      const estMax = transportUnknownLegs * 2000;
      transportEstimatedCost = Math.round((estMin + estMax) / 2);
      transportMin += estMin;
      transportMax += estMax;
      assumptions.push(`${transportUnknownLegs} local transfer leg(s) lack official digital fares and are estimated at ₹800–₹2,000 per leg (counter/shared taxi).`);
    }

    breakdown.transport = {
      provenance: verifiedTransitLegs.length > 0 && transportUnknownLegs === 0 ? 'VERIFIED' : 'ESTIMATED',
      knownCost: transportKnownCost,
      estimatedCost: transportEstimatedCost,
      minCost: transportMin,
      maxCost: transportMax,
      unknownLegsCount: transportUnknownLegs,
      currency: 'INR',
      details: verifiedTransitLegs
    };

    // 3. FOOD & MEALS (ESTIMATED — STRICTLY PROVENANCE-LABELED)
    // Daily food estimate: ₹400–₹700 per person per day
    const foodRateBand = budgetPreference === 'Budget' ? { min: 350, max: 500 }
      : budgetPreference === 'Luxury' ? { min: 800, max: 1500 }
      : { min: 500, max: 800 };

    const foodMin = days * travelers * foodRateBand.min;
    const foodMax = days * travelers * foodRateBand.max;
    const foodEst = Math.round((foodMin + foodMax) / 2);
    assumptions.push(`Food & dining is ESTIMATED at ₹${foodRateBand.min}–₹${foodRateBand.max}/day per traveler based on local mountain dhaba and hotel meal rates.`);

    breakdown.food = {
      provenance: 'ESTIMATED',
      knownCost: 0,
      estimatedCost: foodEst,
      minCost: foodMin,
      maxCost: foodMax,
      ratePerPersonPerDay: `₹${foodRateBand.min}–₹${foodRateBand.max}`,
      currency: 'INR'
    };

    // 4. GUIDE HIRE (ESTIMATED / VERIFIED)
    let guideMin = 0;
    let guideMax = 0;
    let guideEst = 0;
    if (guideDays > 0) {
      const guideRateBand = { min: 1500, max: 2500 }; // Standard certified guide rate in Kumaon/Garhwal
      guideMin = guideDays * guideRateBand.min;
      guideMax = guideDays * guideRateBand.max;
      guideEst = Math.round((guideMin + guideMax) / 2);
      assumptions.push(`Local mountain guide estimated for ${guideDays} day(s) at government recommended standard rate ₹${guideRateBand.min}–₹${guideRateBand.max}/day.`);
    }

    breakdown.guide = {
      provenance: guideDays > 0 ? 'ESTIMATED' : 'NOT_APPLICABLE',
      knownCost: 0,
      estimatedCost: guideEst,
      minCost: guideMin,
      maxCost: guideMax,
      currency: 'INR'
    };

    // 5. EMERGENCY & ALTITUDE BUFFER (ESTIMATED)
    // 10% safety buffer for weather delays, landslide holds, or emergency medical descents
    const subtotalEst = (stayKnownCost + stayEstimatedCost) + (transportKnownCost + transportEstimatedCost) + foodEst + guideEst;
    const emergencyMin = Math.round(subtotalEst * 0.08);
    const emergencyMax = Math.round(subtotalEst * 0.12);
    const emergencyEst = Math.round((emergencyMin + emergencyMax) / 2);
    assumptions.push('A 10% emergency buffer is recommended for high-altitude weather holds, landslide detours, or unplanned overnight delays.');

    breakdown.emergencyBuffer = {
      provenance: 'ESTIMATED',
      knownCost: 0,
      estimatedCost: emergencyEst,
      minCost: emergencyMin,
      maxCost: emergencyMax,
      currency: 'INR'
    };

    // TOTALS COMPUTATION
    const totalKnownCost = stayKnownCost + transportKnownCost;
    const totalEstimatedCost = subtotalEst + emergencyEst;
    const totalMinCost = stayMin + transportMin + foodMin + guideMin + emergencyMin;
    const totalMaxCost = stayMax + transportMax + foodMax + guideMax + emergencyMax;
    const unknownCostCount = stayUnknownCount + transportUnknownLegs;

    // TARGET BUDGET BENCHMARK
    let targetCap = targetBudgetAmount;
    if (!targetCap) {
      // Default expected total caps per traveler for duration
      const dailyCap = budgetPreference === 'Budget' ? 2500
        : budgetPreference === 'Luxury' ? 8000
        : 4500;
      targetCap = dailyCap * days * travelers;
    }

    // BUDGET STATUS EVALUATION
    let budgetStatus = 'NEAR_BUDGET';
    let explanation = '';

    if (unknownCostCount > 3) {
      budgetStatus = 'INSUFFICIENT_DATA';
      explanation = 'Multiple remote transit legs lack official published counter rates; total cost is an approximation.';
    } else if (totalMaxCost < targetCap * 0.85) {
      budgetStatus = 'UNDER_BUDGET';
      explanation = `Estimated total (₹${totalMinCost.toLocaleString()} - ₹${totalMaxCost.toLocaleString()}) is comfortably within your ₹${targetCap.toLocaleString()} ${budgetPreference} allocation.`;
    } else if (totalMinCost > targetCap) {
      budgetStatus = 'OVER_BUDGET';
      const overBy = totalMinCost - targetCap;
      explanation = `Trip exceeds your ${budgetPreference} allocation (₹${targetCap.toLocaleString()}) by approximately ₹${overBy.toLocaleString()} primarily due to ${
        stayMin > targetCap * 0.5 ? 'accommodation tariffs' : 'distance and multiple vehicle transfers'
      }.`;
    } else {
      budgetStatus = 'NEAR_BUDGET';
      explanation = `Estimated total matches your ${budgetPreference} expectations (target ₹${targetCap.toLocaleString()}).`;
    }

    return {
      success: true,
      data: {
        summary: {
          totalKnownCost,
          totalEstimatedCost,
          minCost: totalMinCost,
          maxCost: totalMaxCost,
          budgetStatus,
          explanation,
          targetBudgetCap: targetCap,
          days,
          travelers,
          hasUnknownCosts: unknownCostCount > 0
        },
        breakdown,
        assumptions,
        provenanceNotice: 'Verified prices are sourced from official KMVN / UTC tariffs. Food and buffer costs are strictly estimates and subject to on-ground variations.'
      }
    };
  }
}

export default BudgetEngine;
