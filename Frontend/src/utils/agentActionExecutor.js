/**
 * Discovery Uttarakhand - Agentic UI Action Executor
 *
 * Safe Action Registry & Execution Layer.
 * Validates action type, arguments, routes, entities, and stale request IDs before execution.
 *
 * CRITICAL SECURITY & STABILITY RULES:
 * 1. ZERO arbitrary code execution (eval, new Function, RUN_JS, EXECUTE_CODE rejected).
 * 2. ZERO arbitrary URLs (javascript:, data:, external domains rejected).
 * 3. Strict allowlist for actions and routes.
 * 4. Stale action protection via active requestId validation.
 * 5. Two-way synchronization via canonical useMapStore.
 */
import { useMapStore } from '../store/mapStore';
import { normalizeLocationValue } from './locationHelpers';

// Allowed Route Keys to Safe Application Routes
export const ALLOWED_ROUTE_MAP = {
  TRIP_PLANNER: '/trip-planner',
  MAP: '/map',
  STAYS: '/stays',
  RENTALS: '/rentals',
  GUIDES: '/guides',
  ACTIVITIES: '/activities',
  SPIRITUAL: '/spiritual',
  CULTURE: '/culture',
  MY_TRIP: '/my-trip',
  HOME: '/'
};

// Explicit relative route allowlist regexes
const ALLOWED_PATH_PATTERNS = [
  /^\/$/,
  /^\/trip-planner$/,
  /^\/map$/,
  /^\/stays(\?.*)?$/,
  /^\/rentals(\?.*)?$/,
  /^\/guides(\?.*)?$/,
  /^\/guides\/[a-zA-Z0-9_-]+$/,
  /^\/activities(\?.*)?$/,
  /^\/spiritual(\?.*)?$/,
  /^\/culture$/,
  /^\/my-trip$/,
  /^\/my-trip\/[a-zA-Z0-9_-]+$/,
  /^\/destinations\/[a-zA-Z0-9_-]+$/,
  /^\/destinations\/[a-zA-Z0-9_-]+\/explore$/
];

export const ALLOWED_ACTIONS = new Set([
  'NAVIGATE',
  'PREFILL_TRIP_PLANNER',
  'FOCUS_TRIP_FIELD',
  'OPEN_DESTINATION',
  'OPEN_TRIP',
  'OPEN_STAY',
  'OPEN_RENTAL',
  'OPEN_GUIDE',
  'OPEN_ACTIVITY',
  'OPEN_MAP',
  'SET_TRIP_FILTER',
  'REFRESH_TRIP',
  'REFRESH_RESULTS',
  'SUGGEST_ACTION',
  'SET_TRIP_DURATION',
  'SET_ORIGIN',
  'SET_DESTINATION',
  'SET_BUDGET',
  'FIND_STAYS',
  'SHOW_ROUTE',
  'CHECK_WEATHER',
  'EXPLORE_DESTINATION'
]);

export const ALLOWED_FOCUS_FIELDS = new Set([
  'origin',
  'destination',
  'startDate',
  'endDate',
  'duration',
  'travelers',
  'transport',
  'budget',
  'tripTypes',
  'interests',
  'pace'
]);

// Track currently active requestId to reject stale background actions
let currentActiveRequestId = null;

export function setActiveRequestId(reqId) {
  currentActiveRequestId = reqId;
}

export function getActiveRequestId() {
  return currentActiveRequestId;
}

/**
 * Validates a route path against allowed patterns.
 */
function isAllowedPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  if (/^(javascript|data|vbscript):/i.test(path)) return false;
  if (/^[a-zA-Z]+:\/\//i.test(path)) return false; // No external URLs
  return ALLOWED_PATH_PATTERNS.some(regex => regex.test(path));
}

/**
 * Safe action executor invoked when SSE or agent controller produces a ui_action.
 *
 * @param {Object} action - Structured action payload from agent
 * @param {Object} context - Execution context { navigate, requestId, currentRoute }
 * @returns {Object} { executed: boolean, reason?: string }
 */
