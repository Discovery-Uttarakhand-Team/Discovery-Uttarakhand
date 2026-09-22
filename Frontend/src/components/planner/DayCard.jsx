import React from 'react';
import { 
  MapPin, 
  Footprints, 
  BedDouble, 
  ArrowRight, 
  Info,
  CalendarCheck,
  ExternalLink 
} from 'lucide-react';
import JourneySegmentStepper from './JourneySegmentStepper';
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
  const isTrek = day.type === 'trek';
  const isJourney = day.type === 'journey' || day.type === 'return';

  const segments = Array.isArray(day.journeySegments) && day.journeySegments.length > 0
    ? day.journeySegments
    : [day.transportSegment].filter(Boolean);

  return (
    <div
      ref={cardRef}
      id={`day-card-${idx}`}
      onClick={() => onSelect(idx)}
      className={`rounded-2xl p-4 sm:p-6 transition-all cursor-pointer border ${
        isActive 
          ? 'bg-white border-forest-green shadow-lg ring-2 ring-forest-green/20' 
          : isTrek
          ? 'bg-[#fcf9f5] border-earth-brown/30 hover:border-earth-brown/60'
          : isJourney
          ? 'bg-[#faf8f5] border-border-light hover:border-forest-green/40'
          : 'bg-white border-border-light hover:border-forest-green/30 shadow-2xs'
      }`}
    >
      {/* Header: Day Badge & Title */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-2.5 pb-3.5 mb-4 border-b border-border-light">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`text-white font-black text-xs md:text-sm uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-2xs ${
            isTrek ? 'bg-earth-brown' : 'bg-forest-green'
          }`}>
            Day {day.dayNumber}
          </span>
          <span className="text-xs font-bold text-forest-green bg-forest-green/10 px-3 py-1 rounded-full">
            {day.badge}
          </span>
          {day.phase && (
            <span className="text-xs font-semibold text-muted-text">
              • {day.phase}
            </span>
          )}
        </div>

        {isActive && (
          <span className="text-xs font-black uppercase tracking-wider bg-forest-green text-white px-2.5 py-1 rounded-full shadow-2xs">
            🟢 Focused on Map
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-5">
        {/* Left Thumbnail */}
        <div className="w-full sm:w-32 h-36 sm:h-32 rounded-xl overflow-hidden bg-beige flex-shrink-0 border border-border-light relative">
          <img
            src={day.image}
            alt={day.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
          />
          <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            Day {day.dayNumber}
          </div>
        </div>

        {/* Right Details: 5 Structured Parts */}
        <div className="flex-1 min-w-0 space-y-3.5">
          <div>
            <h3 className="font-bold text-text-dark text-lg md:text-xl font-display leading-tight mb-1.5">
              {day.title}
            </h3>
            <p className="text-sm text-muted-text leading-relaxed">
              {day.description}
            </p>
          </div>

          {/* PART 1: 📍 WHERE AM I? */}
          <div className="bg-[#faf9f6] rounded-xl p-3 border border-border-light flex items-start gap-2.5">
            <MapPin size={16} className="text-forest-green mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-bold text-text-dark">Where am I: </span>
              <span className="text-muted-text font-medium">{typeof day.where === 'string' ? day.where : (typeof day.location === 'string' ? day.location : (day.location?.name || defaultDestination))}</span>
              {day.district && <span className="text-muted-text font-normal"> ({day.district} District)</span>}
            </div>
          </div>

          {/* PART 2: 🚗 / 🚆 HOW DO I GET THERE? (Multi-Segment Journey Stepper) */}
          <JourneySegmentStepper 
            segments={segments}
            transportModeFallback={day.transportSegment?.mode || fallbackTransport}
            defaultStartLocation={day.transportSegment?.route?.split('→')[0] || defaultStartLocation}
            defaultDestination={day.transportSegment?.route?.split('→')[1] || (typeof day.where === 'string' ? day.where : defaultDestination)}
          />

          {/* PART 3: 🥾 WHAT AM I DOING? (Activities & Verified Trek Info) */}
          <div className="bg-white rounded-xl p-3.5 border border-border-light">
            <div className="flex items-center gap-2 mb-2">
              <Footprints size={16} className="text-forest-green" />
              <span className="text-xs font-black uppercase tracking-wider text-text-dark">
                What Am I Doing & Seeing:
              </span>
            </div>

            {day.trekDetails && (
              <div className="mb-2.5 p-2.5 rounded-lg bg-earth-brown/5 border border-earth-brown/20 text-xs">
                <span className="font-bold text-earth-brown block mb-1">
                  🏔️ Verified Trail Details: {day.trekDetails.name}
                </span>
                <div className="flex flex-wrap gap-x-4 text-xs text-muted-text">
                  {day.trekDetails.difficulty && <span>Difficulty: <strong>{day.trekDetails.difficulty}</strong></span>}
                  {day.trekDetails.duration && <span>Duration: <strong>{day.trekDetails.duration}</strong></span>}
                  {day.trekDetails.elevation && <span>Elevation: <strong>{day.trekDetails.elevation}</strong></span>}
                </div>
              </div>
            )}

            <ul className="space-y-1.5">
              {(day.activities || []).map((act, aIdx) => (
                <li key={aIdx} className="text-sm text-text-dark flex items-start gap-2 leading-relaxed">
                  <span className="text-forest-green font-bold">•</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PART 4: 🏨 WHERE AM I STAYING? */}
          {day.stay && (
            <div className="bg-white rounded-xl p-3.5 border border-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-beige flex items-center justify-center flex-shrink-0 text-forest-green">
                  <BedDouble size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-text block">
                      Overnight Stay:
                    </span>
                    {day.stay.web3Sync && (
                      <VerificationBadge 
                        listingId={day.stay._id || day.stay.id} 
                        web3Sync={day.stay.web3Sync} 
                        size="sm" 
                      />
                    )}
                  </div>
                  <span className="font-bold text-sm text-text-dark">
                    {day.stay.name || day.stay.title}
                  </span>
                  <span className="text-xs text-muted-text ml-1.5">
                    ({day.stay.category || 'Stay'}, {typeof day.stay.location === 'string' ? day.stay.location : (day.stay.district || day.stay.city || 'Uttarakhand')})
                  </span>
                  {(day.stay.pricing?.amount || day.stay.price?.amount) && (
                    <span className="text-xs font-bold text-forest-green block mt-0.5">
                      ₹{Number(day.stay.pricing?.amount || day.stay.price?.amount).toLocaleString('en-IN')} / {day.stay.pricing?.unit || 'night'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Direct Discovery Booking or Verified Official Portal */}
              <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                {onBookStay && (day.stay.pricing?.provenance === 'VERIFIED' || day.stay.status === 'ACTIVE' || (day.stay.price && day.stay.price.amount > 0)) ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onBookStay(day.stay, day);
                    }}
                    className="px-3.5 py-2 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-2xs hover:shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CalendarCheck size={14} />
                    <span>Book Now</span>
                  </button>
                ) : day.stay.name?.includes('KMVN') ? (
                  <a
                    href="https://www.kmvn.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 bg-beige/80 hover:bg-beige text-earth-brown font-bold text-xs uppercase tracking-wider rounded-lg transition-colors border border-border-light flex items-center gap-1"
                  >
                    <span>KMVN Portal</span>
                    <ExternalLink size={12} />
                  </a>
                ) : null}
              </div>
            </div>
          )}

          {/* PART 5: ➡️ WHAT'S NEXT & 💡 WHY */}
          <div className="pt-2.5 border-t border-border-light flex flex-col gap-1.5 text-xs md:text-sm">
            {day.whatsNext && (
              <p className="text-forest-green font-semibold flex items-center gap-1.5">
                <ArrowRight size={14} className="flex-shrink-0" />
                <span>{day.whatsNext}</span>
              </p>
            )}
            {day.reasoning && (
              <p className="text-muted-text italic flex items-start gap-1.5">
                <Info size={14} className="text-forest-green/70 flex-shrink-0 mt-0.5" />
                <span>Why this plan: {day.reasoning}</span>
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
