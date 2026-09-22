import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { MdStar, MdTerrain, MdLuggage, MdCheck } from 'react-icons/md';

export default function DestinationPopup({ destination }) {
  const { tripDestinations, addTripDestination, removeTripDestination } = useMapStore();
  const isAdded = tripDestinations.some((d) => d.id === destination.id);

  return (
    <div className="destination-popup-card w-64 p-0 text-slate-100 font-sans">
      {/* Thumbnail */}
      <div className="relative h-28 w-full overflow-hidden rounded-t-xl">
        <img
          src={destination.image}
          alt={destination.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20" />
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-amber-400 border border-amber-500/30 backdrop-blur-sm flex items-center gap-1">
          <MdStar className="text-amber-400" /> {destination.rating}
        </span>
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-black/60 text-slate-200 backdrop-blur-sm flex items-center gap-1">
          <MdTerrain /> {destination.altitude}m
        </span>
      </div>

      {/* Body */}
      <div className="p-3 bg-slate-900 rounded-b-xl border border-t-0 border-slate-700/60">
        <h3 className="font-bold text-sm text-white m-0 truncate">{destination.name}</h3>
        <p className="text-[11px] text-amber-400/90 font-medium m-0 mt-0.5">
          {destination.district} &bull; {destination.region} Region
        </p>

        <p className="text-xs text-slate-300 mt-1.5 mb-2 line-clamp-2 leading-relaxed">
          {destination.shortDesc}
        </p>

        <div className="flex items-center gap-1 flex-wrap mb-3">
          {destination.tags?.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={() => {
            if (isAdded) {
              removeTripDestination(destination.id);
            } else {
              addTripDestination(destination);
            }
          }}
          className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isAdded
              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
          }`}
        >
          {isAdded ? (
            <>
              <MdCheck className="text-sm" /> Added to Itinerary
            </>
          ) : (
            <>
              <MdLuggage className="text-sm" /> + Add to Itinerary
            </>
          )}
        </button>
      </div>
    </div>
  );
}
