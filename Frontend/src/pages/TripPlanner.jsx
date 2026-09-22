import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useMapStore } from '../store/mapStore';
import { getDestinations } from '../api/destinationApi';
import { getSpiritualPlaces } from '../api/spiritualApi';
import { getStays } from '../api/stayApi';
import { getActivities } from '../api/activityApi';
import { getCulturePlaces } from '../api/cultureApi';
import { detectBrowserLocation, geocodeCityName, POPULAR_START_HUBS } from '../utils/geoHelpers';
import { generatePersonalizedTripPlan } from '../utils/itineraryGenerator';
import { fetchOSRMRoute } from '../utils/routeHelpers';
import { normalizeLocationValue } from '../utils/locationHelpers';
import {
  MapPin,
  Calendar,
  Clock,
  Car,
  Users,
  Compass,
  Sparkles,
  Search,
  Check,
  AlertCircle,
  RotateCcw,
  Navigation,
  Loader2,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Heart,
  Mountain,
  Landmark,
  Trees,
  Coffee,
  Flame,
  Wallet,
  Banknote,
  TrendingUp,
  Utensils,
  Bed,
  Fuel,
  Ticket,
  ShieldCheck,
  Calculator,
  Info
} from 'lucide-react';

// Normalise API entities
const normaliseEntity = (raw, type) => {
  const c = raw.location?.coordinates;
  const coords =
    Array.isArray(c) && c.length === 2
      ? [c[1], c[0]]
      : Array.isArray(raw.coordinates) && raw.coordinates.length === 2
      ? raw.coordinates
      : null;

  const image =
    raw.coverImage?.url ||
    (typeof raw.coverImage === 'string' ? raw.coverImage : null) ||
    raw.image?.url ||
    (typeof raw.image === 'string' ? raw.image : null) ||
    (Array.isArray(raw.images) && raw.images[0]?.url) ||
    '/assets/fallback.svg';

  return {
    ...raw,
    id: raw._id || raw.slug,
    type,
    coordinates: coords,
    image,
    district: raw.district || 'Uttarakhand',
    region: raw.region || raw.area || '',
    shortDesc: raw.shortDescription || raw.shortDesc || raw.description || '',
    category: raw.category || type,
  };
};

const TRIP_TYPES = [
  { id: 'Trekking', label: 'Trekking', icon: Mountain },
  { id: 'Adventure', label: 'Adventure', icon: Compass },
  { id: 'Spiritual', label: 'Spiritual', icon: Landmark },
  { id: 'Nature', label: 'Nature', icon: Trees },
  { id: 'Relaxation', label: 'Relaxation', icon: Coffee },
  { id: 'Culture', label: 'Culture', icon: Flame },
  { id: 'Road Trip', label: 'Road Trip', icon: Car },
  { id: 'Family', label: 'Family', icon: Users },
];

const INTERESTS_LIST = [
  'Trekking',
  'Temple Visits',
  'Nature Walks',
  'Wildlife',
  'Photography',
  'Adventure Sports',
  'Local Culture',
  'Camping',
  'Wellness & Yoga',
];

const TRAVEL_MODES = ['Car', 'Bike', 'Taxi', 'Bus / Public Transport'];
const TRAVELER_OPTIONS = ['Solo', '2 Adults', 'Family (2 Adults, 1-2 Kids)', 'Group (3-5)', 'Large Group (6+)'];
const DURATIONS = ['1 Day', '2 Days', '3 Days', '4 Days', '5 Days', '7 Days', '10+ Days'];

