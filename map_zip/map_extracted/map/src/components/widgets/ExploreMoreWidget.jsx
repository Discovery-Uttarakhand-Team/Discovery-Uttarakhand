import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { getNearbyDestinations } from '../../services/destinationService';
import { MdNearMe, MdStar } from 'react-icons/md';

export default function ExploreMoreWidget() {
  const { selectedDestination, setSelectedDestination } = useMapStore();

  if (!selectedDestination) return null;

  const nearby = getNearbyDestinations(selectedDestination.id, 2);

  if (nearby.length === 0) return null;

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl text-slate-100 w-64">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">
        <MdNearMe className="text-sm" />
        <span>Nearby In Circuit</span>
      </div>

      <div className="space-y-2">
        {nearby.map((dest) => (
          <div
            key={dest.id}
            onClick={() => setSelectedDestination(dest)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 cursor-pointer transition-all border border-transparent hover:border-slate-700"
          >
            <img
              src={dest.image}
              alt={dest.name}
              className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-semibold text-white truncate m-0">{dest.name}</h5>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                <span>{dest.district}</span>
                <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                  <MdStar /> {dest.rating}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
