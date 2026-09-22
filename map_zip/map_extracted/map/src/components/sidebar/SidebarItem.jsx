import React from 'react';

export default function SidebarItem({ id, label, icon: Icon, isActive, onClick, badge, count }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-500/10'
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-1.5 rounded-lg transition-colors ${
            isActive
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/50'
              : 'bg-slate-800/80 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-700'
          }`}
        >
          {Icon && <Icon className="text-base" />}
        </div>
        <span className="truncate">{label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {badge && (
          <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {badge}
          </span>
        )}
        {count !== undefined && count > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {count}
          </span>
        )}
      </div>
    </button>
  );
}
