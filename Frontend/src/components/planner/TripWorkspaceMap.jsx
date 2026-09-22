import React, { useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TILE_PROVIDERS, UTTARAKHAND_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from '../../utils/mapConstants';
import { Navigation, Compass, Layers, Check, Sparkles } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom Day Marker with Journey Status (🟢 Current, ✓ Past, ⚪ Upcoming)
const createDayMarkerIcon = (dayNumber, status, isStart, isTrek, isPeak) => {
  const isCurrent = status === 'CURRENT';
  const isCompleted = status === 'COMPLETED';

  let bg = '#2D6A4F';
  let borderColor = '#ffffff';
  let textColor = '#ffffff';
  let size = 32;
  let pulseRing = '';

  if (isCurrent) {
    bg = '#14452F';
    borderColor = '#52b788';
    size = 38;
    pulseRing = `box-shadow: 0 0 0 4px rgba(45, 106, 79, 0.4), 0 4px 12px rgba(0,0,0,0.35);`;
  } else if (isCompleted) {
    bg = '#1b4332';
    size = 28;
    pulseRing = `box-shadow: 0 2px 6px rgba(0,0,0,0.25);`;
  } else {
    // Upcoming
    bg = '#ffffff';
    borderColor = '#52b788';
    textColor = '#14452F';
    size = 28;
    pulseRing = `box-shadow: 0 2px 6px rgba(0,0,0,0.15);`;
  }

  // Icon / Content
  let innerContent = isCompleted 
    ? '✓' 
    : isStart 
    ? '🏠' 
    : isTrek 
    ? '🥾' 
    : isPeak 
    ? '🏔️' 
    : dayNumber;

  return L.divIcon({
    className: 'custom-workspace-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${bg};
        color: ${textColor};
        border-radius: 9999px;
        border: 2px solid ${borderColor};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: ${isCompleted ? '13px' : isStart || isTrek || isPeak ? '12px' : '11px'};
        ${pulseRing}
        transform: ${isCurrent ? 'scale(1.15)' : 'scale(1)'};
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      ">
        ${innerContent}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Map auto-fit and fly controller
function WorkspaceAutoFitController({ coordinates, activeCoords }) {
  const map = useMap();

  useEffect(() => {
    if (activeCoords && Array.isArray(activeCoords) && activeCoords.length === 2 && Number.isFinite(activeCoords[0]) && Number.isFinite(activeCoords[1])) {
      try {
        map.flyTo(activeCoords, 10, { duration: 1.0 });
        return;
      } catch (e) {
        console.warn('flyTo failed:', e);
      }
    }

    if (coordinates && coordinates.length > 1) {
      try {
        const bounds = L.latLngBounds(coordinates);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
        }
      } catch (e) {
        console.warn('fitBounds failed:', e);
      }
    }
  }, [coordinates, activeCoords, map]);

  return null;
}

export default function TripWorkspaceMap({ 
  tripSession, 
  activeDayIndex, 
  onSelectDay 
}) {
  const { activeTileLayer, setActiveTileLayer } = useMapStore();
  const tile = TILE_PROVIDERS[activeTileLayer] || TILE_PROVIDERS.topo;

  const dayPlans = tripSession?.dayPlans || [];
  const routeGeometry = tripSession?.routeData?.geometry || null;

  // Extract all valid coordinates for route and bounds
  const validCoordinates = useMemo(() => {
    const coords = [];
    dayPlans.forEach(d => {
      if (Array.isArray(d.coordinates) && d.coordinates.length === 2 && Number.isFinite(d.coordinates[0]) && Number.isFinite(d.coordinates[1])) {
        coords.push(d.coordinates);
      }
    });
    return coords;
  }, [dayPlans]);

  const activeDayCoords = useMemo(() => {
    if (dayPlans[activeDayIndex] && Array.isArray(dayPlans[activeDayIndex].coordinates)) {
      return dayPlans[activeDayIndex].coordinates;
    }
    return null;
  }, [dayPlans, activeDayIndex]);

  const isRoadRoute = tripSession?.routeData?.isRoadRoute !== false;
  const polylineCoords = isRoadRoute && routeGeometry && routeGeometry.length > 1 
    ? routeGeometry 
    : null;

  const initialCenter = validCoordinates[0] || UTTARAKHAND_CENTER;

  return (
    <div className="relative w-full h-full min-h-[380px] bg-[#faf9f6] rounded-2xl md:rounded-3xl overflow-hidden border border-border-light shadow-sm">
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        <WorkspaceAutoFitController 
          coordinates={validCoordinates} 
          activeCoords={activeDayCoords} 
        />

        {/* Real Route Polyline - Only drawn when verified road geometry is present */}
        {polylineCoords && polylineCoords.length >= 2 && (
          <Polyline
            positions={polylineCoords}
            pathOptions={{
              color: '#14452F',
              weight: 4,
              opacity: 0.85,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Day Status Markers */}
        {dayPlans.map((day, idx) => {
          if (!Array.isArray(day.coordinates) || day.coordinates.length !== 2 || !Number.isFinite(day.coordinates[0])) {
            return null;
          }
          
          let status = 'UPCOMING';
          if (idx === activeDayIndex) {
            status = 'CURRENT';
          } else if (idx < activeDayIndex) {
            status = 'COMPLETED';
          }

          const isStart = day.dayNumber === 1 && day.type === 'journey';
          const isTrek = day.type === 'trek';
          const isPeak = /peak|kailash|pass/i.test(day.title || day.where || '');

          return (
            <Marker
              key={`day-${day.dayNumber}-${idx}`}
              position={day.coordinates}
              icon={createDayMarkerIcon(day.dayNumber, status, isStart, isTrek, isPeak)}
              eventHandlers={{
                click: () => onSelectDay(idx)
              }}
            >
              <Popup className="custom-popup">
                <div className="p-1 min-w-[200px] max-w-[240px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-forest-green">
                      Day {day.dayNumber} • {day.badge || 'Journey Leg'}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      status === 'CURRENT'
                        ? 'bg-green-100 text-forest-green'
                        : status === 'COMPLETED'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-amber-50 text-amber-800'
                    }`}>
                      {status === 'CURRENT' ? 'Active Day' : status === 'COMPLETED' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>

                  <h4 className="font-bold text-text-dark text-xs mt-0.5 leading-snug">
                    {day.title}
                  </h4>
                  <p className="text-[11px] text-muted-text mt-1 line-clamp-2">
                    {day.description}
                  </p>

                  <button
                    onClick={() => onSelectDay(idx)}
                    className="mt-2 w-full text-[11px] font-bold text-white bg-forest-green hover:bg-dark-green py-1.5 rounded-lg transition-colors shadow-2xs"
                  >
                    View Day Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Layer Switcher */}
      <div className="absolute top-3 right-3 z-[400] flex items-center bg-white/95 backdrop-blur-md rounded-xl p-1 shadow-md border border-border-light">
        {['topo', 'voyager', 'satellite'].map((key) => (
          <button
            key={key}
            onClick={() => setActiveTileLayer(key)}
            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTileLayer === key
                ? 'bg-forest-green text-white shadow-xs'
                : 'text-text-dark hover:bg-beige/60'
            }`}
          >
            {key === 'topo' ? 'Terrain' : key === 'voyager' ? 'Roads' : 'Satellite'}
          </button>
        ))}
      </div>

      {/* Compact Journey Tracker Legend */}
      <div className="absolute bottom-3 right-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl px-2.5 py-2 shadow-md border border-border-light text-[10px] text-text-dark space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#14452F] ring-2 ring-emerald-400"></span>
          <span className="font-semibold text-forest-green">Active Day</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332] text-white flex items-center justify-center text-[8px]">✓</span>
          <span className="text-muted-text">Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#52b788] text-[8px] text-center font-bold">⚪</span>
          <span className="text-muted-text">Upcoming</span>
        </div>
      </div>

      {/* Route Stats overlay pill */}
      {tripSession?.routeData?.totalDistanceKm > 0 && tripSession?.routeData?.isRoadRoute !== false ? (
        <div className="absolute bottom-3 left-3 z-[400] bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-md border border-border-light flex items-center gap-3 text-xs font-bold text-forest-green">
          <span className="flex items-center gap-1.5">
            <Navigation size={13} className="text-forest-green" />
            {tripSession.routeData.totalDistanceKm} km
          </span>
          {tripSession.routeData.estimatedTime && (
            <span className="text-earth-brown">
              ~{tripSession.routeData.estimatedTime}
            </span>
          )}
        </div>
      ) : tripSession?.routeData?.routeStatus === 'UNAVAILABLE' ? (
        <div className="absolute bottom-3 left-3 z-[400] bg-amber-50/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-amber-200 flex items-center gap-2 text-[11px] font-medium text-amber-900 max-w-[280px]">
          <span>⚠️ Road routing unavailable for extreme high-altitude trails. Waypoints displayed.</span>
        </div>
      ) : null}
    </div>
  );
}
