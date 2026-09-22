import React, { useRef } from 'react';
import { useMapStore } from '../../store/mapStore';
import DestinationCard from './DestinationCard';
import destinationsData from '../../data/destinations.json';
import { 
  MdChevronLeft, 
  MdChevronRight, 
  MdClose, 
  MdAutoAwesome 
} from 'react-icons/md';

export default function DestinationCarousel() {
  const { isCarouselOpen, toggleCarousel, isSidebarOpen, selectedCategory } = useMapStore();
  const scrollRef = useRef(null);

  if (!isCarouselOpen) return null;

  const filteredDestinations = destinationsData.filter(
    (d) => selectedCategory === 'all' || d.category === selectedCategory
  );

  const scroll = (offset) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`fixed bottom-4 ${
        isSidebarOpen ? 'left-92 md:left-100' : 'left-4'
      } right-4 z-[990] transition-all duration-300 ease-in-out`}
    >
      <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-3 shadow-2xl">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400">
              <MdAutoAwesome className="text-xs" />
            </span>
            <span className="text-xs font-bold text-white tracking-wide">
              Featured Devbhoomi Destinations ({filteredDestinations.length})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => scroll(-300)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Scroll Left"
            >
              <MdChevronLeft className="text-base" />
            </button>
            <button
              onClick={() => scroll(300)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Scroll Right"
            >
              <MdChevronRight className="text-base" />
            </button>
            <button
              onClick={toggleCarousel}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Close Carousel"
            >
              <MdClose className="text-base" />
            </button>
          </div>
        </div>

        {/* Scrollable Cards Container */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 custom-scrollbar scroll-smooth"
        >
          {filteredDestinations.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      </div>
    </div>
  );
}
