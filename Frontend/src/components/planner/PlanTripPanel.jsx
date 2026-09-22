import React, { useState } from 'react';
import { 
  MdAutoAwesome, 
  MdCheckCircle, 
  MdRadioButtonUnchecked, 
  MdTune, 
  MdChevronRight, 
  MdFavoriteBorder, 
  MdMoreVert,
  MdLocationOn,
  MdCalendarToday,
  MdDirectionsCar,
  MdPeople
} from 'react-icons/md';
import { useMapStore } from '../../store/mapStore';

export default function PlanTripPanel() {
  const { toggleTripPlanner } = useMapStore();
  const [tripType, setTripType] = useState('Round Trip');
  const [startingFrom, setStartingFrom] = useState('Delhi');
  const [duration, setDuration] = useState('5 Days');
  const [travelMode, setTravelMode] = useState('By Car');
  const [travelers, setTravelers] = useState('2 Adults');

  const [interests, setInterests] = useState(['Nature', 'Adventure']);

  const toggleInterest = (interest) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const allInterests = [
    'Nature',
    'Adventure',
    'Spiritual',
    'Wildlife',
    'Culture',
    'Relaxation',
    'Trekking',
    'Food'
  ];

  const suggestedItinerary = [
    {
      day: 1,
      badgeColor: 'bg-[#10b981]',
      title: 'Delhi → Rishikesh',
      meta: '240 km • 6h',
      image: 'https://images.unsplash.com/photo-1596761226848-6d5df65b4c19?q=80&w=200&auto=format&fit=crop'
    },
    {
      day: 2,
      badgeColor: 'bg-[#f59e0b]',
      title: 'Rishikesh → Tehri → Dhanaulti',
      meta: '130 km • 5h',
      image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=200&auto=format&fit=crop'
    },
    {
      day: 3,
      badgeColor: 'bg-[#3b82f6]',
      title: 'Dhanaulti → Auli',
      meta: '220 km • 6h 30m',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=200&auto=format&fit=crop'
    },
    {
      day: 4,
      badgeColor: 'bg-[#8b5cf6]',
      title: 'Auli → Joshimath → Badrinath',
      meta: '50 km • 2h',
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=200&auto=format&fit=crop'
    },
    {
      day: 5,
      badgeColor: 'bg-[#ef4444]',
      title: 'Badrinath → Rishikesh → Delhi',
      meta: 'Return • 10h',
      image: 'https://images.unsplash.com/photo-1609137144822-0d1a45749323?q=80&w=200&auto=format&fit=crop'
    }
  ];

  return (
    <aside className="w-80 h-[calc(100vh-3.5rem)] bg-[#0a0f1d]/95 backdrop-blur-xl border-l border-slate-800/80 flex flex-col justify-between p-3 select-none z-[1000] overflow-y-auto custom-scrollbar flex-shrink-0 text-slate-200">
      <div className="space-y-3.5">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MdAutoAwesome className="text-emerald-400 text-base" />
              <h2 className="text-xs font-bold text-white tracking-tight m-0">
                Plan Your Uttarakhand Trip
              </h2>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 flex items-center gap-0.5">
              <MdAutoAwesome className="text-[9px]" /> AI
            </span>
          </div>
          <p className="text-[10px] text-slate-400 m-0 mt-0.5">
            Create your perfect itinerary and see it on the map
          </p>
        </div>

        {/* Trip Mode Switch */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] font-medium">
          {['One Way', 'Round Trip', 'Multi-City'].map((mode) => (
            <button
              key={mode}
              onClick={() => setTripType(mode)}
              className={`py-1 rounded-lg text-center transition-all ${
                tripType === mode
                  ? 'bg-[#10b981] text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Inputs 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {/* Starting From */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Starting From</label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 cursor-pointer hover:border-slate-700">
              <span className="flex items-center gap-1 truncate">
                <MdLocationOn className="text-emerald-400 text-xs flex-shrink-0" /> {startingFrom}
              </span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Duration</label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 cursor-pointer hover:border-slate-700">
              <span className="flex items-center gap-1 truncate">
                <MdCalendarToday className="text-emerald-400 text-xs flex-shrink-0" /> {duration}
              </span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>
          </div>

          {/* Travel Mode */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Travel Mode</label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 cursor-pointer hover:border-slate-700">
              <span className="flex items-center gap-1 truncate">
                <MdDirectionsCar className="text-emerald-400 text-xs flex-shrink-0" /> {travelMode}
              </span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>
          </div>

          {/* Travelers */}
          <div className="space-y-1">
            <label className="text-[10px] text-slate-400">Travelers</label>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 cursor-pointer hover:border-slate-700">
              <span className="flex items-center gap-1 truncate">
                <MdPeople className="text-emerald-400 text-xs flex-shrink-0" /> {travelers}
              </span>
              <span className="text-slate-400 text-[10px]">▼</span>
            </div>
          </div>
        </div>

        {/* Interests Multi-Select */}
        <div>
          <label className="text-[10px] font-semibold text-slate-400 block mb-1.5">
            Interests (Select Multiple)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {allInterests.map((interest) => {
              const isSelected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-[11px] font-medium border transition-all text-left ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/80 text-emerald-300'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {isSelected ? (
                    <MdCheckCircle className="text-emerald-400 text-xs flex-shrink-0" />
                  ) : (
                    <MdRadioButtonUnchecked className="text-slate-600 text-xs flex-shrink-0" />
                  )}
                  <span className="truncate">{interest}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Button + Filter Toggle */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={() => toggleTripPlanner(true)}
            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
          >
            <MdAutoAwesome className="text-sm" /> Generate My Trip
          </button>
          <button 
            onClick={() => toggleTripPlanner(true)}
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <MdTune className="text-base" />
          </button>
        </div>

        {/* Suggested Itinerary Section */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white">Suggested Itinerary</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 font-mono">
              ⏱ 5 Days
            </span>
          </div>

          <div className="space-y-1.5">
            {suggestedItinerary.map((item) => (
              <div
                key={item.day}
                className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 hover:border-slate-700 cursor-pointer transition-all group"
              >
                {/* Day Badge */}
                <div
                  className={`w-4 h-4 rounded-full ${item.badgeColor} text-slate-950 font-black text-[9px] flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  {item.day}
                </div>

                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider w-8">
                  Day {item.day}
                </span>

                {/* Thumbnail */}
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-slate-200 group-hover:text-emerald-400 truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{item.meta}</div>
                </div>

                <MdChevronRight className="text-slate-500 group-hover:text-slate-300 text-sm flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center gap-1.5 mt-3">
        <button
          onClick={() => toggleTripPlanner(true)}
          className="flex-1 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors"
        >
          View Full Itinerary
        </button>

        <button
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-red-400 text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Save Trip"
        >
          <MdFavoriteBorder className="text-sm" /> Save Trip
        </button>

        <button
          className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-colors"
          title="More Options"
        >
          <MdMoreVert className="text-base" />
        </button>
      </div>
    </aside>
  );
}
