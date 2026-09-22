import React, { useState, useMemo } from 'react';
import { Search, X, Plus, Check, MapPin, Sparkles } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { Link } from 'react-router-dom';

const POPULAR_SUGGESTIONS = ['Nainital', 'Mussoorie', 'Rishikesh', 'Almora', 'Auli', 'Kedarnath', 'Badrinath', 'Corbett'];

export default function AddDestinationDrawer() {
  const { 
    isAddDrawerOpen, 
    closeAddDrawer, 
    allDestinations, 
    tripDestinations, 
    addTripDestination,
    removeTripDestination
  } = useMapStore();

  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const tripIds = useMemo(() => {
    return new Set(tripDestinations.map(d => d._id || d.id || d.slug));
  }, [tripDestinations]);

  const filteredDestinations = useMemo(() => {
    const q = query.toLowerCase().trim();
    return allDestinations.filter(d => {
      const name = (d.name || '').toLowerCase();
      const district = (d.district || '').toLowerCase();
      const region = (d.region || '').toLowerCase();
      const exp = (d.experiences || []).join(' ').toLowerCase();
      const highlights = (d.highlights || []).join(' ').toLowerCase();
      const desc = (d.shortDescription || d.description || '').toLowerCase();

      const matchesQuery = !q || 
        name.includes(q) || 
        district.includes(q) || 
        region.includes(q) || 
        exp.includes(q) || 
        highlights.includes(q);

      const matchesFilter = selectedFilter === 'All' ||
        (selectedFilter === 'Kumaon' && region.includes('kumaon')) ||
        (selectedFilter === 'Garhwal' && region.includes('garhwal')) ||
        (selectedFilter === 'Spiritual' && (exp.includes('temple') || exp.includes('pilgrim') || desc.includes('sacred') || desc.includes('shrine') || name.includes('dham'))) ||
        (selectedFilter === 'Adventure' && (exp.includes('trek') || exp.includes('raft') || exp.includes('ski') || exp.includes('camp')));

      return matchesQuery && matchesFilter;
    });
  }, [allDestinations, query, selectedFilter]);

  if (!isAddDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={closeAddDrawer}
      />

      {/* Slide-out Drawer from Left */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideRight font-sans">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-border-light flex items-center justify-between bg-[#faf9f6]">
          <div>
            <h2 className="text-xl font-black text-text-dark font-display uppercase tracking-wide">
              Add Destinations
            </h2>
            <p className="text-xs text-muted-text mt-0.5">
              Select places across Uttarakhand to build your trip
            </p>
          </div>
          <button 
            onClick={closeAddDrawer}
            className="w-9 h-9 rounded-full bg-white border border-border-light flex items-center justify-center text-text-dark hover:bg-beige transition-colors shadow-sm"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-border-light bg-white">
          <div className="relative">
            <input 
              type="text"
              autoFocus
              placeholder="Search Nainital, Mussoorie, Auli..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-9 py-3 rounded-2xl bg-[#f5f3ec] border border-border-light text-sm focus:outline-none focus:ring-2 focus:ring-forest-green text-text-dark placeholder-muted-text"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none" size={18} />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-text hover:text-text-dark p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="text-[11px] font-bold text-muted-text self-center mr-1">Popular:</span>
            {POPULAR_SUGGESTIONS.map(name => (
              <button
                key={name}
                onClick={() => setQuery(name)}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  query.toLowerCase() === name.toLowerCase()
                    ? 'bg-forest-green text-white font-bold'
                    : 'bg-beige/70 hover:bg-beige text-text-dark font-medium'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border-light/60 overflow-x-auto no-scrollbar">
            {['All', 'Kumaon', 'Garhwal', 'Spiritual', 'Adventure'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedFilter(cat)}
                className={`text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedFilter === cat
                    ? 'bg-forest-green text-white shadow-sm'
                    : 'bg-[#faf9f6] text-muted-text hover:text-text-dark border border-border-light/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-[#faf9f6]">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-muted-text uppercase tracking-wider">
              {filteredDestinations.length} Places Found
            </span>
            <span className="text-xs font-bold text-forest-green">
              {tripDestinations.length} Selected
            </span>
          </div>

          {filteredDestinations.map(dest => {
            const destId = dest._id || dest.id || dest.slug;
            const isAdded = tripIds.has(destId);

            return (
              <div 
                key={destId}
                className={`bg-white p-3 rounded-2xl border transition-all flex items-center gap-3.5 shadow-sm ${
                  isAdded ? 'border-forest-green/60 ring-1 ring-forest-green/20' : 'border-border-light/80 hover:border-forest-green/40'
                }`}
              >
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-beige flex-shrink-0 relative">
                  <img 
                    src={dest.image || dest.coverImage?.url || '/assets/fallback.svg'} 
                    alt={dest.name}
                    onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                    className="w-full h-full object-cover"
                  />
                  {isAdded && (
                    <div className="absolute inset-0 bg-forest-green/30 backdrop-blur-[1px] flex items-center justify-center">
                      <Check size={18} className="text-white drop-shadow" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-dark text-sm leading-tight truncate">
                    {dest.name}
                  </h4>
                  <p className="text-xs text-muted-text flex items-center gap-1 mt-0.5 truncate">
                    <MapPin size={11} className="text-earth-brown flex-shrink-0" />
                    <span>{dest.district}{dest.region ? ` • ${dest.region}` : ''}</span>
                  </p>
                  
                  {dest.highlights && dest.highlights.length > 0 && (
                    <div className="flex gap-1 mt-1.5 overflow-hidden">
                      {dest.highlights.slice(0, 2).map((h, i) => (
                        <span key={i} className="text-[10px] bg-beige px-1.5 py-0.5 rounded text-muted-text truncate max-w-[100px]">
                          {h}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add / Added Button */}
                <div className="flex-shrink-0">
                  {isAdded ? (
                    <button
                      onClick={() => removeTripDestination(destId)}
                      className="px-3 py-1.5 rounded-full bg-forest-green text-white text-xs font-bold flex items-center gap-1 hover:bg-red-600 transition-colors shadow-sm group"
                      title="Click to remove from trip"
                    >
                      <Check size={13} className="group-hover:hidden" />
                      <X size={13} className="hidden group-hover:block" />
                      <span className="group-hover:hidden">Added</span>
                      <span className="hidden group-hover:inline">Remove</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => addTripDestination(dest)}
                      className="px-3.5 py-1.5 rounded-full bg-forest-green hover:bg-dark-green text-white text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
                    >
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredDestinations.length === 0 && (
            <div className="text-center py-12 text-muted-text">
              <p className="text-sm font-bold text-text-dark">No destinations match your search</p>
              <p className="text-xs text-muted-text mt-1">Try searching another town or clearing your filters</p>
              <button 
                onClick={() => { setQuery(''); setSelectedFilter('All'); }}
                className="mt-3 text-xs font-bold text-forest-green hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border-light bg-white flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-text">Trip items:</span>
            <span className="font-bold text-text-dark ml-1 text-sm">{tripDestinations.length}</span>
          </div>
          <button
            onClick={closeAddDrawer}
            className="btn-primary px-6 py-2.5 text-xs font-bold rounded-full uppercase tracking-wider"
          >
            Done Adding
          </button>
        </div>
      </div>
    </div>
  );
}
