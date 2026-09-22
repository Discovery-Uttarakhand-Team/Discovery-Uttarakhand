import React, { useState, useCallback } from 'react';
import {
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Sparkles,
  Bookmark,
  Check,
  MapPin,
  Plus,
  Route,
  Clock,
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useAuth } from '../../context/AuthContext';
import { createTrip } from '../../api/tripApi';

// ── Trip Preferences config ─────────────────────────────────
const TRIP_TYPES    = ['Round Trip', 'One Way'];
const DURATIONS     = ['1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '7 Days', '10+ Days'];
const TRAVEL_MODES  = ['By Car', 'By Bike', 'By Bus', 'Taxi'];
const TRAVELER_OPTIONS = ['Solo', '2 Adults', '3–4', 'Group 5+'];
const INTERESTS     = ['Nature', 'Adventure', 'Spiritual', 'Culture', 'Wildlife', 'Food', 'Relaxation'];

export default function TripRightPanel({ onFocusSearch }) {
  const {
    tripDestinations,
    removeTripDestination,
    reorderTripDestinations,
    clearTrip,
    tripStats,
    tripPreferences,
    setTripPreferences,
    itineraryStatus,
    generateTripItinerary,
    isGenerating,
  } = useMapStore();

  const { tripType, duration, travelMode, travelers, interests = ['Nature'] } = tripPreferences;

  const hasStops = tripDestinations.length > 0;

  // ── Reorder ────────────────────────────────────────────────
  const moveUp = useCallback(
    (idx) => {
      if (idx === 0) return;
      const next = [...tripDestinations];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      reorderTripDestinations(next);
    },
    [tripDestinations, reorderTripDestinations]
  );

  const moveDown = useCallback(
    (idx) => {
      if (idx === tripDestinations.length - 1) return;
      const next = [...tripDestinations];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      reorderTripDestinations(next);
    },
    [tripDestinations, reorderTripDestinations]
  );

  // ── Interests toggle ───────────────────────────────────────
  const toggleInterest = (label) => {
    const nextInterests = interests.includes(label)
      ? interests.filter((i) => i !== label)
      : [...interests, label];
    setTripPreferences({ interests: nextInterests });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-border-light overflow-hidden">

      {/* ── Your Trip header ──────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 border-b border-border-light flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-forest-green/10 flex items-center justify-center">
            <Route size={14} className="text-forest-green" />
          </div>
          <div>
            <h2 className="font-black text-text-dark text-sm uppercase tracking-wider">
              Your Trip
            </h2>
            <p className="text-[11px] text-muted-text">
              {tripDestinations.length}{' '}
              {tripDestinations.length === 1 ? 'destination' : 'destinations'}
            </p>
          </div>
        </div>
        {hasStops && (
          <button
            onClick={clearTrip}
            aria-label="Clear all destinations"
            className="text-[11px] font-bold text-muted-text hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── Scrollable body ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ── Empty state ──────────────────────────────────── */}
        {!hasStops ? (
          <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-beige flex items-center justify-center mb-3">
              <MapPin size={24} className="text-forest-green opacity-60" />
            </div>
            <p className="font-bold text-text-dark text-sm mb-1">
              Start building your trip
            </p>
            <p className="text-xs text-muted-text leading-relaxed mb-4">
              Search and add destinations to create your Uttarakhand itinerary.
            </p>
            <button
              onClick={onFocusSearch}
              className="btn-primary text-xs py-2 px-5 rounded-full"
            >
              <Plus size={14} /> Add Destination
            </button>
          </div>
        ) : (
          <div className="px-3 pt-3 pb-2">

            {/* Route stats pill */}
            {tripDestinations.length >= 2 && tripStats.totalDistanceKm > 0 && (
              <div className="bg-forest-green/8 border border-forest-green/20 rounded-xl px-3 py-2 flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-forest-green flex items-center gap-1.5">
                  <Route size={13} /> {tripStats.totalDistanceKm} km
                </span>
                <span className="text-xs font-bold text-earth-brown flex items-center gap-1">
                  <Clock size={12} /> ~{tripStats.estimatedTime}
                </span>
              </div>
            )}

            {/* Selected destinations list */}
            <ul className="flex flex-col gap-2 mb-3">
              {tripDestinations.map((dest, idx) => {
                const id = dest._id || dest.id || dest.slug;
                return (
                  <li
                    key={id}
                    className="bg-[#faf9f6] rounded-xl border border-border-light flex items-center gap-2.5 p-2 group hover:border-forest-green/30 transition-all"
                  >
                    {/* Number badge */}
                    <div className="w-7 h-7 rounded-full bg-forest-green text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                      {idx + 1}
                    </div>

                    {/* Thumb */}
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-beige flex-shrink-0">
                      <img
                        src={dest.image || '/assets/fallback.svg'}
                        alt={dest.name}
                        loading="lazy"
                        onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-dark text-xs truncate">
                        {dest.name}
                      </p>
                      <p className="text-[10px] text-muted-text truncate">
                        {dest.district}
                        {dest.category ? ` • ${dest.category}` : ''}
                      </p>
                    </div>

                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        aria-label="Move up"
                        className={`p-0.5 rounded text-muted-text hover:text-text-dark transition-colors ${idx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === tripDestinations.length - 1}
                        aria-label="Move down"
                        className={`p-0.5 rounded text-muted-text hover:text-text-dark transition-colors ${idx === tripDestinations.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeTripDestination(id)}
                      aria-label={`Remove ${dest.name}`}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-muted-text hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <X size={13} />
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* + Add More */}
            <button
              onClick={onFocusSearch}
              className="w-full py-2 rounded-xl border-2 border-dashed border-forest-green/30 hover:border-forest-green text-forest-green text-xs font-bold flex items-center justify-center gap-1 transition-all hover:bg-forest-green/5"
            >
              <Plus size={13} /> Add More Destinations
            </button>
          </div>
        )}

        {/* ── Trip Preferences ─────────────────────────────── */}
        <div className="px-3 pb-3">
          <div className="mt-3 pt-3 border-t border-border-light">
            <h3 className="text-[11px] font-black text-text-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-beige flex items-center justify-center text-forest-green">⚙</span>
              Trip Preferences
            </h3>

            {/* 2-col grid for compact layout */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-3">
              {/* Trip Type */}
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1">
                  Trip Type
                </label>
                <select
                  value={tripType}
                  onChange={(e) => setTripPreferences({ tripType: e.target.value })}
                  className="w-full text-xs font-semibold bg-[#faf9f6] border border-border-light rounded-lg px-2 py-1.5 text-text-dark focus:outline-none focus:ring-1 focus:ring-forest-green"
                >
                  {TRIP_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setTripPreferences({ duration: e.target.value })}
                  className="w-full text-xs font-semibold bg-[#faf9f6] border border-border-light rounded-lg px-2 py-1.5 text-text-dark focus:outline-none focus:ring-1 focus:ring-forest-green"
                >
                  {DURATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              {/* Travel Mode */}
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1">
                  Travel Mode
                </label>
                <select
                  value={travelMode}
                  onChange={(e) => setTripPreferences({ travelMode: e.target.value })}
                  className="w-full text-xs font-semibold bg-[#faf9f6] border border-border-light rounded-lg px-2 py-1.5 text-text-dark focus:outline-none focus:ring-1 focus:ring-forest-green"
                >
                  {TRAVEL_MODES.map((m) => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Travelers */}
              <div>
                <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1">
                  Travelers
                </label>
                <select
                  value={travelers}
                  onChange={(e) => setTripPreferences({ travelers: e.target.value })}
                  className="w-full text-xs font-semibold bg-[#faf9f6] border border-border-light rounded-lg px-2 py-1.5 text-text-dark focus:outline-none focus:ring-1 focus:ring-forest-green"
                >
                  {TRAVELER_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Interests chips */}
            <div className="mt-3">
              <label className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-2">
                Interests
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INTERESTS.map((label) => {
                  const active = interests.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleInterest(label)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        active
                          ? 'bg-forest-green text-white'
                          : 'bg-beige text-text-dark hover:bg-[#e6ddcd]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action buttons (sticky bottom) ────────────────── */}
      <div className="px-3 py-3 border-t border-border-light flex flex-col gap-2 flex-shrink-0 bg-white">
        {/* Validation hint */}
        {!hasStops && (
          <p className="text-[11px] text-muted-text text-center mb-1">
            Add at least one destination to generate your trip
          </p>
        )}

        {/* Notifies user if stops or preferences changed after an itinerary was generated */}
        {itineraryStatus === 'MODIFIED' && hasStops && (
          <div className="text-[11px] text-earth-brown bg-[#fbf8f2] border border-earth-brown/30 rounded-xl px-3 py-2 font-medium flex items-center gap-1.5 animate-fadeIn">
            <span>⚠️</span>
            <span>Your stops or preferences changed. Generate the itinerary again.</span>
          </div>
        )}

        {/* Generate */}
        <button
          onClick={generateTripItinerary}
          disabled={!hasStops || isGenerating}
          className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
            hasStops && !isGenerating
              ? 'bg-forest-green hover:bg-dark-green text-white shadow-md hover:shadow-lg active:scale-[0.99]'
              : 'bg-beige text-muted-text cursor-not-allowed'
          }`}
        >
          <Sparkles size={16} className={isGenerating ? 'animate-spin' : ''} />
          {isGenerating ? 'Generating Itinerary...' : 'Generate My Trip'}
        </button>
      </div>
    </div>
  );
}
