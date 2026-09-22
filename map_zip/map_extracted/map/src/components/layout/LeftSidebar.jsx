import React, { useState } from 'react';
import { 
  MdDashboard, 
  MdPlace, 
  MdTempleHindu, 
  MdHotel, 
  MdDirectionsRun, 
  MdPedalBike, 
  MdPeople, 
  MdLuggage, 
  MdMap,
  MdWbSunny
} from 'react-icons/md';
import { useMapStore } from '../../store/mapStore';

export default function LeftSidebar() {
  const { setSelectedCategory } = useMapStore();
  const [activeItem, setActiveItem] = useState('Plan a Trip');

  // Layer switches state matching the screenshot
  const [layerStates, setLayerStates] = useState({
    Destinations: true,
    Stays: true,
    Activities: true,
    'Spiritual Places': true,
    Rentals: true,
    Guides: true,
    'Food & Cafes': true,
    Viewpoints: true,
    'Treks & Trails': true,
    Wildlife: true,
    'Roads & Transport': true,
    Weather: false,
    'Live Traffic': false
  });

  const toggleSwitch = (name) => {
    setLayerStates((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const navMenuItems = [
    { label: 'Dashboard', icon: MdDashboard },
    { label: 'Destinations', icon: MdPlace, category: 'all' },
    { label: 'Spiritual', icon: MdTempleHindu, category: 'spiritual' },
    { label: 'Stays', icon: MdHotel },
    { label: 'Activities', icon: MdDirectionsRun, category: 'adventure' },
    { label: 'Rentals', icon: MdPedalBike },
    { label: 'Guides', icon: MdPeople },
    { label: 'Plan a Trip', icon: MdLuggage, isSpecial: true },
    { label: 'Map View', icon: MdMap }
  ];

  return (
    <aside className="w-56 h-[calc(100vh-3.5rem)] bg-[#080d19]/95 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between p-3 select-none z-[1000] overflow-y-auto custom-scrollbar flex-shrink-0">
      <div className="space-y-4">
        {/* Main Menu Links */}
        <nav className="space-y-1">
          {navMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;

            if (item.isSpecial) {
              return (
                <button
                  key={item.label}
                  onClick={() => setActiveItem(item.label)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#10b981] hover:bg-[#059669] text-white shadow-lg shadow-emerald-500/25 transition-all my-1"
                >
                  <Icon className="text-base" />
                  <span>{item.label}</span>
                </button>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => {
                  setActiveItem(item.label);
                  if (item.category) setSelectedCategory(item.category);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-400 bg-slate-900/80 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`text-sm ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Map Layers Section */}
        <div className="pt-2 border-t border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-400 tracking-wider block mb-2 px-1">
            Map Layers
          </span>

          <div className="space-y-1.5 px-1">
            {Object.entries(layerStates).map(([layerName, isChecked]) => (
              <div
                key={layerName}
                onClick={() => toggleSwitch(layerName)}
                className="flex items-center justify-between text-xs text-slate-300 hover:text-white cursor-pointer py-0.5 group"
              >
                <span className="text-[11px] text-slate-300 group-hover:text-white truncate">
                  {layerName}
                </span>

                {/* Glowing Toggle Pill */}
                <div
                  className={`w-7 h-4 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                    isChecked ? 'bg-[#10b981] shadow-sm shadow-emerald-500/40' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ${
                      isChecked ? 'translate-x-3' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Weather Widget */}
      <div className="pt-3 border-t border-slate-800/80 mt-3">
        <div className="flex items-center gap-3">
          <div className="text-amber-400">
            <MdWbSunny className="text-3xl" />
          </div>
          <div>
            <div className="text-lg font-black text-white leading-none">22&deg;C</div>
            <div className="text-xs font-semibold text-slate-200">Dehradun</div>
            <div className="text-[10px] text-slate-400 leading-tight">Partly Cloudy</div>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800/40">
          Mon, 12 May 2025 | 10:30 AM
        </div>
      </div>
    </aside>
  );
}
