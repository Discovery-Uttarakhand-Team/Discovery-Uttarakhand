import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../../store/mapStore';
import { MdSearch, MdClose, MdLocationOn, MdStar, MdTerrain } from 'react-icons/md';

export default function SearchBar() {
  const { setSelectedDestination, isSidebarOpen, allDestinations } = useMapStore();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredResults = query.trim()
    ? allDestinations.filter((d) => {
        const q = query.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.district.toLowerCase().includes(q) ||
          (d.tags && d.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }).slice(0, 6)
    : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (dest) => {
    setSelectedDestination(dest);
    setQuery(dest.name);
    setIsOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-4 ${
        isSidebarOpen ? 'left-92 md:left-100' : 'left-18'
      } right-4 sm:right-auto sm:w-96 z-[1000] transition-all duration-300 ease-in-out`}
    >
      <div className="relative">
        <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl text-slate-100 focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all">
          <MdSearch className="text-xl text-amber-400 mr-2 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search Kedarnath, Rishikesh, Auli, Treks..."
            className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-100 placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <MdClose className="text-base" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && filteredResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 p-1.5 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-slate-700/90 shadow-2xl overflow-hidden divide-y divide-slate-800/60 z-50">
            {filteredResults.map((dest) => (
              <div
                key={dest._id || dest.id}
                onClick={() => handleSelect(dest)}
                className="p-2.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all flex items-center gap-3 text-left group"
              >
                <img
                  src={dest.coverImage || dest.image}
                  alt={dest.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 truncate">
                      {dest.name}
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] text-amber-400 font-bold ml-2">
                      <MdStar className="text-xs" /> {dest.rating}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <MdLocationOn className="text-xs text-amber-500" /> {dest.district}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-0.5">
                      <MdTerrain className="text-xs" /> {dest.altitude}m
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
