import React from 'react';
import { useMapStore } from '../../store/mapStore';
import { 
  MdWbSunny, 
  MdAcUnit, 
  MdCloud, 
  MdAir, 
  MdWaterDrop, 
  MdWarningAmber 
} from 'react-icons/md';

export default function WeatherWidget() {
  const { selectedDestination } = useMapStore();

  if (!selectedDestination) return null;

  // Calculate realistic Himalayan altitude-adjusted weather
  // Standard lapse rate ~ 6.5°C drop per 1000m
  const baseTemp = 28;
  const altitudeKm = (selectedDestination.altitude || 1000) / 1000;
  const tempC = Math.round(baseTemp - altitudeKm * 5.8);

  const isFreezing = tempC <= 5;
  const condition = isFreezing
    ? 'Snow Flurries / Cold'
    : tempC <= 16
    ? 'Pleasant & Crisp'
    : 'Sunny & Warm';

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 shadow-2xl text-slate-100 w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
          Mountain Weather
        </span>
        <span className="text-[10px] text-slate-400 font-mono">Live Simulation</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-black text-white font-mono">{tempC}&deg;C</div>
          <p className="text-xs text-slate-300 font-medium m-0">{condition}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          {isFreezing ? (
            <MdAcUnit className="text-2xl text-sky-400" />
          ) : tempC <= 16 ? (
            <MdCloud className="text-2xl text-amber-300" />
          ) : (
            <MdWbSunny className="text-2xl text-amber-400" />
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <MdAir className="text-amber-400 text-sm" />
          <span>14 km/h wind</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MdWaterDrop className="text-amber-400 text-sm" />
          <span>48% humidity</span>
        </div>
      </div>

      {/* High-altitude pass advisory */}
      {selectedDestination.altitude > 3000 && (
        <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-1.5 text-[10px] text-amber-300 leading-tight">
          <MdWarningAmber className="text-sm flex-shrink-0 mt-0.5" />
          <span>High-altitude zone (&gt;3,000m). Warm layers and acclimatization required.</span>
        </div>
      )}
    </div>
  );
}
