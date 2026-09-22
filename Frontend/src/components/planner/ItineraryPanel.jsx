import React from 'react';
import { MdSchedule, MdHotel, MdDirectionsCar, MdLocationPin } from 'react-icons/md';

export default function ItineraryPanel({ days = [] }) {
  if (!days || days.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-xs">
        Select stops or choose a recommended tour package to generate your detailed schedule.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Day-by-Day Journey Schedule
        </label>
        <span className="text-xs text-amber-400 font-bold">{days.length} Total Days</span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {days.map((item, index) => (
          <div key={index} className="relative group">
            {/* Timeline Dot */}
            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center shadow-md shadow-amber-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>

            {/* Day Card */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 group-hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Day {item.day || index + 1}
                </span>
                {item.stay && (
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MdHotel className="text-amber-400" /> Stay: <strong className="text-slate-200">{item.stay}</strong>
                  </span>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-100 m-0 mt-1">
                {item.title}
              </h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
