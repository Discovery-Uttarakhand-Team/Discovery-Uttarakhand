import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useMapStore } from '../../store/mapStore';
import { UTTARAKHAND_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, UTTARAKHAND_BOUNDS } from '../../utils/constants';
import { 
  MdNavigation, 
  MdDirectionsBus, 
  MdDirectionsCar,
  MdFlight,
  MdExplore
} from 'react-icons/md';

// Major destinations with circular photo badges matching the reference screenshot
const PHOTO_DESTINATIONS = [
  {
    id: 'yamunotri',
    name: 'Yamunotri',
    alt: '3,293 m',
    coords: [31.0140, 78.4600],
    image: 'https://images.unsplash.com/photo-1609137144822-0d1a45749323?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'gangotri',
    name: 'Gangotri',
    alt: '3,100 m',
    coords: [30.9947, 78.9398],
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'kedarnath',
    name: 'Kedarnath',
    alt: '3,583 m',
    coords: [30.7352, 79.0669],
    image: 'https://images.unsplash.com/photo-1609137144822-0d1a45749323?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'badrinath',
    name: 'Badrinath',
    alt: '3,133 m',
    coords: [30.7433, 79.4938],
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'valley_of_flowers',
    name: 'Valley of Flowers',
    alt: '3,658 m',
    coords: [30.7280, 79.6053],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'auli',
    name: 'Auli',
    alt: '2,800 m',
    coords: [30.5310, 79.5694],
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    alt: '2,005 m',
    coords: [30.4598, 78.0644],
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'dehradun',
    name: 'Dehradun',
    alt: '640 m',
    coords: [30.3165, 78.0322],
    image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    alt: '372 m',
    coords: [30.0869, 78.2676],
    image: 'https://images.unsplash.com/photo-1596761226848-6d5df65b4c19?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'haridwar',
    name: 'Haridwar',
    alt: '314 m',
    coords: [29.9457, 78.1642],
    image: 'https://images.unsplash.com/photo-1609137144822-0d1a45749323?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'tehri',
    name: 'Tehri Lake',
    alt: '',
    coords: [30.3800, 78.4800],
    image: 'https://images.unsplash.com/photo-1596761226848-6d5df65b4c19?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'kausani',
    name: 'Kausani',
    alt: '1,890 m',
    coords: [29.8543, 79.5967],
    image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'almora',
    name: 'Almora',
    alt: '1,638 m',
    coords: [29.5971, 79.6591],
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'nainital',
    name: 'Nainital',
    alt: '1,938 m',
    coords: [29.3919, 79.4542],
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'munsiyari',
    name: 'Munsiyari',
    alt: '2,298 m',
    coords: [30.0668, 80.2372],
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=150&auto=format&fit=crop'
  },
  {
    id: 'corbett',
    name: 'Jim Corbett',
    alt: '520 m',
    coords: [29.5300, 78.7747],
    image: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?q=80&w=150&auto=format&fit=crop'
  }
];

// Minor towns & landmarks
const MINOR_LANDMARKS = [
  { name: 'Dhanaulti', coords: [30.4500, 78.2300], icon: 'circle' },
  { name: 'Jolly Grant Airport', coords: [30.1900, 78.1800], icon: 'airport' },
  { name: 'Uttarkashi', coords: [30.7268, 78.4354], icon: 'dot' },
  { name: 'Rudraprayag', coords: [30.2858, 78.9814], icon: 'dot' },
  { name: 'Joshimath', coords: [30.5564, 79.5667], icon: 'dot' },
  { name: 'Chamoli', coords: [30.4077, 79.3364], icon: 'dot' },
  { name: 'Pauri', coords: [30.1500, 78.7800], icon: 'dot' },
  { name: 'Binsar', coords: [29.7000, 79.7500], icon: 'paw' },
  { name: 'Ranikhet', coords: [29.6434, 79.4322], icon: 'dot' },
  { name: 'Mukteshwar', coords: [29.4722, 79.6543], icon: 'dot' },
  { name: 'Ramnagar', coords: [29.3900, 79.1200], icon: 'dot' },
  { name: 'Pithoragarh', coords: [29.5800, 80.2200], icon: 'dot' }
];

