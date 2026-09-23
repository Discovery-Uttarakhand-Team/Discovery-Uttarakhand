import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PhotoGallery from '../components/PhotoGallery';
import DestinationMap from '../components/DestinationMap';
import DestinationDiscoveryWorkspace from '../components/destination/DestinationDiscoveryWorkspace';
import FloatingTripBasket from '../components/planner/FloatingTripBasket';
import { getDestinationBySlug, getDestinationRelated, getDestinationExplore } from '../api/destinationApi';
import { normalizeDiscoveryCandidate } from '../utils/discoveryAdapter';
import { useAuth } from '../context/AuthContext';
import { useMapStore } from '../store/mapStore';
import api from '../api/api';
import { 
  MapPin, 
  Star, 
  Calendar, 
  ArrowLeft, 
  Heart, 
  Mountain, 
  Compass, 
  Phone, 
  Info, 
  Clock, 
  Sparkles,
  ShieldCheck,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

// Reusable Section wrapper with standard heading styling
const DetailSection = ({ title, subtitle, count, children, className = '' }) => (
  <section className={`mb-20 ${className}`}>
    <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-border-light/70 gap-2">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl md:text-3xl font-black text-text-dark font-display uppercase tracking-wide">
            {title}
          </h2>
          {count !== undefined && count > 0 && (
            <span className="bg-forest-green/10 text-forest-green text-xs font-bold px-2.5 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>
        {subtitle && <p className="text-muted-text text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

// Skeleton component for loading states
const SectionSkeleton = ({ count = 4, cardHeight = "h-72" }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`bg-white rounded-3xl p-4 border border-border-light animate-pulse ${cardHeight} flex flex-col justify-between`}>
        <div className="w-full h-40 bg-beige/60 rounded-2xl mb-4"></div>
        <div className="h-4 bg-beige/80 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-beige/50 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-beige/40 rounded-full w-full mt-auto"></div>
      </div>
    ))}
  </div>
);

const normalizeImgUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  let fixed = url;
  if (fixed.includes('upload.wikimedia.org/wikipedia/commons/thumb/')) {
    fixed = fixed.replace('upload.wikimedia.org/wikipedia/commons/thumb/', 'thumb.wikimedia.org/wikipedia/commons/thumb/');
  }
  if (fixed.includes('/1280px-')) {
    fixed = fixed.replace('/1280px-', '/1920px-');
  }
  return fixed;
};

// Fallback image helper
const getImageSrc = (record) => {
  if (!record) return '/assets/fallback.svg';
  if (record.coverImage?.url) return normalizeImgUrl(record.coverImage.url);
  if (typeof record.coverImage === 'string' && record.coverImage.length > 0) return normalizeImgUrl(record.coverImage);
  if (record.image?.url) return normalizeImgUrl(record.image.url);
  if (typeof record.image === 'string' && record.image.length > 0) return normalizeImgUrl(record.image);
  if (Array.isArray(record.images) && record.images.length > 0) {
    const first = record.images[0];
    if (first?.url) return normalizeImgUrl(first.url);
    if (typeof first === 'string' && first.length > 0) return normalizeImgUrl(first);
  }
  if (Array.isArray(record.gallery) && record.gallery.length > 0) {
    const first = record.gallery[0];
    if (first?.url) return normalizeImgUrl(first.url);
    if (typeof first === 'string' && first.length > 0) return normalizeImgUrl(first);
  }
  return '/assets/fallback.svg';
};

