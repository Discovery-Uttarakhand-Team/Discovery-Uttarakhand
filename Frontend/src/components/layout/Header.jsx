import React, { useState } from 'react';
import { 
  MdSearch, 
  MdNotificationsNone, 
  MdArrowForward,
  MdTerrain
} from 'react-icons/md';
import { useMapStore } from '../../store/mapStore';

export default function Header() {
  const { searchQuery, setSearchQuery, activeSidebarTab, setActiveSidebarTab } = useMapStore();
  const [activeNav, setActiveNav] = useState('Trip Planner');

  const navLinks = [
    'Home',
    'Explore',
    'Stays',
    'Activities',
    'Rentals',
    'Guides',
    'Trip Planner'
  ];

  return (
    <header className="w-full h-14 bg-[#0a0f1d]/95 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between z-[1100] relative text-slate-200 select-none">
      {/* 1. Left Brand */}
      <div className="flex items-center gap-2.5 cursor-pointer">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20">
          <MdTerrain className="text-xl text-slate-950" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
            Discovery <span className="text-white">Uttarakhand</span>
          </div>
          <div className="text-[10px] text-slate-400 tracking-wider">
            Explore &bull; Plan &bull; Experience
          </div>
        </div>
      </div>

      {/* 2. Center Search Bar */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative flex items-center">
          <MdSearch className="absolute left-3.5 text-slate-400 text-lg pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations, stays, activities, guides..."
            className="w-full h-9 pl-10 pr-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 transition-all"
          />
        </div>
      </div>

      {/* 3. Right Navigation & Profile */}
      <div className="flex items-center gap-5">
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300">
          {navLinks.map((link) => {
            const isActive = activeNav === link;
            return (
              <button
                key={link}
                onClick={() => {
                  setActiveNav(link);
                  if (link === 'Explore') setActiveSidebarTab('explore');
                  if (link === 'Trip Planner') setActiveSidebarTab('planner');
                }}
                className={`relative py-1 transition-colors hover:text-white ${
                  isActive ? 'text-white font-semibold' : 'text-slate-400'
                }`}
              >
                {link}
                {isActive && (
                  <span className="absolute bottom-[-16px] left-0 right-0 h-[2.5px] bg-emerald-400 rounded-full shadow-sm shadow-emerald-400/50" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800/80">
          {/* Arrow shortcut */}
          <button 
            onClick={() => setActiveSidebarTab('planner')}
            className="w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Next"
          >
            <MdArrowForward className="text-sm" />
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button className="text-slate-300 hover:text-white transition-colors p-1">
              <MdNotificationsNone className="text-lg" />
            </button>
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-950" />
          </div>

          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40 p-0.5 cursor-pointer hover:border-emerald-400 transition-colors">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop"
              alt="User profile"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
