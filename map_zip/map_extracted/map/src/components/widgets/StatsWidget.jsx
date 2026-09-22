import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { MdTerrain, MdCalendarToday, MdAccessTime, MdLocationCity } from 'react-icons/md';

export default function StatsWidget() {
  const { selectedDestination } = useMapStore();

  if (!selectedDestination) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl text-slate-100 w-64">
      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block mb-2">
        Destination Quick Stats
      </span>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <MdTerrain className="text-amber-400 text-sm" /> Elevation
          </span>
          <span className="font-bold text-white font-mono">{selectedDestination.altitude} meters</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <MdLocationCity className="text-amber-400 text-sm" /> District
          </span>
          <span className="font-bold text-white">{selectedDestination.district}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5">
            <MdCalendarToday className="text-amber-400 text-sm" /> Best Season
          </span>
          <span className="font-bold text-amber-300">{selectedDestination.bestSeason}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="text-slate-400 flex items-center gap-1.5">
            <MdAccessTime className="text-amber-400 text-sm" /> Recommended
          </span>
          <span className="font-bold text-white">{selectedDestination.idealDays}</span>
        </div>
      </div>
    </div>
  );
}
