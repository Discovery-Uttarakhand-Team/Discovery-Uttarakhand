import React from 'react';

/**
 * FilterPills — category filter bar.
 * Props:
 *   activeFilter  — currently active filter string
 *   onFilterChange — (filter: string) => void
 *
 * Mobile: horizontally scrollable, no line-wrap.
 * Keyboard: Enter or Space activates focused pill.
 */

// Icon SVG components — inline SVGs to avoid extra dependencies
const Icons = {
  All: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  Garhwal: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l5-10 4 7 3-5 6 8H3z" />
    </svg>
  ),
  Kumaon: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20l6-12 5 8 4-6 5 10H2z" />
    </svg>
  ),
  Spiritual: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Adventure: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Nature: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M5 12C5 7 8 3 12 2c4 1 7 5 7 10-2 2-4 3-7 3s-5-1-7-3z" />
    </svg>
  ),
};

const filters = ['All', 'Garhwal', 'Kumaon', 'Spiritual', 'Adventure', 'Nature'];

const FilterPills = ({ activeFilter, onFilterChange }) => {
  const handleKey = (e, filter) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFilterChange(filter);
    }
  };

  return (
    <div
      role="group"
      aria-label="Filter destinations by category"
      className="flex items-center gap-2.5 mb-12 overflow-x-auto scrollbar-hide px-1 pb-1"
      // px-1 so the shadow of focused pill isn't clipped
    >
      {filters.map((filter) => {
        const Icon = Icons[filter];
        const isActive = activeFilter === filter;
        return (
          <button
            key={filter}
            role="radio"
            aria-checked={isActive}
            tabIndex={0}
            onClick={() => onFilterChange(filter)}
            onKeyDown={(e) => handleKey(e, filter)}
            className={`
              pill flex-shrink-0 flex items-center gap-1.5
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-green
              ${isActive ? 'active' : ''}
            `}
          >
            {Icon && <Icon />}
            <span>{filter}</span>
          </button>
        );
      })}
    </div>
  );
};

export default FilterPills;
