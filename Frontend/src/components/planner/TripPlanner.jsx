import React, { useState } from 'react';
import { useMapStore } from '../../store/mapStore';
import RouteSelector from './RouteSelector';
import InterestSelector from './InterestSelector';
import ItineraryPanel from './ItineraryPanel';

import { PRESET_ITINERARIES } from '../../services/tripService.js';
import { 
  MdClose, 
  MdLuggage, 
  MdArrowUpward, 
  MdArrowDownward, 
  MdDeleteOutline, 
  MdPrint,
  MdNavigation
} from 'react-icons/md';

export default function TripPlanner() {
  const {
    isTripPlannerOpen,
    toggleTripPlanner,
    tripDestinations,
    reorderTripDestinations,
    removeTripDestination,
    clearTrip,
    tripStats
  } = useMapStore();

  const [selectedInterests, setSelectedInterests] = useState(['spiritual', 'trekking']);
  const [activePreset, setActivePreset] = useState(PRESET_ITINERARIES[0]);

  if (!isTripPlannerOpen) return null;

  const handleToggleInterest = (id) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMoveStop = (index, direction) => {
    const newDestinations = [...tripDestinations];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newDestinations.length) return;

    const temp = newDestinations[index];
    newDestinations[index] = newDestinations[targetIndex];
    newDestinations[targetIndex] = temp;
    reorderTripDestinations(newDestinations);
  };

  // Generate dynamic days from stops if no preset days are loaded
  const displayDays = activePreset?.days || tripDestinations.map((dest, i) => ({
    day: i + 1,
    title: `Visit ${dest.name}`,
    desc: dest.shortDesc || `Explore attractions around ${dest.district}`,
    stay: dest.name
  }));

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <MdLuggage className="text-2xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white m-0">Uttarakhand Trip & Itinerary Planner</h2>
              <p className="text-xs text-slate-400 m-0">Design, calculate mountain drive times, and optimize your Himalayan route</p>
            </div>
          </div>

          <button
            onClick={() => toggleTripPlanner(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <MdClose className="text-2xl" />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 px-6 py-3 bg-amber-500/5 border-b border-amber-500/20 text-center">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Stops</span>
            <div className="text-lg font-bold text-amber-400 font-mono">{tripDestinations.length}</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Distance</span>
            <div className="text-lg font-bold text-amber-400 font-mono">{tripStats.totalDistanceKm} km</div>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Mountain Drive Duration</span>
            <div className="text-lg font-bold text-amber-400 font-mono">{tripStats.estimatedTime}</div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Preset Circuits & Interests Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RouteSelector
              activePresetId={activePreset?.id}
              onSelectPreset={(preset) => setActivePreset(preset)}
            />
            <div className="space-y-4">
              <InterestSelector
                selectedInterests={selectedInterests}
                onToggle={handleToggleInterest}
              />

              {/* Stops Reordering List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Route Waypoints Order ({tripDestinations.length})
                  </label>
                  {tripDestinations.length > 0 && (
                    <button
                      onClick={clearTrip}
                      className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <MdDeleteOutline /> Clear
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {tripDestinations.map((dest, index) => {
                    const destId = dest._id || dest.id;
                    return (
                    <div
                      key={destId}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-slate-200 truncate">{dest.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({dest.district})</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveStop(index, -1)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move Up"
                        >
                          <MdArrowUpward />
                        </button>
                        <button
                          onClick={() => handleMoveStop(index, 1)}
                          disabled={index === tripDestinations.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                          title="Move Down"
                        >
                          <MdArrowDownward />
                        </button>
                        <button
                          onClick={() => removeTripDestination(destId)}
                          className="p-1 text-slate-500 hover:text-red-400"
                          title="Delete"
                        >
                          <MdDeleteOutline />
                        </button>
                      </div>
                    </div>
                  )})}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Timeline Panel */}
          <div className="pt-4 border-t border-slate-800">
            <ItineraryPanel days={displayDays} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <MdPrint /> Print / Save Itinerary
          </button>

          <button
            onClick={() => toggleTripPlanner(false)}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all"
          >
            <MdNavigation /> View on Map
          </button>
        </div>
      </div>
    </div>
  );
}
