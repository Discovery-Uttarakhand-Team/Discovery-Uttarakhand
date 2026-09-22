import React from 'react';
import { Cloud, AlertTriangle, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

export default function LiveSafetyBadge({
  status = 'LIVE',
  source = null,
  severity = 'INFO',
  label = null,
  className = ''
}) {
  const getStatusStyles = () => {
    switch (status) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-500',
          icon: CheckCircle,
          text: label || 'LIVE TELEMETRY'
        };
      case 'STALE':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          icon: Clock,
          text: label || 'CACHED TELEMETRY'
        };
      case 'UNAVAILABLE':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-500',
          icon: AlertTriangle,
          text: label || 'FEED OFFLINE'
        };
      case 'UNKNOWN':
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          icon: ShieldCheck,
          text: label || 'OFFLINE VERIFIED'
        };
    }
  };

  const config = getStatusStyles();
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wide transition-all ${config.bg} ${className}`}
      title={source ? `Source: ${source}` : 'Telemetry Status'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      <Icon size={11} className="flex-shrink-0" />
      <span>{config.text}</span>
    </div>
  );
}
