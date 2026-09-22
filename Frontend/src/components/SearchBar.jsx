import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * SearchBar with real-data suggestion dropdown.
 * Props:
 *   value        — controlled search string
 *   onChange     — (e) => void  (standard input change handler)
 *   destinations — array of destination objects for suggestion matching
 *   onClear      — () => void  called when user clears the input
 */
const SearchBar = ({ value, onChange, destinations = [], onClear }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  // ── Debounced suggestion matching ──────────────────────────────────────────
  const computeSuggestions = useCallback(
    (query) => {
      if (!query || query.trim().length < 1) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }
      const q = query.toLowerCase().trim();
      const matches = destinations
        .filter(
          (d) =>
            d.name?.toLowerCase().includes(q) ||
            d.district?.toLowerCase().includes(q) ||
            d.region?.toLowerCase().includes(q)
        )
        .slice(0, 6); // max 6 suggestions

      setSuggestions(matches);
      setShowDropdown(true);
      setActiveIndex(-1);
    },
    [destinations]
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => computeSuggestions(value), 220);
    return () => clearTimeout(debounceRef.current);
  }, [value, computeSuggestions]);

  // ── Close dropdown on outside click ───────────────────────────────────────
  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
    // Enter is handled by navigating via <Link> — active item gets focused
  };

  const handleClear = () => {
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    if (onClear) onClear();
    inputRef.current?.focus();
  };

  const handleSuggestionClick = () => {
    setShowDropdown(false);
    setActiveIndex(-1);
  };

  // Build location display for a suggestion: "District • Region" only if both exist
  const locationLabel = (d) => {
    const parts = [d.district, d.region].filter(Boolean);
    return parts.join(' • ');
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-10">
      {/* Input row */}
      <div className="relative flex items-center w-full h-16 rounded-full bg-white card-shadow overflow-hidden border border-border-light pl-6 pr-2">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => value && suggestions.length > 0 && setShowDropdown(true)}
          placeholder="Where do you want to go?"
          aria-label="Search destinations"
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          aria-controls="search-suggestions"
          className="w-full h-full outline-none text-lg text-text-dark placeholder:text-muted-text/70 bg-transparent"
        />
        {/* Clear button — visible only when there's text */}
        {value && (
          <button
            onClick={handleClear}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-text hover:text-text-dark hover:bg-beige transition-colors mr-1 flex-shrink-0"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <button
          className="h-12 w-12 rounded-full bg-forest-green text-white flex items-center justify-center hover:bg-dark-green transition-colors flex-shrink-0"
          aria-label="Search"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-xl border border-border-light z-50 overflow-hidden"
        >
          {suggestions.length > 0 ? (
            <ul className="py-2 max-h-80 overflow-y-auto">
              {suggestions.map((dest, idx) => {
                const loc = locationLabel(dest);
                const imageUrl = dest.coverImage?.url || dest.coverImage;
                return (
                  <li key={dest._id || dest.id} role="option" aria-selected={idx === activeIndex}>
                    <Link
                      to={`/destinations/${dest.slug}`}
                      onClick={handleSuggestionClick}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-beige transition-colors group ${
                        idx === activeIndex ? 'bg-beige' : ''
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="h-11 w-14 rounded-lg overflow-hidden bg-beige flex-shrink-0">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={dest.name}
                            loading="lazy"
                            onError={(e) => { e.target.style.display = 'none'; }}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-border-light" />
                        )}
                      </div>
                      {/* Text */}
                      <div className="flex flex-col min-w-0">
                        <span className="text-text-dark font-semibold text-sm truncate">
                          {dest.name}
                        </span>
                        {loc && (
                          <span className="text-muted-text text-xs truncate">{loc}</span>
                        )}
                      </div>
                      {/* Arrow */}
                      <span className="ml-auto text-muted-text group-hover:text-forest-green text-sm transition-colors flex-shrink-0">
                        →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            /* No results state */
            <div className="px-5 py-5 text-center">
              <p className="text-text-dark font-semibold text-sm mb-1">
                No destinations found for &ldquo;{value}&rdquo;
              </p>
              <p className="text-muted-text text-xs">
                Try searching for a place name or district
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
