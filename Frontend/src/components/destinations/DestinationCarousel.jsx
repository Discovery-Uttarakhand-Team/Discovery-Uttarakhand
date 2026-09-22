import React, { useRef, useState, useEffect } from 'react';
import { MdChevronLeft, MdChevronRight, MdAutoAwesome, MdClose } from 'react-icons/md';
import { useMapStore } from '../../store/mapStore';
import DestinationCard from './DestinationCard';

export default function DestinationCarousel() {
  const { allDestinations, selectedCategory, setSelectedDestination, isCarouselOpen, toggleCarousel, isSidebarOpen } = useMapStore();
  const scrollRef = useRef(null);

  if (!isCarouselOpen) return null;

  // Filter destinations based on the active category
  const filteredDestinations = allDestinations.filter((dest) => {
    if (selectedCategory === 'all') return true;
    return dest.category === selectedCategory;
  });

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (filteredDestinations.length === 0) return null;

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
              onClick={() => scroll('left')}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Scroll Left"
            >
              <MdChevronLeft className="text-base" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Scroll Right"
            >
              <MdChevronRight className="text-base" />
            </button>
            <button
              onClick={toggleCarousel}
              className="p-1.5 ml-2 rounded-lg bg-slate-800/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
              title="Close Carousel"
            >
              <MdClose className="text-base" />
            </button>
          </div>
        </div>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory hide-scrollbar"
        >
          {filteredDestinations.map((dest) => (
            <div
              key={dest._id || dest.id}
              className="snap-start shrink-0 cursor-pointer"
              onClick={() => setSelectedDestination(dest)}
            >
              <DestinationCard destination={dest} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
