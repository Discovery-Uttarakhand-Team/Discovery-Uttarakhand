import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Navbar from '../components/Navbar';
import {
  Search,
  MapPin,
  Compass,
  Mountain,
  Sparkles,
  Hotel,
  Activity as ActivityIcon,
  Plus,
  Check,
  X,
  Layers,
  RefreshCcw,
  ChevronRight,
} from 'lucide-react';
import { getDestinations } from '../api/destinationApi';
import { getSpiritualPlaces } from '../api/spiritualApi';
import { getActivities } from '../api/activityApi';
import { getStays } from '../api/stayApi';
import { useMapStore } from '../store/mapStore';
import {
  TILE_PRESETS,
  MAP_CENTER,
  MAP_ZOOM,
  MAP_MIN_ZOOM,
  MAP_MAX_ZOOM,
  isValidCoord,
} from '../utils/mapConfig';

// ─── Leaflet icon fix ────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Category colours ────────────────────────────────────────
const DOT_COLORS = {
  destination: '#1a4331',
  spiritual: '#c08457',
  activity: '#2563eb',
  stay: '#7c3aed',
};

// ─── Lightweight dot icon ─────────────────────────────────────
const createDotIcon = (type, selected = false) => {
  const color = DOT_COLORS[type] || DOT_COLORS.destination;
  const size = selected ? 18 : 12;
  const border = selected ? 3 : 2;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:${border}px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);cursor:pointer;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
};

// ─── Cluster icon ─────────────────────────────────────────────
const createClusterCustomIcon = (cluster) => {
  const count = cluster.getChildCount();
  const size = count > 50 ? 48 : count > 20 ? 42 : 36;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;background:#1a4331;color:#fff;border:2.5px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;font-weight:900;font-size:${size > 40 ? 14 : 12}px;box-shadow:0 3px 10px rgba(0,0,0,0.3);cursor:pointer;">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Fly-to controller ────────────────────────────────────────
function FlyToController({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && isValidCoord(coords)) {
      map.flyTo(coords, 14, { duration: 1.1 });
    }
  }, [coords, map]);
  return null;
}

// ─── Bounds controller ────────────────────────────────────────
function BoundsController({ locations }) {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (locations.length > 0 && !initialized.current) {
      const bounds = L.latLngBounds(locations.map(l => l.coordinates));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        initialized.current = true;
      }
    }
  }, [locations, map]);
  return null;
}

// ─── Category config ─────────────────────────────────────────
const CATEGORIES = [
  { key: 'All', label: 'All', Icon: Compass },
  { key: 'destination', label: 'Destinations', Icon: Mountain },
  { key: 'spiritual', label: 'Spiritual', Icon: Sparkles },
  { key: 'activity', label: 'Adventures', Icon: ActivityIcon },
  { key: 'stay', label: 'Stays', Icon: Hotel },
];

