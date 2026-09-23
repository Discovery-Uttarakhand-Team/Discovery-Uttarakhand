import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Car, 
  Footprints, 
  BedDouble, 
  ArrowRight, 
  CalendarCheck, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Compass,
  Bike,
  Sparkles,
  Clock,
  Check,
  ShieldCheck,
  Navigation,
  Sun,
  Sunset,
  Moon,
  Info
} from 'lucide-react';
import VerificationBadge from '../verification/VerificationBadge';

export default function DayCard({
  day,
  idx,
  isActive,
  onSelect,
  defaultStartLocation,
  defaultDestination,
  fallbackTransport,
  cardRef,
  onBookStay
}) {
  const [showTransportDetails, setShowTransportDetails] = useState(false);

  const isTrek = day.type === 'trek';
  const isReturn = day.type === 'return';
  const isJourney = day.type === 'journey';

  // Segments for technical expandable panel
  const segments = Array.isArray(day.journeySegments) && day.journeySegments.length > 0
    ? day.journeySegments
    : [day.transportSegment].filter(Boolean);

  const routeStops = Array.isArray(day.routeStops) && day.routeStops.length > 0
    ? day.routeStops
    : [defaultStartLocation || 'Origin', defaultDestination || 'Destination'];

  const timelineItems = Array.isArray(day.timeline) && day.timeline.length > 0
    ? day.timeline
    : (day.activities || []).map((act, aIdx) => ({
        period: aIdx === 0 ? 'Morning' : aIdx === 1 ? 'Afternoon' : 'Evening',
        time: aIdx === 0 ? '09:00 AM' : aIdx === 1 ? '01:30 PM' : '06:00 PM',
        title: act,
        desc: ''
      }));

  const placesToVisit = Array.isArray(day.places) && day.places.length > 0
    ? day.places
    : (day.activities || []).slice(0, 3).map(a => ({ name: a, category: 'Attraction' }));

  const currentStay = day.stay;
  const currentRental = day.rental;
  const currentActivity = day.activity || (isTrek && day.trekDetails ? {
    name: day.trekDetails.name || 'Guided Mountain Trek',
    difficulty: day.trekDetails.difficulty || 'Moderate',
    duration: day.trekDetails.duration || '6–8 hrs',
    location: day.location || defaultDestination,
    status: `✓ Added to Day ${day.dayNumber}`
  } : null);

  return (
    <div
      ref={cardRef}
      id={`day-card-${idx}`}
      onClick={() => onSelect(idx)}
      className={`rounded-3xl p-6 sm:p-7 transition-all cursor-pointer border ${
        isActive 
          ? 'bg-white border-forest-green shadow-xl ring-2 ring-forest-green/20' 
          : 'bg-white border-slate-200 hover:border-forest-green/40 shadow-xs hover:shadow-md'
      }`}
    >
      {/* ── 1. DAY HEADER ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className={`text-white font-black text-xs md:text-sm uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs ${
              isTrek ? 'bg-earth-brown' : isReturn ? 'bg-slate-700' : 'bg-forest-green'
            }`}>
              DAY {day.dayNumber}
            </span>
            <span className="text-xs font-bold text-forest-green bg-forest-green/10 px-3 py-1 rounded-full">
              {day.badge || `Day ${day.dayNumber}`}
            </span>
            {isActive && (
              <span className="text-xs font-black uppercase tracking-wider bg-emerald-600 text-white px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1">
                <span>🟢</span> Focused on Map
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">
            {day.title || `Day ${day.dayNumber} — Explore ${defaultDestination}`}
          </h2>
        </div>

        {/* Quick Summary Pill */}
        {day.summary && (
          <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl self-start sm:self-center">
            {day.summary}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-6">

        {/* ── 2. 📍 TODAY'S ROUTE ─────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
            <MapPin size={15} className="text-forest-green" />
            <span>Today's Route</span>
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar text-sm font-bold text-slate-800 flex-wrap">
            {routeStops.map((stop, sIdx) => (
              <React.Fragment key={`route-stop-${sIdx}`}>
                <span className={`px-3 py-1 rounded-lg border ${
                  sIdx === 0 
                    ? 'bg-slate-100 text-slate-900 border-slate-200' 
                    : sIdx === routeStops.length - 1 
                    ? 'bg-forest-green/10 text-forest-green border-forest-green/20' 
                    : 'bg-white text-slate-700 border-slate-200'
                }`}>
                  {stop}
                </span>
                {sIdx < routeStops.length - 1 && (
                  <ArrowRight size={14} className="text-slate-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── 3. 🚗 HOW YOU'RE TRAVELLING ─────────────────────────── */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-green/10 flex items-center justify-center text-forest-green shrink-0">
                <Car size={20} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  How You're Travelling
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {day.transportSegment?.mode || fallbackTransport || 'By Car'}
                </span>
                <span className="text-xs text-slate-500 ml-2">
                  • Estimated journey: {day.transportSegment?.driveTime || '~7–8 hrs'}
                </span>
              </div>
            </div>

            {/* Toggle Expandable Technical Details */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTransportDetails(!showTransportDetails);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-green hover:text-dark-green px-3 py-1.5 rounded-lg border border-forest-green/20 bg-white hover:bg-forest-green/5 transition-colors self-start sm:self-center"
            >
              <span>{showTransportDetails ? 'Hide transport details' : 'View transport details'}</span>
              {showTransportDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* Expandable Technical Panel */}
          {showTransportDetails && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-fadeIn text-xs">
              {segments.map((seg, sIdx) => (
                <div key={sIdx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Leg {seg.legIndex || sIdx + 1}: {seg.from || defaultStartLocation} → {seg.to || defaultDestination}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {seg.operator || 'Scheduled Transport / Private Vehicle'}
                    </span>
                  </div>

                  {seg.transferNote && (
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80">
                      🔄 {seg.transferNote}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-500 pt-1">
                    <span>Schedule status: {seg.isVerified ? '✓ Verified Official Service' : 'Route Verified (Local timings)'}</span>
                    {seg.bookingUrl && (
                      <a
                        href={seg.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-forest-green font-bold hover:underline inline-flex items-center gap-1"
                      >
                        Official Portal <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 4. 🗺️ TODAY'S PLAN (TIMELINE) ───────────────────────── */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Clock size={15} className="text-forest-green" />
            <span>Today's Plan</span>
          </h3>

          <div className="relative pl-6 space-y-4 border-l-2 border-slate-200">
            {timelineItems.map((item, tIdx) => {
              const Icon = item.period === 'Morning' ? Sun : item.period === 'Afternoon' ? Footprints : Sunset;
              return (
                <div key={`timeline-${tIdx}`} className="relative group">
                  <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-forest-green flex items-center justify-center text-forest-green shadow-xs">
                    <Icon size={12} />
                  </div>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-forest-green">
                      {item.time || item.period}
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <strong className="text-sm font-bold text-slate-900">
                      {item.title}
                    </strong>
                  </div>
                  {item.desc && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 5. 📍 PLACES TO VISIT ───────────────────────────────── */}
        {placesToVisit.length > 0 && !isReturn && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Compass size={15} className="text-forest-green" />
              <span>Places to Visit</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {placesToVisit.map((place, pIdx) => (
                <div key={`place-${pIdx}`} className="p-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">📍</span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {place.name}
                      </h4>
                      {place.category && (
                        <span className="text-[11px] text-slate-500 font-medium block">
                          {place.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    to={`/destinations/${encodeURIComponent(place.name.toLowerCase().replace(/\s+/g, '-'))}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-bold text-forest-green hover:text-dark-green px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0 transition-colors"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 6. 🥾 ACTIVITIES / TREKKING ─────────────────────────── */}
        {currentActivity && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Footprints size={15} className="text-earth-brown" />
              <span>Activities & Trekking</span>
            </h3>
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 shrink-0">
                  <Footprints size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">
                      {currentActivity.name}
                    </h4>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                      {currentActivity.status || '✓ Planned'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Duration: <strong>{currentActivity.duration || '6–8 hrs'}</strong> • Difficulty: <strong>{currentActivity.difficulty || 'Moderate'}</strong> • Location: <strong>{currentActivity.location || defaultDestination}</strong>
                  </p>
                </div>
              </div>

              <Link
                to="/activities"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-amber-900 bg-white hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 transition-colors self-start sm:self-center shrink-0"
              >
                View Details →
              </Link>
            </div>
          </div>
        )}

        {/* ── 7. 🏨 TONIGHT'S STAY ─────────────────────────────────── */}
        {!isReturn && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <BedDouble size={15} className="text-forest-green" />
              <span>Tonight's Stay</span>
            </h3>

            {currentStay ? (
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-forest-green text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                    🏨
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 truncate">
                        {currentStay.name}
                      </h4>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {currentStay.status === 'BOOKED' ? '✓ Booked' : '✓ Selected'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      📍 {currentStay.location || defaultDestination} • Check-in: <strong>{currentStay.checkIn || '05:00 PM'}</strong> • ₹{currentStay.pricePerNight || currentStay.pricing?.amount || 3200}/night
                    </p>
                    {currentStay.note && (
                      <span className="text-[11px] text-forest-green font-medium italic block mt-0.5">
                        {currentStay.note}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {onBookStay ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookStay(currentStay, day);
                      }}
                      className="px-4 py-2 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <CalendarCheck size={14} />
                      <span>{currentStay.status === 'BOOKED' ? 'View Voucher' : 'Book Stay'}</span>
                    </button>
                  ) : (
                    <Link
                      to={`/stays/${currentStay.slug || currentStay._id || currentStay.id || ''}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 font-bold text-xs rounded-xl"
                    >
                      View Stay
                    </Link>
                  )}
                  <Link
                    to="/stays"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 underline"
                  >
                    Change
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-500">
                    <BedDouble size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No stay selected yet for Day {day.dayNumber}</h4>
                    <p className="text-xs text-slate-500">Select verified government KMVN or boutique mountain retreats.</p>
                  </div>
                </div>
                <Link
                  to="/stays"
                  onClick={(e) => e.stopPropagation()}
                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors shrink-0"
                >
                  Find Stays →
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── 8. 🛵 YOUR SCOOTY / RENTAL ───────────────────────────── */}
        {currentRental && (
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-2">
              <Bike size={15} className="text-forest-green" />
              <span>Your Scooty / Rental</span>
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-green/10 flex items-center justify-center text-forest-green shrink-0">
                  <Bike size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-slate-900">
                      {currentRental.name}
                    </h4>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      ✓ Available
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Pickup: <strong>{currentRental.pickupLocation} ({currentRental.pickupTime})</strong> • Return: <strong>{currentRental.dropoffTime}</strong> • ₹{currentRental.pricePerDay}/day
                  </p>
                </div>
              </div>

              <Link
                to="/rentals"
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-bold text-forest-green bg-white hover:bg-forest-green/5 px-3 py-1.5 rounded-xl border border-forest-green/30 transition-colors self-start sm:self-center shrink-0"
              >
                View Rental →
              </Link>
            </div>
          </div>
        )}

        {/* ── 9. 💡 WHY THIS DAY? ──────────────────────────────────── */}
        {Array.isArray(day.whyThisDay) && day.whyThisDay.length > 0 && (
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-1.5 bg-slate-50/50 p-4 rounded-2xl">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5 mb-1">
              <Sparkles size={13} className="text-forest-green" />
              Why this day?
            </span>
            {day.whyThisDay.map((bullet, bIdx) => (
              <p key={`why-${bIdx}`} className="flex items-start gap-2 leading-relaxed">
                <span className="text-forest-green font-bold">✓</span>
                <span>{bullet}</span>
              </p>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
