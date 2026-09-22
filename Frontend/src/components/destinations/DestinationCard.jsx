import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { MdStar, MdTerrain, MdLuggage, MdCheck } from 'react-icons/md';

export default function DestinationCard({ destination }) {
  const { 
    selectedDestination, 
    setSelectedDestination, 
    tripDestinations, 
    addTripDestination, 
    removeTripDestination 
  } = useMapStore();

  const isSelected = selectedDestination?.id === destination.id;
  const isAdded = tripDestinations.some((d) => d.id === destination.id);

  return (
    <div
      onClick={() => setSelectedDestination(destination)}
      className={`relative w-72 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border ${
        isSelected
          ? 'bg-slate-900 border-amber-500 shadow-xl shadow-amber-500/20 scale-[1.02]'
          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:scale-[1.01]'
      } backdrop-blur-xl group`}
    >
      {/* Hero Image */}
      <div className="relative h-32 w-full overflow-hidden">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

        {/* Category Chip */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-amber-300 border border-amber-500/30 backdrop-blur-md">
          {destination.category.replace('_', ' ')}
        </span>

        {/* Rating */}
        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-950/80 text-amber-400 border border-amber-500/30 backdrop-blur-md flex items-center gap-1">
          <MdStar className="text-amber-400" /> {destination.rating}
        </span>

        {/* Elevation */}
        <span className="absolute bottom-2 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-slate-200 backdrop-blur-md flex items-center gap-1">
          <MdTerrain /> {destination.altitude}m
        </span>
      </div>

      {/* Info Container */}
      <div className="p-3">
        <h4 className="font-bold text-sm text-white truncate m-0 group-hover:text-amber-400 transition-colors">
          {destination.name}
        </h4>
        <p className="text-[11px] text-slate-400 m-0 mt-0.5 truncate">
          {destination.district} &bull; {destination.region} Uttarakhand
        </p>

        <p className="text-xs text-slate-300 mt-1.5 mb-2.5 line-clamp-2 leading-relaxed">
          {destination.shortDesc}
        </p>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[10px] text-amber-400/90 font-medium">
            Best: {destination.bestSeason}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isAdded) {
                removeTripDestination(destination.id);
              } else {
                addTripDestination(destination);
              }
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              isAdded
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
            }`}
          >
            {isAdded ? (
              <>
                <MdCheck className="text-xs" /> In Trip
              </>
            ) : (
              <>
                <MdLuggage className="text-xs" /> + Add
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
