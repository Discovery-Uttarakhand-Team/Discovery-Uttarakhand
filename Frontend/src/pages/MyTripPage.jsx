import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TripWorkspaceMap from '../components/planner/TripWorkspaceMap';
import DayCard from '../components/planner/DayCard';
import WorkspaceAdvisories from '../components/planner/WorkspaceAdvisories';
import ModifyTripModal from '../components/planner/ModifyTripModal';
import BudgetBreakdownCard from '../components/planner/BudgetBreakdownCard';
import BookingModal from '../components/booking/BookingModal';
import { useMapStore } from '../store/mapStore';
import { useAuth } from '../context/AuthContext';
import { createTrip, getTripById, updateTrip } from '../api/tripApi';
import { getGuides } from '../api/guideApi';
import { getStays } from '../api/stayApi';
import { getActivities } from '../api/activityApi';
import { getDestinations } from '../api/destinationApi';
import { getRecommendations } from '../api/recommendationApi';
import { calculateBudget } from '../api/budgetApi';
import { generateAiPlan } from '../api/aiApi';
import AiTripPlanCard from '../components/planner/AiTripPlanCard';
import WeatherWidget from '../components/planner/WeatherWidget';
import { generatePersonalizedTripPlan } from '../utils/itineraryGenerator';

import { 
  MapPin, 
  Calendar, 
  Car, 
  Users, 
  Compass, 
  Sparkles, 
  Bookmark, 
  Check, 
  AlertCircle, 
  ChevronLeft, 
  Edit3, 
  ShieldCheck, 
  Mountain, 
  Loader2,
  Navigation,
  ArrowRight,
  Wallet,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function MyTripPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { requireAuth } = useAuth();

  const {
    activeTripSession,
    setActiveTripSession,
    activeDayIndex,
    setActiveDayIndex,
    allActivities,
    allStays,
    allDestinations,
    setActivities,
    setStays,
    setDestinations
  } = useMapStore();

  // Local states
  const [session, setSession] = useState(activeTripSession);
  const [loading, setLoading] = useState(!activeTripSession);
  const [guides, setGuides] = useState([]);
  const [saveStatus, setSaveStatus] = useState('IDLE'); // 'IDLE' | 'SAVING' | 'SAVED' | 'ERROR'
  const [saveMessage, setSaveMessage] = useState('');
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Phase 1 Engines state
  const [budgetData, setBudgetData] = useState(null);
  const [engineRecs, setEngineRecs] = useState({ stays: [], guides: [], activities: [] });

  // Phase 2 AI Planner state
  const [aiPlan, setAiPlan] = useState(null);
  const [aiMeta, setAiMeta] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Edit modal draft state
  const [editDuration, setEditDuration] = useState('7 Days');
  const [editPace, setEditPace] = useState('Balanced');
  const [editTransport, setEditTransport] = useState('By Car');

  // Booking modal state (Phase 4)
  const [bookingModalState, setBookingModalState] = useState({
    isOpen: false,
    item: null,
    defaultStartDate: '',
    defaultEndDate: ''
  });

  const handleBookStay = (stay, day) => {
    requireAuth(() => {
      const now = Date.now();
      const sDate = new Date(now + ((day?.dayNumber || 1) - 1) * 86400000).toISOString().slice(0, 10);
      const eDate = new Date(now + (day?.dayNumber || 1) * 86400000).toISOString().slice(0, 10);
      setBookingModalState({
        isOpen: true,
        item: stay,
        defaultStartDate: sDate,
        defaultEndDate: eDate
      });
    });
  };

  // Day card DOM refs for smooth scrolling from map clicks
  const dayCardRefs = useRef({});

  // Load guides & stays & destinations if not already available
  useEffect(() => {
    const loadExtraData = async () => {
      try {
        const [guidesRes, staysRes, actRes, destRes] = await Promise.allSettled([
          getGuides(),
          (!allStays || allStays.length === 0) ? getStays() : Promise.resolve({ data: allStays }),
          (!allActivities || allActivities.length === 0) ? getActivities() : Promise.resolve({ data: allActivities }),
          (!allDestinations || allDestinations.length === 0) ? getDestinations() : Promise.resolve({ data: allDestinations }),
        ]);

        if (guidesRes.status === 'fulfilled' && guidesRes.value?.success && Array.isArray(guidesRes.value.data)) {
          setGuides(guidesRes.value.data);
        }
        if (staysRes.status === 'fulfilled' && staysRes.value?.success && Array.isArray(staysRes.value.data)) {
          setStays(staysRes.value.data);
        }
        if (actRes.status === 'fulfilled' && actRes.value?.success && Array.isArray(actRes.value.data)) {
          setActivities(actRes.value.data);
        }
        if (destRes.status === 'fulfilled' && destRes.value?.success && Array.isArray(destRes.value.data)) {
          setDestinations(destRes.value.data);
        }
      } catch (err) {
        console.warn('Could not fetch guides/stays:', err);
      }
    };
    loadExtraData();
  }, []);

  // Restore session from localStorage or backend if not currently in memory
  useEffect(() => {
    if (session) return;

    try {
      const saved = localStorage.getItem('discovery_active_trip');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.tripId === tripId || !tripId || (tripId && tripId.startsWith('trip_')))) {
          if (tripId && tripId.startsWith('trip_')) {
            parsed.tripId = tripId;
          }
          setSession(parsed);
          setActiveTripSession(parsed);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('localStorage error:', e);
    }

    // Try fetching from backend if tripId looks like MongoDB ObjectId
    if (tripId && tripId.match(/^[0-9a-fA-F]{24}$/)) {
      getTripById(tripId)
        .then((res) => {
          if (res?.success && res.data) {
            const trip = res.data;
            const primaryDest = trip.destinations?.[0] || null;
            const reconstructed = {
              tripId: trip._id,
              title: trip.title,
              startingLocation: trip.startingLocation || { name: 'Starting Point', coordinates: null },
              destination: primaryDest,
              startDate: trip.startDate ? new Date(trip.startDate).toLocaleDateString() : '',
              endDate: trip.endDate ? new Date(trip.endDate).toLocaleDateString() : '',
              duration: trip.duration || '7 Days',
              travelers: trip.travelers || '2 Adults',
              transport: trip.transport || 'By Car',
              tripType: trip.tripType || ['Nature'],
              interests: trip.interests || ['Nature'],
              pace: trip.pace || 'Balanced',
              budget: trip.budget || 'Comfort',
              routeData: trip.routeData || { totalDistanceKm: 0, estimatedTime: '' },
              dayPlans: trip.generatedItinerary || [],
              status: 'Saved'
            };
            setSession(reconstructed);
            setActiveTripSession(reconstructed);
            setSaveStatus('SAVED');
          }
        })
        .catch((err) => {
          console.warn('Failed to load trip from API:', err);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [tripId, session, setActiveTripSession]);

  // Sync edit form with current session
  useEffect(() => {
    if (session) {
      setEditDuration(session.duration || `${session.dayPlans?.length || 7} Days`);
      setEditPace(session.pace || 'Balanced');
      setEditTransport(session.transport || 'By Car');
    }
  }, [session]);

  const dest = session?.destination;
  const dayPlans = session?.dayPlans || [];
  const startLoc = session?.startingLocation || { name: 'Starting Point' };

  // Calculate strict duration display (prevents "10+ Days" or 7 days when 5 days were selected)
  const exactDurationText = useMemo(() => {
    if (dayPlans.length > 0) {
      return `${dayPlans.length} ${dayPlans.length === 1 ? 'Day' : 'Days'}`;
    }
    return session?.duration || '7 Days';
  }, [dayPlans, session]);

  // Handle bidirectional sync: when a marker is clicked on the map, scroll to the day card
  const handleSelectDayFromMap = (idx) => {
    setActiveDayIndex(idx);
    const cardEl = dayCardRefs.current[idx];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Relevant stays for destination / district (Engine scored or fallback)
  const displayStays = useMemo(() => {
    if (engineRecs.stays && engineRecs.stays.length > 0) {
      return engineRecs.stays.map(r => ({
        ...r.item,
        score: r.score,
        reasons: r.reasons,
        distanceKm: r.distanceKm,
        budgetFit: r.budgetFit
      })).slice(0, 3);
    }
    if (!allStays || allStays.length === 0) return [];
    const district = dest?.district?.toLowerCase() || '';
    const destId = dest?._id || dest?.id;

    const matches = allStays.filter(s => 
      (s.destination && (s.destination === destId || s.destination._id === destId)) ||
      (s.district && s.district.toLowerCase() === district) ||
      (s.city && s.city.toLowerCase() === district)
    );

    return (matches.length > 0 ? matches : allStays).slice(0, 3);
  }, [engineRecs.stays, allStays, dest]);

  // Relevant guides (Engine scored or fallback)
  const displayGuides = useMemo(() => {
    if (engineRecs.guides && engineRecs.guides.length > 0) {
      return engineRecs.guides.map(r => ({
        ...r.item,
        score: r.score,
        reasons: r.reasons,
        confidence: r.confidence
      })).slice(0, 3);
    }
    const district = dest?.district?.toLowerCase() || '';
    const matches = (guides || []).filter(g => 
      g.location?.toLowerCase().includes(district) ||
      g.district?.toLowerCase().includes(district)
    );
    return (matches.length > 0 ? matches : guides).slice(0, 3);
  }, [engineRecs.guides, guides, dest]);

  // Phase 1 Engine Data Fetcher (Trip-context aware recommendations + budget)
  useEffect(() => {
    if (!session || !dest || !dayPlans || dayPlans.length === 0) return;

    const fetchEngineData = async () => {
      try {
        const activeDay = dayPlans[activeDayIndex] || dayPlans[0] || {};
        const currentLoc = {
          name: activeDay.where || dest.name,
          district: activeDay.district || dest.district,
          coordinates: dest.coordinates
        };

        // 1. Fetch trip-context aware recommendations for active day
        const recsRes = await getRecommendations({
          dayNumber: activeDayIndex + 1,
          currentLocation: currentLoc,
          overnightLocation: {
            name: activeDay.stay?.name || dest.name,
            district: dest.district,
            coordinates: dest.coordinates
          },
          durationDays: dayPlans.length,
          pace: session.pace || 'Balanced',
          tripType: session.tripType || ['Nature'],
          interests: session.interests || [],
          budgetTier: session.budget || 'Balanced',
          travelersCount: parseInt(session.travelers) || 2
        }, ['stays', 'guides', 'activities']);

        if (recsRes?.success && recsRes.data) {
          setEngineRecs(recsRes.data);
        }

        // 2. Fetch deterministic budget calculation
        const allSegments = dayPlans.flatMap(d => d.journeySegments || [d.transportSegment]).filter(Boolean);
        const stayIds = dayPlans.map(d => d.stay?.stayId || d.stay?._id).filter(Boolean);

        const bRes = await calculateBudget({
          durationDays: dayPlans.length,
          travelersCount: parseInt(session.travelers) || 2,
          budgetPreference: session.budget || 'Balanced',
          stayIds,
          transportSegments: allSegments,
          guideDays: dayPlans.filter(d => d.type === 'trek').length
        });

        if (bRes?.success && bRes.data) {
          setBudgetData(bRes.data);
        }
      } catch (err) {
        console.warn('Recommendation/Budget fetch issue:', err);
      }
    };

    fetchEngineData();
  }, [session, activeDayIndex, dest, dayPlans.length]);

  // Phase 2 AI Planner Data Fetcher
  const fetchAiPlan = async () => {
    if (!session || !dest) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const isSaved = Boolean(session._id || session.id || tripId);
      const res = await generateAiPlan({
        tripId: isSaved ? (session._id || session.id || tripId) : undefined,
        tripData: !isSaved ? {
          ...session,
          dayPlans,
          duration: exactDurationText
        } : undefined
      });

      if (res?.success && res.plan) {
        setAiPlan(res.plan);
        setAiMeta(res.meta);
      } else {
        setAiError(res?.message || 'AI reasoning unavailable');
      }
    } catch (err) {
      console.warn('AI reasoning fetch issue:', err);
      setAiError(err.message || 'AI reasoning unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    fetchAiPlan();
  }, [session?._id, session?.id, tripId, dest?.name, dayPlans.length]);

  // Save Trip to MongoDB
  const handleSaveTrip = () => {
    if (!session || !dest) return;

    requireAuth(async () => {
      setSaveStatus('SAVING');
      setSaveMessage('');

      try {
        const destIds = [dest._id || dest.id].filter(Boolean);
        const title = session.title || `My ${dest.name} Adventure`;

        const payload = {
          title,
          destinations: destIds,
          startingLocation: session.startingLocation,
          duration: exactDurationText,
          travelers: session.travelers,
          transport: session.transport,
          tripType: session.tripType,
          interests: session.interests,
          pace: session.pace,
          budget: session.budget,
          status: 'Saved',
          routeData: session.routeData,
          generatedItinerary: session.dayPlans,
          notes: `${session.transport} · ${session.travelers} · ${exactDurationText} · Starting from ${startLoc.name}`
        };

        const res = await createTrip(payload);
        if (res?.success || res?.data) {
          setSaveStatus('SAVED');
          setSaveMessage('Trip saved to your profile!');
          const updated = { ...session, status: 'Saved' };
          setSession(updated);
          setActiveTripSession(updated);
          try {
            localStorage.setItem('discovery_active_trip', JSON.stringify(updated));
          } catch (e) {
            console.warn(e);
          }
        } else {
          setSaveStatus('ERROR');
          setSaveMessage('Could not save trip. Please try again.');
        }
      } catch (err) {
        console.error('Failed to save trip:', err);
        setSaveStatus('ERROR');
        setSaveMessage(err.response?.data?.message || 'Failed to save trip. Try again.');
      }
    });
  };

  // Update Trip when modified
  const handleUpdateTrip = async () => {
    if (!session || !dest) return;

    const newPreferences = {
      duration: editDuration,
      pace: editPace,
      transport: editTransport,
      travelMode: editTransport,
      travelers: session.travelers,
      tripType: session.tripType,
      interests: session.interests,
      budget: session.budget
    };

    const newDayPlans = generatePersonalizedTripPlan({
      startingLocation: session.startingLocation,
      destination: dest,
      preferences: newPreferences,
      routeData: session.routeData,
      allActivities,
      allSpiritual: [],
      allStays
    });

    const isAlreadySavedTrip = session.status === 'Saved' && tripId && tripId.match(/^[0-9a-fA-F]{24}$/);

    const updated = {
      ...session,
      duration: editDuration,
      pace: editPace,
      transport: editTransport,
      dayPlans: newDayPlans,
      status: isAlreadySavedTrip ? 'Saved' : 'Modified'
    };

    setSession(updated);
    setActiveTripSession(updated);
    setIsModifyOpen(false);
    
    try {
      localStorage.setItem('discovery_active_trip', JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    if (isAlreadySavedTrip) {
      try {
        await updateTrip(session.tripId || tripId, {
          duration: editDuration,
          pace: editPace,
          transport: editTransport,
          generatedItinerary: newDayPlans,
          notes: `${editTransport} · ${session.travelers} · ${editDuration} · Starting from ${startLoc.name}`
        });
        setSaveStatus('SAVED');
        setSaveMessage('Saved trip updated in your profile!');
      } catch (err) {
        console.warn('Failed to update saved trip on server:', err);
      }
    } else {
      setSaveStatus('IDLE');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="text-center p-8">
            <Loader2 size={32} className="animate-spin text-forest-green mx-auto mb-3" />
            <p className="font-bold text-text-dark text-sm">Loading your trip workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !dest) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-border-light shadow-sm text-center">
            <Mountain size={36} className="text-forest-green/50 mx-auto mb-3" />
            <h3 className="font-display font-bold text-xl text-text-dark mb-2">No Active Trip Found</h3>
            <p className="text-xs text-muted-text mb-6">
              Start by setting up your starting location, destination, and preferences in the Trip Planner.
            </p>
            <Link to="/trip-planner" className="btn-primary text-xs py-2.5 px-6 rounded-full inline-flex items-center gap-2">
              <Compass size={14} /> Plan a Trip
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Budget display range
  const budgetRange = budgetData?.summary?.minCost && budgetData?.summary?.maxCost
    ? `₹${budgetData.summary.minCost.toLocaleString()} – ₹${budgetData.summary.maxCost.toLocaleString()}`
    : 'Estimated based on itinerary';

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <Navbar />

      {/* ── SECTION A: TRIP HERO ─────────────────────────── */}
      <div className="bg-white border-b border-slate-200 pt-28 md:pt-32 pb-8 px-4 md:px-8 shadow-2xs">
        <div className="max-w-[1400px] mx-auto">
          {/* Top Breadcrumb & Status */}
          <div className="flex items-center justify-between gap-4 mb-4">
            <button
              onClick={() => navigate('/trip-planner')}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-forest-green font-bold text-xs sm:text-sm border border-slate-200/80 shadow-xs transition-all duration-200 group cursor-pointer"
            >
              <ChevronLeft size={16} className="text-forest-green group-hover:-translate-x-1 transition-transform" /> 
              <span>Back to Planner</span>
            </button>

            <span className={`text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full flex items-center gap-1.5 ${
              session.status === 'Saved' 
                ? 'bg-forest-green text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}>
              {session.status === 'Saved' ? <Check size={14} /> : <Sparkles size={14} />}
              {session.status === 'Saved' ? 'Saved to Profile' : 'Personalized Journey'}
            </span>
          </div>

          {/* Title, Route & Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-forest-green bg-forest-green/10 px-3 py-0.5 rounded-full">
                  MY TRIP / TRIP COMPANION
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {session.startDate ? `${session.startDate} → ${session.endDate || ''}` : 'Custom Itinerary'}
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 font-display leading-tight tracking-tight">
                My {dest.name} Adventure
              </h1>
              <p className="text-base md:text-lg font-bold text-forest-green mt-2 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-800"><MapPin size={18} className="text-forest-green" /> {startLoc.name}</span>
                <span className="text-slate-400">→</span>
                <span className="font-extrabold text-slate-900">{dest.name}</span>
                {dest.district && <span className="text-slate-600 font-medium">({dest.district} District)</span>}
              </p>
            </div>

            {/* Actions & Weather */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Weather Badge */}
              {dest.coordinates && dest.coordinates.length === 2 && (
                <WeatherWidget lat={dest.coordinates[0]} lng={dest.coordinates[1]} name={dest.name} />
              )}

              <button
                onClick={() => setIsModifyOpen(true)}
                className="px-4 py-2.5 text-sm font-extrabold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Edit3 size={16} /> Modify Trip
              </button>

              <button
                onClick={() => setIsCopilotOpen(true)}
                className="px-4 py-2.5 text-sm font-extrabold rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 flex items-center gap-2 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                title="Open AI Travel Copilot"
              >
                <Sparkles size={16} className="text-indigo-600" /> Ask Copilot
              </button>

              <button
                onClick={handleSaveTrip}
                disabled={saveStatus === 'SAVING' || saveStatus === 'SAVED'}
                className={`px-6 py-2.5 text-sm font-extrabold rounded-xl uppercase tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                  saveStatus === 'SAVED'
                    ? 'bg-forest-green text-white cursor-default'
                    : saveStatus === 'ERROR'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-forest-green hover:bg-dark-green text-white hover:shadow-md active:scale-[0.99]'
                }`}
              >
                {saveStatus === 'SAVING' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : saveStatus === 'SAVED' ? (
                  <>
                    <Check size={16} /> ✓ Trip Saved
                  </>
                ) : saveStatus === 'ERROR' ? (
                  <>
                    <AlertCircle size={16} /> Try Again
                  </>
                ) : (
                  <>
                    <Bookmark size={16} /> Save Trip
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-6 pt-5 border-t border-slate-200 text-sm font-bold text-slate-800">
            <span className="flex items-center gap-2">
              <Calendar size={17} className="text-forest-green" />
              <strong className="text-slate-900 font-extrabold">{exactDurationText}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <Users size={17} className="text-forest-green" />
              <strong className="text-slate-900">{session.travelers || '2 Adults'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <Car size={17} className="text-forest-green" />
              <strong className="text-slate-900">{session.transport || 'By Car'}</strong>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-2">
              <Compass size={17} className="text-forest-green" />
              <strong className="text-slate-900">{session.pace || 'Balanced'} Pace</strong>
            </span>
            {session.tripType && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-forest-green font-extrabold">
                  {(session.tripType || []).join(' • ')}
                </span>
              </>
            )}
            {session.routeData?.totalDistanceKm > 0 && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-2 text-earth-brown font-extrabold">
                  <span>Total Route: ~{session.routeData.totalDistanceKm} km</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION B: TRIP AT A GLANCE ───────────────────── */}
      <div className="bg-[#f7f5f0] border-b border-slate-200 py-6 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
            {/* Duration Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green">
                  <Calendar size={16} />
                </div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Duration
                </span>
              </div>
              <span className="text-lg md:text-xl font-black text-slate-900 font-display block">
                {exactDurationText}
              </span>
            </div>

            {/* Route Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green">
                  <Navigation size={16} />
                </div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Route
                </span>
              </div>
              <span className="text-sm md:text-base font-extrabold text-slate-900 truncate block" title={`${startLoc.name} → ${dest.name}`}>
                {startLoc.name} → {dest.name}
              </span>
            </div>

            {/* Travel Mode Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green">
                  <Car size={16} />
                </div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Travel Mode
                </span>
              </div>
              <span className="text-lg md:text-xl font-black text-slate-900 block">
                {session.transport || 'By Car'}
              </span>
            </div>

            {/* Travelers Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green">
                  <Users size={16} />
                </div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Travelers
                </span>
              </div>
              <span className="text-lg md:text-xl font-black text-slate-900 block">
                {session.travelers || '2 Adults'}
              </span>
            </div>

            {/* Estimated Budget Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-forest-green/10 flex items-center justify-center text-forest-green">
                  <Wallet size={16} />
                </div>
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  Estimated Budget
                </span>
              </div>
              <span className="text-base md:text-lg font-black text-forest-green truncate block font-display">
                {budgetRange}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION C: YOUR JOURNEY (TIMELINE & MAP SPLIT) ─── */}
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-6 flex-1 space-y-8">
        {saveMessage && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            saveStatus === 'SAVED' ? 'bg-green-50 text-forest-green border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveStatus === 'SAVED' ? <Check size={16} /> : <AlertCircle size={16} />}
            {saveMessage}
          </div>
        )}

        {/* Section Heading & Day Navigator */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-text-dark font-display tracking-tight">
                YOUR JOURNEY
              </h2>
              <p className="text-sm text-muted-text font-medium mt-0.5">
                Your verified day-by-day plan ({dayPlans.length} Days)
              </p>
            </div>
            <span className="text-xs text-muted-text font-medium hidden sm:inline">
              Click any day to highlight route & map
            </span>
          </div>

          {/* Horizontal Day Navigator */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 no-scrollbar text-sm">
            {dayPlans.map((day, idx) => {
              const isActive = idx === activeDayIndex;
              const isPast = idx < activeDayIndex;
              const isTrek = day.type === 'trek';

              return (
                <React.Fragment key={`ribbon-${idx}`}>
                  <button
                    onClick={() => handleSelectDayFromMap(idx)}
                    className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex-shrink-0 border cursor-pointer ${
                      isActive
                        ? 'bg-forest-green text-white font-bold shadow-sm border-forest-green scale-[1.02]'
                        : isPast
                        ? 'bg-white text-forest-green font-semibold border-forest-green/30 hover:bg-[#faf9f6]'
                        : 'bg-white text-text-dark font-semibold border-border-light hover:border-forest-green/40 hover:bg-[#faf9f6]'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      isActive ? 'bg-white text-forest-green' : isPast ? 'bg-forest-green text-white' : 'bg-beige text-text-dark'
                    }`}>
                      {isPast ? '✓' : isTrek ? '🥾' : day.dayNumber}
                    </span>
                    <span className="text-xs md:text-sm">{day.badge || `Day ${day.dayNumber}`}</span>
                  </button>
                  {idx < dayPlans.length - 1 && (
                    <ArrowRight size={15} className="text-muted-text flex-shrink-0 opacity-60" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Desktop Split Layout: Itinerary (65%) + Interactive Map (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Daily Day Cards */}
          <div className="lg:col-span-7 space-y-4">
            {dayPlans.map((day, idx) => (
              <DayCard
                key={`day-${day.dayNumber}-${idx}`}
                cardRef={(el) => (dayCardRefs.current[idx] = el)}
                day={day}
                idx={idx}
                isActive={idx === activeDayIndex}
                onSelect={setActiveDayIndex}
                defaultStartLocation={startLoc.name}
                defaultDestination={dest.name}
                fallbackTransport={session.transport}
                onBookStay={handleBookStay}
              />
            ))}
          </div>

          {/* Right Column: Interactive Map (Sticky) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-forest-green/10 flex items-center justify-center">
                    <Compass size={16} className="text-forest-green" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                    Journey Map
                  </h3>
                </div>
                <span className="text-xs text-forest-green font-extrabold bg-forest-green/10 px-2.5 py-1 rounded-full">
                  Day {activeDayIndex + 1} of {dayPlans.length}
                </span>
              </div>

              {/* Map Container */}
              <div className="h-[440px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
                <TripWorkspaceMap 
                  tripSession={session} 
                  activeDayIndex={activeDayIndex}
                  onSelectDay={handleSelectDayFromMap}
                />
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-200 text-xs text-slate-600 font-medium flex items-center justify-between">
                <span>📍 Pins show corridor hubs, stays & trails</span>
                <button
                  onClick={() => setActiveDayIndex(0)}
                  className="text-forest-green font-extrabold hover:underline cursor-pointer"
                >
                  Reset to Day 1
                </button>
              </div>
            </div>

            {/* Strategy Note */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs text-sm text-slate-700 font-medium space-y-2.5">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Sparkles size={15} className="text-forest-green" /> Why We Planned It This Way
              </h4>
              <p className="leading-relaxed">
                • <strong className="text-slate-900">{exactDurationText} Duration:</strong> Optimized from {startLoc.name} to {dest.name}.
              </p>
              <p className="leading-relaxed">
                • <strong className="text-slate-900">Daylight Mountain Travel:</strong> High ghat road drives are scheduled in daylight for safety.
              </p>
              <p className="leading-relaxed">
                • <strong className="text-slate-900">{session.pace || 'Balanced'} Pacing:</strong> Incorporates rest and acclimatization windows.
              </p>
            </div>
          </div>
        </div>

        {/* ── SECTION D: TRIP INSIGHTS (AI) ────────────────── */}
        <AiTripPlanCard
          aiPlan={aiPlan}
          meta={aiMeta}
          loading={aiLoading}
          error={aiError}
          onRetry={fetchAiPlan}
          maxDays={dayPlans.length}
        />

        {/* ── SECTION E: TRIP BUDGET ───────────────────────── */}
        <BudgetBreakdownCard 
          budgetData={budgetData} 
          budgetPreference={session.budget || 'Balanced'} 
        />

        {/* ── SECTION F: RECOMMENDATIONS ───────────────────── */}
        <div className="space-y-10">
          {/* 1. Recommended Stays */}
          {displayStays.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 font-display">
                    Recommended Stays
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Verified KMVN, GMVN & boutique stays near {dest.district || dest.name}
                  </p>
                </div>
                <Link to="/stays" className="text-sm font-extrabold text-forest-green hover:underline">
                  View All Stays →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displayStays.map((stay) => (
                  <div key={stay.id || stay._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col">
                    <div className="h-40 rounded-xl overflow-hidden bg-beige mb-3.5 relative">
                      <img
                        src={stay.image || '/assets/fallback.svg'}
                        alt={stay.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                      />
                      {stay.score && (
                        <div className="absolute top-2.5 right-2.5 bg-forest-green text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-sm">
                          Match: {stay.score}/100
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-xs font-extrabold text-earth-brown bg-beige/80 px-2.5 py-0.5 rounded-full inline-block">
                            {stay.category || stay.type || 'Stay'}
                          </span>
                          {typeof stay.distanceKm === 'number' && (
                            <span className="text-xs font-extrabold text-forest-green">
                              {stay.distanceKm} km away
                            </span>
                          )}
                        </div>
                        <h4 className="font-black text-slate-900 text-base leading-snug">
                          {stay.name}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          📍 {typeof stay.location === 'string' ? stay.location : (stay.city || stay.district || 'Uttarakhand')}
                        </p>

                        {stay.reasons && stay.reasons.length > 0 && (
                          <p className="text-xs text-forest-green font-semibold italic mt-2.5 p-2 rounded-lg bg-forest-green/5 border border-forest-green/10 leading-relaxed">
                            💡 {stay.reasons[0]}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3.5 border-t border-slate-200 flex items-center justify-between">
                        {stay.pricePerNight || stay.price?.amount ? (
                          <span className="text-sm font-black text-forest-green">
                            ₹{stay.pricePerNight || stay.price?.amount} / night
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500">Tariff on inquiry</span>
                        )}
                        <Link to={`/stays/${stay.slug || stay.id || stay._id}`} className="text-xs font-extrabold text-forest-green hover:underline">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Recommended Certified Guides */}
          {displayGuides.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 font-display">
                    Recommended Local Mountain Guides
                  </h3>
                  <p className="text-sm text-slate-600 font-medium">
                    Certified and experienced guides for mountain routes
                  </p>
                </div>
                <Link to="/guides" className="text-sm font-extrabold text-forest-green hover:underline">
                  View All Guides →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displayGuides.map((guide) => (
                  <div key={guide._id || guide.slug} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col">
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-beige flex-shrink-0 border-2 border-slate-200 relative">
                        <img
                          src={guide.profileImage || guide.image || '/assets/fallback.svg'}
                          alt={guide.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-black text-slate-900 text-base leading-tight flex items-center gap-1.5 truncate">
                            {guide.name}
                            {guide.verifiedByGovt && (
                              <ShieldCheck size={16} className="text-forest-green flex-shrink-0" title="Govt Verified" />
                            )}
                          </h4>
                          {guide.score && (
                            <span className="text-xs font-black text-forest-green bg-forest-green/10 px-2 py-0.5 rounded-full flex-shrink-0">
                              {guide.score}/100
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-1">
                          📍 {typeof guide.location === 'string' ? guide.location : (guide.city || guide.district || 'Uttarakhand')}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      {guide.specialties && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {guide.specialties.slice(0, 3).map((spec, sIdx) => (
                            <span key={sIdx} className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="pt-3.5 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-sm font-black text-forest-green">
                          {guide.pricePerDay ? `₹${guide.pricePerDay} / day` : 'Available for hire'}
                        </span>
                        <Link to={`/guides/${guide.slug || guide._id}`} className="text-xs font-extrabold text-forest-green hover:underline">
                          View Profile →
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION G: SAFETY / ADVISORIES ───────────────── */}
        <WorkspaceAdvisories
          destination={
            session?.destination ||
            (Array.isArray(session?.destinations) && session.destinations[0]) ||
            (allDestinations && allDestinations.length > 0 ? allDestinations[0] : null)
          }
          tripContext={session}
        />

      </div>

      {/* ── Modals ───────────────────────────────────────── */}
      <ModifyTripModal
        isOpen={isModifyOpen}
        onClose={() => setIsModifyOpen(false)}
        editDuration={editDuration}
        setEditDuration={setEditDuration}
        editPace={editPace}
        setEditPace={setEditPace}
        editTransport={editTransport}
        setEditTransport={setEditTransport}
        onUpdateTrip={handleUpdateTrip}
      />

      <BookingModal
        isOpen={bookingModalState.isOpen}
        onClose={() => setBookingModalState(prev => ({ ...prev, isOpen: false }))}
        item={bookingModalState.item}
        defaultStartDate={bookingModalState.defaultStartDate}
        defaultEndDate={bookingModalState.defaultEndDate}
        tripId={tripId}
      />
    </div>
  );
}
