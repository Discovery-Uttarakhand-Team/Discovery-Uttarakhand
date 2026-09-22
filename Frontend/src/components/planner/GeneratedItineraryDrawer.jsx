import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Car, 
  Bookmark, 
  Sparkles, 
  Check, 
  AlertCircle, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';
import { useAuth } from '../../context/AuthContext';
import { createTrip } from '../../api/tripApi';
import { generateItineraryPlan } from '../../utils/itineraryGenerator';

export default function GeneratedItineraryDrawer() {
  const { 
    isItineraryOpen, 
    closeItinerary, 
    tripDestinations, 
    tripStats,
    tripPreferences,
    setTripPreferences,
    generatedItinerary,
    setSaveStatus,
    allActivities,
    allSpiritual
  } = useMapStore();

  const { requireAuth } = useAuth();

  // Local save button lifecycle states: 'INITIAL' | 'SAVING' | 'SAVED' | 'ERROR'
  const [saveState, setSaveState] = useState('INITIAL');
  const [saveErrorText, setSaveErrorText] = useState('');

  // Reset save state whenever the itinerary modal opens
  useEffect(() => {
    if (isItineraryOpen) {
      setSaveState('INITIAL');
      setSaveErrorText('');
    }
  }, [isItineraryOpen]);

  // Generate or use stored plan based on selected destinations and preferences
  const dayPlans = useMemo(() => {
    if (!tripDestinations || tripDestinations.length === 0) return [];
    
    // Always generate from current user-selected destinations and preferences
    return generateItineraryPlan({
      destinations: tripDestinations,
      preferences: tripPreferences,
      tripStats,
      allActivities,
      allSpiritual
    });
  }, [tripDestinations, tripPreferences, tripStats, allActivities, allSpiritual]);

  // Modify Stops closes the modal and returns user to the planner with stops intact
  const handleModifyStops = () => {
    closeItinerary();
  };

  // Save Trip persists to MongoDB only upon explicit user click
  const handleSaveTrip = () => {
    requireAuth(async () => {
      setSaveState('SAVING');
      setSaveErrorText('');
      setSaveStatus('SAVING');

      try {
        const destIds = tripDestinations
          .map(d => d._id || d.id)
          .filter(id => id && typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/));

        const title = tripDestinations.map(d => d.name).join(' → ');
        const durationStr = tripPreferences.duration || `${dayPlans.length} Days`;
        
        const notesParts = [
          tripPreferences.travelMode || 'By Car',
          tripPreferences.travelers || '2 Adults',
          durationStr,
          tripPreferences.pace ? `Pace: ${tripPreferences.pace}` : null,
          tripStats.totalDistanceKm > 0 ? `Total Route: ${tripStats.totalDistanceKm} km (~${tripStats.estimatedTime})` : null,
          Array.isArray(tripPreferences.interests) && tripPreferences.interests.length > 0 
            ? `Interests: ${tripPreferences.interests.join(', ')}` 
            : null
        ].filter(Boolean);

        const payload = {
          title: `${title} (${durationStr})`,
          destinations: destIds,
          notes: notesParts.join(' • ')
        };

        const res = await createTrip(payload);
        if (res?.success || res?.data) {
          setSaveState('SAVED');
          setSaveStatus('SAVED');
        } else {
          setSaveState('ERROR');
          setSaveErrorText('Could not save trip. Please try again.');
          setSaveStatus('ERROR', 'Could not save trip');
        }
      } catch (err) {
        console.error('Trip save error:', err);
        setSaveState('ERROR');
        setSaveErrorText(err.response?.data?.message || 'Failed to save trip. Try again.');
        setSaveStatus('ERROR', err.message);
      }
    });
  };

  if (!isItineraryOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[2000] flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itinerary-title"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fadeIn"
        onClick={closeItinerary}
      />

      {/* Main Modal Box */}
      <div className="relative w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[94vh] z-10 overflow-hidden animate-scaleUp">
        
        {/* ── Top Summary Header ──────────────────────────── */}
        <div className="p-5 md:p-6 bg-[#faf9f6] border-b border-border-light flex items-start justify-between flex-shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-forest-green text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                <Sparkles size={11} /> GENERATED TRIP
              </span>
            </div>

            <h2 id="itinerary-title" className="text-xl md:text-2xl font-black text-text-dark font-display leading-tight">
              Your Uttarakhand Itinerary
            </h2>

            {/* Destination Sequence */}
            <p className="text-sm md:text-base font-bold text-forest-green mt-1 truncate">
              {tripDestinations.map(d => d.name).join(' → ')}
            </p>

            {/* Summary details */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs">
              <span className="font-bold text-text-dark">
                {tripDestinations.length} {tripDestinations.length === 1 ? 'Destination' : 'Destinations'} • {dayPlans.length} Days • {tripPreferences.travelMode || 'By Car'}
              </span>

              {/* Real route information from OSRM — never fabricated */}
              {tripStats.totalDistanceKm > 0 ? (
                <span className="text-muted-text flex items-center gap-2">
                  <span>•</span>
                  <span className="font-semibold text-text-dark">
                    Total Distance: <strong>{tripStats.totalDistanceKm} km</strong>
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-text-dark">
                    Estimated Drive Time: <strong>~{tripStats.estimatedTime}</strong>
                  </span>
                </span>
              ) : tripDestinations.length >= 2 ? (
                <span className="text-muted-text italic">• Route information unavailable</span>
              ) : null}
            </div>

            {/* Supporting explanation */}
            <p className="text-xs text-muted-text mt-2 font-medium">
              Here's a suggested day-by-day plan based on your selected destinations and preferences.
            </p>
          </div>

          <button 
            onClick={closeItinerary}
            className="w-9 h-9 rounded-full bg-white border border-border-light flex items-center justify-center text-text-dark hover:bg-beige transition-colors shadow-2xs flex-shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Adjust Your Plan (Pace & Transport) ───────────── */}
        <div className="px-5 md:px-6 py-2.5 bg-white border-b border-border-light flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-1.5 text-muted-text font-bold uppercase tracking-wider text-[10px]">
            <span>Adjust your plan:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Pace */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-muted-text text-[11px]">Pace:</span>
              {['Relaxed', 'Balanced', 'Fast'].map(p => (
                <button
                  key={p}
                  onClick={() => setTripPreferences({ pace: p })}
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs transition-all ${
                    (tripPreferences.pace || 'Balanced') === p 
                      ? 'bg-forest-green text-white shadow-2xs' 
                      : 'bg-beige/60 text-text-dark hover:bg-beige'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Transport */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-muted-text text-[11px]">Transport:</span>
              {['By Car', 'Taxi', 'By Bus'].map(m => (
                <button
                  key={m}
                  onClick={() => setTripPreferences({ travelMode: m })}
                  className={`px-2.5 py-0.5 rounded-full font-bold text-xs transition-all ${
                    (tripPreferences.travelMode || 'By Car') === m 
                      ? 'bg-forest-green text-white shadow-2xs' 
                      : 'bg-beige/60 text-text-dark hover:bg-beige'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Day-by-Day Scrollable Itinerary ──────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-[#faf9f6] custom-scrollbar">
          {dayPlans.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-text-dark mb-1">
                Add at least one destination to generate your trip.
              </p>
              <button 
                onClick={closeItinerary}
                className="btn-primary text-xs py-2 px-5 rounded-full mt-3"
              >
                Back to Destinations
              </button>
            </div>
          ) : (
            dayPlans.map((day) => {
              const isTransfer = day.type === 'transfer' || day.isTransfer;

              // ── Destination Day Card ──────────────────────
              if (!isTransfer) {
                return (
                  <div 
                    key={day.dayNumber}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-border-light shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-5 hover:border-forest-green/30 transition-all"
                  >
                    {/* Day Badge & Image */}
                    <div className="flex flex-row sm:flex-col items-start gap-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-forest-green text-white font-black text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                          Day {day.dayNumber}
                        </span>
                        <span className="sm:hidden text-xs font-bold text-earth-brown flex items-center gap-1 truncate">
                          <MapPin size={11} /> {typeof day.location === 'string' ? day.location : (day.location?.name || day.where || 'Destination')}
                        </span>
                      </div>

                      <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-beige flex-shrink-0 border border-border-light/60">
                        <img 
                          src={day.image} 
                          alt={day.title} 
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                        />
                      </div>
                    </div>

                    {/* Day Content */}
                    <div className="flex-1 min-w-0">
                      <div className="hidden sm:flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-earth-brown bg-beige/60 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <MapPin size={11} className="text-earth-brown" /> {typeof day.location === 'string' ? day.location : (day.location?.name || day.where || 'Destination')}
                          {day.district ? ` • ${day.district}` : ''}
                        </span>
                      </div>

                      <h4 className="text-base sm:text-lg font-bold text-text-dark font-display leading-tight mb-1.5">
                        {day.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-muted-text leading-relaxed mb-3">
                        {day.description}
                      </p>

                      {/* Things to explore */}
                      {day.activities && day.activities.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[11px] font-bold text-text-dark uppercase tracking-wider mb-1">
                            Things to explore:
                          </p>
                          <ul className="flex flex-col gap-1">
                            {day.activities.map((act, i) => (
                              <li key={i} className="text-xs text-text-dark flex items-start gap-2 leading-relaxed">
                                <span className="text-forest-green font-bold flex-shrink-0">•</span>
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {day.slug && (
                        <div className="mt-3 pt-2.5 border-t border-border-light/60 flex justify-end">
                          <Link 
                            to={`/destinations/${day.slug}`}
                            className="text-xs font-bold text-forest-green hover:underline inline-flex items-center gap-1"
                          >
                            View {typeof day.location === 'string' ? day.location : (day.location?.name || day.where || 'Destination')} Guide <ArrowRight size={12} />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // ── Transfer Day Card (Distinct road styling) ──
              return (
                <div 
                  key={day.dayNumber}
                  className="bg-[#faf7f2] rounded-2xl p-4 sm:p-5 border border-earth-brown/25 shadow-sm flex flex-col sm:flex-row gap-4 sm:gap-5 hover:border-earth-brown/40 transition-all"
                >
                  {/* Day Badge & Image */}
                  <div className="flex flex-row sm:flex-col items-start gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-earth-brown text-white font-black text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-2xs">
                        Day {day.dayNumber}
                      </span>
                      <span className="sm:hidden text-xs font-bold text-earth-brown flex items-center gap-1 truncate">
                        <Car size={11} /> {day.fromDestination} → {day.toDestination}
                      </span>
                    </div>

                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-beige flex-shrink-0 border border-earth-brown/20">
                      <img 
                        src={day.image} 
                        alt={day.title} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                      />
                    </div>
                  </div>

                  {/* Day Content */}
                  <div className="flex-1 min-w-0">
                    <div className="hidden sm:flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-earth-brown bg-earth-brown/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <Car size={11} /> {day.fromDestination} → {day.toDestination}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-text-dark font-display leading-tight mb-1.5">
                      {day.title}
                    </h4>

                    {/* Real Route Transition Stats */}
                    {day.distanceKm ? (
                      <div className="inline-flex items-center gap-3 bg-white border border-earth-brown/20 rounded-xl px-3 py-1.5 mb-2.5 shadow-2xs">
                        <span className="text-xs font-bold text-forest-green flex items-center gap-1">
                          <span>Distance:</span> <strong>{day.distanceKm} km</strong>
                        </span>
                        <span className="text-muted-text text-xs">•</span>
                        <span className="text-xs font-bold text-earth-brown flex items-center gap-1">
                          <span>Drive time:</span> <strong>~{day.driveTime}</strong>
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-text italic mb-2">
                        Route information unavailable
                      </p>
                    )}

                    <p className="text-xs sm:text-sm text-muted-text leading-relaxed mb-3">
                      {day.description}
                    </p>

                    {day.activities && day.activities.length > 0 && (
                      <div className="mt-2">
                        <p className="text-[11px] font-bold text-text-dark uppercase tracking-wider mb-1">
                          Transfer Highlights:
                        </p>
                        <ul className="flex flex-col gap-1">
                          {day.activities.map((act, i) => (
                            <li key={i} className="text-xs text-text-dark flex items-start gap-2 leading-relaxed">
                              <span className="text-earth-brown font-bold flex-shrink-0">•</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer Actions (Sticky Bottom) ──────────────── */}
        <div className="p-4 md:p-5 bg-white border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="min-h-[20px]">
            {/* ONLY shown after actual successful backend confirmation */}
            {saveState === 'SAVED' && (
              <span className="text-xs font-bold text-forest-green flex items-center gap-1.5 animate-fadeIn">
                <Check size={15} /> Trip saved to your profile.
              </span>
            )}
            {saveState === 'ERROR' && (
              <span className="text-xs font-bold text-red-600 flex items-center gap-1.5 animate-fadeIn">
                <AlertCircle size={15} /> {saveErrorText || 'Failed to save trip. Please try again.'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Modify Stops — closes modal and returns user to planner with stops intact */}
            <button
              onClick={handleModifyStops}
              className="btn-outline flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold rounded-xl uppercase tracking-wider"
            >
              Modify Stops
            </button>

            {/* Save Trip — triggers auth if needed, then persists to MongoDB */}
            <button
              onClick={handleSaveTrip}
              disabled={saveState === 'SAVING' || saveState === 'SAVED'}
              className={`flex-1 sm:flex-none px-7 py-2.5 text-xs font-black rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
                saveState === 'SAVED'
                  ? 'bg-forest-green text-white cursor-default'
                  : saveState === 'ERROR'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-forest-green hover:bg-dark-green text-white hover:shadow-md active:scale-[0.99]'
              }`}
            >
              {saveState === 'SAVING' ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveState === 'SAVED' ? (
                <>
                  <Check size={15} />
                  <span>✓ Trip Saved</span>
                </>
              ) : saveState === 'ERROR' ? (
                <>
                  <AlertCircle size={15} />
                  <span>Try Again</span>
                </>
              ) : (
                <>
                  <Bookmark size={15} />
                  <span>Save Trip</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
