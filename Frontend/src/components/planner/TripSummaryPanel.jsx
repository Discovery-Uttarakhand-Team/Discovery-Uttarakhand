import React, { useState } from 'react';
import { 
  Plus, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Compass, 
  MapPin, 
  Sparkles, 
  Trash2, 
  ChevronRight,
  Clock,
  Route
} from 'lucide-react';
import { useMapStore } from '../../store/mapStore';

export default function TripSummaryPanel() {
  const { 
    tripDestinations, 
    removeTripDestination, 
    reorderTripDestinations,
    clearTrip,
    openAddDrawer,
    openItinerary,
    tripStats,
    allDestinations,
    addTripDestination
  } = useMapStore();

  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newOrder = [...tripDestinations];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    reorderTripDestinations(newOrder);
  };

  const handleMoveDown = (index) => {
    if (index === tripDestinations.length - 1) return;
    const newOrder = [...tripDestinations];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    reorderTripDestinations(newOrder);
  };

  const quickAddPopular = (name) => {
    const found = allDestinations.find(d => d.name.toLowerCase() === name.toLowerCase());
    if (found) {
      addTripDestination(found);
    }
  };

  const hasStops = tripDestinations.length > 0;

  return (
    <aside className="absolute top-4 right-4 z-[400] w-full max-w-sm font-sans select-none pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-border-light overflow-hidden transition-all duration-300">
        
        {/* Panel Header */}
        <div className="p-4 bg-[#faf9f6] border-b border-border-light flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-green animate-pulse" />
            <h3 className="font-black text-text-dark text-sm uppercase tracking-wide font-display">
              Your Trip
            </h3>
            {hasStops && (
              <span className="bg-forest-green text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {tripDestinations.length} {tripDestinations.length === 1 ? 'Stop' : 'Stops'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {hasStops && (
              <button 
                onClick={clearTrip}
                className="text-[11px] font-bold text-muted-text hover:text-red-600 transition-colors px-2 py-1"
                title="Clear all destinations"
              >
                Clear
              </button>
            )}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-7 h-7 rounded-full hover:bg-beige flex items-center justify-center text-text-dark transition-colors"
              aria-label={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="p-4 flex flex-col gap-4">
            
            {/* Empty State — strictly clean onboarding with NO fake itinerary */}
            {!hasStops ? (
              <div className="text-center py-5 px-2 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-beige flex items-center justify-center text-forest-green mb-3">
                  <Compass size={28} />
                </div>
                <h4 className="font-bold text-text-dark text-base mb-1">
                  Plan Your Uttarakhand Trip
                </h4>
                <p className="text-xs text-muted-text leading-relaxed mb-4 max-w-[240px]">
                  Choose places you want to visit and we'll connect your route and build your itinerary.
                </p>

                <button
                  onClick={openAddDrawer}
                  className="btn-primary w-full py-3 text-xs font-bold rounded-full uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                >
                  <Plus size={16} /> Add First Destination
                </button>

                {/* Quick Add Suggestions */}
                <div className="mt-4 pt-3 border-t border-border-light/60 w-full text-left">
                  <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider block mb-2">
                    Popular Picks:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Nainital', 'Mussoorie', 'Rishikesh', 'Almora'].map((place) => (
                      <button
                        key={place}
                        onClick={() => quickAddPopular(place)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#faf9f6] hover:bg-beige text-text-dark border border-border-light transition-colors"
                      >
                        + {place}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Populated State — list of actual chosen destinations */
              <>
                {/* Route Metrics Pill (if 2+ stops) */}
                {tripDestinations.length >= 2 && tripStats.totalDistanceKm > 0 && (
                  <div className="bg-forest-green/10 border border-forest-green/20 rounded-2xl p-2.5 flex items-center justify-between text-xs">
                    <span className="font-bold text-forest-green flex items-center gap-1.5">
                      <Route size={14} /> {tripStats.totalDistanceKm} km total
                    </span>
                    <span className="font-bold text-earth-brown flex items-center gap-1">
                      <Clock size={13} /> ~{tripStats.estimatedTime}
                    </span>
                  </div>
                )}

                {/* Stops List */}
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {tripDestinations.map((dest, idx) => {
                    const destId = dest._id || dest.id || dest.slug;
                    return (
                      <div 
                        key={destId}
                        className="bg-[#faf9f6] p-2.5 rounded-2xl border border-border-light/80 flex items-center gap-2.5 shadow-sm group hover:border-forest-green/40 transition-all"
                      >
                        {/* Number Badge */}
                        <div className="w-7 h-7 rounded-full bg-forest-green text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                          {idx + 1}
                        </div>

                        {/* Thumbnail */}
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-beige flex-shrink-0">
                          <img 
                            src={dest.image || dest.coverImage?.url || '/assets/fallback.svg'} 
                            alt={dest.name}
                            onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Title & District */}
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-text-dark text-xs truncate">
                            {dest.name}
                          </h5>
                          <p className="text-[11px] text-muted-text truncate">
                            {dest.district}
                          </p>
                        </div>

                        {/* Reorder Buttons */}
                        <div className="flex flex-col gap-0.5 flex-shrink-0">
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className={`p-0.5 rounded hover:bg-white text-muted-text hover:text-text-dark ${idx === 0 ? 'opacity-20 cursor-not-allowed' : ''}`}
                            title="Move up in trip order"
                          >
                            <ChevronUp size={13} />
                          </button>
                          <button 
                            disabled={idx === tripDestinations.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className={`p-0.5 rounded hover:bg-white text-muted-text hover:text-text-dark ${idx === tripDestinations.length - 1 ? 'opacity-20 cursor-not-allowed' : ''}`}
                            title="Move down in trip order"
                          >
                            <ChevronDown size={13} />
                          </button>
                        </div>

                        {/* Remove Button */}
                        <button 
                          onClick={() => removeTripDestination(destId)}
                          className="w-6 h-6 rounded-full hover:bg-red-50 hover:text-red-600 text-muted-text flex items-center justify-center transition-colors flex-shrink-0"
                          title="Remove stop"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-border-light">
                  <button
                    onClick={openAddDrawer}
                    className="w-full py-2.5 px-4 rounded-full border-2 border-dashed border-forest-green/40 hover:border-forest-green hover:bg-forest-green/5 text-forest-green font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus size={14} /> Add Another Stop
                  </button>

                  <button
                    onClick={openItinerary}
                    className="btn-primary w-full py-3 rounded-full font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                  >
                    <Sparkles size={15} /> Generate My Trip →
                  </button>
                </div>
              </>
            )}

          </div>
        )}

      </div>
    </aside>
  );
}
