import { create } from 'zustand';
import { UTTARAKHAND_CENTER, DEFAULT_ZOOM } from '../utils/constants';

export const useMapStore = create((set, get) => ({
  // Active category filter: 'all' | 'spiritual' | 'trekking' | 'adventure' | 'hill_station' | 'wildlife'
  selectedCategory: 'all',
  
  // Currently highlighted / inspected destination
  selectedDestination: null,

  // Currently active / inspected scenic route
  activeRoute: null,

  // Selected base map tile layer: 'voyager' | 'topo' | 'satellite' | 'dark'
  activeTileLayer: 'voyager',

  // Active layer visibility toggles
  layers: {
    destinations: true,
    routes: true,
    stays: false,
    activities: false,
    spiritual: false
  },

  // Map viewport
  mapCenter: UTTARAKHAND_CENTER,
  mapZoom: DEFAULT_ZOOM,

  // Search query
  searchQuery: '',

  // Trip planner custom itinerary
  tripDestinations: [],

  // Active sidebar drawer/tab: 'explore' | 'planner' | 'routes' | 'stays' | 'spiritual' | 'layers'
  activeSidebarTab: 'explore',
  isSidebarOpen: true,
  isCarouselOpen: true,
  isTripPlannerOpen: false,

  // State mutators
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  setSelectedDestination: (destination) => {
    if (destination) {
      set({
        selectedDestination: destination,
        mapCenter: destination.coordinates,
        mapZoom: 10
      });
    } else {
      set({ selectedDestination: null });
    }
  },

  setActiveRoute: (route) => {
    if (route && route.waypoints && route.waypoints.length > 0) {
      set({
        activeRoute: route,
        mapCenter: route.waypoints[0].coords,
        mapZoom: 9
      });
    } else {
      set({ activeRoute: null });
    }
  },

  setActiveTileLayer: (tileKey) => set({ activeTileLayer: tileKey }),

  toggleLayer: (layerId) => {
    set((state) => ({
      layers: {
        ...state.layers,
        [layerId]: !state.layers[layerId]
      }
    }));
  },

  setMapCenter: (center, zoom = DEFAULT_ZOOM) => set({ mapCenter: center, mapZoom: zoom }),

  resetMapBounds: () => set({ mapCenter: UTTARAKHAND_CENTER, mapZoom: DEFAULT_ZOOM, selectedDestination: null, activeRoute: null }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  addTripDestination: (dest) => {
    const { tripDestinations } = get();
    if (!tripDestinations.some((d) => d.id === dest.id)) {
      set({ tripDestinations: [...tripDestinations, dest] });
    }
  },

  removeTripDestination: (destId) => {
    set((state) => ({
      tripDestinations: state.tripDestinations.filter((d) => d.id !== destId)
    }));
  },

  reorderTripDestinations: (newOrder) => set({ tripDestinations: newOrder }),

  clearTrip: () => set({ tripDestinations: [] }),

  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab, isSidebarOpen: true }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  toggleCarousel: () => set((state) => ({ isCarouselOpen: !state.isCarouselOpen })),

  toggleTripPlanner: (forceOpen) =>
    set((state) => ({
      isTripPlannerOpen: forceOpen !== undefined ? forceOpen : !state.isTripPlannerOpen
    }))
}));
