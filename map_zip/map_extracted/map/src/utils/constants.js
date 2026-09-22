export const UTTARAKHAND_CENTER = [30.25, 79.15];
export const DEFAULT_ZOOM = 8;
export const MIN_ZOOM = 7;
export const MAX_ZOOM = 16;

export const UTTARAKHAND_BOUNDS = [
  [28.7, 77.5], // Southwest coordinates
  [31.5, 81.2]  // Northeast coordinates
];

export const CATEGORIES = [
  { id: 'all', label: 'All Places', icon: 'MdExplore', color: '#6366f1' },
  { id: 'spiritual', label: 'Sacred & Dhams', icon: 'MdTempleHindu', color: '#f59e0b' },
  { id: 'trekking', label: 'High Peaks & Treks', icon: 'MdTerrain', color: '#ec4899' },
  { id: 'adventure', label: 'Adventure Sports', icon: 'MdKayaking', color: '#3b82f6' },
  { id: 'hill_station', label: 'Scenic Hill Towns', icon: 'MdLandscape', color: '#10b981' },
  { id: 'wildlife', label: 'Wildlife & Safaris', icon: 'MdPets', color: '#8b5cf6' }
];

export const MAP_LAYERS = [
  { id: 'destinations', label: 'Destinations', icon: 'MdPlace', defaultActive: true },
  { id: 'routes', label: 'Scenic Routes', icon: 'MdAltRoute', defaultActive: true },
  { id: 'stays', label: 'Resorts & Stays', icon: 'MdHotel', defaultActive: false },
  { id: 'activities', label: 'Adventure Spots', icon: 'MdSportsKabaddi', defaultActive: false },
  { id: 'spiritual', label: 'Panch Prayag / Kedar', icon: 'MdSelfImprovement', defaultActive: false }
];

export const TILE_PROVIDERS = {
  voyager: {
    name: 'Carto Voyager (Clean)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  },
  topo: {
    name: 'Topographic Relief',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
  },
  satellite: {
    name: 'Esri Satellite Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  dark: {
    name: 'Dark Matter (Night)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>'
  }
};
