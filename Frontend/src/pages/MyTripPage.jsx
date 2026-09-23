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
  ExternalLink,
  Bike
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
  const [allRentals, setAllRentals] = useState([]);
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
  const [editDuration, setEditDuration] = useState('3 Days');
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

  // Load guides, stays, rentals & destinations
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

    import('../api/rentalApi').then(module => {
      module.getRentals().then(res => {
        if (res?.success && Array.isArray(res.data)) setAllRentals(res.data);
      });
    }).catch(err => console.warn('Failed to load rentals', err));
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
              duration: trip.duration || '3 Days',
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
      setEditDuration(session.duration || `${session.dayPlans?.length || 3} Days`);
      setEditPace(session.pace || 'Balanced');
      setEditTransport(session.transport || 'By Car');
    }
  }, [session]);

  const dest = session?.destination;
  const dayPlans = session?.dayPlans || [];
  const startLoc = session?.startingLocation || { name: 'Delhi' };

  // Calculate strict duration display
  const exactDurationText = useMemo(() => {
    if (dayPlans.length > 0) {
      return `${dayPlans.length} ${dayPlans.length === 1 ? 'Day' : 'Days'}`;
    }
    return session?.duration || '3 Days';
  }, [dayPlans, session]);

  // Auto-upgrade legacy dayPlans if they have artificial gateway detours (e.g. Haldwani Gateway / Corbett stay)
  useEffect(() => {
    if (session && dest && Array.isArray(session.dayPlans) && session.dayPlans.length > 0) {
      const firstDay = session.dayPlans[0];
      const hasLegacyGateway = firstDay?.where?.includes('Gateway') || 
                              firstDay?.stay?.location?.includes('Gateway') ||
                              firstDay?.stay?.name?.includes('Corbett');
      if (hasLegacyGateway) {
        const upgradedPlans = generatePersonalizedTripPlan({
          startingLocation: session.startingLocation || { name: 'Delhi' },
          destination: dest,
          preferences: {
            duration: session.duration || `${session.dayPlans.length} Days`,
            pace: session.pace || 'Balanced',
            transport: session.transport || 'By Car',
            travelMode: session.transport || 'By Car',
            travelers: session.travelers || '2 Adults',
            tripType: session.tripType || ['Nature'],
            interests: session.interests || ['Nature'],
            budget: session.budget || 'Comfort'
          },
          routeData: session.routeData || {},
          allActivities,
          allSpiritual: [],
          allStays
        });
        const updated = { ...session, dayPlans: upgradedPlans };
        setSession(updated);
        setActiveTripSession(updated);
        try {
          localStorage.setItem('discovery_active_trip', JSON.stringify(updated));
        } catch (e) {}
      }
    }
  }, [session, dest, allActivities, allStays]);

  // Handle bidirectional sync: when a marker is clicked on the map, scroll to the day card
  const handleSelectDayFromMap = (idx) => {
    setActiveDayIndex(idx);
    const cardEl = dayCardRefs.current[idx];
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Helper for availability badge
  const getAvailabilityState = (item) => {
    if (item?.availabilityStatus === 'AVAILABLE' || item?.status === 'ACTIVE' || item?.isVerified) {
      return { label: 'Available', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    if (item?.availabilityStatus === 'UNAVAILABLE' || item?.status === 'INACTIVE') {
      return { label: 'Unavailable', className: 'bg-red-50 text-red-700 border-red-200' };
    }
    return { label: 'Inquire Availability', className: 'bg-slate-50 text-slate-700 border-slate-200' };
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
    const destName = (dest?.name || '').toLowerCase();

    const matches = allStays.filter(s => {
      const sCity = (s.city || '').toLowerCase();
      const sName = (s.name || '').toLowerCase();
      const sDist = (s.district || '').toLowerCase();
      return (destName && (sCity.includes(destName) || sName.includes(destName))) ||
             (district && sDist.includes(district));
    });

    return (matches.length > 0 ? matches : allStays).slice(0, 3);
  }, [engineRecs.stays, allStays, dest]);

  // Relevant vehicle rentals
  const displayRentals = useMemo(() => {
    if (!allRentals || allRentals.length === 0) return [];
    const district = dest?.district?.toLowerCase() || '';
    const matches = allRentals.filter(r => 
      (r.city && r.city.toLowerCase().includes(district)) ||
      (r.location && r.location.toLowerCase().includes(district))
    );
    return (matches.length > 0 ? matches : allRentals).slice(0, 3);
  }, [allRentals, dest]);

  // Relevant guides
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
    : '₹18,000 – ₹24,000';

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <Navbar />

      {/* ── 1. TRIP HEADER ────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 pt-28 md:pt-32 pb-6 px-4 md:px-8 shadow-2xs">
        <div className="max-w-[1400px] mx-auto">
          {/* Breadcrumb row */}
          <div className="flex items-center justify-between gap-4 mb-3">
            <button
              onClick={() => navigate('/trip-planner')}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-forest-green font-bold text-xs border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <ChevronLeft size={15} /> 
              <span>Back to Planner</span>
            </button>

            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5 ${
              session.status === 'Saved' 
                ? 'bg-forest-green text-white' 
                : 'bg-slate-100 text-slate-700 border border-slate-200'
            }`}>
              {session.status === 'Saved' ? <Check size={13} /> : <Sparkles size={13} />}
              {session.status === 'Saved' ? 'Saved to Profile' : 'Custom Itinerary'}
            </span>
          </div>

          {/* Title and actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 font-display leading-tight tracking-tight">
                My {dest.name} Trip
              </h1>
              <p className="text-sm md:text-base font-bold text-slate-600 mt-1.5 flex items-center gap-2 flex-wrap">
                <span className="text-forest-green font-extrabold flex items-center gap-1">
                  <MapPin size={16} /> {startLoc.name}
                </span>
                <span className="text-slate-400">→</span>
                <span className="text-slate-900 font-extrabold">{dest.name}</span>
                <span className="text-slate-400">•</span>
                <span>{session.startDate ? `${session.startDate} – ${session.endDate || ''}` : '15 Oct – 18 Oct'}</span>
                <span className="text-slate-400">•</span>
                <strong className="text-slate-900">{exactDurationText}</strong>
                <span className="text-slate-400">•</span>
                <span>{session.travelers || '2 Travelers'}</span>
              </p>
            </div>

            {/* Compact Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {dest.coordinates && dest.coordinates.length === 2 && (
                <WeatherWidget lat={dest.coordinates[0]} lng={dest.coordinates[1]} name={dest.name} />
              )}

              <button
                onClick={() => setIsModifyOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Edit3 size={14} /> Modify Trip
              </button>

              <button
                onClick={() => setIsCopilotOpen(true)}
                className="px-3.5 py-2 text-xs font-bold rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <Sparkles size={14} className="text-indigo-600" /> Ask Copilot
              </button>

              <button
                onClick={handleSaveTrip}
                disabled={saveStatus === 'SAVING' || saveStatus === 'SAVED'}
                className={`px-4 py-2 text-xs font-bold rounded-xl uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                  saveStatus === 'SAVED'
                    ? 'bg-forest-green text-white cursor-default'
                    : saveStatus === 'ERROR'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-forest-green hover:bg-dark-green text-white'
                }`}
              >
                {saveStatus === 'SAVING' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : saveStatus === 'SAVED' ? (
                  <>
                    <Check size={14} /> ✓ Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={14} /> Save Trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TRIP AT A GLANCE ───────────────────────────────────── */}
      <div className="bg-[#f7f5f0] border-b border-slate-200 py-4 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Route */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                <Navigation size={13} className="text-forest-green" /> Route
              </span>
              <strong className="text-sm font-extrabold text-slate-900 block truncate" title={`${startLoc.name} → ${dest.name}`}>
                {startLoc.name} → {dest.name}
              </strong>
            </div>

            {/* Duration */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-forest-green" /> Duration
              </span>
              <strong className="text-sm font-extrabold text-slate-900 block">
                {exactDurationText}
              </strong>
            </div>

            {/* Travelers */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                <Users size={13} className="text-forest-green" /> Travelers
              </span>
              <strong className="text-sm font-extrabold text-slate-900 block">
                {session.travelers || '2 Travelers'}
              </strong>
            </div>

            {/* Transport */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                <Car size={13} className="text-forest-green" /> Transport
              </span>
              <strong className="text-sm font-extrabold text-slate-900 block">
                {session.transport || 'By Car'}
              </strong>
            </div>

            {/* Budget */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                <Wallet size={13} className="text-forest-green" /> Budget
              </span>
              <strong className="text-sm font-extrabold text-forest-green block truncate">
                {budgetRange}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. DAY-BY-DAY JOURNEY (MAIN PRODUCT) ──────────────────── */}
      <div className="max-w-[1400px] mx-auto w-full px-4 md:px-8 py-6 flex-1 space-y-10">
        {saveMessage && (
          <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
            saveStatus === 'SAVED' ? 'bg-green-50 text-forest-green border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {saveStatus === 'SAVED' ? <Check size={16} /> : <AlertCircle size={16} />}
            {saveMessage}
          </div>
        )}

        {/* Journey Section Title & Day Switcher Ribbon */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 font-display tracking-tight">
                YOUR JOURNEY
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                Verified day-by-day plan ({dayPlans.length} Days) · Focus any day to highlight route & map
              </p>
            </div>
          </div>

          {/* Horizontal Day Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 no-scrollbar text-sm">
            {dayPlans.map((day, idx) => {
              const isActive = idx === activeDayIndex;
              const isPast = idx < activeDayIndex;

              return (
                <button
                  key={`ribbon-${idx}`}
                  onClick={() => handleSelectDayFromMap(idx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all whitespace-nowrap border cursor-pointer ${
                    isActive
                      ? 'bg-forest-green text-white font-bold shadow-sm border-forest-green scale-[1.02]'
                      : isPast
                      ? 'bg-white text-forest-green font-semibold border-forest-green/30 hover:bg-slate-50'
                      : 'bg-white text-slate-700 font-semibold border-slate-200 hover:border-forest-green/40 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                    isActive ? 'bg-white text-forest-green' : isPast ? 'bg-forest-green text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {isPast ? '✓' : day.dayNumber}
                  </span>
                  <span>DAY {day.dayNumber}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Split Layout: Itinerary (65%) + Interactive Map (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Daily Day Cards */}
          <div className="lg:col-span-7 space-y-6">
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

          {/* Right Column: Interactive Map (Sticky) with Simplified Legend */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
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
              <div className="h-[420px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <TripWorkspaceMap 
                  tripSession={session} 
                  activeDayIndex={activeDayIndex}
                  onSelectDay={handleSelectDayFromMap}
                />
              </div>

              {/* Simplified Map Legend (Rule 18) */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1">🟢 Start</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">📍 Place</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">🥾 Activity</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">🏨 Stay</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">🔴 End</span>
                </div>
                <button
                  onClick={() => setActiveDayIndex(0)}
                  className="text-forest-green font-bold hover:underline cursor-pointer text-xs"
                >
                  Reset to Day 1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. TRIP BUDGET (AFTER ITINERARY) ───────────────────────── */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
              TRIP BUDGET
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Deterministic estimate based on verified lodging, transport rates, and selected activities
            </p>
          </div>
          <BudgetBreakdownCard 
            budgetData={budgetData} 
            budgetPreference={session.budget || 'Balanced'} 
          />
        </div>

        {/* ── 5. OPTIONAL RECOMMENDATIONS ───────────────────────────── */}
        <div className="space-y-8 pt-4 border-t border-slate-200">
          {/* Other Stays You May Like */}
          {displayStays.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                    Other Stays You May Like
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Optional recommendations near {dest.district || dest.name} (Not your confirmed overnight stay)
                  </p>
                </div>
                <Link to="/stays" className="text-xs sm:text-sm font-extrabold text-forest-green hover:underline">
                  View All Stays →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displayStays.map((stay) => (
                  <div key={stay.id || stay._id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                    <div>
                      <div className="h-40 rounded-xl overflow-hidden bg-slate-100 mb-3.5 relative">
                        <img
                          src={stay.image || '/assets/fallback.svg'}
                          alt={stay.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                        />
                        {stay.score && (
                          <div className="absolute top-2.5 right-2.5 bg-forest-green text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                            Match: {stay.score}/100
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {stay.category || 'Stay'}
                        </span>
                        {typeof stay.distanceKm === 'number' && (
                          <span className="text-xs font-bold text-forest-green">
                            {stay.distanceKm} km away
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {stay.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        📍 {typeof stay.location === 'string' ? stay.location : (stay.city || stay.district || 'Uttarakhand')}
                      </p>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-forest-green">
                        ₹{stay.pricePerNight || stay.pricing?.amount || stay.price?.amount || 3200} / night
                      </span>
                      <Link to={`/stays/${stay.slug || stay.id || stay._id}`} className="text-xs font-bold text-forest-green hover:underline">
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Local Guides */}
          {displayGuides.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                    Other Local Guides
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Certified and experienced mountain guides available for hire in {dest.district || dest.name}
                  </p>
                </div>
                <Link to="/guides" className="text-xs sm:text-sm font-extrabold text-forest-green hover:underline">
                  View All Guides →
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {displayGuides.map((guide) => (
                  <div key={guide._id || guide.slug} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                        <img
                          src={guide.profileImage || guide.image || '/assets/fallback.svg'}
                          alt={guide.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1">
                          {guide.name}
                          {guide.verifiedByGovt && <ShieldCheck size={14} className="text-forest-green shrink-0" />}
                        </h4>
                        <p className="text-xs text-slate-500">
                          📍 {typeof guide.location === 'string' ? guide.location : (guide.city || guide.district || 'Uttarakhand')}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm font-black text-forest-green">
                        {guide.pricePerDay ? `₹${guide.pricePerDay} / day` : 'Tariff on inquiry'}
                      </span>
                      <Link to={`/guides/${guide.slug || guide._id}`} className="text-xs font-bold text-forest-green hover:underline">
                        View Profile →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 6. SAFETY / ADVISORIES ─────────────────────────────────── */}
        <div className="pt-4 border-t border-slate-200">
          <WorkspaceAdvisories
            destination={
              session?.destination ||
              (Array.isArray(session?.destinations) && session.destinations[0]) ||
              (allDestinations && allDestinations.length > 0 ? allDestinations[0] : null)
            }
            tripContext={session}
          />
        </div>

      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
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
