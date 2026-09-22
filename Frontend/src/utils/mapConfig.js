/**
 * mapConfig.js
 * ─────────────────────────────────────────────────────────────
 * Centralised map tile provider configuration.
 *
 * To change providers: update VITE_MAP_TILE_URL and
 * VITE_MAP_ATTRIBUTION in your .env file.
 *
 * Default: CARTO Voyager (no API key required, works from any
 * origin including localhost, proper attribution included).
 *
 * Other free options (no key):
 *   OSM  → https://tile.openstreetmap.org/{z}/{x}/{y}.png
 *   Topo → https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png
 *
 * Commercial (requires key via VITE_MAP_PROVIDER_KEY):
 *   Mapbox, Stadia, Thunderforest, etc.
 * ─────────────────────────────────────────────────────────────
 */

const ESRI_TOPO = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
  subdomains: '',
  maxZoom: 19,
};

const OPEN_TOPO = {
  url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  attribution:
    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  subdomains: 'abc',
  maxZoom: 17,
};

const ESRI_SATELLITE = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
  subdomains: '',
  maxZoom: 18,
};

/** Tile presets available in the layer switcher. */
export const TILE_PRESETS = {
  map: { ...ESRI_TOPO, label: 'Map' },
  terrain: { ...OPEN_TOPO, label: 'Terrain' },
  satellite: { ...ESRI_SATELLITE, label: 'Satellite' },
};

/** Active tile layer — falls back to ESRI_TOPO if no env override. */
export const DEFAULT_TILE = {
  url: import.meta.env.VITE_MAP_TILE_URL || ESRI_TOPO.url,
  attribution: import.meta.env.VITE_MAP_ATTRIBUTION || ESRI_TOPO.attribution,
  subdomains: ESRI_TOPO.subdomains,
  maxZoom: 19,
};

/** Uttarakhand geographic defaults */
export const MAP_CENTER = [30.25, 79.15];  // centre of Uttarakhand
export const MAP_ZOOM   = 8;
export const MAP_MIN_ZOOM = 7;
export const MAP_MAX_ZOOM = 18;

/**
 * Validate a GeoJSON [lng, lat] or Leaflet [lat, lng] pair.
 * Uttarakhand bounding box: lat 28.7–31.5, lng 77.5–81.2
 */
export const isValidCoord = ([lat, lng]) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= 28.0 && lat <= 32.0 &&
  lng >= 77.0 && lng <= 82.0;
