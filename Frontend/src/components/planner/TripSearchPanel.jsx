import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, Check, MapPin, ChevronRight } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

// Category config — keys map to the type field on normalized entities
const CATEGORIES = [
  { key: 'all',         label: 'All'          },
  { key: 'destination', label: 'Destinations' },
  { key: 'spiritual',   label: 'Spiritual'    },
  { key: 'activity',    label: 'Activities'   },
  { key: 'stay',        label: 'Stays'        },
  { key: 'culture',     label: 'Culture'      },
];

export default function TripSearchPanel({ allEntities = [], onAddFocus }) {
  const { tripDestinations, addTripDestination, removeTripDestination } =
    useMapStore();

  const [query, setQuery]     = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const searchRef = useRef(null);

  // Allow parent to focus the search (e.g. "+ Add More" from right panel)
  useEffect(() => {
    if (onAddFocus) {
      onAddFocus(() => searchRef.current?.focus());
    }
  }, [onAddFocus]);

  const tripIds = useMemo(
    () => new Set(tripDestinations.map((d) => d._id || d.id || d.slug)),
    [tripDestinations]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allEntities.filter((e) => {
      const catMatch = activeTab === 'all' || e.type === activeTab;
      const qMatch =
        !q ||
        (e.name || '').toLowerCase().includes(q) ||
        (e.district || '').toLowerCase().includes(q) ||
        (e.region || '').toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  }, [allEntities, activeTab, query]);

  const handleToggle = useCallback(
    (entity) => {
      const id = entity._id || entity.id || entity.slug;
      if (tripIds.has(id)) {
        removeTripDestination(id);
      } else {
        addTripDestination(entity);
      }
    },
    [tripIds, addTripDestination, removeTripDestination]
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-forest-green/10 flex items-center justify-center">
            <MapPin size={14} className="text-forest-green" />
          </div>
          <h2 className="font-black text-text-dark text-sm uppercase tracking-wider">
            Add Destinations
          </h2>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none"
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places, districts…"
            aria-label="Search destinations"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border-light bg-[#faf9f6] text-sm focus:outline-none focus:ring-2 focus:ring-forest-green text-text-dark placeholder-muted-text"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="px-3 py-2 flex gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 border-b border-border-light">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
              activeTab === key
                ? 'bg-forest-green text-white'
                : 'bg-beige text-text-dark hover:bg-[#e6ddcd]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Search size={24} className="text-muted-text opacity-40 mb-2" />
            <p className="text-sm font-bold text-text-dark">No places found</p>
            <button
              onClick={() => { setQuery(''); setActiveTab('all'); }}
              className="mt-2 text-xs font-bold text-forest-green hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-border-light/50">
            {filtered.map((entity) => {
              const id = entity._id || entity.id || entity.slug;
              const isAdded = tripIds.has(id);
              return (
                <li key={id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[#faf9f6] transition-colors group">
                  {/* Thumbnail */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-beige flex-shrink-0">
                    <img
                      src={entity.image || '/assets/fallback.svg'}
                      alt={entity.name}
                      loading="lazy"
                      onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-text-dark text-sm truncate leading-tight">
                      {entity.name}
                    </p>
                    <p className="text-[11px] text-muted-text truncate mt-0.5">
                      {entity.district}
                      {entity.region ? ` • ${entity.region}` : ''}
                    </p>
                    {entity.type === 'stay' && entity.locationSource && entity.locationSource.startsWith('APPROXIMATE') && (
                      <span className="inline-block text-[9px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 mt-0.5">
                        Location approximate — town/village centre
                      </span>
                    )}
                    {entity.shortDesc && (
                      <p className="text-[10px] text-muted-text truncate mt-0.5 leading-snug">
                        {entity.shortDesc}
                      </p>
                    )}
                  </div>

                  {/* Add / Added */}
                  <button
                    onClick={() => handleToggle(entity)}
                    aria-label={isAdded ? `Remove ${entity.name} from trip` : `Add ${entity.name} to trip`}
                    className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold transition-all shadow-sm ${
                      isAdded
                        ? 'bg-forest-green text-white'
                        : 'bg-beige text-forest-green border-2 border-forest-green hover:bg-forest-green hover:text-white'
                    }`}
                  >
                    {isAdded ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer count */}
      <div className="px-4 py-2 border-t border-border-light bg-[#faf9f6] flex-shrink-0">
        <p className="text-[11px] text-muted-text font-medium text-center">
          {filtered.length} places · {tripDestinations.length} selected
        </p>
      </div>
    </div>
  );
}
