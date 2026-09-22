import { create } from 'zustand';
import { UTTARAKHAND_CENTER, DEFAULT_ZOOM } from '../utils/mapConstants';

const getInitialTripDestinations = () => {
  try {
    const saved = localStorage.getItem('discovery_trip_destinations');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useMapStore = create((set, get) => ({
  // All destinations from real API
  allDestinations: [],
  allSpiritual: [],
  allStays: [],
  allActivities: [],

  // Active category filter: 'all' | 'spiritual' | 'trekking' | 'adventure' | 'hill_station' | 'wildlife'
  selectedCategory: 'all',
  
  // Currently highlighted / inspected destination
  selectedDestination: null,

  // Selected base map tile layer: 'voyager' | 'topo' | 'satellite'
  activeTileLayer: 'topo',

  // Map viewport
  mapCenter: UTTARAKHAND_CENTER,
  mapZoom: DEFAULT_ZOOM,

  // Search query in drawer
  searchQuery: '',

  // Trip planner custom itinerary
  tripDestinations: getInitialTripDestinations(),
  tripStats: { totalDistanceKm: 0, estimatedTime: '0 hrs', stopsCount: 0, legs: [] },
  customRouteGeometry: null,

  // Trip preferences
  tripPreferences: {
    tripType: 'Round Trip',
    duration: '5 Days',
    travelMode: 'By Car',
    travelers: '2 Adults',
    interests: ['Nature'],
    pace: 'Balanced',
  },

  // Canonical Planner Form State (Shared Bridge for Agent & UI)
  plannerForm: (() => {
    try {
      const saved = localStorage.getItem('discovery_planner_form');
      return saved ? JSON.parse(saved) : {
        origin: null,
        destination: null,
        destinationId: null,
        startDate: null,
        endDate: null,
        duration: 5,
        travelers: 2,
        transport: 'Car',
        budget: null,
        customBudgetLimit: null,
        tripTypes: ['Nature', 'Trekking'],
        interests: ['Nature Walks', 'Photography'],
        pace: 'Balanced',
        focusedField: null
      };
    } catch {
      return {
        origin: null,
        destination: null,
        destinationId: null,
        startDate: null,
        endDate: null,
        duration: 5,
        travelers: 2,
        transport: 'Car',
        budget: null,
        customBudgetLimit: null,
        tripTypes: ['Nature', 'Trekking'],
        interests: ['Nature Walks', 'Photography'],
        pace: 'Balanced',
        focusedField: null
      };
    }
  })(),

  setPlannerForm: (fields) => {
    const current = get().plannerForm;
    const updated = { ...current, ...fields };
    set({ plannerForm: updated });
    try {
      localStorage.setItem('discovery_planner_form', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save planner form to localStorage:', e);
    }
  },

  resetPlannerForm: () => {
    const initial = {
      origin: null,
      destination: null,
      destinationId: null,
      startDate: null,
      endDate: null,
      duration: 5,
      travelers: 2,
      transport: 'Car',
      budget: null,
      customBudgetLimit: null,
      tripTypes: ['Nature', 'Trekking'],
      interests: ['Nature Walks', 'Photography'],
      pace: 'Balanced',
      focusedField: null
    };
    set({ plannerForm: initial });
    try {
      localStorage.removeItem('discovery_planner_form');
    } catch (e) {}
  },

  // Generated itinerary state
  generatedItinerary: null,
  itineraryStatus: 'IDLE', // 'IDLE' | 'GENERATED' | 'MODIFIED' | 'SAVED' | 'ERROR'
  isGenerating: false,
  isSaving: false,
  saveStatus: 'IDLE', // 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'
  saveError: null,

  // Stage 2 Dedicated Trip Workspace active session
  activeTripSession: (() => {
    try {
      const saved = localStorage.getItem('discovery_active_trip');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),
  activeDayIndex: 0,

  setActiveTripSession: (session) => {
    set({ activeTripSession: session });
    try {
      if (session) {
        localStorage.setItem('discovery_active_trip', JSON.stringify(session));
      } else {
        localStorage.removeItem('discovery_active_trip');
      }
    } catch (e) {
      console.warn('Failed to save trip session:', e);
    }
  },

  setActiveDayIndex: (idx) => {
    set({ activeDayIndex: idx });
    const session = get().activeTripSession;
    if (session && session.dayPlans && session.dayPlans[idx]) {
      const dayCoords = session.dayPlans[idx].coordinates;
      if (Array.isArray(dayCoords) && dayCoords.length === 2 && Number.isFinite(dayCoords[0]) && Number.isFinite(dayCoords[1])) {
        set({ mapCenter: dayCoords, mapZoom: 11 });
      }
    }
  },

  // Layer visibility toggles
  layers: {
    destinations: true,
    routes: true,
    stays: true,
    activities: true,
    spiritual: true
  },
  toggleLayer: (layerKey) =>
    set((state) => ({
      layers: {
        ...state.layers,
        [layerKey]: !state.layers[layerKey]
      }
    })),

  // Drawers and modals
  isAddDrawerOpen: false,
  isItineraryOpen: false,
  isTripPlannerOpen: false,

  // State mutators
  setDestinations: (destinations) => set({ allDestinations: destinations }),
  setSpiritual: (spiritual) => set({ allSpiritual: spiritual }),
  setStays: (stays) => set({ allStays: stays }),
  setActivities: (activities) => set({ allActivities: activities }),

  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedDestination: (destination) => {
    if (destination) {
      set({
        selectedDestination: destination,
        mapCenter: destination.coordinates,
        mapZoom: 11
      });
    } else {
      set({ selectedDestination: null });
    }
  },

  setActiveTileLayer: (tileKey) => set({ activeTileLayer: tileKey }),

  setMapCenter: (center, zoom = DEFAULT_ZOOM) => set({ mapCenter: center, mapZoom: zoom }),

  resetMapBounds: () => set({ mapCenter: UTTARAKHAND_CENTER, mapZoom: DEFAULT_ZOOM, selectedDestination: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  openAddDrawer: () => set({ isAddDrawerOpen: true }),
  closeAddDrawer: () => set({ isAddDrawerOpen: false }),

  openItinerary: () => set({ isItineraryOpen: true }),
  closeItinerary: () => set({ isItineraryOpen: false }),

  setTripPreferences: (newPrefs) => {
    const current = get().tripPreferences;
    const updated = { ...current, ...newPrefs };
    const wasGenerated = get().itineraryStatus === 'GENERATED';
    set({
      tripPreferences: updated,
      itineraryStatus: wasGenerated ? 'MODIFIED' : get().itineraryStatus
    });
  },

  generateTripItinerary: async () => {
    const { tripDestinations, tripPreferences, tripStats, allActivities, allSpiritual } = get();
    if (!tripDestinations || tripDestinations.length === 0) return;
    set({ isGenerating: true });
    try {
      const { generateItineraryPlan } = await import('../utils/itineraryGenerator');
      const plan = generateItineraryPlan({
        destinations: tripDestinations,
        preferences: tripPreferences,
        tripStats,
        allActivities,
        allSpiritual
      });
      set({
        generatedItinerary: plan,
        itineraryStatus: 'GENERATED',
        saveStatus: 'IDLE',
        saveError: null,
        isGenerating: false,
        isItineraryOpen: true
      });
    } catch (err) {
      console.error('Failed to generate itinerary:', err);
      set({
        itineraryStatus: 'ERROR',
        isGenerating: false
      });
    }
  },

  invalidateItinerary: () => {
    if (get().itineraryStatus === 'GENERATED') {
      set({ itineraryStatus: 'MODIFIED' });
    }
  },

  setSaveStatus: (status, error = null) => {
    set({
      saveStatus: status,
      isSaving: status === 'SAVING',
      saveError: error,
      itineraryStatus: status === 'SAVED' ? 'SAVED' : get().itineraryStatus
    });
  },

  addTripDestination: (dest) => {
    const { tripDestinations, updateCustomRoute, itineraryStatus } = get();
    const destId = dest._id || dest.id || dest.slug;
    if (!tripDestinations.some((d) => (d._id || d.id || d.slug) === destId)) {
      const newDests = [...tripDestinations, dest];
      set({
        tripDestinations: newDests,
        selectedDestination: dest,
        itineraryStatus: itineraryStatus === 'GENERATED' ? 'MODIFIED' : itineraryStatus
      });
      try {
        localStorage.setItem('discovery_trip_destinations', JSON.stringify(newDests));
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      updateCustomRoute(newDests);
    }
  },

  removeTripDestination: (destId) => {
    const { tripDestinations, updateCustomRoute, itineraryStatus } = get();
    const newDests = tripDestinations.filter((d) => (d._id || d.id || d.slug) !== destId);
    set({
      tripDestinations: newDests,
      itineraryStatus: itineraryStatus === 'GENERATED' ? 'MODIFIED' : itineraryStatus
    });
    try {
      localStorage.setItem('discovery_trip_destinations', JSON.stringify(newDests));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    updateCustomRoute(newDests);
  },

  reorderTripDestinations: (newOrder) => {
    const { itineraryStatus } = get();
    set({
      tripDestinations: newOrder,
      itineraryStatus: itineraryStatus === 'GENERATED' ? 'MODIFIED' : itineraryStatus
    });
    try {
      localStorage.setItem('discovery_trip_destinations', JSON.stringify(newOrder));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
    get().updateCustomRoute(newOrder);
  },

  clearTrip: () => {
    set({
      tripDestinations: [],
      tripStats: { totalDistanceKm: 0, estimatedTime: '0 hrs', stopsCount: 0, legs: [] },
      customRouteGeometry: null,
      generatedItinerary: null,
      itineraryStatus: 'IDLE',
      saveStatus: 'IDLE',
      saveError: null,
      isItineraryOpen: false
    });
    try {
      localStorage.removeItem('discovery_trip_destinations');
    } catch (e) {
      console.warn('Failed to clear localStorage:', e);
    }
  },

  updateCustomRoute: async (destinations) => {
    if (!destinations || destinations.length < 2) {
      set({
        tripStats: { totalDistanceKm: 0, estimatedTime: '0 hrs', stopsCount: destinations ? destinations.length : 0, legs: [] },
        customRouteGeometry: null
      });
      return;
    }
    const { fetchOSRMRoute } = await import('../utils/routeHelpers');
    const stats = await fetchOSRMRoute(destinations);
    set({ tripStats: stats, customRouteGeometry: stats.geometry });
  },

  toggleTripPlanner: (forceOpen) =>
    set((state) => ({
      isTripPlannerOpen: forceOpen !== undefined ? forceOpen : !state.isTripPlannerOpen
    }))
}));
