import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Footprints, 
  Waves, 
  Trees, 
  Sparkles, 
  MapPin, 
  Building, 
  Car, 
  UserCheck, 
  Compass, 
  Plus, 
  Check, 
  ExternalLink, 
  Star,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { getProvenanceBadge } from '../../utils/discoveryAdapter';

// Icon resolver for discovery chips
const getCategoryIcon = (id) => {
  switch (id) {
    case 'trekking': return <Footprints size={15} />;
    case 'boating': return <Waves size={15} />;
    case 'nature': return <Trees size={15} />;
    case 'spiritual': return <Sparkles size={15} />;
    case 'adventure': return <Compass size={15} />;
    case 'stays': return <Building size={15} />;
    case 'rentals': return <Car size={15} />;
    case 'guides': return <UserCheck size={15} />;
    default: return <MapPin size={15} />;
  }
};

const DestinationDiscoveryWorkspace = ({
  destination,
  exploreData,
  selectedInterest,
  onSelectInterest,
  onAddToTrip,
  addedIds = new Set(),
  loading = false
}) => {
  if (!destination) return null;

  const destName = destination.name || 'this destination';
  const availableCategories = exploreData?.availableCategories || [];
  const matchingResults = exploreData?.matchingResults || [];
  const emptyStateMessage = exploreData?.emptyStateMessage;

  // Standard preset discovery interests
  const quickInterests = [
    { id: 'all', label: 'All Discovery', icon: <Layers size={15} /> },
    { id: 'trekking', label: 'Trekking', icon: <Footprints size={15} /> },
    { id: 'boating', label: 'Boating & Lakes', icon: <Waves size={15} /> },
    { id: 'nature', label: 'Nature', icon: <Trees size={15} /> },
    { id: 'spiritual', label: 'Spiritual', icon: <Sparkles size={15} /> },
    { id: 'places', label: 'Places to Visit', icon: <MapPin size={15} /> },
    { id: 'stays', label: 'Stays', icon: <Building size={15} /> },
    { id: 'rentals', label: 'Rentals', icon: <Car size={15} /> },
    { id: 'guides', label: 'Guides', icon: <UserCheck size={15} /> }
  ];

  // Helper to check if a category has real verified data
  const getCategoryCount = (id) => {
    if (id === 'all') return null;
    const found = availableCategories.find(c => c.id === id);
    return found ? found.count : 0;
  };

  return (
    <div className="w-full bg-white rounded-[2.5rem] p-6 sm:p-10 md:p-12 border border-border-light card-shadow mb-16">
      
      {/* ── TOP DISCOVERY HEADER ────────────────────────────────────────────── */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-green/10 text-forest-green text-xs font-black uppercase tracking-wider mb-3">
          <Compass size={14} /> Destination Discovery Workspace
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-text-dark font-display tracking-tight mb-2 uppercase">
          What do you want to do in {destName}?
        </h2>
        <p className="text-sm sm:text-base text-muted-text leading-relaxed">
          Tell us your interest, and we'll reveal authentic things you can actually do here — from local treks and boating to heritage shrines, verified government stays, and certified guides.
        </p>
      </div>

      {/* ── INTERACTIVE FILTER CHIPS ───────────────────────────────────────── */}
      <div className="mb-10 pb-6 border-b border-border-light/70">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-2 px-2 scroll-smooth">
          {quickInterests.map((chip) => {
            const isActive = (selectedInterest || 'all') === chip.id;
            const count = getCategoryCount(chip.id);
            const hasData = count === null || count > 0;

            return (
              <button
                key={chip.id}
                onClick={() => onSelectInterest(chip.id === 'all' ? null : chip.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer shadow-xs shrink-0 ${
                  isActive
                    ? 'bg-forest-green text-white shadow-md scale-[1.02]'
                    : hasData
                    ? 'bg-[#faf9f6] hover:bg-beige/60 text-text-dark border border-border-light hover:border-forest-green/30'
                    : 'bg-stone-50 text-stone-400 border border-stone-200/60 opacity-60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-forest-green'}>
                  {chip.icon}
                </span>
                <span>{chip.label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-forest-green/10 text-forest-green'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DYNAMIC FILTERED RESULTS VIEW ──────────────────────────────────── */}
      {selectedInterest && (
        <div className="animate-fade-in mb-10">
          
          {/* Section Context Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-text-dark font-display uppercase tracking-wide flex items-center gap-2">
                {selectedInterest === 'trekking' && `🥾 Trekking & Trails near ${destName}`}
                {selectedInterest === 'boating' && `🌊 Lakes & Boating in ${destName}`}
                {selectedInterest === 'nature' && `🌲 Nature & Viewpoints around ${destName}`}
                {selectedInterest === 'spiritual' && `🛕 Temples & Shrines near ${destName}`}
                {selectedInterest === 'places' && `🧭 Places to Visit in ${destName}`}
                {selectedInterest === 'stays' && `🏨 Verified Stays near ${destName}`}
                {selectedInterest === 'rentals' && `🏍️ Bike & Car Rentals in ${destination.district || destName}`}
                {selectedInterest === 'guides' && `👤 Certified Guides in ${destination.district || destName}`}
              </h3>
              <p className="text-xs text-muted-text mt-1">
                {selectedInterest === 'trekking' && `Genuinely verified trails within a 50km radius of ${destName}. Zero far-away fallbacks.`}
                {selectedInterest === 'boating' && `Water sports and lake experiences verified near ${destName}.`}
                {selectedInterest === 'nature' && `Himalayan scenic vistas and nature spots around ${destName}.`}
                {selectedInterest === 'spiritual' && `Sacred shrines and cultural places in this corridor.`}
                {selectedInterest === 'stays' && `Government tourist rest houses (KMVN/GMVN) and verified properties.`}
                {selectedInterest === 'rentals' && `Verified vehicle rentals available in ${destination.district || destName}.`}
                {selectedInterest === 'guides' && `State-certified tourist and trekking guides.`}
              </p>
            </div>

            <button
              onClick={() => onSelectInterest(null)}
              className="text-xs font-bold text-forest-green hover:underline cursor-pointer self-start sm:self-auto"
            >
              Clear Filter ✕
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-beige/40 animate-pulse border border-border-light p-4" />
              ))}
            </div>
          ) : matchingResults.length > 0 ? (
            /* Results Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchingResults.map((item) => {
                const itemId = String(item._id || item.id || item.slug);
                const isAdded = addedIds.has(itemId);
                const badge = getProvenanceBadge(item.priceProvenance);
                const itemImg = item.image || item.coverImage?.url || '/assets/fallback.svg';

                return (
                  <div
                    key={itemId}
                    className="bg-[#faf9f6] rounded-3xl overflow-hidden border border-border-light hover:border-forest-green/40 transition-all duration-300 flex flex-col group hover:shadow-md"
                  >
                    {/* Image Cover */}
                    <div className="relative h-44 w-full overflow-hidden bg-beige">
                      <img
                        src={itemImg}
                        alt={item.name}
                        onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white">
                          {item.category || item.itemType || 'Experience'}
                        </span>
                      </div>
                      {item.distanceKm && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-text-dark text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <MapPin size={10} className="text-forest-green" />
                          <span>~{item.distanceKm} km</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-base text-text-dark mb-1 group-hover:text-forest-green transition-colors font-display line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-text mb-3 line-clamp-2">
                          {item.description || item.shortDescription || `Authentic experience located around ${destName}, Uttarakhand.`}
                        </p>
                      </div>

                      {/* Pricing & Provenance */}
                      <div className="pt-3 border-t border-border-light/60 mt-auto">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div>
                            {item.price ? (
                              <div className="text-sm font-black text-text-dark">
                                ₹{Number(item.price).toLocaleString()}
                                <span className="text-[10px] font-medium text-muted-text">
                                  {item.itemType === 'stay' ? ' / night' : ' / person'}
                                </span>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-muted-text">
                                {item.priceProvenance === 'FREE_ACCESS' ? 'Free Entry' : 'Price on Inquiry'}
                              </div>
                            )}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onAddToTrip(item)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-forest-green hover:bg-dark-green text-white shadow-xs'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check size={14} /> Added to Trip
                              </>
                            ) : (
                              <>
                                <Plus size={14} /> Add to Trip
                              </>
                            )}
                          </button>

                          {item.slug && (
                            <Link
                              to={item.detailUrl || `/destinations/${item.slug}`}
                              className="p-2 rounded-xl bg-white hover:bg-beige text-text-dark border border-border-light transition-colors"
                              title="View Details"
                            >
                              <ExternalLink size={14} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Strict Zero-Hallucination Empty State */
            <div className="bg-[#faf9f6] rounded-3xl p-8 text-center border border-border-light/80 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center mx-auto mb-3">
                <Info size={22} />
              </div>
              <h4 className="font-bold text-text-dark text-base mb-1 font-display">
                No Verified Experiences Found
              </h4>
              <p className="text-xs text-muted-text mb-4 leading-relaxed">
                {emptyStateMessage || `No verified ${selectedInterest} experiences found within a 50km radius of ${destName}. We never fabricate unverified activities.`}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => onSelectInterest('boating')}
                  className="px-3 py-1.5 rounded-full bg-white border border-border-light text-xs font-bold text-forest-green hover:bg-beige transition-colors"
                >
                  🌊 Explore Boating
                </button>
                <button
                  onClick={() => onSelectInterest('places')}
                  className="px-3 py-1.5 rounded-full bg-white border border-border-light text-xs font-bold text-forest-green hover:bg-beige transition-colors"
                >
                  🧭 Places to Visit
                </button>
                <button
                  onClick={() => onSelectInterest('stays')}
                  className="px-3 py-1.5 rounded-full bg-white border border-border-light text-xs font-bold text-forest-green hover:bg-beige transition-colors"
                >
                  🏨 Check Stays
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── DEFAULT ALL DISCOVERY PANELS (WHEN NO FILTER SELECTED) ───────────── */}
      {!selectedInterest && (
        <div className="space-y-12">
          
          {/* 1. PLACES TO VISIT */}
          {exploreData?.placesToVisit && exploreData.placesToVisit.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-black text-text-dark font-display uppercase tracking-wide">
                    Places to Visit around {destName}
                  </h3>
                  <p className="text-xs text-muted-text">
                    Lakes, viewpoints, temples, and heritage sites in this locality
                  </p>
                </div>
                <button
                  onClick={() => onSelectInterest('places')}
                  className="text-xs font-bold text-forest-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All ({exploreData.placesToVisit.length}) <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exploreData.placesToVisit.slice(0, 3).map((place) => {
                  const id = String(place._id || place.id || place.slug);
                  const isAdded = addedIds.has(id);
                  return (
                    <div
                      key={id}
                      className="bg-[#faf9f6] rounded-2xl overflow-hidden border border-border-light flex flex-col justify-between p-4 hover:border-forest-green/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={place.image || '/assets/fallback.svg'}
                          alt={place.name}
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-forest-green/10 text-forest-green">
                            {place.category || 'Sight'}
                          </span>
                          <h4 className="font-bold text-sm text-text-dark truncate mt-1">
                            {place.name}
                          </h4>
                          {place.distanceKm && (
                            <span className="text-[11px] text-muted-text">~{place.distanceKm} km away</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-border-light/60">
                        <button
                          onClick={() => onAddToTrip(place)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isAdded ? 'bg-emerald-600 text-white' : 'bg-forest-green text-white hover:bg-dark-green'
                          }`}
                        >
                          {isAdded ? <Check size={12} /> : <Plus size={12} />}
                          <span>{isAdded ? 'Added' : 'Add to Trip'}</span>
                        </button>
                        <Link
                          to={place.detailUrl || `/destinations/${place.slug || id}`}
                          className="p-1.5 rounded-lg bg-white border border-border-light text-text-dark hover:bg-beige"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. FEATURED ACTIVITIES */}
          {exploreData?.activities && exploreData.activities.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-black text-text-dark font-display uppercase tracking-wide">
                    Outdoor & Lake Activities
                  </h3>
                  <p className="text-xs text-muted-text">
                    Verified activities within local reach
                  </p>
                </div>
                <button
                  onClick={() => onSelectInterest('boating')}
                  className="text-xs font-bold text-forest-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View Activities ({exploreData.activities.length}) <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exploreData.activities.slice(0, 3).map((act) => {
                  const id = String(act._id || act.id || act.slug);
                  const isAdded = addedIds.has(id);
                  const badge = getProvenanceBadge(act.priceProvenance);
                  return (
                    <div
                      key={id}
                      className="bg-[#faf9f6] rounded-2xl p-4 border border-border-light flex flex-col justify-between hover:border-forest-green/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={act.coverImage?.url || act.image?.url || '/assets/fallback.svg'}
                          alt={act.name}
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {act.category || 'Activity'}
                            </span>
                            {act.distanceKm && (
                              <span className="text-[10px] text-muted-text">~{act.distanceKm}km</span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-text-dark truncate mt-1">
                            {act.name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border-light/60">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.text}
                        </span>
                        <button
                          onClick={() => onAddToTrip(act)}
                          className={`py-1 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isAdded ? 'bg-emerald-600 text-white' : 'bg-forest-green text-white hover:bg-dark-green'
                          }`}
                        >
                          {isAdded ? <Check size={12} /> : <Plus size={12} />}
                          <span>{isAdded ? 'Added' : 'Add to Trip'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. STAYS NEARBY */}
          {exploreData?.stays && exploreData.stays.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-black text-text-dark font-display uppercase tracking-wide">
                    Government & Verified Stays Nearby
                  </h3>
                  <p className="text-xs text-muted-text">
                    KMVN Tourist Rest Houses and trusted accommodations
                  </p>
                </div>
                <button
                  onClick={() => onSelectInterest('stays')}
                  className="text-xs font-bold text-forest-green hover:underline flex items-center gap-1 cursor-pointer"
                >
                  View All Stays ({exploreData.stays.length}) <ArrowRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {exploreData.stays.slice(0, 3).map((stay) => {
                  const id = String(stay._id || stay.id || stay.slug);
                  const isAdded = addedIds.has(id);
                  const badge = getProvenanceBadge(stay.priceProvenance);
                  return (
                    <div
                      key={id}
                      className="bg-[#faf9f6] rounded-2xl p-4 border border-border-light flex flex-col justify-between hover:border-forest-green/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={stay.image || '/assets/fallback.svg'}
                          alt={stay.name}
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                            {stay.category || 'Government TRH'}
                          </span>
                          <h4 className="font-bold text-sm text-text-dark truncate mt-1">
                            {stay.name}
                          </h4>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-black text-text-dark">
                              {stay.price ? `₹${Number(stay.price).toLocaleString()} / night` : 'Tariff on site'}
                            </span>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${badge.className}`}>
                              {badge.text}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-border-light/60">
                        <button
                          onClick={() => onAddToTrip(stay)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isAdded ? 'bg-emerald-600 text-white' : 'bg-forest-green text-white hover:bg-dark-green'
                          }`}
                        >
                          {isAdded ? <Check size={12} /> : <Plus size={12} />}
                          <span>{isAdded ? 'Added' : 'Add to Trip'}</span>
                        </button>
                        <Link
                          to={stay.detailUrl || `/stays/${stay.slug || id}`}
                          className="p-1.5 rounded-lg bg-white border border-border-light text-text-dark hover:bg-beige"
                          title="View Stay Details"
                        >
                          <ExternalLink size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default DestinationDiscoveryWorkspace;
