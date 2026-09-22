import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { MAP_LAYERS, TILE_PROVIDERS } from '../../utils/constants';
import { 
  MdLayers, 
  MdPlace, 
  MdAltRoute, 
  MdHotel, 
  MdSportsKabaddi, 
  MdSelfImprovement,
  MdMap,
  MdTerrain,
  MdSatellite,
  MdDarkMode
} from 'react-icons/md';

const LAYER_ICONS = {
  destinations: MdPlace,
  routes: MdAltRoute,
  stays: MdHotel,
  activities: MdSportsKabaddi,
  spiritual: MdSelfImprovement
};

const TILE_ICONS = {
  voyager: MdMap,
  topo: MdTerrain,
  satellite: MdSatellite,
  dark: MdDarkMode
};

export default function LayerControls() {
  const { layers, toggleLayer, activeTileLayer, setActiveTileLayer } = useMapStore();

  return (
    <div className="space-y-5">
      {/* Base Map Style Selector */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <MdLayers className="text-amber-400 text-sm" />
          <span>Base Map Style</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TILE_PROVIDERS).map(([key, provider]) => {
            const Icon = TILE_ICONS[key] || MdMap;
            const isSelected = activeTileLayer === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTileLayer(key)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium transition-all text-left border ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-md ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                  <Icon className="text-sm" />
                </div>
                <span className="truncate">{provider.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Overlays & Data Layers */}
      <div>
        <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <MdLayers className="text-amber-400 text-sm" />
          <span>GIS Map Overlays</span>
        </div>
        <div className="space-y-1.5">
          {MAP_LAYERS.map((layer) => {
            const Icon = LAYER_ICONS[layer.id] || MdPlace;
            const isActive = !!layers[layer.id];
            return (
              <div
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                  isActive
                    ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                    : 'bg-slate-900/40 border-transparent text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`text-base ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{layer.label}</span>
                </div>

                {/* Switch Toggle */}
                <div
                  className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                    isActive ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform duration-200 ${
                      isActive ? 'translate-x-3.5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
