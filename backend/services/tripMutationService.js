/**
 * Discovery Uttarakhand - Trip Mutation Service
 * Strict deterministic state mutation layer.
 * LLMs propose structured changes; this service validates and applies them deterministically.
 */
import SavedTrip from '../models/SavedTrip.js';

export const VALID_TRANSPORTS = ['cab', 'taxi', 'bus', 'tempo', 'self-drive', 'train', 'flight', 'shared-jeep'];
export const VALID_BUDGET_TIERS = ['Budget', 'Balanced', 'Luxury'];

/**
 * Validates and recalculates budget metrics
 */
export function recalculateBudget(budgetAmount, durationDays = 3, travelers = 2) {
  const total = Math.max(1000, Number(budgetAmount) || 10000);
  const days = Math.max(1, Number(durationDays) || 1);
  const people = Math.max(1, Number(travelers) || 1);

  const perPerson = Math.round(total / people);
  const perDay = Math.round(total / days);
  const perPersonPerDay = Math.round(total / (people * days));

  let tier = 'Balanced';
  if (perPersonPerDay < 1800) tier = 'Budget';
  else if (perPersonPerDay > 5000) tier = 'Luxury';

  return {
    totalEstimatedCost: total,
    budgetTier: tier,
    perPerson,
    perDay,
    breakdown: {
      accommodation: Math.round(total * 0.40),
      transport: Math.round(total * 0.30),
      food: Math.round(total * 0.20),
      activitiesAndBuffer: Math.round(total * 0.10)
    }
  };
}

/**
 * Apply deterministic mutation to in-memory state or DB SavedTrip
 * @param {Object} state - Current trip state or session contextEntities
 * @param {Object} mutation - { type, payload }
 * @param {Object} [options] - { tripId, user }
 * @returns {Promise<{ success: boolean, state: Object, diff: Object, error?: string }>}
 */