export function executeAgentAction(action, context = {}) {
  if (!action || typeof action !== 'object') {
    return { executed: false, reason: 'Invalid action payload' };
  }

  const { type } = action;

  // 1. Strict Action Allowlist Check
  if (!ALLOWED_ACTIONS.has(type)) {
    console.warn(`[AgentActionExecutor] Rejected unauthorized action type: "${type}"`);
    return { executed: false, reason: `Action "${type}" is not allowlisted.` };
  }

  // 2. Stale Request Protection
  if (action.requestId && currentActiveRequestId && action.requestId !== currentActiveRequestId) {
    console.warn(`[AgentActionExecutor] Ignored stale action from requestId ${action.requestId}. Active is ${currentActiveRequestId}`);
    return { executed: false, reason: 'Stale action discarded.' };
  }

  const navigate = context.navigate || (typeof window !== 'undefined' && window.__DU_NAVIGATE__);

  switch (type) {
    case 'NAVIGATE': {
      let targetPath = null;
      if (action.routeKey && ALLOWED_ROUTE_MAP[action.routeKey]) {
        targetPath = ALLOWED_ROUTE_MAP[action.routeKey];
      } else if (action.route && isAllowedPath(action.route)) {
        targetPath = action.route;
      }

      if (!targetPath) {
        console.warn(`[AgentActionExecutor] NAVIGATE rejected for invalid target:`, action);
        return { executed: false, reason: 'Disallowed route target.' };
      }

      if (navigate) {
        navigate(targetPath);
        return { executed: true, target: targetPath };
      }
      return { executed: false, reason: 'Navigation function unavailable.' };
    }

    case 'PREFILL_TRIP_PLANNER': {
      const rawFields = action.fields || {};
      const safeFields = {};

      const normOrigin = normalizeLocationValue(rawFields.origin);
      if (normOrigin) safeFields.origin = normOrigin;

      const normDest = normalizeLocationValue(rawFields.destination);
      if (normDest) safeFields.destination = normDest;

      if (typeof rawFields.destinationId === 'string') safeFields.destinationId = rawFields.destinationId.trim();

      // Normalize date / duration / travelers
      if (rawFields.startDate) safeFields.startDate = String(rawFields.startDate);
      if (rawFields.endDate) safeFields.endDate = String(rawFields.endDate);
      if (rawFields.travelDate && !safeFields.startDate) safeFields.startDate = String(rawFields.travelDate);

      if (rawFields.duration !== undefined && rawFields.duration !== null) {
        const d = parseInt(rawFields.duration, 10);
        if (!isNaN(d) && d > 0) safeFields.duration = d;
      } else if (rawFields.durationDays !== undefined && rawFields.durationDays !== null) {
        const d = parseInt(rawFields.durationDays, 10);
        if (!isNaN(d) && d > 0) safeFields.duration = d;
      }

      if (rawFields.travelers !== undefined && rawFields.travelers !== null) {
        const t = parseInt(rawFields.travelers, 10);
        if (!isNaN(t) && t > 0) safeFields.travelers = t;
      }

      if (typeof rawFields.transport === 'string') safeFields.transport = rawFields.transport;

      // Budget normalization
      if (rawFields.budget !== undefined && rawFields.budget !== null) {
        const b = typeof rawFields.budget === 'number' ? rawFields.budget : parseInt(String(rawFields.budget).replace(/\D/g, ''), 10);
        if (!isNaN(b) && b > 0) safeFields.budget = b;
      }
      if (rawFields.customBudgetLimit !== undefined && rawFields.customBudgetLimit !== null) {
        const b = parseInt(String(rawFields.customBudgetLimit).replace(/\D/g, ''), 10);
        if (!isNaN(b) && b > 0) safeFields.customBudgetLimit = b;
      }

      if (Array.isArray(rawFields.tripTypes)) safeFields.tripTypes = rawFields.tripTypes.filter(t => typeof t === 'string');
      if (Array.isArray(rawFields.interests)) safeFields.interests = rawFields.interests.filter(i => typeof i === 'string');
      if (typeof rawFields.pace === 'string') safeFields.pace = rawFields.pace;

      // Update canonical store state
      useMapStore.getState().setPlannerForm(safeFields);
      console.log(`[AgentActionExecutor] PREFILL_TRIP_PLANNER applied:`, safeFields);
      return { executed: true, appliedFields: safeFields };
    }

    case 'SET_TRIP_DURATION': {
      const payload = action.payload || action;
      const days = parseInt(payload.days || payload.duration || action.days || action.duration, 10);
      if (!isNaN(days) && days > 0) {
        useMapStore.getState().setPlannerForm({ duration: days });
        return { executed: true, duration: days };
      }
      return { executed: false, reason: 'Invalid duration.' };
    }

    case 'SET_ORIGIN': {
      const payload = action.payload || action;
      const origin = normalizeLocationValue(payload.origin || payload.value || action.origin);
      if (origin) {
        useMapStore.getState().setPlannerForm({ origin });
        return { executed: true, origin };
      }
      return { executed: false, reason: 'Invalid origin.' };
    }

    case 'SET_DESTINATION': {
      const payload = action.payload || action;
      const dest = normalizeLocationValue(payload.destination || payload.value || action.destination);
      if (dest) {
        useMapStore.getState().setPlannerForm({ destination: dest });
        return { executed: true, destination: dest };
      }
      return { executed: false, reason: 'Invalid destination.' };
    }

    case 'SET_BUDGET': {
      const payload = action.payload || action;
      const rawBudget = payload.budget !== undefined ? payload.budget : action.budget;
      const b = typeof rawBudget === 'number' ? rawBudget : parseInt(String(rawBudget).replace(/\D/g, ''), 10);
      if (!isNaN(b) && b > 0) {
        useMapStore.getState().setPlannerForm({ budget: b, customBudgetLimit: b });
        return { executed: true, budget: b };
      }
      return { executed: false, reason: 'Invalid budget.' };
    }

    case 'FIND_STAYS': {
      const payload = action.payload || action;
      const dest = normalizeLocationValue(payload.destination || action.destination);
      const query = dest ? `?destination=${encodeURIComponent(dest)}` : '';
      const target = `/stays${query}`;
      if (navigate) {
        navigate(target);
        return { executed: true, target };
      }
      return { executed: false };
    }

    case 'SHOW_ROUTE': {
      const payload = action.payload || action;
      const orig = normalizeLocationValue(payload.origin || action.origin);
      const dest = normalizeLocationValue(payload.destination || action.destination);
      if (orig || dest) {
        useMapStore.getState().setPlannerForm({
          ...(orig ? { origin: orig } : {}),
          ...(dest ? { destination: dest } : {})
        });
      }
      if (navigate) {
        navigate('/trip-planner');
        return { executed: true, target: '/trip-planner' };
      }
      return { executed: false };
    }

    case 'CHECK_WEATHER': {
      const payload = action.payload || action;
      const dest = normalizeLocationValue(payload.destination || action.destination);
      if (dest && navigate) {
        const slug = dest.toLowerCase().replace(/\s+/g, '-');
        navigate(`/destinations/${slug}`);
        return { executed: true, target: `/destinations/${slug}` };
      }
      return { executed: false };
    }

    case 'EXPLORE_DESTINATION': {
      const payload = action.payload || action;
      const dest = normalizeLocationValue(payload.destination || payload.slug || action.destination || action.slug);
      if (dest && navigate) {
        const slug = dest.toLowerCase().replace(/\s+/g, '-');
        navigate(`/destinations/${slug}`);
        return { executed: true, target: `/destinations/${slug}` };
      }
      return { executed: false };
    }

    case 'FOCUS_TRIP_FIELD': {
      const field = action.field;
      if (!ALLOWED_FOCUS_FIELDS.has(field)) {
        return { executed: false, reason: `Field "${field}" not allowlisted for focus.` };
      }

      useMapStore.getState().setPlannerForm({ focusedField: field });

      // If already on /trip-planner, attempt DOM focus
      if (typeof document !== 'undefined') {
        setTimeout(() => {
          const el = document.querySelector(`[data-field-name="${field}"], #${field}, [name="${field}"]`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus?.();
          }
        }, 300);
      }
      return { executed: true, focusedField: field };
    }

    case 'OPEN_DESTINATION': {
      const slugOrId = (action.slug || action.destinationId || action.destination || '').toLowerCase().trim();
      if (!slugOrId || !/^[a-z0-9_-]+$/.test(slugOrId)) {
        return { executed: false, reason: 'Invalid destination identifier.' };
      }
      const target = action.explore
        ? `/destinations/${slugOrId}/explore`
        : `/destinations/${slugOrId}`;
      if (navigate) {
        navigate(target);
        return { executed: true, target };
      }
      return { executed: false };
    }

    case 'OPEN_TRIP': {
      const tripId = action.tripId;
      if (!tripId || !/^[a-zA-Z0-9_-]+$/.test(tripId)) {
        return { executed: false, reason: 'Invalid tripId.' };
      }
      const target = `/my-trip/${tripId}`;
      if (navigate) {
        navigate(target);
        return { executed: true, target };
      }
      return { executed: false };
    }

    case 'OPEN_STAY': {
      if (navigate) {
        navigate('/stays');
        return { executed: true, target: '/stays' };
      }
      return { executed: false };
    }

    case 'OPEN_ACTIVITY': {
      if (navigate) {
        navigate('/activities');
        return { executed: true, target: '/activities' };
      }
      return { executed: false };
    }

    case 'OPEN_GUIDE': {
      const guideSlug = action.slug || action.guideId;
      const target = guideSlug ? `/guides/${guideSlug}` : '/guides';
      if (navigate) {
        navigate(target);
        return { executed: true, target };
      }
      return { executed: false };
    }

    case 'OPEN_RENTAL': {
      if (navigate) {
        navigate('/rentals');
        return { executed: true, target: '/rentals' };
      }
      return { executed: false };
    }

    case 'OPEN_MAP': {
      if (navigate) {
        navigate('/map');
        return { executed: true, target: '/map' };
      }
      return { executed: false };
    }

    case 'SET_TRIP_FILTER': {
      if (action.category) {
        useMapStore.getState().setSelectedCategory(action.category);
      }
      return { executed: true };
    }

    case 'SUGGEST_ACTION':
    case 'REFRESH_TRIP':
    case 'REFRESH_RESULTS': {
      return { executed: true, type };
    }

    default:
      return { executed: false, reason: 'Unhandled action type.' };
  }
}