const DestinationDetails = () => {
  const { slug } = useParams();
  const { requireAuth } = useAuth();

  const [destination, setDestination] = useState(null);
  const [related, setRelated] = useState(null);
  const [loadingDest, setLoadingDest] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [destError, setDestError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullAbout, setShowFullAbout] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  // Parallel Data Fetching
  useEffect(() => {
    window.scrollTo(0, 0);
    setLoadingDest(true);
    setLoadingRelated(true);
    setDestError(null);
    setShowFullAbout(false);
    setActiveTooltip(null);

    // 1. Fetch main destination data
    getDestinationBySlug(slug)
      .then((res) => {
        if (res && res.success && res.data) {
          setDestination(res.data);
        } else {
          setDestError('Destination not found');
        }
      })
      .catch((err) => {
        console.error('Error loading destination:', err);
        setDestError('Unable to load destination data');
      })
      .finally(() => {
        setLoadingDest(false);
      });

    // 2. Fetch related items concurrently (non-blocking)
    getDestinationRelated(slug)
      .then((res) => {
        if (res && res.success && res.data) {
          setRelated(res.data);
        } else {
          setRelated({
            thingsToDo: [],
            placesToVisit: [],
            nearbyDestinations: [],
            nearbyPlacesListed: [],
            stays: [],
            guides: []
          });
        }
      })
      .catch((err) => {
        console.warn('Error fetching related data:', err);
        setRelated({
          thingsToDo: [],
          placesToVisit: [],
          nearbyDestinations: [],
          nearbyPlacesListed: [],
          stays: [],
          guides: []
        });
      })
      .finally(() => {
        setLoadingRelated(false);
      });
  }, [slug]);

  // Destination Discovery & Activity-Based Exploration State
  const [exploreData, setExploreData] = useState(null);
  const [selectedInterest, setSelectedInterest] = useState(null);
  const [loadingExplore, setLoadingExplore] = useState(false);
  const [addedTripIds, setAddedTripIds] = useState(new Set());

  // Fetch / refresh destination discovery data whenever slug or selected interest changes
  useEffect(() => {
    if (!slug) return;
    setLoadingExplore(true);
    const params = selectedInterest ? { interest: selectedInterest } : {};
    getDestinationExplore(slug, params)
      .then((res) => {
        if (res?.success) {
          setExploreData(res);
        }
      })
      .catch((err) => {
        console.warn('Error loading destination explore data:', err);
      })
      .finally(() => {
        setLoadingExplore(false);
      });
  }, [slug, selectedInterest]);

  // Clean, normalized Add-To-Trip handler adhering strictly to useMapStore contract
  const handleAddToTrip = (item) => {
    if (!item || !destination) return;
    const normalized = normalizeDiscoveryCandidate(item, destination);
    if (!normalized) return;

    useMapStore.getState().addTripDestination(normalized);
    setAddedTripIds((prev) => new Set(prev).add(normalized._id));

    setTimeout(() => {
      setAddedTripIds((prev) => {
        const next = new Set(prev);
        next.delete(normalized._id);
        return next;
      });
    }, 2500);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    requireAuth(async () => {
      try {
        const destId = destination?._id || destination?.id;
        if (!destId) return;
        const res = await api.post(`/users/favorites/destination/${destId}`);
        if (res.data?.success) {
          setIsFavorite(res.data.action === 'added');
        }
      } catch (err) {
        console.error('Failed to toggle favorite', err);
      }
    });
  };

  // Pre-calculate place tag chip links
  const placeLookup = useMemo(() => {
    const map = new Map();
    if (related) {
      if (Array.isArray(related.nearbyDestinations)) {
        related.nearbyDestinations.forEach(d => {
          if (d.name) map.set(d.name.toLowerCase().trim(), `/destinations/${d.slug}`);
        });
      }
      if (Array.isArray(related.placesToVisit)) {
        related.placesToVisit.forEach(p => {
          if (p.name) {
            // Determine route based on collection or heuristics
            const route = p.deity || p.architectureStyle ? `/spiritual/${p.slug}` : `/culture/${p.slug}`;
            map.set(p.name.toLowerCase().trim(), route);
          }
        });
      }
    }
    return map;
  }, [related]);

  // Combined Places to Visit Nearby cards
  const combinedPlacesNearby = useMemo(() => {
    if (!related) return [];
    const destCards = (related.nearbyDestinations || []).map(d => ({
      ...d,
      itemType: 'destination',
      detailUrl: `/destinations/${d.slug}`
    }));
    const placesCards = (related.placesToVisit || []).map(p => ({
      ...p,
      itemType: p.deity || p.architectureStyle ? 'spiritual' : 'culture',
      detailUrl: p.deity || p.architectureStyle ? `/spiritual/${p.slug}` : `/culture/${p.slug}`
    }));

    return [...destCards, ...placesCards];
  }, [related]);

  if (loadingDest) {
    return (
      <div className="min-h-screen flex flex-col pt-32 bg-[#faf9f6]">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 border-4 border-beige border-t-forest-green rounded-full animate-spin mb-4"></div>
          <h2 className="text-2xl font-black text-text-dark font-display uppercase tracking-wider">
            Discovering {slug.replace(/-/g, ' ')}...
          </h2>
          <p className="text-muted-text text-sm mt-2">Connecting to the heart of Uttarakhand</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (destError || !destination) {
    return (
      <div className="min-h-screen flex flex-col pt-32 bg-[#faf9f6]">
        <Navbar />
        <main className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-3xl font-black text-text-dark mb-4 font-display">
            {destError || 'Destination Not Found'}
          </h2>
          <p className="text-muted-text max-w-md mb-8">
            The destination you are looking for might have been moved, renamed, or is currently unavailable.
          </p>
          <Link to="/" className="bg-forest-green text-white px-8 py-3.5 font-bold rounded-full hover:bg-dark-green transition-all shadow-md">
            Return to Explore
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Destination attributes
  const aboutText = destination.description || destination.shortDescription || '';
  const isLongAbout = aboutText.length > 320;
  const bestTime = destination.bestTimeToVisit || 'Not specified';
  const hasCoordinates = destination.location &&
    Array.isArray(destination.location.coordinates) &&
    destination.location.coordinates.length === 2 &&
    typeof destination.location.coordinates[0] === 'number' &&
    typeof destination.location.coordinates[1] === 'number';

  // Section visibility checks
  const thingsToDo = related?.thingsToDo || [];
  const highlights = destination.highlights || [];
  const showThingsToDoSection = loadingRelated || (thingsToDo.length > 0 || highlights.length > 0);

  const nearbyPlacesTags = related?.nearbyPlacesListed || [];
  const showPlacesNearbySection = loadingRelated || (combinedPlacesNearby.length > 0 || nearbyPlacesTags.length > 0);

  const stays = related?.stays || [];
  const showStaysSection = loadingRelated || stays.length > 0;

  const guides = related?.guides || [];
  const showGuidesSection = loadingRelated || guides.length > 0;

  return (
    <div className="min-h-screen flex flex-col pt-24 md:pt-32 bg-[#faf9f6] text-text-dark selection:bg-forest-green selection:text-white">
      <Navbar />

      <main className="flex-grow flex flex-col pb-20">
        
        {/* Navigation Breadcrumb */}
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full mb-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-forest-green font-bold text-xs sm:text-sm border border-slate-200/80 shadow-xs transition-all duration-200 group cursor-pointer"
          >
            <ArrowLeft size={16} className="text-forest-green group-hover:-translate-x-1 transition-transform" /> 
            <span>Back to Explore Uttarakhand</span>
          </Link>
        </div>

        {/* 1. HERO SECTION */}
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full mb-10">
          <div className="relative w-full h-[520px] md:h-[640px] rounded-[2.5rem] overflow-hidden bg-beige shadow-lg">
            <img 
              src={getImageSrc(destination)} 
              alt={destination.name}
              onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
            
            {/* Top Bar inside Hero */}
            <div className="absolute top-6 right-6 flex items-center gap-3">
              <button 
                onClick={handleFavorite}
                className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-forest-green transition-all shadow-md z-10"
                aria-label="Save to favorites"
              >
                <Heart size={22} className={isFavorite ? "fill-current text-white" : ""} />
              </button>
            </div>
            
            {/* Hero Content at Bottom */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="flex-1 max-w-4xl">
                {/* District & Region tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-forest-green text-white text-xs font-black tracking-widest px-3.5 py-1.5 rounded-full uppercase shadow-sm">
                    {destination.category || 'Destination'}
                  </span>
                  {destination.region && (
                    <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wider px-3.5 py-1.5 rounded-full uppercase border border-white/30">
                      {destination.region} Region
                    </span>
                  )}
                  {destination.district && (
                    <span className="bg-white/10 backdrop-blur-md text-white/90 text-xs font-bold tracking-wider px-3.5 py-1.5 rounded-full border border-white/20 flex items-center gap-1">
                      <MapPin size={12} /> {destination.district} District
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white mb-4 drop-shadow-md font-display tracking-tight">
                  {destination.name}
                </h1>

                {/* Experiences Chips directly under title */}
                {Array.isArray(destination.experiences) && destination.experiences.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {destination.experiences.map((exp, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/25 backdrop-blur-md text-white text-xs font-bold border border-white/30 shadow-sm"
                      >
                        <span className="text-white/80 text-[10px]">✦</span> {exp}
                      </span>
                    ))}
                  </div>
                )}
              </div>              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                <button 
                  onClick={() => handleAddToTrip(destination)}
                  className={`font-black py-4 px-8 rounded-full transition-all shadow-xl text-center flex items-center justify-center gap-2 tracking-wide uppercase text-sm cursor-pointer ${
                    addedTripIds.has(String(destination._id || destination.slug))
                      ? 'bg-emerald-600 text-white'
                      : 'bg-forest-green hover:bg-dark-green text-white'
                  }`}
                >
                  {addedTripIds.has(String(destination._id || destination.slug)) ? (
                    <>
                      <Check size={18} /> Added to Trip
                    </>
                  ) : (
                    <>
                      <Mountain size={18} /> Add to Trip
                    </>
                  )}
                </button>
                <Link 
                  to="/trip-planner"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold py-4 px-6 rounded-full transition-all border border-white/30 text-center flex items-center justify-center gap-2 uppercase text-sm"
                >
                  Plan Custom Trip
                </Link>
              </div>
            </div>
          </div>

          {destination.coverImage?.attribution && (
            <div className="text-right mt-2 text-[11px] text-muted-text px-2">
              Photo: {destination.coverImage.attribution}
            </div>
          )}
        </div>

        {/* Gallery Carousel Component */}
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full mb-14">
          <PhotoGallery coverImage={destination.coverImage} gallery={destination.gallery} />
        </div>

        {/* 2. OVERVIEW SECTION */}
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full mb-20">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-border-light card-shadow">
            
            {/* Quick Facts Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-8 border-b border-border-light/70 mb-8">
              <div className="flex flex-col">
                <span className="text-muted-text text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MapPin size={14} className="text-earth-brown" /> Location
                </span>
                <p className="text-text-dark font-black text-lg">
                  {destination.district || 'Uttarakhand'}
                  {destination.region ? `, ${destination.region}` : ''}
                </p>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-text text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-earth-brown" /> Best Time to Visit
                </span>
                <p className="text-text-dark font-black text-lg">
                  {bestTime}
                </p>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-text text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Clock size={14} className="text-earth-brown" /> Ideal Duration
                </span>
                <p className="text-text-dark font-black text-lg">
                  {destination.idealDuration || '1 - 3 Days'}
                </p>
              </div>

              <div className="flex flex-col">
                <span className="text-muted-text text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Star size={14} className="text-earth-brown" /> Traveler Rating
                </span>
                <p className="text-text-dark font-black text-lg flex items-center gap-1">
                  {destination.rating && destination.rating > 0 ? (
                    <>
                      <Star size={18} className="fill-earth-brown text-earth-brown" />
                      {destination.rating} / 5
                    </>
                  ) : (
                    <span className="text-muted-text font-bold text-base">Recommended</span>
                  )}
                </p>
              </div>
            </div>

            {/* Overview Description & Conditional Map Grid */}
            <div className={`grid grid-cols-1 ${hasCoordinates ? 'lg:grid-cols-2 gap-10' : 'gap-6'} items-start`}>
              <div>
                <h3 className="text-2xl font-black text-text-dark mb-4 font-display uppercase tracking-wide">
                  Overview
                </h3>
                <div className="text-muted-text text-base leading-relaxed space-y-4">
                  <p className={`whitespace-pre-line ${!showFullAbout && isLongAbout ? 'line-clamp-6' : ''}`}>
                    {aboutText || 'Discover breathtaking Himalayan landscapes, rich spiritual heritage, and serene nature in this iconic destination of Uttarakhand.'}
                  </p>
                  {isLongAbout && (
                    <button 
                      onClick={() => setShowFullAbout(!showFullAbout)}
                      className="text-forest-green font-black text-sm uppercase tracking-wider hover:text-dark-green underline underline-offset-4 transition-colors pt-2 block"
                    >
                      {showFullAbout ? 'Show Less ↑' : 'Read Full Overview ↓'}
                    </button>
                  )}
                </div>

                {/* Additional Metadata pills if available */}
                {destination.budgetLevel && (
                  <div className="mt-6 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-text">Budget Style:</span>
                    <span className="bg-beige text-text-dark font-bold text-xs px-3 py-1 rounded-full border border-border-light">
                      {destination.budgetLevel}
                    </span>
                  </div>
                )}
              </div>

              {/* Map Card ONLY if coordinates exist */}
              {hasCoordinates && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-text flex items-center gap-1.5">
                      <Compass size={14} className="text-forest-green" /> Geographical Location
                    </span>
                    <span className="text-[11px] text-muted-text font-mono">
                      {destination.location.coordinates[1].toFixed(4)}° N, {destination.location.coordinates[0].toFixed(4)}° E
                    </span>
                  </div>
                  <div className="rounded-3xl overflow-hidden border border-border-light shadow-sm">
                    <DestinationMap 
                      center={[destination.location.coordinates[1], destination.location.coordinates[0]]}
                      items={related}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── DESTINATION DISCOVERY & ACTIVITY WORKSPACE ───────────────────────── */}
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full">
            <DestinationDiscoveryWorkspace
              destination={destination}
              exploreData={exploreData}
              selectedInterest={selectedInterest}
              onSelectInterest={setSelectedInterest}
              onAddToTrip={handleAddToTrip}
              addedIds={addedTripIds}
              loading={loadingExplore}
            />

            <FloatingTripBasket />
        </div>

        {/* 3. THINGS TO DO SECTION */}
        {showThingsToDoSection && (
          <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full">
            <DetailSection 
              title="Things to Do" 
              subtitle={`Exciting adventures, experiences, and attractions in and around ${destination.name}`}
              count={thingsToDo.length}
            >
              {loadingRelated ? (
                <SectionSkeleton count={4} />
              ) : (
                <>
                  {/* Activity Cards: horizontal scroll on mobile, responsive grid on desktop */}
                  {thingsToDo.length > 0 && (
                    <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0 scrollbar-thin mb-8">
                      {thingsToDo.map((act) => (
                        <Link 
                          key={act._id || act.slug} 
                          to={`/activities/${act.slug}`}
                          className="min-w-[280px] max-w-[320px] shrink-0 snap-start md:min-w-0 md:max-w-none md:shrink md:w-auto group flex flex-col bg-white rounded-3xl overflow-hidden border border-border-light card-shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="relative h-48 w-full overflow-hidden bg-beige">
                            <img 
                              src={getImageSrc(act)} 
                              alt={act.name}
                              loading="lazy"
                              onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {act.category && (
                              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-text-dark text-xs font-black px-3 py-1 rounded-full shadow-sm">
                                {act.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="p-5 flex flex-col flex-grow justify-between">
                            <div>
                              <h4 className="text-lg font-black text-text-dark mb-1 font-display group-hover:text-forest-green transition-colors">
                                {act.name}
                              </h4>
                              {act.district && (
                                <p className="text-muted-text text-xs font-medium mb-3 flex items-center gap-1">
                                  <MapPin size={12} className="text-earth-brown" /> {act.district}
                                </p>
                              )}
                              <p className="text-muted-text text-sm line-clamp-2 leading-relaxed">
                                {act.shortDescription || act.description || 'Explore this memorable adventure in the Himalayas.'}
                              </p>
                            </div>
                            
                            <div className="mt-5 pt-3 border-t border-border-light/50 flex items-center justify-between">
                              <span className="text-forest-green text-xs font-bold uppercase tracking-wider group-hover:underline">
                                View Activity
                              </span>
                              <ChevronRight size={16} className="text-forest-green group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Below them: Popular attractions chip list from highlights */}
                  {highlights.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-border-light card-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={18} className="text-earth-brown" />
                        <h4 className="text-sm font-black text-text-dark uppercase tracking-widest">
                          Popular Attractions & Highlights
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {highlights.map((item, idx) => (
                          <span 
                            key={idx} 
                            className="bg-[#faf9f6] text-text-dark font-bold text-sm px-4 py-2 rounded-full border border-border-light shadow-sm hover:border-forest-green hover:text-forest-green transition-colors cursor-default"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </DetailSection>
          </div>
        )}

        {/* 4. PLACES TO VISIT NEARBY SECTION */}
        {showPlacesNearbySection && (
          <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full">
            <DetailSection 
              title="Places to Visit Nearby" 
              subtitle={`Charming hill stations, serene temples, and cultural landmarks accessible from ${destination.name}`}
              count={combinedPlacesNearby.length}
            >
              {loadingRelated ? (
                <SectionSkeleton count={4} />
              ) : (
                <>
                  {/* Cards Grid: horizontal scroll on mobile */}
                  {combinedPlacesNearby.length > 0 && (
                    <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 scrollbar-thin mb-8">
                      {combinedPlacesNearby.map((place, idx) => (
                        <Link 
                          key={place._id || place.slug || idx} 
                          to={place.detailUrl}
                          className="min-w-[280px] max-w-[320px] shrink-0 snap-start md:min-w-0 md:max-w-none md:shrink md:w-auto group flex flex-col bg-white rounded-3xl overflow-hidden border border-border-light card-shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="relative h-48 w-full overflow-hidden bg-beige">
                            <img 
                              src={getImageSrc(place)} 
                              alt={place.name}
                              loading="lazy"
                              onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-text-dark text-[11px] font-black px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wide">
                              {place.itemType === 'spiritual' ? 'Spiritual' : place.itemType === 'culture' ? 'Heritage' : 'Destination'}
                            </div>
                          </div>
                          
                          <div className="p-5 flex flex-col flex-grow justify-between">
                            <div>
                              <h4 className="text-lg font-black text-text-dark mb-1 font-display group-hover:text-forest-green transition-colors">
                                {place.name}
                              </h4>
                              {place.district && (
                                <p className="text-muted-text text-xs font-medium mb-2.5 flex items-center gap-1">
                                  <MapPin size={12} className="text-earth-brown" /> {place.district}
                                </p>
                              )}
                              <p className="text-muted-text text-sm line-clamp-2 leading-relaxed">
                                {place.shortDescription || place.description || 'Explore scenic viewpoints, temples, and tranquil nature.'}
                              </p>
                            </div>
                            
                            <div className="mt-5 pt-3 border-t border-border-light/50 flex items-center justify-between">
                              <span className="text-forest-green text-xs font-bold uppercase tracking-wider group-hover:underline">
                                Explore Details
                              </span>
                              <ChevronRight size={16} className="text-forest-green group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Nearby Places Listed Tag Chips */}
                  {nearbyPlacesTags.length > 0 && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 border border-border-light card-shadow">
                      <div className="flex items-center gap-2 mb-4">
                        <Compass size={18} className="text-earth-brown" />
                        <h4 className="text-sm font-black text-text-dark uppercase tracking-widest">
                          More Nearby Towns & Excursions
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2.5">
                        {nearbyPlacesTags.map((name, idx) => {
                          const lower = name.toLowerCase().trim();
                          const matchedUrl = placeLookup.get(lower);
                          if (matchedUrl) {
                            return (
                              <Link
                                key={idx}
                                to={matchedUrl}
                                className="inline-flex items-center gap-1.5 bg-forest-green/10 hover:bg-forest-green hover:text-white text-forest-green font-bold text-xs px-4 py-2 rounded-full border border-forest-green/20 transition-all shadow-sm group"
                              >
                                <span>📍</span>
                                <span>{name}</span>
                                <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
                              </Link>
                            );
                          }
                          return (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1.5 bg-beige/50 text-text-dark font-medium text-xs px-4 py-2 rounded-full border border-border-light shadow-sm"
                            >
                              <span>📍</span>
                              <span>{name}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </DetailSection>
          </div>
        )}

        {/* 5. WHERE TO STAY SECTION */}
        {showStaysSection && (
          <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full">
            <DetailSection 
              title="Where to Stay" 
              subtitle={`Verified KMVN Tourist Rest Houses and authentic mountain stays in ${destination.district || 'the area'}`}
              count={stays.length}
            >
              {loadingRelated ? (
                <SectionSkeleton count={4} />
              ) : (
                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0 scrollbar-thin">
                  {stays.map((stay) => {
                    const priceAmount = stay.price?.amount || stay.pricePerNight;
                    const formattedPrice = priceAmount ? Number(priceAmount).toLocaleString('en-IN') : null;
                    const tooltipKey = stay._id || stay.slug;

                    return (
                      <div 
                        key={stay._id || stay.slug}
                        className="min-w-[280px] max-w-[340px] shrink-0 snap-start md:min-w-0 md:max-w-none md:shrink md:w-auto bg-white rounded-3xl overflow-hidden border border-border-light card-shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Container with fallback placeholder */}
                          <div className="relative h-48 w-full overflow-hidden bg-beige">
                            <img 
                              src={getImageSrc(stay)} 
                              alt={stay.name}
                              loading="lazy"
                              onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-text-dark text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                              {stay.category || 'KMVN Tourist Rest House'}
                            </div>
                          </div>

                          <div className="p-5">
                            <h4 className="text-lg font-black text-text-dark mb-1 font-display line-clamp-1">
                              {stay.name}
                            </h4>
                            <p className="text-muted-text text-xs font-medium mb-4 flex items-center gap-1">
                              <MapPin size={12} className="text-earth-brown" /> 
                              {stay.city || stay.district || 'Uttarakhand'}
                            </p>

                            {/* Price and Notes */}
                            <div className="bg-[#faf9f6] p-3 rounded-2xl border border-border-light/70 flex items-center justify-between mb-4">
                              <div>
                                <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider block">
                                  Official Tariff
                                </span>
                                {formattedPrice ? (
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-earth-brown">₹{formattedPrice}</span>
                                    <span className="text-xs font-bold text-muted-text">/ night</span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-text-dark">Tariff on request</span>
                                )}
                              </div>

                              {/* Price Notes Tooltip Trigger */}
                              {stay.priceNotes && (
                                <div className="relative">
                                  <button
                                    type="button"
                                    onClick={() => setActiveTooltip(activeTooltip === tooltipKey ? null : tooltipKey)}
                                    className="h-8 w-8 rounded-full bg-white hover:bg-beige text-muted-text hover:text-text-dark flex items-center justify-center border border-border-light transition-colors"
                                    title="View tariff details"
                                    aria-label="Tariff details"
                                  >
                                    <Info size={16} />
                                  </button>

                                  {activeTooltip === tooltipKey && (
                                    <div className="absolute right-0 bottom-10 w-64 bg-text-dark text-white p-3 rounded-xl text-xs z-30 shadow-xl border border-white/10 leading-relaxed">
                                      <p className="font-bold mb-1 text-earth-brown">Price Details:</p>
                                      <p>{stay.priceNotes}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Link */}
                        <div className="p-5 pt-0">
                          <Link 
                            to={`/stays/${stay.slug}`}
                            className="w-full bg-forest-green hover:bg-dark-green text-white text-xs font-bold py-3 px-4 rounded-xl text-center block transition-colors uppercase tracking-wider"
                          >
                            View Stay Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </DetailSection>
          </div>
        )}

        {/* 6. LOCAL GUIDES SECTION */}
        {showGuidesSection && (
          <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full">
            <DetailSection 
              title="Local Guides" 
              subtitle={`Government certified and expert local guides available in ${destination.district || 'this region'}`}
              count={guides.length}
            >
              {loadingRelated ? (
                <SectionSkeleton count={4} />
              ) : (
                <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 scrollbar-thin">
                  {guides.map((guide) => {
                    const initials = guide.name
                      ? guide.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
                      : 'G';

                    return (
                      <div 
                        key={guide._id || guide.slug}
                        className="min-w-[280px] max-w-[320px] shrink-0 snap-start md:min-w-0 md:max-w-none md:shrink md:w-auto bg-white rounded-3xl p-5 border border-border-light card-shadow hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Guide Avatar Header */}
                          <div className="flex items-center gap-4 mb-4">
                            {guide.profileImage ? (
                              <img 
                                src={guide.profileImage?.url || guide.profileImage}
                                alt={guide.name}
                                onError={(e) => { e.target.style.display = 'none'; }}
                                className="w-16 h-16 rounded-2xl object-cover bg-beige shrink-0"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-green to-dark-green text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
                                {initials}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-1 text-[11px] font-bold text-forest-green uppercase tracking-wider mb-0.5">
                                <ShieldCheck size={14} /> Govt. Certified
                              </div>
                              <h4 className="text-base font-black text-text-dark leading-tight line-clamp-1">
                                {guide.name}
                              </h4>
                              {guide.experience && (
                                <p className="text-muted-text text-xs mt-0.5">
                                  {guide.experience} experience
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Specialties Chips */}
                          {Array.isArray(guide.specialties) && guide.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {guide.specialties.slice(0, 3).map((spec, idx) => (
                                <span key={idx} className="bg-beige/60 text-text-dark text-[11px] font-bold px-2.5 py-1 rounded-full border border-border-light">
                                  {spec}
                                </span>
                              ))}
                              {guide.specialties.length > 3 && (
                                <span className="text-[11px] font-bold text-muted-text px-1 self-center">
                                  +{guide.specialties.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Phone contact */}
                          {guide.phone && (
                            <a 
                              href={`tel:${guide.phone}`}
                              className="flex items-center gap-2 text-xs font-bold text-earth-brown bg-[#faf9f6] p-2.5 rounded-xl border border-border-light mb-4 hover:border-earth-brown transition-colors"
                            >
                              <Phone size={14} /> 
                              <span>Call: {guide.phone}</span>
                            </a>
                          )}
                        </div>

                        {/* Profile Link Button */}
                        <Link 
                          to={`/guides/${guide.slug}`}
                          className="w-full bg-[#faf9f6] hover:bg-forest-green hover:text-white text-forest-green font-bold py-2.5 px-4 rounded-xl text-xs transition-colors text-center border border-forest-green/20 uppercase tracking-wider block"
                        >
                          View Guide Profile
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </DetailSection>
          </div>
        )}

        {/* 7. TRIP PLANNER CTA */}
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full mt-6">
          <div className="bg-forest-green rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4"></div>
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-4 font-display">
                Ready to explore {destination.name}?
              </h3>
              <p className="text-white/90 text-base md:text-lg mb-8 leading-relaxed">
                Add {destination.name} to your custom itinerary and experience the wonders of Uttarakhand with intelligent route planning.
              </p>
              <Link 
                to="/trip-planner" 
                onClick={() => {
                  const coords = (destination.location && Array.isArray(destination.location.coordinates) && destination.location.coordinates.length === 2)
                    ? [destination.location.coordinates[1], destination.location.coordinates[0]]
                    : (Array.isArray(destination.coordinates) && destination.coordinates.length === 2 ? destination.coordinates : null);
                  useMapStore.getState().addTripDestination({
                    ...destination,
                    id: destination._id || destination.slug,
                    coordinates: coords,
                    image: destination.coverImage?.url || destination.image?.url || '/assets/fallback.svg'
                  });
                }}
                className="inline-block bg-white text-forest-green text-base font-black py-4 px-10 rounded-full hover:bg-beige transition-all shadow-lg uppercase tracking-wider"
              >
                Build My Trip →
              </Link>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default DestinationDetails;