export default function TripPlanner() {
  const navigate = useNavigate();
  const {
    allDestinations,
    allSpiritual,
    allActivities,
    allStays,
    setDestinations,
    setSpiritual,
    setStays,
    setActivities,
    setActiveTripSession,
    plannerForm,
    setPlannerForm,
  } = useMapStore();

  const [loadingData, setLoadingData] = useState(true);

  // Form State
  // 1. Starting location
  const [startingLocation, setStartingLocation] = useState({
    name: '',
    coordinates: null,
  });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [customCityInput, setCustomCityInput] = useState('');

  // 2. Destination
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destSearchQuery, setDestSearchQuery] = useState('');
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);

  // 3. Dates & Duration
  const [hasExactDates, setHasExactDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('5 Days');

  // 4. Travelers & Transport
  const [travelers, setTravelers] = useState('2 Adults');
  const [transport, setTransport] = useState('Car');

  // 5. Trip Type & Interests
  const [tripTypes, setTripTypes] = useState(['Nature', 'Trekking']);
  const [interests, setInterests] = useState(['Nature Walks', 'Photography']);

  // 6. Pace & Budget
  const [pace, setPace] = useState('Balanced');
  const [budget, setBudget] = useState('Comfort');
  const [customBudgetLimit, setCustomBudgetLimit] = useState('');

  // ── Live Interactive Budget Tracker Engine ──────────────────────────
  const liveBudget = useMemo(() => {
    const numDays = parseInt(duration, 10) || 5;
    const nights = Math.max(1, numDays - 1);

    let numTravelers = 2;
    if (travelers?.includes('Solo')) numTravelers = 1;
    else if (travelers?.includes('2 Adults')) numTravelers = 2;
    else if (travelers?.includes('Family')) numTravelers = 3;
    else if (travelers?.includes('Group (3-5)')) numTravelers = 4;
    else if (travelers?.includes('Large Group')) numTravelers = 6;

    const roomsNeeded = Math.ceil(numTravelers / 2);

    let stayMin = 1000;
    let stayMax = 1800;
    let foodMin = 450;
    let foodMax = 750;
    let actMin = 200;
    let actMax = 500;

    if (budget === 'Comfort') {
      stayMin = 2400;
      stayMax = 4500;
      foodMin = 900;
      foodMax = 1600;
      actMin = 500;
      actMax = 1200;
    } else if (budget === 'Premium') {
      stayMin = 6500;
      stayMax = 14000;
      foodMin = 2000;
      foodMax = 3800;
      actMin = 1500;
      actMax = 3500;
    }

    let transportMin = 2000;
    let transportMax = 3200;
    let isPerPersonTransport = false;

    if (transport === 'Bike') {
      transportMin = 700;
      transportMax = 1200;
    } else if (transport === 'Car') {
      transportMin = 2000;
      transportMax = 3200;
    } else if (transport === 'Taxi') {
      transportMin = 3600;
      transportMax = 5500;
    } else if (transport?.includes('Bus')) {
      transportMin = 350;
      transportMax = 650;
      isPerPersonTransport = true;
    }

    const stayTotalMin = roomsNeeded * stayMin * nights;
    const stayTotalMax = roomsNeeded * stayMax * nights;

    const foodTotalMin = numTravelers * foodMin * numDays;
    const foodTotalMax = numTravelers * foodMax * numDays;

    const transTotalMin = isPerPersonTransport 
      ? numTravelers * transportMin * numDays 
      : transportMin * numDays;
    const transTotalMax = isPerPersonTransport 
      ? numTravelers * transportMax * numDays 
      : transportMax * numDays;

    const actTotalMin = numTravelers * actMin * Math.min(numDays, 3);
    const actTotalMax = numTravelers * actMax * Math.min(numDays, 3);

    const subtotalMin = stayTotalMin + foodTotalMin + transTotalMin + actTotalMin;
    const subtotalMax = stayTotalMax + foodTotalMax + transTotalMax + actTotalMax;

    const bufferMin = Math.round(subtotalMin * 0.1);
    const bufferMax = Math.round(subtotalMax * 0.1);

    const totalMin = subtotalMin + bufferMin;
    const totalMax = subtotalMax + bufferMax;

    const perPersonMin = Math.round(totalMin / numTravelers);
    const perPersonMax = Math.round(totalMax / numTravelers);

    const target = customBudgetLimit ? Number(customBudgetLimit) : null;
    let budgetStatus = 'OPTIMAL';
    let progressPercent = 65;

    if (target && target > 0) {
      const midPoint = (totalMin + totalMax) / 2;
      progressPercent = Math.min(100, Math.max(5, Math.round((midPoint / target) * 100)));
      if (target >= totalMax) budgetStatus = 'UNDER';
      else if (target >= totalMin) budgetStatus = 'OPTIMAL';
      else budgetStatus = 'OVER';
    }

    return {
      numDays,
      nights,
      numTravelers,
      roomsNeeded,
      totalMin,
      totalMax,
      perPersonMin,
      perPersonMax,
      stayTotalMin,
      stayTotalMax,
      transTotalMin,
      transTotalMax,
      foodTotalMin,
      foodTotalMax,
      actTotalMin,
      actTotalMax,
      bufferMin,
      bufferMax,
      target,
      budgetStatus,
      progressPercent
    };
  }, [duration, travelers, transport, budget, customBudgetLimit]);

  // Submitting state
  const [isPlanning, setIsPlanning] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Load datasets
  useEffect(() => {
    const load = async () => {
      setLoadingData(true);
      try {
        const [destRes, spirRes, stayRes, actRes] = await Promise.allSettled([
          getDestinations(),
          getSpiritualPlaces(),
          getStays(),
          getActivities(),
        ]);

        if (destRes.status === 'fulfilled') {
          const arr = destRes.value?.data || destRes.value || [];
          if (Array.isArray(arr)) setDestinations(arr.map((d) => normaliseEntity(d, 'destination')));
        }
        if (spirRes.status === 'fulfilled') {
          const arr = spirRes.value?.data || spirRes.value || [];
          if (Array.isArray(arr)) setSpiritual(arr.map((s) => normaliseEntity(s, 'spiritual')));
        }
        if (stayRes.status === 'fulfilled') {
          const arr = stayRes.value?.data || stayRes.value || [];
          if (Array.isArray(arr)) setStays(arr.map((st) => normaliseEntity(st, 'stay')));
        }
        if (actRes.status === 'fulfilled') {
          const arr = actRes.value?.data || actRes.value || [];
          if (Array.isArray(arr)) setActivities(arr.map((a) => normaliseEntity(a, 'activity')));
        }
      } catch (err) {
        console.error('Failed to load datasets:', err);
      } finally {
        setLoadingData(false);
      }
    };
    load();
  }, [setDestinations, setSpiritual, setStays, setActivities]);

  // Combined searchable destinations
  const searchableDestinations = useMemo(() => {
    return [...allDestinations, ...allSpiritual];
  }, [allDestinations, allSpiritual]);

  // Filtered destination suggestions
  const filteredDestinations = useMemo(() => {
    if (!destSearchQuery.trim()) return searchableDestinations.slice(0, 8);
    const q = destSearchQuery.toLowerCase();
    return searchableDestinations
      .filter((d) => d.name?.toLowerCase().includes(q) || d.district?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [searchableDestinations, destSearchQuery]);

  // Handle Location Detection
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationError('');
    const res = await detectBrowserLocation();
    setIsDetectingLocation(false);
    if (res.success) {
      setStartingLocation({
        name: res.name,
        coordinates: res.coordinates,
      });
      setCustomCityInput('');
      setPlannerForm({ origin: res.name });
    } else {
      setLocationError(res.error || 'Location could not be determined. Please enter your city.');
    }
  };

  // Handle Manual City Geocoding
  const handleSelectHub = (hub) => {
    const hubName = `${hub.city}, ${hub.state}`;
    setStartingLocation({
      name: hubName,
      coordinates: hub.coordinates,
    });
    setCustomCityInput('');
    setLocationError('');
    setPlannerForm({ origin: hubName });
  };

  const handleApplyCustomCity = async (e) => {
    if (e) e.preventDefault();
    if (!customCityInput.trim()) return;
    const resolved = await geocodeCityName(customCityInput);
    if (resolved) {
      setStartingLocation({
        name: resolved.name,
        coordinates: resolved.coordinates,
      });
      setLocationError('');
      setPlannerForm({ origin: resolved.name });
    }
  };

  // Calculate duration when exact dates change
  useEffect(() => {
    if (hasExactDates && startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
      if (diffDays > 0) {
        setDuration(`${diffDays} ${diffDays === 1 ? 'Day' : 'Days'}`);
      }
    }
  }, [hasExactDates, startDate, endDate]);

  // Synchronize incoming canonical plannerForm changes (AI Copilot -> TripPlanner)
  useEffect(() => {
    if (!plannerForm) return;

    const normOrigin = normalizeLocationValue(plannerForm.origin);
    if (normOrigin && normOrigin !== startingLocation.name) {
      setStartingLocation({ name: normOrigin, coordinates: null });
      setCustomCityInput(normOrigin);
    }

    const normDest = normalizeLocationValue(plannerForm.destination);
    if (
      normDest &&
      (!selectedDestination || normalizeLocationValue(selectedDestination.name).toLowerCase() !== normDest.toLowerCase())
    ) {
      const match = searchableDestinations.find(
        (d) => normalizeLocationValue(d.name).toLowerCase() === normDest.toLowerCase()
      );
      if (match) {
        setSelectedDestination(match);
      } else {
        setSelectedDestination({
          name: normDest,
          id: plannerForm.destinationId || normDest.toLowerCase(),
          district: 'Uttarakhand',
          image: '/assets/fallback.svg',
          coordinates: null,
        });
      }
    }

    if (plannerForm.startDate && plannerForm.startDate !== startDate) {
      setStartDate(plannerForm.startDate);
      setHasExactDates(true);
    }
    if (plannerForm.endDate && plannerForm.endDate !== endDate) {
      setEndDate(plannerForm.endDate);
    }

    if (plannerForm.duration) {
      const durStr = `${plannerForm.duration} Days`;
      if (duration !== durStr) {
        setDuration(durStr);
      }
    }

    if (plannerForm.travelers) {
      const numT = Number(plannerForm.travelers);
      const travStr = numT === 1 ? 'Solo' : numT === 2 ? '2 Adults' : `${numT} Adults`;
      if (travelers !== travStr) {
        setTravelers(travStr);
      }
    }

    if (plannerForm.transport && plannerForm.transport !== transport) {
      setTransport(plannerForm.transport);
    }

    if (plannerForm.budget !== null && plannerForm.budget !== undefined) {
      const bStr = String(plannerForm.budget);
      if (customBudgetLimit !== bStr) {
        setCustomBudgetLimit(bStr);
      }
    }

    if (plannerForm.focusedField) {
      const targetField = plannerForm.focusedField;
      setTimeout(() => {
        const el = document.querySelector(`[data-field-name="${targetField}"], #${targetField}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus?.();
        }
      }, 150);
    }
  }, [plannerForm, searchableDestinations]);

  // Toggle helpers
  const toggleTripType = (id) => {
    setTripTypes((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((t) => t !== id) : prev) : [...prev, id]
    );
  };

  const toggleInterest = (id) => {
    setInterests((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((i) => i !== id) : prev) : [...prev, id]
    );
  };

  // Start Over (Reset form)
  const handleStartOver = () => {
    setStartingLocation({ name: '', coordinates: null });
    setSelectedDestination(null);
    setDestSearchQuery('');
    setHasExactDates(false);
    setStartDate('');
    setEndDate('');
    setDuration('5 Days');
    setTravelers('2 Adults');
    setTransport('Car');
    setTripTypes(['Nature', 'Trekking']);
    setInterests(['Nature Walks', 'Photography']);
    setPace('Balanced');
    setBudget('Comfort');
    setValidationError('');
  };

  // Plan My Trip Submission
  const handlePlanMyTrip = async () => {
    setValidationError('');

    // Validation
    if (!startingLocation.name) {
      setValidationError('Please specify where you are starting from (use location detection or pick a city).');
      window.scrollTo({ top: 300, behavior: 'smooth' });
      return;
    }

    if (!selectedDestination) {
      setValidationError('Please select where you want to go in Uttarakhand.');
      window.scrollTo({ top: 500, behavior: 'smooth' });
      return;
    }

    setIsPlanning(true);

    try {
      // 1. Calculate honest road route via OSRM from starting location to destination
      let routeData = { totalDistanceKm: 0, estimatedTime: '', geometry: null, legs: [] };
      const startCoord = startingLocation.coordinates || selectedDestination.coordinates;
      const destCoord = selectedDestination.coordinates;

      if (startCoord && destCoord) {
        const waypoints = [
          { coordinates: startCoord, name: startingLocation.name },
          { coordinates: destCoord, name: selectedDestination.name },
        ];
        routeData = await fetchOSRMRoute(waypoints);
      }

      // 2. Generate personalized day-by-day itinerary
      const preferences = {
        duration,
        pace,
        travelMode: `By ${transport}`,
        transport: `By ${transport}`,
        travelers,
        tripType: tripTypes,
        interests,
        budget,
      };

      const dayPlans = generatePersonalizedTripPlan({
        startingLocation,
        destination: selectedDestination,
        preferences,
        routeData,
        allActivities,
        allSpiritual,
        allStays,
      });

      // 3. Create Draft Trip Session
      const tripId = `trip_${Date.now()}`;
      const tripSession = {
        tripId,
        title: `My ${selectedDestination.name} Adventure`,
        startingLocation,
        destination: selectedDestination,
        startDate: hasExactDates ? startDate : '',
        endDate: hasExactDates ? endDate : '',
        duration,
        travelers,
        transport: `By ${transport}`,
        tripType: tripTypes,
        interests,
        pace,
        budget,
        routeData,
        dayPlans,
        status: 'Planning',
      };

      // 4. Save to Store & LocalStorage
      setActiveTripSession(tripSession);
      try {
        localStorage.setItem('discovery_active_trip', JSON.stringify(tripSession));
      } catch (e) {
        console.warn('localStorage save failed:', e);
      }

      // 5. Navigate directly to Stage 2: /my-trip/:tripId
      navigate(`/my-trip/${tripId}`);
    } catch (err) {
      console.error('Failed to plan trip:', err);
      setValidationError('Something went wrong generating your trip. Please try again.');
    } finally {
      setIsPlanning(false);
    }
  };



  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <Navbar />

      {/* â”€â”€ Hero Section â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="relative w-full overflow-hidden flex-shrink-0 mt-24 md:mt-28"
        style={{ height: '240px' }}
        role="banner"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-forest-green via-dark-green to-[#0f3423]" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="relative h-full max-w-[1200px] mx-auto flex flex-col justify-center px-6 md:px-8">
          <span className="bg-white/15 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-2 backdrop-blur-xs">
            Your Personal Travel Assistant
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight font-display">
            Plan Your Uttarakhand Trip
          </h1>
          <p className="text-white/85 text-sm md:text-base mt-2 max-w-2xl font-medium leading-relaxed">
            Tell us where you're starting from, where you want to go, and how you want to travel. We'll create a complete day-by-day plan with real routes, stays and experiences.
          </p>
        </div>
      </div>

      {/* â”€â”€ Guided Step Indicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-white border-b border-border-light shadow-sm sticky top-24 md:top-28 z-40 hidden lg:block">
        <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between text-xs font-bold text-muted-text">
          <span className="text-forest-green flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-forest-green text-white flex items-center justify-center text-[10px]">1</span> Trip Basics
          </span>
          <ChevronRight size={14} className="opacity-40" />
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-beige text-text-dark flex items-center justify-center text-[10px]">2</span> Destination
          </span>
          <ChevronRight size={14} className="opacity-40" />
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-beige text-text-dark flex items-center justify-center text-[10px]">3</span> Dates & Travelers
          </span>
          <ChevronRight size={14} className="opacity-40" />
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-beige text-text-dark flex items-center justify-center text-[10px]">4</span> Preferences
          </span>
          <ChevronRight size={14} className="opacity-40" />
          <span className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-beige text-text-dark flex items-center justify-center text-[10px]">5</span> Review & Plan
          </span>
        </div>
      </div>

      {/* â”€â”€ Main Layout: 2 Columns â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-[1200px] mx-auto w-full px-4 md:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: Main Setup Form (approx 70%) */}
        <div className="flex-1 w-full space-y-8">
          
          {validationError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* SECTION 1: Starting Location */}
          <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center">
                <MapPin size={16} />
              </div>
              <h2 className="text-lg md:text-xl font-black text-text-dark font-display">
                Where are you starting from?
              </h2>
            </div>
            <p className="text-sm text-muted-text mb-6 md:ml-11">
              We'll calculate travel distances, travel legs, and arrival timing from your starting point.
            </p>

            <div className="md:ml-11 space-y-4">
              {startingLocation.name ? (
                <div className="bg-forest-green/5 border border-forest-green/20 rounded-2xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-forest-green text-white flex items-center justify-center">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
                        Starting Location
                      </p>
                      <p className="font-black text-text-dark text-base mt-0.5">
                        {startingLocation.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStartingLocation({ name: '', coordinates: null })}
                    className="text-sm font-bold text-forest-green hover:underline px-3 py-1"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="btn-primary text-sm py-3 px-6 rounded-xl flex items-center gap-2"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <Navigation size={16} />
                          <span>Use My Current Location</span>
                        </>
                      )}
                    </button>

                    <span className="text-sm text-muted-text font-bold uppercase">or</span>

                    <form onSubmit={handleApplyCustomCity} className="flex-1 min-w-[280px] flex items-center gap-2">
                      <input
                        id="origin"
                        data-field-name="origin"
                        type="text"
                        value={customCityInput}
                        onChange={(e) => {
                          setCustomCityInput(e.target.value);
                          setPlannerForm({ origin: e.target.value });
                        }}
                        placeholder="Enter starting city (e.g. Agra, Delhi)"
                        className="flex-1 text-sm border border-border-light rounded-xl px-4 py-3 bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-forest-green/20"
                      />
                      <button
                        type="submit"
                        className="px-5 py-3 text-sm font-bold bg-beige hover:bg-[#e8decb] text-text-dark rounded-xl transition-colors"
                      >
                        Set
                      </button>
                    </form>
                  </div>

                  {locationError && (
                    <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center gap-2">
                      <AlertCircle size={14} className="flex-shrink-0" />
                      <span>{locationError}</span>
                    </p>
                  )}

                  <div className="pt-2">
                    <p className="text-xs font-bold text-muted-text mb-2.5">
                      Popular departure hubs:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {POPULAR_START_HUBS.map((hub) => (
                        <button
                          key={hub.city}
                          onClick={() => handleSelectHub(hub)}
                          className="text-sm font-semibold px-4 py-1.5 rounded-full bg-[#faf9f6] border border-border-light text-text-dark hover:border-forest-green/40 hover:bg-forest-green hover:text-white transition-all"
                        >
                          {hub.city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Destination */}
          <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center">
                <Compass size={16} />
              </div>
              <h2 className="text-lg md:text-xl font-black text-text-dark font-display">
                Where do you want to go in Uttarakhand?
              </h2>
            </div>
            <p className="text-sm text-muted-text mb-6 md:ml-11">
              Select your primary destination. We'll suggest nearby treks, attractions and experiences.
            </p>

            <div className="md:ml-11 space-y-4">
              {selectedDestination ? (
                <div className="bg-[#faf9f6] border-2 border-forest-green/40 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-beige flex-shrink-0 border border-border-light">
                      <img
                        src={selectedDestination.image || '/assets/fallback.svg'}
                        alt={selectedDestination.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-forest-green uppercase tracking-wider flex items-center gap-1">
                        <Check size={12} /> Selected Destination
                      </span>
                      <h4 className="font-black text-text-dark text-lg mt-0.5">
                        {selectedDestination.name}
                      </h4>
                      <p className="text-xs text-muted-text font-medium mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="text-forest-green shrink-0" />
                        <span>{selectedDestination.district}{selectedDestination.region ? ` • ${selectedDestination.region}` : ''}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDestination(null);
                      setDestSearchQuery('');
                    }}
                    className="text-sm font-bold text-forest-green hover:underline px-3 py-1 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-5 relative">
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text" />
                    <input
                      id="destination"
                      data-field-name="destination"
                      type="text"
                      value={destSearchQuery}
                      onChange={(e) => {
                        setDestSearchQuery(e.target.value);
                        setDestDropdownOpen(true);
                      }}
                      onFocus={() => setDestDropdownOpen(true)}
                      placeholder="Search destinations (e.g. Kedarnath, Rishikesh, Nainital...)"
                      className="w-full text-sm border border-border-light rounded-2xl pl-12 pr-4 py-3.5 bg-[#faf9f6] focus:outline-none focus:ring-2 focus:ring-forest-green/20"
                    />
                  </div>

                  {destDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border-light rounded-2xl shadow-xl max-h-72 overflow-y-auto z-50 divide-y divide-border-light/60">
                      {filteredDestinations.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSelectedDestination(d);
                            setDestDropdownOpen(false);
                            setPlannerForm({ destination: d.name, destinationId: d.id || d._id });
                          }}
                          className="p-3 flex items-center justify-between hover:bg-beige/40 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-beige flex-shrink-0">
                              <img
                                src={d.image || '/assets/fallback.svg'}
                                alt={d.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-text-dark text-sm">{d.name}</p>
                              <p className="text-xs text-muted-text mt-0.5">
                                {d.district}{d.category ? ` • ${d.category}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-forest-green flex items-center gap-1 bg-forest-green/10 px-3 py-1.5 rounded-full">
                            Select <ChevronRight size={14} />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2">
                    <p className="text-xs font-bold text-muted-text mb-3">
                      Popular Destinations:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {['Kedarnath', 'Badrinath', 'Rishikesh', 'Nainital', 'Chopta', 'Auli', 'Munsiyari', 'Mussoorie'].map((name) => {
                        const match = searchableDestinations.find((d) => d.name?.toLowerCase() === name.toLowerCase());
                        const img = match?.image || '/assets/fallback.svg';
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              if (match) setSelectedDestination(match);
                              else setSelectedDestination({ name, district: 'Uttarakhand', coordinates: [30.3, 79.1] });
                            }}
                            className="group text-left rounded-xl overflow-hidden border border-border-light hover:border-forest-green/50 transition-all bg-[#faf9f6] cursor-pointer"
                          >
                            <div className="h-16 w-full bg-beige overflow-hidden">
                              <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e)=>{e.target.src='/assets/fallback.svg'}}/>
                            </div>
                            <div className="p-2.5">
                              <p className="text-xs font-black text-text-dark truncate">{name}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Dates / Duration */}
          <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center">
                <Calendar size={16} />
              </div>
              <h2 className="text-lg md:text-xl font-black text-text-dark font-display">
                When are you travelling?
              </h2>
            </div>
            
            <div className="md:ml-11 mt-6 space-y-5">
              {/* Segmented Control */}
              <div className="inline-flex p-1 bg-[#faf9f6] rounded-xl border border-border-light">
                <button
                  type="button"
                  onClick={() => setHasExactDates(false)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    !hasExactDates
                      ? 'bg-white text-forest-green shadow-sm'
                      : 'text-muted-text hover:text-text-dark'
                  }`}
                >
                  Trip Duration
                </button>
                <button
                  type="button"
                  onClick={() => setHasExactDates(true)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    hasExactDates
                      ? 'bg-white text-forest-green shadow-sm'
                      : 'text-muted-text hover:text-text-dark'
                  }`}
                >
                  Custom Dates
                </button>
              </div>

              {hasExactDates ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                  <div>
                    <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-2">
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      data-field-name="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPlannerForm({ startDate: e.target.value });
                      }}
                      className="w-full text-sm font-semibold border border-border-light rounded-xl p-3 bg-white focus:ring-2 focus:ring-forest-green/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full text-sm font-semibold border border-border-light rounded-xl p-3 bg-white focus:ring-2 focus:ring-forest-green/20 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2.5" data-field-name="duration">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDuration(d);
                        const num = parseInt(d, 10);
                        setPlannerForm({ duration: isNaN(num) ? 5 : num });
                      }}
                      className={`text-sm font-bold px-5 py-2.5 rounded-xl border transition-all ${
                        duration === d
                          ? 'bg-forest-green text-white border-forest-green shadow-sm'
                          : 'bg-white text-text-dark border-border-light hover:border-forest-green/40'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: Travelers & Transport */}
          <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center">
                <Users size={16} />
              </div>
              <h2 className="text-lg md:text-xl font-black text-text-dark font-display">
                Who's travelling & How?
              </h2>
            </div>
            
            <div className="md:ml-11 mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div data-field-name="travelers">
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
                  Travelers
                </label>
                <div className="space-y-2">
                  {TRAVELER_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTravelers(t);
                        let num = 2;
                        if (t.includes('Solo')) num = 1;
                        else if (t.includes('2 Adults')) num = 2;
                        else if (t.includes('Family')) num = 3;
                        else if (t.includes('Group (3-5)')) num = 4;
                        else if (t.includes('Large Group')) num = 6;
                        setPlannerForm({ travelers: num });
                      }}
                      className={`w-full text-left text-sm font-semibold p-3.5 rounded-xl border transition-all ${
                        travelers === t
                          ? 'bg-forest-green/5 text-forest-green border-forest-green'
                          : 'bg-white text-text-dark border-border-light hover:border-forest-green/40'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
                  Mode of Transport
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TRAVEL_MODES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setTransport(m)}
                      className={`text-sm font-semibold p-3.5 rounded-xl border text-center transition-all ${
                        transport === m
                          ? 'bg-forest-green/5 text-forest-green border-forest-green'
                          : 'bg-white text-text-dark border-border-light hover:border-forest-green/40'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: Preferences */}
          <div className="bg-white rounded-3xl border border-border-light shadow-sm p-6 md:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <h2 className="text-lg md:text-xl font-black text-text-dark font-display">
                Travel Preferences
              </h2>
            </div>

            <div className="md:ml-11 mt-6 space-y-8">
              <div>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
                  Trip Theme (Select multiple)
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {TRIP_TYPES.map(({ id, label, icon: IconComponent }) => {
                    const active = tripTypes.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleTripType(id)}
                        className={`text-sm font-bold px-4 py-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                          active
                            ? 'bg-forest-green text-white border-forest-green shadow-xs'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-forest-green/40 hover:bg-slate-50'
                        }`}
                      >
                        <IconComponent size={16} className={active ? 'text-white' : 'text-forest-green'} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
                  Interests
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTERESTS_LIST.map((item) => {
                    const active = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`text-sm font-semibold px-4 py-2 rounded-full border flex items-center gap-1.5 transition-all cursor-pointer ${
                          active
                            ? 'bg-earth-brown text-white border-earth-brown shadow-xs'
                            : 'bg-[#faf9f6] text-slate-800 border-slate-200 hover:bg-beige/50'
                        }`}
                      >
                        {active && <Check size={14} className="text-white shrink-0" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
                    Pace
                  </label>
                  <div className="space-y-2.5">
                    {[
                      { id: 'Relaxed', desc: 'More rest, fewer activities, slow immersion' },
                      { id: 'Balanced', desc: 'A mix of travel, outdoor exploration, and rest' },
                      { id: 'Fast', desc: 'Active exploration, cover more places' },
                    ].map(({ id, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPace(id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          pace === id
                            ? 'bg-forest-green/5 border-forest-green ring-1 ring-forest-green'
                            : 'bg-white border-border-light hover:border-forest-green/40'
                        }`}
                      >
                        <span className="font-bold text-sm text-text-dark block">{id}</span>
                        <span className="text-xs text-muted-text block mt-1">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-text uppercase tracking-wider block mb-3">
                    Budget Tier
                  </label>
                  <div className="space-y-2.5">
                    {[
                      { id: 'Budget', desc: 'Homestays, local mountain transport' },
                      { id: 'Comfort', desc: 'Verified guesthouses, private cab, standard rooms' },
                      { id: 'Premium', desc: 'Boutique eco-resorts, dedicated vehicle' },
                    ].map(({ id, desc }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setBudget(id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                          budget === id
                            ? 'bg-forest-green/5 border-forest-green ring-1 ring-forest-green'
                            : 'bg-white border-border-light hover:border-forest-green/40'
                        }`}
                      >
                        <span className="font-bold text-sm text-text-dark block">{id}</span>
                        <span className="text-xs text-muted-text block mt-1">{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6: Live Budget Tracker */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 relative overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-forest-green/10 text-forest-green flex items-center justify-center shrink-0">
                  <Wallet size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg md:text-xl font-black text-slate-900 font-display">
                      Live Budget Tracker & Estimator
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-forest-green/10 text-forest-green border border-forest-green/20">
                      Live Dynamic
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Real-time cost estimation based on verified mountain tariffs, stays, fuel & dining
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  liveBudget.budgetStatus === 'UNDER'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : liveBudget.budgetStatus === 'OVER'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  <ShieldCheck size={14} />
                  <span>
                    {liveBudget.budgetStatus === 'UNDER'
                      ? 'Under Custom Cap'
                      : liveBudget.budgetStatus === 'OVER'
                      ? 'Exceeds Custom Cap'
                      : `${budget} Tier Benchmark`}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {/* Primary Stat Hero Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Estimate */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#faf9f6] to-beige/30 border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Estimated Total Trip
                  </span>
                  <div className="text-2xl lg:text-3xl font-black text-forest-green font-display tracking-tight">
                    ₹{liveBudget.totalMin.toLocaleString()} – ₹{liveBudget.totalMax.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block mt-1">
                    For {liveBudget.numDays} Days • {liveBudget.numTravelers} {liveBudget.numTravelers === 1 ? 'Traveler' : 'Travelers'}
                  </span>
                </div>

                {/* Per Person */}
                <div className="p-4 rounded-2xl bg-[#faf9f6] border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Per Person Approx.
                  </span>
                  <div className="text-2xl font-black text-slate-900 font-display tracking-tight">
                    ₹{liveBudget.perPersonMin.toLocaleString()} – ₹{liveBudget.perPersonMax.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium block mt-1">
                    ~₹{Math.round(liveBudget.totalMin / liveBudget.numDays / liveBudget.numTravelers).toLocaleString()}/day per person
                  </span>
                </div>

                {/* Custom Target Budget Input */}
                <div className="p-4 rounded-2xl bg-[#faf9f6] border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                      Your Target Budget (Optional)
                    </span>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">₹</span>
                      <input
                        id="budget"
                        data-field-name="budget"
                        type="number"
                        placeholder="e.g. 25000"
                        value={customBudgetLimit}
                        onChange={(e) => {
                          setCustomBudgetLimit(e.target.value);
                          const val = Number(e.target.value);
                          setPlannerForm({ budget: isNaN(val) || !e.target.value ? null : val });
                        }}
                        className="w-full pl-7 pr-3 py-1.5 text-sm font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-green/30"
                      />
                    </div>
                  </div>
                  {customBudgetLimit && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            liveBudget.budgetStatus === 'UNDER'
                              ? 'bg-emerald-500'
                              : liveBudget.budgetStatus === 'OVER'
                              ? 'bg-rose-500'
                              : 'bg-forest-green'
                          }`}
                          style={{ width: `${Math.min(100, liveBudget.progressPercent)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                        Utilizing ~{liveBudget.progressPercent}% of target
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Categorical Breakdown Grid */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">
                  Categorical Cost Breakdown
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Stays */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Bed size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-700 block">Accommodations / Stays</span>
                      <span className="text-sm font-black text-slate-900 font-display">
                        ₹{liveBudget.stayTotalMin.toLocaleString()} – ₹{liveBudget.stayTotalMax.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {liveBudget.roomsNeeded} room(s) for {liveBudget.nights} night(s)
                      </span>
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Fuel size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-700 block">Transport & Fuel</span>
                      <span className="text-sm font-black text-slate-900 font-display">
                        ₹{liveBudget.transTotalMin.toLocaleString()} – ₹{liveBudget.transTotalMax.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {transport} mode for {liveBudget.numDays} days
                      </span>
                    </div>
                  </div>

                  {/* Food & Meals */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Utensils size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-700 block">Food & Mountain Meals</span>
                      <span className="text-sm font-black text-slate-900 font-display">
                        ₹{liveBudget.foodTotalMin.toLocaleString()} – ₹{liveBudget.foodTotalMax.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Breakfast, lunch, dinner & tea
                      </span>
                    </div>
                  </div>

                  {/* Activities & Sightseeing */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Ticket size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-700 block">Activities & Permits</span>
                      <span className="text-sm font-black text-slate-900 font-display">
                        ₹{liveBudget.actTotalMin.toLocaleString()} – ₹{liveBudget.actTotalMax.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Temple entries, guides, permit passes
                      </span>
                    </div>
                  </div>

                  {/* Safety Buffer */}
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 sm:col-span-2 lg:col-span-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 block">Mountain Safety Contingency Buffer (10%)</span>
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[9px] font-bold">Recommended</span>
                      </div>
                      <span className="text-sm font-black text-slate-900 font-display">
                        ₹{liveBudget.bufferMin.toLocaleString()} – ₹{liveBudget.bufferMax.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Emergency buffer for landslides, roadblock diversions, or weather halts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro-Tip Advisory Card */}
              <div className="p-4 rounded-2xl bg-forest-green/5 border border-forest-green/15 flex items-start gap-3 text-xs text-slate-700">
                <Info size={16} className="text-forest-green shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-forest-green block mb-0.5">
                    💡 Uttarakhand Local Budget Advice:
                  </span>
                  <span>
                    {budget === 'Budget' && 'Homestays and KMVN Tourist Rest Houses offer incredible Himalayan hospitality and home-cooked meals at authentic local rates.'}
                    {budget === 'Comfort' && 'Pre-booking verified guesthouses and hiring registered local mountain drivers ensures punctual mountain navigation and comfort.'}
                    {budget === 'Premium' && 'Eco-resorts provide private heated rooms, dedicated 4x4 mountain vehicles, curated wellness sessions, and private nature guides.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CTA (Mobile/Desktop Bottom) */}
          <div className="pt-4 lg:hidden">
            <button
              type="button"
              onClick={handlePlanMyTrip}
              disabled={isPlanning}
              className="w-full btn-primary py-4 px-8 rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-lg active:scale-[0.99] transition-all"
            >
              {isPlanning ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Planning Journey...</span>
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  <span>Plan My Trip</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (approx 30%) */}
        <div className="w-full lg:w-[340px] flex-shrink-0 space-y-6 lg:sticky lg:top-[160px]">
          
          {/* Your Trip at a Glance Card */}
          <div className="bg-white rounded-3xl p-6 border border-border-light shadow-sm">
            <h3 className="font-black text-text-dark text-sm uppercase tracking-wider flex items-center gap-2 mb-5">
              <Compass size={16} className="text-forest-green" />
              Your Trip at a Glance
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                  Starting Point
                </span>
                <span className={`font-bold block mt-1 ${startingLocation.name ? 'text-text-dark text-sm' : 'text-muted-text text-xs italic'}`}>
                  {startingLocation.name || 'Not selected'}
                </span>
              </div>
              <div>
                <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                  Destination
                </span>
                <span className={`font-bold block mt-1 ${selectedDestination?.name ? 'text-forest-green text-lg' : 'text-muted-text text-xs italic'}`}>
                  {selectedDestination?.name || 'Not selected'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                    Duration
                  </span>
                  <span className="font-bold text-text-dark text-sm block mt-1">
                    {duration}
                  </span>
                </div>
                <div>
                  <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                    Travelers
                  </span>
                  <span className="font-bold text-text-dark text-sm block mt-1">
                    {travelers}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                    Transport
                  </span>
                  <span className="font-bold text-text-dark text-sm block mt-1">
                    {transport}
                  </span>
                </div>
                <div>
                  <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                    Pace
                  </span>
                  <span className="font-bold text-text-dark text-sm block mt-1">
                    {pace}
                  </span>
                </div>
              </div>

              {/* Live Budget in Sidebar */}
              <div className="pt-3.5 border-t border-border-light">
                <div className="flex items-center justify-between">
                  <span className="text-muted-text font-bold text-[10px] uppercase tracking-wider block">
                    Estimated Budget
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-forest-green/10 text-forest-green border border-forest-green/20">
                    {budget}
                  </span>
                </div>
                <div className="text-lg font-black text-forest-green font-display mt-1">
                  ₹{liveBudget.totalMin.toLocaleString()} – ₹{liveBudget.totalMax.toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                  ~₹{liveBudget.perPersonMin.toLocaleString()} / person • {liveBudget.numDays} Days
                </span>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border-light hidden lg:block">
              <button
                type="button"
                onClick={handlePlanMyTrip}
                disabled={isPlanning}
                className="w-full btn-primary py-4 px-6 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99] transition-all"
              >
                {isPlanning ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Planning...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Plan My Trip</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleStartOver}
                className="w-full mt-3 text-xs font-bold text-muted-text hover:text-red-600 flex items-center justify-center gap-1.5 transition-colors py-2"
              >
                <RotateCcw size={13} /> Reset Options
              </button>
            </div>
          </div>

          {/* Why Plan With Us Card */}
          <div className="bg-[#f5f1ea] rounded-3xl p-6 border border-earth-brown/20 shadow-sm">
            <h3 className="font-black text-earth-brown text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={16} />
              Why Plan With Us?
            </h3>
            <ul className="space-y-3">
              {[
                'Real travel routes & navigation',
                'Personalized daily itinerary',
                'Verified stays & accommodations',
                'Local guides & experiences',
                'Intelligent budget planning',
                'Trusted local travel information'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-text-dark font-medium">
                  <Check size={16} className="text-forest-green mt-0.5 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

