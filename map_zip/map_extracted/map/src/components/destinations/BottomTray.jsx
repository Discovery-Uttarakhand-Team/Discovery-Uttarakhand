import React, { useRef } from 'react';
import { 
  MdFavoriteBorder, 
  MdFavorite, 
  MdArrowForward, 
  MdChevronRight, 
  MdTerrain,
  MdAutoAwesome
} from 'react-icons/md';
import { useMapStore } from '../../store/mapStore';

export default function BottomTray() {
  const { setSelectedDestination } = useMapStore();
  const scrollRef = useRef(null);

  const topDestinations = [
    {
      id: 'nainital',
      name: 'Nainital',
      altitude: '1,938 m',
      image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?q=80&w=400&auto=format&fit=crop',
      coordinates: [29.3919, 79.4542]
    },
    {
      id: 'rishikesh',
      name: 'Rishikesh',
      altitude: '372 m',
      image: 'https://images.unsplash.com/photo-1596761226848-6d5df65b4c19?q=80&w=400&auto=format&fit=crop',
      coordinates: [30.0869, 78.2676]
    },
    {
      id: 'auli',
      name: 'Auli',
      altitude: '2,800 m',
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?q=80&w=400&auto=format&fit=crop',
      coordinates: [30.5310, 79.5694]
    },
    {
      id: 'kedarnath',
      name: 'Kedarnath',
      altitude: '3,583 m',
      image: 'https://images.unsplash.com/photo-1609137144822-0d1a45749323?q=80&w=400&auto=format&fit=crop',
      coordinates: [30.7352, 79.0669]
    },
    {
      id: 'valley_of_flowers',
      name: 'Valley of Flowers',
      altitude: '3,658 m',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=400&auto=format&fit=crop',
      coordinates: [30.7280, 79.6053]
    },
    {
      id: 'mussoorie',
      name: 'Mussoorie',
      altitude: '2,005 m',
      image: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?q=80&w=400&auto=format&fit=crop',
      coordinates: [30.4598, 78.0644]
    },
    {
      id: 'corbett',
      name: 'Jim Corbett',
      altitude: '520 m',
      image: 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?q=80&w=400&auto=format&fit=crop',
      coordinates: [29.5300, 78.7747]
    }
  ];

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-[#070b16]/95 backdrop-blur-xl border-t border-slate-800/80 px-4 py-2 flex items-center justify-between gap-4 z-[1000] select-none">
      {/* 1. Left: Top Destinations Carousel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-xs font-bold text-white tracking-wide">Top Destinations</span>
          <button className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors">
            View All <MdArrowForward />
          </button>
        </div>

        {/* Carousel row with scroll arrow */}
        <div className="relative flex items-center">
          <div
            ref={scrollRef}
            className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar pb-1 scroll-smooth w-full"
          >
            {topDestinations.map((dest) => (
              <div
                key={dest.id}
                onClick={() => setSelectedDestination(dest)}
                className="relative w-36 h-20 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 group border border-slate-800 hover:border-emerald-500/70 transition-all"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-black/20 to-transparent" />

                {/* Heart Button */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-red-400 transition-colors"
                >
                  <MdFavoriteBorder className="text-xs" />
                </button>

                {/* Info Text */}
                <div className="absolute bottom-1.5 left-2 right-2">
                  <div className="text-xs font-bold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                    {dest.name}
                  </div>
                  <div className="text-[10px] text-slate-300 font-mono flex items-center gap-0.5">
                    {dest.altitude}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={scrollRight}
            className="w-7 h-7 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center ml-2 flex-shrink-0 shadow-lg"
            title="Scroll Next"
          >
            <MdChevronRight className="text-base" />
          </button>
        </div>
      </div>

      {/* 2. Right: Explore More Circuits Card */}
      <div className="hidden lg:flex items-center gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex-shrink-0 w-80">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-white leading-snug">
            Explore More Uttarakhand Circuits
          </div>
          <p className="text-[10px] text-slate-400 m-0 mt-0.5 leading-tight line-clamp-1">
            Char Dham, Panch Kedar, Kumaon Lakes and more
          </p>
          <button className="mt-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition-colors">
            Explore Circuits <MdArrowForward className="text-xs" />
          </button>
        </div>

        <img
          src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=200&auto=format&fit=crop"
          alt="Char Dham Circuit"
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-slate-700"
        />
      </div>

      {/* 3. Floating AI Assistant Widget */}
      <div className="hidden xl:flex items-center gap-2 p-1.5 pr-3 rounded-full bg-slate-900/95 border border-slate-800 shadow-xl flex-shrink-0 cursor-pointer hover:border-emerald-500/60 transition-all">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-400 flex-shrink-0">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=120&auto=format&fit=crop"
            alt="AI Travel Assistant"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="leading-tight">
          <div className="text-[10px] text-slate-400">Need help planning?</div>
          <div className="text-[11px] font-bold text-slate-200">Ask our AI travel assistant</div>
        </div>
      </div>
    </div>
  );
}