// Create circular 3D photo icon
const createPhotoIcon = (item, isSelected) => {
  const size = isSelected ? 44 : 36;
  const html = `
    <div class="reference-photo-marker ${isSelected ? 'selected' : ''}">
      <div class="marker-circle" style="width: ${size}px; height: ${size}px;">
        <img src="${item.image}" alt="${item.name}" />
      </div>
      <div class="marker-pill">
        <span class="name">${item.name}</span>
        ${item.alt ? `<span class="alt">(${item.alt})</span>` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'photo-marker-leaflet',
    html,
    iconSize: [size, size + 20],
    iconAnchor: [size / 2, size / 2]
  });
};

// Create landmark badge
const createLandmarkIcon = (landmark) => {
  let iconHtml = '<div class="landmark-dot"></div>';
  if (landmark.icon === 'airport') {
    iconHtml = '<div class="airport-badge">✈</div>';
  } else if (landmark.icon === 'paw') {
    iconHtml = '<div class="paw-badge">🐾</div>';
  }

  const html = `
    <div class="landmark-marker">
      ${iconHtml}
      <span class="landmark-label">${landmark.name}</span>
    </div>
  `;

  return L.divIcon({
    className: 'landmark-leaflet',
    html,
    iconSize: [80, 20],
    iconAnchor: [10, 10]
  });
};

// Map controller to listen to store updates
function MapController() {
  const map = useMap();
  const { mapCenter, mapZoom } = useMapStore();

  React.useEffect(() => {
    if (mapCenter) {
      map.flyTo(mapCenter, mapZoom, { duration: 1.0 });
    }
  }, [mapCenter, mapZoom, map]);

  return null;
}

export default function MapStage() {
  const { selectedDestination, setSelectedDestination } = useMapStore();
  const [activeRouteFilter, setActiveRouteFilter] = useState('Popular Routes');

  // Realistic highway polylines matching the screenshot
  const yellowRoute = [
    [30.0869, 78.2676], // Rishikesh
    [30.3800, 78.4800], // Tehri Lake
    [30.2858, 78.9814], // Rudraprayag
    [30.5233, 79.0766], // Guptkashi
    [30.7352, 79.0669]  // Kedarnath
  ];

  const blueRoute = [
    [29.9457, 78.1642], // Haridwar
    [30.0869, 78.2676], // Rishikesh
    [30.1500, 78.7800], // Pauri
    [29.5300, 78.7747]  // Jim Corbett
  ];

  const greenRoute = [
    [30.2858, 78.9814], // Rudraprayag
    [30.4077, 79.3364], // Chamoli
    [30.5564, 79.5667], // Joshimath
    [30.7433, 79.4938]  // Badrinath
  ];

  const routeFilters = [
    { label: 'Popular Routes', icon: '▲', color: 'bg-[#10b981] text-white border-transparent' },
    { label: 'Char Dham', icon: '🏛', color: 'bg-slate-900/90 text-amber-300 border-amber-500/30' },
    { label: 'Kumaon Circuit', icon: '🏔', color: 'bg-slate-900/90 text-sky-300 border-sky-500/30' },
    { label: 'Nainital Loop', icon: '🛶', color: 'bg-slate-900/90 text-rose-300 border-rose-500/30' },
    { label: 'Adventure Trail', icon: '⚡', color: 'bg-slate-900/90 text-teal-300 border-teal-500/30' },
    { label: 'Spiritual Trail', icon: '🪔', color: 'bg-slate-900/90 text-orange-300 border-orange-500/30' },
    { label: 'Wildlife Trail', icon: '🐅', color: 'bg-slate-900/90 text-emerald-300 border-emerald-500/30' }
  ];

  return (
    <div className="relative flex-1 h-[calc(100vh-3.5rem)] bg-[#040813] overflow-hidden select-none">
      {/* 1. Leaflet Interactive Base Map */}
      <MapContainer
        center={[30.3, 79.1]}
        zoom={8}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        maxBounds={UTTARAKHAND_BOUNDS}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        {/* Esri World Imagery / Satellite Tile Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="&copy; Esri &mdash; Devbhoomi Uttarakhand"
        />

        <MapController />

        {/* Glowing Route Polylines */}
        {/* Yellow Route (6h 30m) */}
        <Polyline
          positions={yellowRoute}
          pathOptions={{
            color: '#f59e0b',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.95
          }}
        >
          <Tooltip permanent direction="center" offset={[0, 0]} className="route-duration-badge">
            <span className="flex items-center gap-1 font-mono font-bold text-[10px] text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded-full shadow-md">
              <MdDirectionsCar className="text-xs" /> 6h 30m
            </span>
          </Tooltip>
        </Polyline>

        {/* Blue Route (3h 15m) */}
        <Polyline
          positions={blueRoute}
          pathOptions={{
            color: '#0ea5e9',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.95
          }}
        >
          <Tooltip permanent direction="center" offset={[0, 0]} className="route-duration-badge">
            <span className="flex items-center gap-1 font-mono font-bold text-[10px] text-sky-950 bg-sky-400 px-1.5 py-0.5 rounded-full shadow-md">
              <MdDirectionsBus className="text-xs" /> 3h 15m
            </span>
          </Tooltip>
        </Polyline>

        {/* Green Route (4h 20m) */}
        <Polyline
          positions={greenRoute}
          pathOptions={{
            color: '#10b981',
            weight: 4,
            dashArray: '8, 8',
            opacity: 0.95
          }}
        >
          <Tooltip permanent direction="center" offset={[0, 0]} className="route-duration-badge">
            <span className="flex items-center gap-1 font-mono font-bold text-[10px] text-emerald-950 bg-emerald-400 px-1.5 py-0.5 rounded-full shadow-md">
              <MdDirectionsBus className="text-xs" /> 4h 20m
            </span>
          </Tooltip>
        </Polyline>

        {/* 3D Circular Photo Destination Markers */}
        {PHOTO_DESTINATIONS.map((item) => (
          <Marker
            key={item.id}
            position={item.coords}
            icon={createPhotoIcon(item, selectedDestination?.id === item.id)}
            eventHandlers={{
              click: () => setSelectedDestination(item)
            }}
          />
        ))}

        {/* Minor Landmarks / Towns */}
        {MINOR_LANDMARKS.map((item, idx) => (
          <Marker
            key={idx}
            position={item.coords}
            icon={createLandmarkIcon(item)}
          />
        ))}
      </MapContainer>

      {/* 2. Top-Left Script Calligraphy Title matching reference */}
      <div className="absolute top-4 left-6 z-[400] pointer-events-none">
        <h1 
          className="text-2xl md:text-3xl font-normal text-white m-0 tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
        >
          Uttarakhand
        </h1>
        <p 
          className="text-base md:text-lg text-slate-100 font-normal m-0 -mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
        >
          More than a Destination,
        </p>
        <p 
          className="text-lg md:text-xl text-emerald-300 font-normal m-0 -mt-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
          style={{ fontFamily: "'Caveat', cursive, sans-serif" }}
        >
          A Feeling
        </p>
      </div>

      {/* 3. Surrounding Border Labels matching reference */}
      <div className="absolute top-16 left-6 z-[400] pointer-events-none text-[11px] font-black uppercase tracking-widest text-slate-400/80 drop-shadow-md">
        HIMACHAL<br />PRADESH
      </div>

      <div className="absolute top-6 right-20 z-[400] pointer-events-none text-[11px] font-black uppercase tracking-widest text-slate-300/80 drop-shadow-md">
        CHINA (TIBET)
      </div>

      <div className="absolute bottom-28 left-8 z-[400] pointer-events-none text-[11px] font-black uppercase tracking-widest text-slate-400/80 drop-shadow-md">
        UTTAR PRADESH
      </div>

      <div className="absolute bottom-24 right-16 z-[400] pointer-events-none text-[11px] font-black uppercase tracking-widest text-slate-300/80 drop-shadow-md">
        NEPAL
      </div>

      {/* 4. Bottom-Left Compass Rose & Distance Scale */}
      <div className="absolute bottom-16 left-6 z-[400] pointer-events-none flex flex-col items-center gap-1">
        {/* Compass */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border border-slate-500/50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <span className="text-[10px] font-bold text-slate-300 absolute -top-1">N</span>
            <span className="text-[9px] font-bold text-slate-400 absolute -bottom-1">S</span>
            <span className="text-[9px] font-bold text-slate-400 absolute -left-1">W</span>
            <span className="text-[9px] font-bold text-slate-400 absolute -right-1">E</span>
            <MdNavigation className="text-emerald-400 text-sm -rotate-45" />
          </div>
        </div>

        {/* Scale */}
        <div className="flex flex-col items-center text-[9px] font-mono text-slate-300 bg-black/50 px-2 py-0.5 rounded border border-slate-700/50">
          <div className="flex justify-between w-20 text-[8px]">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>100 km</span>
          </div>
          <div className="w-20 h-1 bg-gradient-to-r from-slate-200 via-slate-400 to-slate-200 rounded-full mt-0.5" />
        </div>
      </div>

      {/* 5. Bottom Route Filter Pills Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-[500] flex items-center justify-center gap-1.5 flex-wrap">
        {routeFilters.map((pill) => {
          const isActive = activeRouteFilter === pill.label;
          return (
            <button
              key={pill.label}
              onClick={() => setActiveRouteFilter(pill.label)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md transition-all shadow-md ${
                isActive
                  ? 'bg-[#10b981] text-white border-emerald-400 shadow-emerald-500/30'
                  : `${pill.color} hover:bg-slate-800 hover:text-white`
              }`}
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