// ─── Normalise API record → unified shape ─────────────────────
const normalise = (raw, type, linkPrefix, labelFn) => {
  const c = raw.location?.coordinates;
  if (!Array.isArray(c) || c.length !== 2) return null;
  const coords = [c[1], c[0]]; // GeoJSON [lng,lat] → Leaflet [lat,lng]
  if (!isValidCoord(coords)) return null;
  const isApprox = raw.locationSource && raw.locationSource.startsWith('APPROXIMATE');
  const isKmvn = type === 'stay' || raw.name?.includes('KMVN');
  return {
    id: raw._id || raw.slug,
    name: raw.name || 'Unknown',
    slug: raw.slug || raw._id,
    type,
    categoryLabel: labelFn ? labelFn(raw) : type,
    district: raw.district || 'Uttarakhand',
    region: raw.region || '',
    coordinates: coords,
    isApproximate: isApprox,
    locationSource: raw.locationSource,
    image:
      raw.coverImage?.url ||
      (typeof raw.coverImage === 'string' ? raw.coverImage : null) ||
      raw.image?.url ||
      (typeof raw.image === 'string' ? raw.image : null) ||
      (Array.isArray(raw.images) && raw.images[0]?.url) ||
      (isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg'),
    description: raw.shortDescription || raw.description || '',
    link: `${linkPrefix}/${raw.slug || raw._id}`,
    _raw: raw,
  };
};

// ─── Lazy sidebar list (30 at a time) ────────────────────────
const BATCH = 30;

function LocationList({ locations, activeId, onSelect }) {
  const [visible, setVisible] = useState(BATCH);
  const listRef = useRef(null);

  useEffect(() => setVisible(BATCH), [locations]);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
      setVisible((v) => Math.min(v + BATCH, locations.length));
    }
  }, [locations.length]);

  useEffect(() => {
    if (activeId && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-id="${activeId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        const idx = locations.findIndex((l) => l.id === activeId);
        if (idx >= visible) {
          setVisible(idx + BATCH);
        }
      }
    }
  }, [activeId, visible, locations]);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 p-3"
    >
      {locations.slice(0, visible).map((loc) => {
        const isActive = activeId === loc.id;
        return (
          <button
            key={loc.id}
            data-id={loc.id}
            onClick={() => onSelect(loc)}
            className={`w-full text-left p-2.5 rounded-2xl border transition-all flex gap-2.5 items-center group ${
              isActive
                ? 'bg-white border-forest-green ring-1 ring-forest-green/20 shadow-sm'
                : 'bg-white border-border-light/60 hover:border-forest-green/30 hover:shadow-sm'
            }`}
          >
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-beige flex-shrink-0">
              <img
                src={loc.image}
                alt={loc.name}
                loading="lazy"
                onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-[9px] uppercase font-black px-1.5 py-0.5 rounded mb-0.5"
                style={{ background: `${DOT_COLORS[loc.type]}18`, color: DOT_COLORS[loc.type] }}
              >
                {loc.categoryLabel}
              </span>
              <h4 className="font-bold text-text-dark text-xs leading-tight truncate group-hover:text-forest-green transition-colors">
                {loc.name}
              </h4>
              <p className="text-[11px] text-muted-text flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="flex-shrink-0 text-earth-brown" />
                <span className="truncate">{loc.district}</span>
              </p>
            </div>
            <ChevronRight size={14} className="text-muted-text flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      })}
      {visible < locations.length && (
        <p className="text-center text-xs text-muted-text py-3 font-medium">
          Scroll for more · {locations.length - visible} remaining
        </p>
      )}
    </div>
  );
}

// ─── Tile switcher ────────────────────────────────────────────
function TileLayerSwitcher({ active, onChange }) {
  const [open, setOpen] = useState(false);
  const opts = [
    { key: 'map', label: 'Map' },
    { key: 'terrain', label: 'Terrain' },
    { key: 'satellite', label: 'Satellite' },
  ];
  return (
    <div className="absolute bottom-5 left-4 z-[400]">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Switch map layer"
        className="bg-white/95 backdrop-blur-sm border border-border-light rounded-full px-3 py-2 text-xs font-bold text-text-dark shadow-md flex items-center gap-1.5 hover:bg-beige transition-colors"
      >
        <Layers size={14} /> Layers
      </button>
      {open && (
        <div className="mt-2 bg-white/95 backdrop-blur-sm border border-border-light rounded-2xl shadow-xl overflow-hidden min-w-[110px]">
          {opts.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { onChange(key); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${
                active === key ? 'bg-forest-green text-white' : 'text-text-dark hover:bg-beige'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Popup card ───────────────────────────────────────────────
function PopupCard({ loc, isInTrip, onAddTrip }) {
  return (
    <div className="flex flex-col gap-2 font-sans" style={{ minWidth: 210, maxWidth: 250 }}>
      <div className="h-28 w-full rounded-xl overflow-hidden bg-beige">
        <img
          src={loc.image}
          alt={loc.name}
          loading="lazy"
          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
          className="w-full h-full object-cover"
        />
      </div>
      <h4 className="font-bold text-text-dark text-base m-0 leading-tight mt-1">{loc.name}</h4>
      <div className="text-[11px] text-muted-text font-bold mb-1">📍 {loc.district}</div>
      <div className="flex items-center gap-1.5 mb-1">
        <span
          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider"
          style={{ background: `${DOT_COLORS[loc.type]}18`, color: DOT_COLORS[loc.type] }}
        >
          {loc.categoryLabel}
        </span>
      </div>
      {loc.isApproximate && (
        <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 font-medium mb-1">
          Location approximate
        </div>
      )}
      {loc.description && (
        <p className="text-xs text-muted-text m-0 leading-relaxed line-clamp-2">{loc.description}</p>
      )}
      <div className="flex gap-2 mt-1 pt-2 border-t border-border-light">
        <Link
          to={loc.link}
          className="flex-1 bg-forest-green hover:bg-dark-green text-white text-xs font-bold py-2 px-3 rounded-full text-center transition-colors shadow-sm tracking-wide"
        >
          View Details →
        </Link>
        {loc.type !== 'stay' && (
          <button
            onClick={() => onAddTrip(loc)}
            title={isInTrip ? 'Already in trip' : 'Add to Trip Planner'}
            className={`flex items-center gap-1 text-xs font-bold py-2 px-3 rounded-full transition-all shadow-sm ${
              isInTrip
                ? 'bg-forest-green/10 text-forest-green border border-forest-green/30'
                : 'bg-beige hover:bg-earth-brown/10 text-text-dark border border-border-light'
            }`}
          >
            {isInTrip ? <Check size={13} /> : <Plus size={13} />}
            {isInTrip ? 'Added' : 'Trip'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────
export default function MapPage() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeLocation, setActiveLocation] = useState(null);
  const [flyCoords, setFlyCoords] = useState(null);
  const [activeTile, setActiveTile] = useState('map');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { addTripDestination, tripDestinations } = useMapStore();
  const tripIds = useMemo(
    () => new Set(tripDestinations.map((d) => d._id || d.id || d.slug)),
    [tripDestinations]
  );

  // ── Load data ────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [destRes, spirRes, actRes, stayRes] = await Promise.allSettled([
          getDestinations(),
          getSpiritualPlaces(),
          getActivities(),
          getStays(),
        ]);

        const all = [];

        if (destRes.status === 'fulfilled') {
          const arr = Array.isArray(destRes.value?.data) ? destRes.value.data
                    : Array.isArray(destRes.value) ? destRes.value : [];
          arr.forEach((d) => {
            const n = normalise(d, 'destination', '/destinations', () => 'Destination');
            if (n) all.push(n);
          });
        }

        if (spirRes.status === 'fulfilled') {
          const arr = Array.isArray(spirRes.value?.data) ? spirRes.value.data
                    : Array.isArray(spirRes.value) ? spirRes.value : [];
          arr.forEach((s) => {
            const n = normalise(s, 'spiritual', '/spiritual', (r) => r.category || 'Spiritual');
            if (n) all.push(n);
          });
        }

        if (actRes.status === 'fulfilled') {
          const arr = Array.isArray(actRes.value?.data) ? actRes.value.data
                    : Array.isArray(actRes.value) ? actRes.value : [];
          arr.forEach((a) => {
            const n = normalise(a, 'activity', '/activities', (r) => r.category || 'Activity');
            if (n) all.push(n);
          });
        }

        if (stayRes.status === 'fulfilled') {
          const arr = Array.isArray(stayRes.value?.data) ? stayRes.value.data
                    : Array.isArray(stayRes.value) ? stayRes.value : [];
          arr.forEach((st) => {
            const n = normalise(st, 'stay', '/stays', (r) => r.category || 'Stay');
            if (n) all.push(n);
          });
        }

        setLocations(all);
      } catch (err) {
        console.error('[Map] Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Filter ───────────────────────────────────────────────
  const filteredLocations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return locations.filter((loc) => {
      const catMatch = selectedCategory === 'All' || loc.type === selectedCategory;
      const qMatch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.district.toLowerCase().includes(q) ||
        loc.region.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [locations, selectedCategory, searchQuery]);

  // ── Select handler ───────────────────────────────────────
  const handleSelect = useCallback((loc) => {
    setActiveLocation(loc);
    setFlyCoords([...loc.coordinates]);
  }, []);

  // ── Add to trip ──────────────────────────────────────────
  const handleAddToTrip = useCallback(
    (loc) => {
      addTripDestination({
        ...(loc._raw || {}),
        id: loc.id,
        _id: loc._raw?._id || loc.id,
        name: loc.name,
        slug: loc.slug,
        district: loc.district,
        image: loc.image,
        coordinates: loc.coordinates,
        category: loc.type,
      });
    },
    [addTripDestination]
  );

  const categoryCounts = useMemo(() => {
    const counts = {};
    locations.forEach((l) => { counts[l.type] = (counts[l.type] || 0) + 1; });
    return counts;
  }, [locations]);

  const tile = TILE_PRESETS[activeTile] || TILE_PRESETS.map;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f6]">
      <Navbar />

      <main className="flex-1 flex flex-col pt-20">

        {/* ── Search + Filter bar ─────────────────────── */}
        <div className="bg-white border-b border-border-light px-4 md:px-6 py-3 flex flex-wrap gap-3 items-center z-10 relative">

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search places or districts…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search locations"
              className="w-full pl-10 pr-9 py-2.5 rounded-full border border-border-light bg-[#faf9f6] text-sm focus:outline-none focus:ring-2 focus:ring-forest-green text-text-dark placeholder-muted-text"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-text-dark p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(({ key, label, Icon }) => {
              const count = key === 'All' ? locations.length : (categoryCounts[key] || 0);
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  aria-pressed={isActive}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-forest-green text-white shadow-sm'
                      : 'bg-[#faf9f6] text-text-dark border border-border-light hover:border-forest-green/40'
                  }`}
                >
                  <Icon size={13} />
                  {label}
                  <span className={`text-[10px] px-1.5 rounded-full font-black ${isActive ? 'bg-white/25 text-white' : 'bg-beige text-muted-text'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs text-muted-text ml-auto font-medium hidden md:block">
            {filteredLocations.length} of {locations.length} places
          </span>
        </div>

        {/* ── Map + Sidebar ───────────────────────────── */}
        <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>

          {/* MAP */}
          <div className="flex-1 relative">
            {loading && (
              <div className="absolute inset-0 bg-[#faf9f6]/90 flex flex-col items-center justify-center gap-4 z-[500]">
                <div className="w-10 h-10 border-4 border-beige border-t-forest-green rounded-full animate-spin" />
                <p className="text-sm font-bold text-text-dark">Loading map…</p>
              </div>
            )}

            {tileError && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-white border border-red-200 rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3">
                <span className="text-red-600 text-sm font-bold">Map tiles could not be loaded</span>
                <button
                  onClick={() => { setTileError(false); setActiveTile('map'); }}
                  className="text-xs font-bold text-forest-green flex items-center gap-1 hover:underline"
                >
                  <RefreshCcw size={12} /> Retry
                </button>
              </div>
            )}

            <MapContainer
              center={MAP_CENTER}
              zoom={MAP_ZOOM}
              minZoom={MAP_MIN_ZOOM}
              maxZoom={MAP_MAX_ZOOM}
              zoomControl={false}
              scrollWheelZoom
              className="w-full h-full"
            >
              <TileLayer
                url={tile.url}
                attribution={tile.attribution}
                subdomains={tile.subdomains || 'abcd'}
                maxZoom={tile.maxZoom || 19}
                eventHandlers={{
                  tileerror: () => setTileError(true),
                  tileload: () => setTileError(false),
                }}
              />

              <ZoomControl position="bottomright" />
              <BoundsController locations={filteredLocations} />
              <FlyToController coords={flyCoords} />

              <MarkerClusterGroup
                chunkedLoading
                iconCreateFunction={createClusterCustomIcon}
                spiderfyOnMaxZoom
                showCoverageOnHover={false}
                zoomToBoundsOnClick
                maxClusterRadius={60}
                disableClusteringAtZoom={13}
              >
                {filteredLocations.map((loc) => (
                  <Marker
                    key={loc.id}
                    position={loc.coordinates}
                    icon={createDotIcon(loc.type, activeLocation?.id === loc.id)}
                    eventHandlers={{ click: () => setActiveLocation(loc) }}
                  >
                    <Popup minWidth={220} maxWidth={260}>
                      <PopupCard loc={loc} isInTrip={tripIds.has(loc.id)} onAddTrip={handleAddToTrip} />
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>

            <TileLayerSwitcher active={activeTile} onChange={setActiveTile} />

            {/* Mobile: show/hide sidebar */}
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="absolute top-4 right-4 z-[400] bg-white/95 backdrop-blur-sm border border-border-light rounded-full px-3 py-2 text-xs font-bold shadow-md flex items-center gap-1.5 lg:hidden"
            >
              <MapPin size={13} /> {sidebarOpen ? 'Hide' : 'Show'} List
            </button>
          </div>

          {/* SIDEBAR */}
          <aside
            className={`${sidebarOpen ? 'flex' : 'hidden lg:flex'} w-full lg:w-80 xl:w-96 flex-col border-l border-border-light bg-[#faf9f6] flex-shrink-0 overflow-hidden`}
          >
            {/* Header */}
            <div className="p-3.5 border-b border-border-light bg-white flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="font-black text-text-dark text-base font-display uppercase tracking-wide">
                  Locations
                </h2>
                <p className="text-[11px] text-muted-text">
                  {filteredLocations.length} places{searchQuery ? ` matching "${searchQuery}"` : ''}
                </p>
              </div>
              <span className="bg-forest-green text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {filteredLocations.length}
              </span>
            </div>

            {/* List */}
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-7 h-7 border-4 border-beige border-t-forest-green rounded-full animate-spin" />
                <p className="text-xs font-bold text-muted-text">Loading places…</p>
              </div>
            ) : filteredLocations.length > 0 ? (
              <LocationList locations={filteredLocations} activeId={activeLocation?.id} onSelect={handleSelect} />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12 text-center px-6">
                <Compass size={28} className="text-forest-green opacity-40" />
                <p className="text-sm font-bold text-text-dark">No places match</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                  className="text-xs font-bold text-forest-green hover:underline"
                >
                  Reset filters
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="p-3 border-t border-border-light bg-white flex flex-wrap gap-3 flex-shrink-0">
              {Object.entries(DOT_COLORS).map(([type, color]) => (
                <span key={type} className="flex items-center gap-1.5 text-[11px] font-bold text-muted-text">
                  <span style={{ background: color }} className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" />
                  {type === 'destination' ? 'Destination'
                    : type === 'spiritual' ? 'Spiritual'
                    : type === 'activity' ? 'Adventure' : 'Stay'}
                </span>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
