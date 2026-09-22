import React from 'react';
import { PRESET_ITINERARIES, buildTripFromIds } from '../../services/tripService';
import { useMapStore } from '../../store/mapStore';
import { MdCheckCircle, MdDirectionsCar, MdCalendarToday } from 'react-icons/md';

export default function RouteSelector({ activePresetId, onSelectPreset }) {
  const { reorderTripDestinations } = useMapStore();

  const handleApplyPreset = (itinerary) => {
    const loadedDestinations = buildTripFromIds(itinerary.destinations);
    reorderTripDestinations(loadedDestinations);
    if (onSelectPreset) {
      onSelectPreset(itinerary);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
        Popular Recommended Circuits
      </label>

      <div className="grid grid-cols-1 gap-2.5">
        {PRESET_ITINERARIES.map((item) => {
          const isSelected = activePresetId === item.id;
          return (
            <div
              key={item.id}
              onClick={() => handleApplyPreset(item)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/70 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-slate-100 m-0 leading-snug">
                  {item.title}
                </h4>
                {isSelected && <MdCheckCircle className="text-amber-400 text-base flex-shrink-0" />}
              </div>

              <p className="text-[11px] text-amber-400/90 font-medium mt-0.5 mb-2">
                {item.idealFor}
              </p>

              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded">
                  <MdCalendarToday className="text-amber-400" /> {item.duration}
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded">
                  <MdDirectionsCar className="text-amber-400" /> {item.destinations.length} Key Stops
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
