import React from 'react';
import { 
  Navigation, 
  ArrowRight, 
  Train, 
  Bus, 
  Car, 
  Footprints, 
  ExternalLink 
} from 'lucide-react';

export default function JourneySegmentStepper({
  segments = [],
  transportModeFallback = '',
  defaultStartLocation = '',
  defaultDestination = ''
}) {
  if (!segments || segments.length === 0) return null;

  return (
    <div className="bg-[#faf9f6] rounded-xl p-3 border border-border-light/80 space-y-2.5">
      <div className="flex items-center justify-between border-b border-border-light/60 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Navigation size={13} className="text-forest-green" />
          <span className="text-[10px] font-black uppercase tracking-wider text-text-dark">
            Transit & Journey Flow ({segments.length} {segments.length === 1 ? 'Leg' : 'Legs'})
          </span>
        </div>
        <span className="text-[10px] font-medium text-muted-text">
          {transportModeFallback}
        </span>
      </div>

      <div className="space-y-2">
        {segments.map((seg, sIdx) => {
          const isRail = seg.routingType === 'rail' || (seg.mode && seg.mode.toLowerCase().includes('train'));
          const isTrek = seg.routingType === 'trek' || (seg.mode && seg.mode.toLowerCase().includes('trek'));
          const isBus = seg.mode && seg.mode.toLowerCase().includes('bus');

          const IconComponent = isRail ? Train : isTrek ? Footprints : isBus ? Bus : Car;

          return (
            <div key={`seg-${sIdx}`} className="space-y-1.5">
              {/* Transfer notice connector between legs */}
              {seg.transferNote && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200/70 text-[11px] text-emerald-950 flex items-start gap-1.5 font-medium">
                  <span className="text-forest-green flex-shrink-0 font-bold">🔄 Transfer:</span>
                  <span>{seg.transferNote}</span>
                </div>
              )}

              {/* Individual Segment Card */}
              <div className="bg-white rounded-lg p-2.5 border border-border-light/80 shadow-2xs space-y-1.5">
                {/* Header: Leg badge, mode & operator */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-forest-green/10 text-forest-green font-black text-[10px] flex items-center justify-center">
                      {seg.legIndex || sIdx + 1}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-text-dark">
                      <IconComponent size={13} className="text-forest-green" />
                      {seg.mode || 'Transit'}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                      {seg.routingType || 'road'}
                    </span>
                  </div>

                  {seg.operator ? (
                    <span className="text-[10px] font-bold text-forest-green bg-forest-green/8 px-2 py-0.5 rounded-full border border-forest-green/20">
                      {seg.operator}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                      Unscheduled / Local Transfer
                    </span>
                  )}
                </div>

                {/* Route Line */}
                <div className="text-xs flex items-center gap-1.5 flex-wrap font-semibold text-text-dark">
                  <span>{seg.from || defaultStartLocation}</span>
                  <ArrowRight size={11} className="text-muted-text flex-shrink-0" />
                  <span>{seg.to || defaultDestination}</span>
                  {seg.duration && (
                    <span className="text-[11px] font-medium text-earth-brown ml-auto">
                      ({seg.duration})
                    </span>
                  )}
                </div>

                {/* Stops list if verified */}
                {Array.isArray(seg.stops) && seg.stops.length > 0 && (
                  <div className="text-[10px] text-muted-text flex items-center gap-1 flex-wrap">
                    <span className="font-semibold text-text-dark">Key Stops:</span>
                    <span>{seg.stops.join(' • ')}</span>
                  </div>
                )}

                {/* Timings & Fare: Strict zero unverified values */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {seg.departureTime ? (
                    <span className="text-[10px] font-bold text-forest-green bg-forest-green/10 px-1.5 py-0.5 rounded">
                      Departs: {seg.departureTime}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                      Schedule not verified (Check at counter)
                    </span>
                  )}

                  {seg.price ? (
                    <span className="text-[10px] font-bold text-earth-brown bg-earth-brown/10 px-1.5 py-0.5 rounded">
                      Fare: ₹{seg.price.min} - ₹{seg.price.max}
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 font-medium">
                      Fare not verified
                    </span>
                  )}

                  {seg.isVerified && seg.source && (
                    <span className="text-[9px] text-forest-green font-semibold ml-auto flex items-center gap-1">
                      ✓ Verified: {seg.source}
                    </span>
                  )}
                </div>

                {/* Notes if present */}
                {seg.notes && (
                  <p className="text-[10px] text-muted-text italic pt-0.5">
                    ℹ️ {seg.notes}
                  </p>
                )}

                {/* Official booking / schedule link if verified */}
                {seg.bookingUrl && (
                  <div className="pt-1">
                    <a
                      href={seg.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-forest-green hover:underline bg-forest-green/8 px-2.5 py-1 rounded-lg border border-forest-green/20 hover:bg-forest-green/12 transition-all"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconComponent size={11} />
                      <span>
                        {isRail ? 'Check IRCTC Official Train Schedules' : isBus ? 'Check UTC State Bus Schedules' : 'Official Portal / Permit Booking'}
                      </span>
                      <ExternalLink size={9} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
