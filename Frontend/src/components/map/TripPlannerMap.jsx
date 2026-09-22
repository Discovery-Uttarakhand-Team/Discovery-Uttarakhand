import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';
import { UTTARAKHAND_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, UTTARAKHAND_BOUNDS } from '../../utils/mapConstants';
import { Plus, Check, MapPin, Layers, ExternalLink } from 'lucide-react';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Tile layer URLs
const TILE_LAYERS = {
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  },
  topo: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap contributors'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Uttarakhand'
  }
};

// Subtle, clean circular marker for unselected destinations
const createUnselectedDotIcon = () => {
  return L.divIcon({
    className: 'clean-pin-unselected',
    html: `<div style="
      width: 12px;
      height: 12px;
      background-color: #14452F;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

// Subtle, clean circular marker for unselected stays (violet)
const createStayDotIcon = () => {
  return L.divIcon({
    className: 'clean-pin-stay',
    html: `<div style="
      width: 12px;
      height: 12px;
      background-color: #7c3aed;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: transform 0.2s;
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

// Prominent numbered marker for selected trip destinations
const createNumberedTripIcon = (number, name) => {
  return L.divIcon({
    className: 'clean-pin-selected',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
        <div style="
          width: 32px;
          height: 32px;
          background-color: #14452F;
          color: #ffffff;
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          font-weight: 900;
          font-size: 14px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
        ">${number}</div>
        <div style="
          margin-top: 3px;
          background-color: rgba(255, 255, 255, 0.95);
          color: #1c1917;
          border: 1px solid #e7e5e4;
          font-size: 11px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        ">${name}</div>
      </div>
    `,
    iconSize: [32, 54],
    iconAnchor: [16, 54],
    popupAnchor: [0, -56]
  });
};

// Auto-fit bounds controller
function MapAutoFitController({ tripDestinations }) {
  const map = useMap();

  useEffect(() => {
    if (!tripDestinations || tripDestinations.length === 0) {
      // No stops — map stays at its initialized center; no flyTo needed
      return;
    }

    const coords = tripDestinations
      .map(d => d.coordinates)
      .filter(c => Array.isArray(c) && c.length === 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]));

    if (coords.length === 1) {
      try {
        if (coords[0] && Number.isFinite(coords[0][0]) && Number.isFinite(coords[0][1])) {
          map.flyTo(coords[0], 11, { duration: 1 });
        }
      } catch (e) {
        console.warn('[Map] flyTo error:', e);
      }
    } else if (coords.length > 1) {
      try {
        const bounds = L.latLngBounds(coords);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 12, duration: 1.2 });
        }
      } catch (e) {
        console.warn('[Map] fitBounds error:', e);
      }
    }
  }, [tripDestinations, map]);

  return null;
}

export default function TripPlannerMap() {
  const { 
    allDestinations, 
    allStays = [],
    tripDestinations, 
    addTripDestination, 
    removeTripDestination,
    activeTileLayer,
    setActiveTileLayer,
    customRouteGeometry,
  } = useMapStore();

  const tripIdMap = useMemo(() => {
    const map = new Map();
    tripDestinations.forEach((dest, index) => {
      const id = dest._id || dest.id || dest.slug;
      map.set(id, index + 1);
    });
    return map;
  }, [tripDestinations]);

  // Extract selected coordinates for polyline
  const routePolyline = useMemo(() => {
    if (customRouteGeometry && Array.isArray(customRouteGeometry) && customRouteGeometry.length > 1) {
      return customRouteGeometry;
    }
    if (tripDestinations.length >= 2) {
      return tripDestinations
        .map(d => d.coordinates)
        .filter(c => Array.isArray(c) && c.length === 2);
    }
    return null;
  }, [customRouteGeometry, tripDestinations]);

  const tile = TILE_LAYERS[activeTileLayer] || TILE_LAYERS.voyager;

  return (
    <div className="relative w-full h-full select-none bg-[#faf9f6]">
      <MapContainer
        center={UTTARAKHAND_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={UTTARAKHAND_BOUNDS}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        <MapAutoFitController tripDestinations={tripDestinations} />

        {/* Clean Route Polyline (only if 2+ destinations selected) */}
        {routePolyline && routePolyline.length >= 2 && (
          <Polyline
            positions={routePolyline}
            pathOptions={{
              color: '#14452F',
              weight: 4,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* 1. Unselected Destinations (subtle 10px dots) */}
        {allDestinations.map(dest => {
          if (!dest.coordinates || !Array.isArray(dest.coordinates) || dest.coordinates.length !== 2) {
            return null;
          }
          const destId = dest._id || dest.id || dest.slug;
          const isSelected = tripIdMap.has(destId);
          if (isSelected) return null; // Rendered below with numbered badge

          return (
            <Marker
              key={`unselected-${destId}`}
              position={dest.coordinates}
              icon={createUnselectedDotIcon()}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span className="font-bold text-xs text-text-dark">{dest.name}</span>
              </Tooltip>
              <Popup className="custom-popup">
                <div className="flex flex-col gap-2 min-w-[210px] max-w-[250px] p-1 font-sans">
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-beige">
                    <img 
                      src={dest.image || dest.coverImage?.url || '/assets/fallback.svg'} 
                      alt={dest.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-sm m-0 leading-tight">{dest.name}</h4>
                    <p className="text-[11px] text-muted-text m-0 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-earth-brown" />
                      {dest.district}{dest.region ? ` • ${dest.region}` : ''}
                    </p>
                  </div>
                  {dest.shortDesc && (
                    <p className="text-xs text-muted-text m-0 line-clamp-2 leading-relaxed">
                      {dest.shortDesc}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-light">
                    <button
                      onClick={() => addTripDestination(dest)}
                      className="flex-1 bg-forest-green hover:bg-dark-green text-white text-xs font-bold py-2 px-3 rounded-full flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Plus size={13} /> Add to Trip
                    </button>
                    <Link
                      to={`/destinations/${dest.slug}`}
                      className="text-xs font-bold text-forest-green hover:underline px-2 py-1"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 2. Unselected Stays (clean violet dots) */}
        {allStays.map(stay => {
          if (!stay.coordinates || !Array.isArray(stay.coordinates) || stay.coordinates.length !== 2) {
            return null;
          }
          const stayId = stay._id || stay.id || stay.slug;
          const isSelected = tripIdMap.has(stayId);
          if (isSelected) return null;

          const isApprox = stay.locationSource && stay.locationSource.startsWith('APPROXIMATE');
          const isKmvn = stay.name?.includes('KMVN') || stay.category?.includes('Government');
          const imgSrc = stay.image?.url || stay.image || (Array.isArray(stay.images) && stay.images[0]?.url) || (isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg');

          return (
            <Marker
              key={`stay-${stayId}`}
              position={stay.coordinates}
              icon={createStayDotIcon()}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <span className="font-bold text-xs text-text-dark">{stay.name}</span>
              </Tooltip>
              <Popup className="custom-popup">
                <div className="flex flex-col gap-2 min-w-[210px] max-w-[250px] p-1 font-sans">
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-beige">
                    <img 
                      src={imgSrc} 
                      alt={stay.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg'; }}
                    />
                  </div>
                  <div>
                    <span className="inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded mb-1 bg-purple-100 text-purple-700">
                      Stay · {stay.category || 'Govt TRH'}
                    </span>
                    <h4 className="font-bold text-text-dark text-sm m-0 leading-tight">{stay.name}</h4>
                    <p className="text-[11px] text-muted-text m-0 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-earth-brown" />
                      {stay.city ? `${stay.city}, ${stay.district || 'Uttarakhand'}` : (stay.district || 'Uttarakhand')}
                    </p>
                  </div>
                  {isApprox && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 font-medium">
                      Location approximate — town/village centre
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-light">
                    <button
                      onClick={() => addTripDestination(stay)}
                      className="flex-1 bg-forest-green hover:bg-dark-green text-white text-xs font-bold py-2 px-3 rounded-full flex items-center justify-center gap-1 transition-all shadow-sm"
                    >
                      <Plus size={13} /> Add to Trip
                    </button>
                    <Link
                      to={`/stays/${stay.slug}`}
                      className="text-xs font-bold text-forest-green hover:underline px-2 py-1"
                    >
                      Explore
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Selected Trip Stops (Prominent Numbered Badges) */}
        {tripDestinations.map((dest, idx) => {
          if (!dest.coordinates || !Array.isArray(dest.coordinates) || dest.coordinates.length !== 2) {
            return null;
          }
          const destId = dest._id || dest.id || dest.slug;
          const stopNumber = idx + 1;
          const isApprox = dest.locationSource && dest.locationSource.startsWith('APPROXIMATE');
          const isKmvn = dest.type === 'stay' || dest.name?.includes('KMVN');
          const imgSrc = dest.image || dest.coverImage?.url || (isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg');
          const exploreLink = dest.type === 'stay' ? `/stays/${dest.slug}` : `/destinations/${dest.slug}`;

          return (
            <Marker
              key={`selected-${destId}`}
              position={dest.coordinates}
              icon={createNumberedTripIcon(stopNumber, dest.name)}
              zIndexOffset={1000 + idx}
            >
              <Popup className="custom-popup">
                <div className="flex flex-col gap-2 min-w-[210px] max-w-[250px] p-1 font-sans">
                  <div className="h-28 w-full rounded-xl overflow-hidden bg-beige relative">
                    <img 
                      src={imgSrc} 
                      alt={dest.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg'; }}
                    />
                    <div className="absolute top-2 left-2 bg-forest-green text-white font-black text-xs px-2.5 py-0.5 rounded-full shadow">
                      Stop {stopNumber}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-sm m-0 leading-tight">{dest.name}</h4>
                    <p className="text-[11px] text-muted-text m-0 mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-earth-brown" />
                      {dest.district}
                    </p>
                  </div>
                  {isApprox && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 font-medium">
                      Location approximate — town/village centre
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border-light">
                    <button
                      onClick={() => removeTripDestination(destId)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-3 rounded-full transition-all shadow-sm"
                    >
                      Remove Stop
                    </button>
                    <Link
                      to={exploreLink}
                      className="text-xs font-bold text-forest-green hover:underline px-2 py-1"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Tile Switcher (Bottom-Left) */}
      <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur-md rounded-full p-1 border border-border-light shadow-md flex items-center gap-1">
        {[
          { key: 'voyager', label: 'Map' },
          { key: 'topo', label: 'Terrain' },
          { key: 'satellite', label: 'Satellite' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTileLayer(t.key)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              activeTileLayer === t.key
                ? 'bg-forest-green text-white shadow-sm'
                : 'text-text-dark hover:bg-beige'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