export async function applyTripMutation(state, mutation, options = {}) {
  if (!state || typeof state !== 'object') {
    return { success: false, state, diff: null, error: "Invalid state object" };
  }
  if (!mutation || !mutation.type) {
    return { success: false, state, diff: null, error: "Mutation type is required" };
  }

  const workingState = JSON.parse(JSON.stringify(state));
  const mutationType = mutation.type.toUpperCase();
  const payload = mutation.payload || {};
  let diff = { mutationType, fieldsChanged: [], before: {}, after: {} };

  try {
    switch (mutationType) {
      case 'SET_BUDGET':
      case 'UPDATE_BUDGET': {
        const rawBudget = payload.budget || payload.amount || payload.value;
        const newBudget = Number(String(rawBudget).replace(/[^0-9]/g, ''));
        if (isNaN(newBudget) || newBudget < 500 || newBudget > 2000000) {
          return { success: false, state, diff: null, error: `Invalid budget amount: ${rawBudget}` };
        }
        diff.before.budget = workingState.budget;
        diff.fieldsChanged.push('budget');
        workingState.budget = newBudget;

        const dur = workingState.durationDays || workingState.duration || 3;
        const trav = workingState.travelers || 2;
        const recalc = recalculateBudget(newBudget, dur, trav);
        workingState.budgetSummary = recalc;
        workingState.budgetTier = recalc.budgetTier;
        diff.after.budget = newBudget;
        diff.after.budgetSummary = recalc;
        break;
      }

      case 'UPDATE_DURATION': {
        const rawDays = payload.durationDays || payload.days || payload.duration || payload.value;
        const days = parseInt(String(rawDays).replace(/[^0-9]/g, ''), 10);
        if (isNaN(days) || days < 1 || days > 30) {
          return { success: false, state, diff: null, error: `Duration must be between 1 and 30 days: got ${rawDays}` };
        }
        diff.before.durationDays = workingState.durationDays || workingState.duration;
        diff.fieldsChanged.push('durationDays');
        workingState.durationDays = days;
        workingState.duration = `${days} Days`;

        // If generatedItinerary is present, adjust days
        if (Array.isArray(workingState.generatedItinerary)) {
          const currentLen = workingState.generatedItinerary.length;
          if (days < currentLen) {
            workingState.generatedItinerary = workingState.generatedItinerary.slice(0, days);
          } else if (days > currentLen) {
            for (let d = currentLen + 1; d <= days; d++) {
              workingState.generatedItinerary.push({
                day: d,
                title: `Day ${d} Exploration`,
                activities: [],
                notes: "Open for scenic exploration or relaxation."
              });
            }
          }
        }

        if (workingState.budget) {
          workingState.budgetSummary = recalculateBudget(workingState.budget, days, workingState.travelers || 2);
        }
        diff.after.durationDays = days;
        break;
      }

      case 'UPDATE_TRAVELERS': {
        const rawTrav = payload.travelers || payload.count || payload.value;
        const trav = parseInt(String(rawTrav).replace(/[^0-9]/g, ''), 10);
        if (isNaN(trav) || trav < 1 || trav > 50) {
          return { success: false, state, diff: null, error: `Travelers must be between 1 and 50: got ${rawTrav}` };
        }
        diff.before.travelers = workingState.travelers;
        diff.fieldsChanged.push('travelers');
        workingState.travelers = trav;

        if (workingState.budget) {
          workingState.budgetSummary = recalculateBudget(workingState.budget, workingState.durationDays || 3, trav);
        }
        diff.after.travelers = trav;
        break;
      }

      case 'UPDATE_TRANSPORT':
      case 'CHANGE_TRANSPORT': {
        const rawTransport = String(payload.transport || payload.mode || payload.value || '').toLowerCase().trim();
        const matched = VALID_TRANSPORTS.find(t => rawTransport.includes(t)) || 'cab';
        diff.before.transport = workingState.transport;
        diff.fieldsChanged.push('transport');
        workingState.transport = matched;
        diff.after.transport = matched;
        break;
      }

      case 'ADD_ACTIVITY': {
        const dayNum = parseInt(payload.day, 10) || 1;
        const activity = payload.activity || { name: payload.name || "Scenic Sightseeing", category: payload.category || "Sightseeing" };
        diff.before.itineraryLength = Array.isArray(workingState.generatedItinerary) ? workingState.generatedItinerary.length : 0;
        diff.fieldsChanged.push('generatedItinerary');

        if (!Array.isArray(workingState.generatedItinerary)) {
          workingState.generatedItinerary = [];
        }

        let targetDay = workingState.generatedItinerary.find(d => d.day === dayNum);
        if (!targetDay) {
          targetDay = { day: dayNum, title: `Day ${dayNum} Itinerary`, activities: [] };
          workingState.generatedItinerary.push(targetDay);
          workingState.generatedItinerary.sort((a, b) => a.day - b.day);
        }

        if (!Array.isArray(targetDay.activities)) targetDay.activities = [];
        targetDay.activities.push(activity);
        diff.after.addedActivity = activity;
        diff.after.day = dayNum;
        break;
      }

      case 'REMOVE_ACTIVITY': {
        const dayNum = parseInt(payload.day, 10);
        const nameToRemove = String(payload.activityName || payload.name || '').toLowerCase().trim();
        diff.fieldsChanged.push('generatedItinerary');

        if (Array.isArray(workingState.generatedItinerary)) {
          for (const day of workingState.generatedItinerary) {
            if (!dayNum || day.day === dayNum) {
              if (Array.isArray(day.activities)) {
                day.activities = day.activities.filter(a => {
                  const aName = typeof a === 'string' ? a : (a.name || '');
                  return !aName.toLowerCase().includes(nameToRemove);
                });
              }
            }
          }
        }
        diff.after.removedActivity = nameToRemove;
        break;
      }

      case 'REPLACE_STAY': {
        const dayNum = parseInt(payload.day, 10) || 1;
        const newStay = payload.stay || { name: payload.name || "Verified Himalayan Stay" };
        diff.fieldsChanged.push('stays');

        if (!Array.isArray(workingState.stays)) workingState.stays = [];
        workingState.stays = workingState.stays.filter(s => (s.day || 1) !== dayNum);
        workingState.stays.push({ day: dayNum, ...newStay });
        diff.after.replacedStay = newStay;
        break;
      }

      case 'MOVE_ACTIVITY': {
        const fromDay = parseInt(payload.fromDay, 10);
        const toDay = parseInt(payload.toDay, 10);
        const actName = String(payload.activityName || payload.name || '').toLowerCase();

        if (!fromDay || !toDay || isNaN(fromDay) || isNaN(toDay)) {
          return { success: false, state, diff: null, error: "fromDay and toDay are required integers" };
        }
        diff.fieldsChanged.push('generatedItinerary');

        let movedItem = null;
        if (Array.isArray(workingState.generatedItinerary)) {
          const src = workingState.generatedItinerary.find(d => d.day === fromDay);
          if (src && Array.isArray(src.activities)) {
            const idx = src.activities.findIndex(a => {
              const aName = typeof a === 'string' ? a : (a.name || '');
              return aName.toLowerCase().includes(actName);
            });
            if (idx >= 0) {
              movedItem = src.activities.splice(idx, 1)[0];
            }
          }

          if (movedItem) {
            let dst = workingState.generatedItinerary.find(d => d.day === toDay);
            if (!dst) {
              dst = { day: toDay, title: `Day ${toDay}`, activities: [] };
              workingState.generatedItinerary.push(dst);
              workingState.generatedItinerary.sort((a, b) => a.day - b.day);
            }
            if (!Array.isArray(dst.activities)) dst.activities = [];
            dst.activities.push(movedItem);
          }
        }
        diff.after.movedItem = movedItem;
        break;
      }

      case 'ADD_DESTINATION': {
        const dest = payload.destination || payload.name;
        if (!dest) return { success: false, state, diff: null, error: "Destination name is required" };
        if (!Array.isArray(workingState.stops)) workingState.stops = workingState.destination ? [workingState.destination] : [];
        if (!workingState.stops.includes(dest)) workingState.stops.push(dest);
        diff.fieldsChanged.push('stops');
        diff.after.stops = workingState.stops;
        break;
      }

      case 'REMOVE_DESTINATION': {
        const dest = payload.destination || payload.name;
        if (!dest) return { success: false, state, diff: null, error: "Destination name is required" };
        if (Array.isArray(workingState.stops)) {
          workingState.stops = workingState.stops.filter(s => s.toLowerCase() !== dest.toLowerCase());
        }
        diff.fieldsChanged.push('stops');
        diff.after.stops = workingState.stops;
        break;
      }

      case 'SWAP_STOPS': {
        const { index1 = 0, index2 = 1 } = payload;
        if (!Array.isArray(workingState.stops) || workingState.stops.length < 2) {
          return { success: false, state, diff: null, error: "At least 2 stops required to swap" };
        }
        const temp = workingState.stops[index1];
        workingState.stops[index1] = workingState.stops[index2];
        workingState.stops[index2] = temp;
        diff.fieldsChanged.push('stops');
        diff.after.stops = workingState.stops;
        break;
      }

      default:
        return { success: false, state, diff: null, error: `Unknown mutation type: ${mutationType}` };
    }

    // Persist to SavedTrip if options.tripId exists and is valid
    if (options.tripId && options.user && /^[0-9a-fA-F]{24}$/.test(options.tripId)) {
      try {
        const updateDoc = {};
        if (workingState.budget) updateDoc.budget = String(workingState.budget);
        if (workingState.duration) updateDoc.duration = String(workingState.duration);
        if (workingState.travelers) updateDoc.travelers = String(workingState.travelers);
        if (workingState.transport) updateDoc.transport = String(workingState.transport);
        if (workingState.generatedItinerary) updateDoc.generatedItinerary = workingState.generatedItinerary;

        await SavedTrip.updateOne(
          { _id: options.tripId, user: options.user._id },
          { $set: updateDoc }
        );
      } catch (dbErr) {
        console.error("[TripMutationService] DB update warning:", dbErr.message);
      }
    }

    return {
      success: true,
      state: workingState,
      diff
    };
  } catch (err) {
    return {
      success: false,
      state,
      diff: null,
      error: err.message
    };
  }
}

export default {
  applyTripMutation,
  recalculateBudget,
  VALID_TRANSPORTS,
  VALID_BUDGET_TIERS
};
