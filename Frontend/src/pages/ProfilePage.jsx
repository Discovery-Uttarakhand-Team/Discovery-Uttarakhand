import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import { useMapStore } from '../store/mapStore';
import { updateProfile, uploadImage } from '../api/userApi';
import { getMyBookings } from '../api/bookingApi';
import { getMyReviews } from '../api/reviewApi';
import { getTrips } from '../api/tripApi';
import {
  User,
  Calendar,
  Heart,
  MessageSquare,
  Map as MapIcon,
  LogOut,
  Edit2,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Star,
  Plus,
  Compass,
  ExternalLink,
  ShieldCheck,
  Camera,
  Check,
  Layers,
  ChevronLeft,
  ChevronRight,
  Building
} from 'lucide-react';
import PartnerListingsManager from '../components/partner/PartnerListingsManager';
import MyBookings from '../components/booking/MyBookings';

// ── Skeleton Loader ──────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-3xl p-4 border border-border-light/60 card-shadow animate-pulse flex flex-col">
    <div className="w-full h-44 bg-beige/60 rounded-2xl mb-4" />
    <div className="h-4 bg-beige/80 rounded w-3/4 mb-2" />
    <div className="h-3 bg-beige/60 rounded w-1/2 mb-3" />
    <div className="h-3 bg-beige/40 rounded w-full mb-1" />
    <div className="h-3 bg-beige/40 rounded w-5/6 mb-4" />
    <div className="mt-auto pt-3 border-t border-border-light/40 flex justify-between items-center">
      <div className="h-8 bg-beige/80 rounded-xl w-24" />
      <div className="h-8 bg-beige/60 rounded-xl w-24" />
    </div>
  </div>
);

// ── Helper to resolve card destination link ──────────────────────────────────
const getItemRoute = (itemType, item) => {
  if (!item) return '/explore';
  const type = (itemType || '').toLowerCase();
  const slug = item.slug || item._id;

  if (type === 'destination') return `/destinations/${slug}`;
  if (type === 'stay') return `/stays/${slug}`;
  if (type === 'rental') return `/rentals`;
  if (type === 'activity') return `/activities/${slug}`;
  if (type === 'guide') return `/guides/${slug}`;
  if (type === 'spiritual') return `/spiritual/${slug}`;
  if (type === 'culture') return `/culture/${slug}`;
  return `/destinations/${slug}`;
};

// ── Helper to resolve cover image ────────────────────────────────────────────
const getItemImage = (item, itemType) => {
  if (!item) return '/assets/fallback.svg';
  if (item.coverImage?.url) return item.coverImage.url;
  if (typeof item.coverImage === 'string' && item.coverImage) return item.coverImage;
  if (item.image?.url) return item.image.url;
  if (typeof item.image === 'string' && item.image) return item.image;
  if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    if (first?.url) return first.url;
    if (typeof first === 'string' && first) return first;
  }
  if (itemType === 'Stay' || item.name?.includes('KMVN')) return '/assets/kmvn-stay.svg';
  return '/assets/fallback.svg';
};

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const { favorites, favoriteCount, loading: favLoading, removeFavorite, refreshFavorites } = useFavorites();
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState('favorites');
  const [favCategory, setFavCategory] = useState('all');

  // Trip planner integration state
  const [addedTripIds, setAddedTripIds] = useState(new Set());

  // Collections data
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [trips, setTrips] = useState([]);

  // Loading states
  const [dataLoading, setDataLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState({ text: '', type: '' });

  // Init form on user change
  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        location: currentUser.location || ''
      });
      setPreviewUrl(
        currentUser.profileImage?.url ||
        (typeof currentUser.profileImage === 'string' ? currentUser.profileImage : null)
      );
    }
  }, [currentUser, showEditModal]);

  // Load secondary data (bookings, reviews, saved trips)
  const loadUserData = async () => {
    setDataLoading(true);
    setFetchError(null);
    try {
      const [bookRes, revRes, tripRes] = await Promise.allSettled([
        getMyBookings(),
        getMyReviews(),
        getTrips()
      ]);

      if (bookRes.status === 'fulfilled' && bookRes.value?.success) {
        setBookings(bookRes.value.data || []);
      }
      if (revRes.status === 'fulfilled' && revRes.value?.success) {
        setReviews(revRes.value.data || []);
      }
      if (tripRes.status === 'fulfilled' && tripRes.value?.success) {
        setTrips(tripRes.value.data || []);
      }
    } catch (err) {
      console.error('Error fetching user dashboard data', err);
      setFetchError('Failed to load some profile records');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Add item to trip planner store
  const handleAddToTrip = (dest, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const destId = dest._id || dest.id;
    useMapStore.getState().addTripDestination(dest);
    setAddedTripIds((prev) => new Set(prev).add(destId));

    setTimeout(() => {
      setAddedTripIds((prev) => {
        const next = new Set(prev);
        next.delete(destId);
        return next;
      });
    }, 2500);
  };

  // Open saved trip into dedicated trip workspace
  const handleOpenSavedTrip = (trip) => {
    if (!trip) return;
    const tripId = trip._id || trip.id;
    if (tripId) {
      navigate(`/my-trip/${tripId}`);
    } else {
      navigate('/trip-planner');
    }
  };

  // Profile update submission
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSaveMsg({ text: '', type: '' });

    try {
      let uploadedImageUrl = null;

      if (selectedFile) {
        setProfileSaveMsg({ text: 'Uploading avatar photo...', type: 'info' });
        const upRes = await uploadImage(selectedFile);
        if (upRes?.success && upRes.image?.url) {
          uploadedImageUrl = upRes.image.url;
        } else {
          setProfileSaveMsg({ text: 'Image upload failed. Please try a different photo.', type: 'error' });
          setIsSavingProfile(false);
          return;
        }
      }

      setProfileSaveMsg({ text: 'Saving your profile details...', type: 'info' });

      const payload = {
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        location: profileForm.location.trim()
      };

      if (uploadedImageUrl) {
        payload.profileImage = uploadedImageUrl;
      }

      const res = await updateProfile(payload);
      if (res?.success) {
        setProfileSaveMsg({ text: 'Profile updated successfully!', type: 'success' });
        setTimeout(() => {
          setShowEditModal(false);
          setProfileSaveMsg({ text: '', type: '' });
          // If profile image was updated, trigger refresh
          window.location.reload();
        }, 1200);
      } else {
        setProfileSaveMsg({ text: res?.message || 'Failed to update profile.', type: 'error' });
      }
    } catch (err) {
      console.error('Update profile error', err);
      setProfileSaveMsg({ text: 'An unexpected error occurred. Please try again.', type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Filtered favorites
  const filteredFavorites = useMemo(() => {
    if (!Array.isArray(favorites)) return [];
    if (favCategory === 'all') return favorites;
    return favorites.filter((f) => {
      const type = (f.itemType || f.targetType || '').toLowerCase();
      return type === favCategory.toLowerCase();
    });
  }, [favorites, favCategory]);

  // Dynamic category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: favorites.length, destination: 0, stay: 0, rental: 0, activity: 0, spiritual: 0 };
    favorites.forEach((f) => {
      const type = (f.itemType || f.targetType || '').toLowerCase();
      if (counts[type] !== undefined) {
        counts[type]++;
      }
    });
    return counts;
  }, [favorites]);

  // Initials for avatar
  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'U';

  const avatarUrl =
    currentUser?.profileImage?.url ||
    (typeof currentUser?.profileImage === 'string' ? currentUser?.profileImage : null);

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-28 md:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* ── Top Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border-light/80">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2.5">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 hover:text-forest-green font-bold text-xs sm:text-sm border border-slate-200/80 shadow-xs transition-all duration-200 group cursor-pointer"
              >
                <ChevronLeft size={16} className="text-forest-green group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Home</span>
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-forest-green bg-forest-green/10 px-3 py-1 rounded-full border border-forest-green/20">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-green animate-pulse"></span>
                Discovery Uttarakhand
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-display">
              My Travel Profile
            </h1>
            <p className="text-slate-600 text-sm sm:text-base font-medium mt-1">
              Plan your journeys, save places and manage your personal trips in Uttarakhand.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl transition-all duration-200 border border-rose-200/70 text-xs uppercase tracking-wider shadow-sm hover:shadow cursor-pointer"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        </div>

        {/* ── Main Layout: Profile Sidebar + Tabs Panel ───────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: User Profile Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-border-light/60 flex flex-col items-center text-center relative overflow-hidden">
              {/* Subtle decorative background accent */}
              <div className="absolute -top-16 -right-16 w-36 h-36 bg-beige/50 rounded-full blur-2xl pointer-events-none" />

              {/* Avatar */}
              <div className="relative mb-5 group">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gradient-to-br from-forest-green to-dark-green flex items-center justify-center text-white text-3xl font-black font-display select-none">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={currentUser?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute bottom-1 right-1 p-2 bg-white text-text-dark hover:text-forest-green rounded-full shadow-md border border-border-light transition-colors"
                  title="Edit Avatar"
                  aria-label="Edit Avatar"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Name & Role */}
              <h2 className="text-xl font-black text-text-dark uppercase tracking-wide leading-tight mb-1 font-display">
                {currentUser?.name || 'Uttarakhand Traveler'}
              </h2>
              <p className="text-xs text-muted-text font-medium break-all mb-3">
                {currentUser?.email}
              </p>

              <div className="flex items-center gap-1.5 mb-5">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-forest-green/10 text-forest-green text-[11px] font-black uppercase tracking-wider rounded-full border border-forest-green/20">
                  <ShieldCheck size={13} />
                  {currentUser?.role === 'admin' ? 'Administrator' : 'Traveler'}
                </span>
                {currentUser?.location && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-beige text-text-dark text-[11px] font-bold rounded-full border border-border-light">
                    <MapPin size={11} className="text-earth-brown" />
                    {currentUser.location}
                  </span>
                )}
              </div>

              {/* Real Stats Counters */}
              <div className="w-full grid grid-cols-3 gap-2 py-4 px-2 my-2 bg-[#faf9f6] rounded-2xl border border-border-light/60">
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-forest-green tabular-nums font-display">
                    {favoriteCount}
                  </span>
                  <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
                    Saved
                  </span>
                </div>
                <div className="flex flex-col items-center border-x border-border-light/80">
                  <span className="text-xl font-black text-forest-green tabular-nums font-display">
                    {trips.length}
                  </span>
                  <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
                    Trips
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-forest-green tabular-nums font-display">
                    {reviews.length}
                  </span>
                  <span className="text-[11px] font-bold text-muted-text uppercase tracking-wider">
                    Reviews
                  </span>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button
                onClick={() => setShowEditModal(true)}
                className="w-full mt-4 py-2.5 px-4 bg-white hover:bg-beige/40 text-forest-green hover:text-dark-green font-bold text-xs uppercase tracking-wider rounded-xl border border-forest-green/30 hover:border-forest-green transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <Edit2 size={14} />
                <span>Edit Profile</span>
              </button>
            </div>

            {/* Quick Trip Planner Banner */}
            <div className="bg-gradient-to-br from-forest-green to-dark-green text-white rounded-3xl p-6 card-shadow flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-white/70 bg-white/10 px-2 py-0.5 rounded-full inline-block mb-3">
                  Interactive Route Tool
                </span>
                <h3 className="text-lg font-black font-display leading-snug mb-2">
                  Plan Your Uttarakhand Journey
                </h3>
                <p className="text-xs text-white/80 leading-relaxed mb-4">
                  Add saved destinations to your route and visualize scenic driving times through the Himalayas.
                </p>
              </div>
              <Link
                to="/trip-planner"
                className="inline-flex items-center justify-center gap-2 bg-white text-forest-green hover:bg-beige font-black text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm"
              >
                <Compass size={14} />
                <span>Open Trip Planner</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Dashboard Navigation & Tabs (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Horizontal Tabs Header */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'favorites'
                    ? 'bg-forest-green text-white shadow-md'
                    : 'bg-white text-text-dark hover:bg-beige/60 border border-border-light/70'
                }`}
              >
                <Heart size={16} className={activeTab === 'favorites' ? 'fill-white' : 'text-forest-green'} />
                <span>My Favorites</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'favorites' ? 'bg-white/20 text-white' : 'bg-beige text-text-dark'
                  }`}
                >
                  {favoriteCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('trips')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'trips'
                    ? 'bg-forest-green text-white shadow-md'
                    : 'bg-white text-text-dark hover:bg-beige/60 border border-border-light/70'
                }`}
              >
                <MapIcon size={16} />
                <span>Saved Trips</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'trips' ? 'bg-white/20 text-white' : 'bg-beige text-text-dark'
                  }`}
                >
                  {trips.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'bookings'
                    ? 'bg-forest-green text-white shadow-md'
                    : 'bg-white text-text-dark hover:bg-beige/60 border border-border-light/70'
                }`}
              >
                <Calendar size={16} />
                <span>My Bookings</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-beige text-text-dark'
                  }`}
                >
                  {bookings.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'reviews'
                    ? 'bg-forest-green text-white shadow-md'
                    : 'bg-white text-text-dark hover:bg-beige/60 border border-border-light/70'
                }`}
              >
                <MessageSquare size={16} />
                <span>My Reviews</span>
                <span
                  className={`ml-1 text-[11px] px-2 py-0.5 rounded-full font-black ${
                    activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-beige text-text-dark'
                  }`}
                >
                  {reviews.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('partner')}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm ${
                  activeTab === 'partner'
                    ? 'bg-forest-green text-white shadow-md'
                    : 'bg-white text-text-dark hover:bg-beige/60 border border-border-light/70'
                }`}
              >
                <Building size={16} />
                <span>Partner Hub</span>
              </button>
            </div>

            {/* Error Banner if any */}
            {fetchError && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500" />
                  <span>{fetchError}</span>
                </div>
                <button
                  onClick={() => {
                    loadUserData();
                    refreshFavorites();
                  }}
                  className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg text-xs font-bold transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── TAB 1: MY FAVORITES ────────────────────────────────────────── */}
            {activeTab === 'favorites' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-border-light/60">
                {/* Header & Category Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-border-light/60">
                  <div>
                    <h3 className="text-lg font-black text-text-dark uppercase tracking-wide font-display">
                      YOUR SAVED PLACES
                    </h3>
                    <p className="text-xs text-muted-text font-medium mt-0.5">
                      {favoriteCount === 1
                        ? '1 place saved for your Uttarakhand journey.'
                        : `${favoriteCount} places saved for your Uttarakhand journey.`}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  {favorites.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setFavCategory('all')}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          favCategory === 'all'
                            ? 'bg-forest-green text-white shadow-sm'
                            : 'bg-beige/60 text-text-dark hover:bg-beige border border-border-light'
                        }`}
                      >
                        All ({categoryCounts.all})
                      </button>
                      {categoryCounts.destination > 0 && (
                        <button
                          onClick={() => setFavCategory('destination')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            favCategory === 'destination'
                              ? 'bg-forest-green text-white shadow-sm'
                              : 'bg-beige/60 text-text-dark hover:bg-beige border border-border-light'
                          }`}
                        >
                          Destinations ({categoryCounts.destination})
                        </button>
                      )}
                      {categoryCounts.stay > 0 && (
                        <button
                          onClick={() => setFavCategory('stay')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            favCategory === 'stay'
                              ? 'bg-forest-green text-white shadow-sm'
                              : 'bg-beige/60 text-text-dark hover:bg-beige border border-border-light'
                          }`}
                        >
                          Stays ({categoryCounts.stay})
                        </button>
                      )}
                      {categoryCounts.rental > 0 && (
                        <button
                          onClick={() => setFavCategory('rental')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            favCategory === 'rental'
                              ? 'bg-forest-green text-white shadow-sm'
                              : 'bg-beige/60 text-text-dark hover:bg-beige border border-border-light'
                          }`}
                        >
                          Rentals ({categoryCounts.rental})
                        </button>
                      )}
                      {categoryCounts.activity > 0 && (
                        <button
                          onClick={() => setFavCategory('activity')}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            favCategory === 'activity'
                              ? 'bg-forest-green text-white shadow-sm'
                              : 'bg-beige/60 text-text-dark hover:bg-beige border border-border-light'
                          }`}
                        >
                          Activities ({categoryCounts.activity})
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content: Loading Skeletons vs Real Cards vs Empty State */}
                {favLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : filteredFavorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredFavorites.map((fav) => {
                      const item = fav.item || fav.targetId;
                      if (!item) return null;

                      const itemType = fav.itemType || fav.targetType || 'Destination';
                      const itemId = item._id || item.id || fav._id;
                      const imageUrl = getItemImage(item, itemType);
                      const routeUrl = getItemRoute(itemType, item);
                      const locationText = item.district
                        ? `${item.district}${item.region ? ` • ${item.region}` : ''}`
                        : item.city
                        ? `${item.city}${item.district ? ` • ${item.district}` : ''}`
                        : item.location || 'Uttarakhand';

                      const isAddedToTrip = addedTripIds.has(itemId);

                      return (
                        <div
                          key={fav._id || itemId}
                          className="bg-white rounded-3xl overflow-hidden card-shadow border border-border-light/70 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col group"
                        >
                          {/* Card Image Banner */}
                          <div className="relative h-48 w-full overflow-hidden bg-beige">
                            <img
                              src={imageUrl}
                              alt={item.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.src = '/assets/fallback.svg';
                              }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />

                            {/* Item Type Badge */}
                            <div className="absolute top-3.5 left-3.5 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-forest-green text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm border border-white/40">
                              <Layers size={11} />
                              <span>{itemType}</span>
                            </div>

                            {/* Rating badge if available */}
                            {item.rating && item.rating > 0 && (
                              <div className="absolute bottom-3.5 left-3.5 bg-white/90 backdrop-blur-sm text-text-dark text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                                <Star size={12} className="fill-earth-brown text-earth-brown" />
                                <span>{item.rating}</span>
                              </div>
                            )}

                            {/* Active Favorite Heart Button */}
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await removeFavorite(itemType, itemId);
                              }}
                              className="absolute top-3.5 right-3.5 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-forest-green hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm z-10"
                              title="Remove from favorites"
                              aria-label="Remove from favorites"
                            >
                              <Heart size={18} className="fill-forest-green text-forest-green" />
                            </button>
                          </div>

                          {/* Card Details */}
                          <div className="p-5 flex flex-col flex-grow justify-between">
                            <div>
                              <Link
                                to={routeUrl}
                                className="block text-base font-bold text-text-dark hover:text-forest-green uppercase tracking-wide leading-tight mb-1 transition-colors font-display"
                              >
                                {item.name}
                              </Link>

                              <div className="flex items-center gap-1 text-muted-text text-xs font-medium mb-2.5">
                                <MapPin size={12} className="text-earth-brown flex-shrink-0" />
                                <span className="truncate">{locationText}</span>
                              </div>

                              <p className="text-muted-text text-xs line-clamp-2 leading-relaxed font-medium mb-4">
                                {item.tagline || item.shortDescription || item.description || 'Explore this authentic Himalayan wonder in Uttarakhand.'}
                              </p>
                            </div>

                            {/* Actions Bar */}
                            <div className="pt-3 border-t border-border-light/60 flex items-center gap-2">
                              <Link
                                to={routeUrl}
                                className="flex-1 py-2 px-3 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors text-center shadow-sm flex items-center justify-center gap-1"
                              >
                                <span>Explore</span>
                                <ExternalLink size={12} />
                              </Link>

                              {/* Add to Trip Planner Button (Available for Destinations & Stays) */}
                              {itemType.toLowerCase() === 'destination' && (
                                <button
                                  onClick={(e) => handleAddToTrip(item, e)}
                                  className={`py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1 border ${
                                    isAddedToTrip
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : 'bg-white hover:bg-beige text-text-dark border-border-light'
                                  }`}
                                  title="Add to current trip plan"
                                >
                                  {isAddedToTrip ? (
                                    <>
                                      <Check size={13} className="text-emerald-600" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <Plus size={13} />
                                      <span>Add to Trip</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Polished Empty State */
                  <div className="text-center py-16 px-4 bg-[#faf9f6] rounded-3xl border border-dashed border-border-light flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center mb-4">
                      <Heart size={30} className="text-forest-green/60" />
                    </div>
                    <h4 className="text-base font-bold text-text-dark mb-1 font-display">
                      No saved favorites yet
                    </h4>
                    <p className="text-xs text-muted-text max-w-sm mb-6 leading-relaxed">
                      Discover the sacred peaks, tranquil lakeside stays, and cultural heritage of Uttarakhand and save them here.
                    </p>
                    <Link
                      to="/"
                      className="px-6 py-2.5 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                    >
                      Explore Destinations
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: SAVED TRIPS ─────────────────────────────────────────── */}
            {activeTab === 'trips' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-border-light/60">
                <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-border-light/60">
                  <div>
                    <h3 className="text-lg font-black text-text-dark uppercase tracking-wide font-display">
                      MY SAVED TRIPS
                    </h3>
                    <p className="text-xs text-muted-text font-medium mt-0.5">
                      Your custom itineraries and route plans for Uttarakhand.
                    </p>
                  </div>
                  <Link
                    to="/trip-planner"
                    className="px-4 py-2 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>New Trip</span>
                  </Link>
                </div>

                {dataLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CardSkeleton />
                    <CardSkeleton />
                  </div>
                ) : trips.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {trips.map((trip) => {
                      const destNames = Array.isArray(trip.destinations)
                        ? trip.destinations.map((d) => d.name || d).filter(Boolean)
                        : [];

                      return (
                        <div
                          key={trip._id}
                          className="bg-white rounded-3xl p-5 border border-border-light/70 card-shadow hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="text-base font-black text-text-dark uppercase tracking-wide font-display">
                                {trip.title || 'Uttarakhand Expedition'}
                              </h4>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-beige text-text-dark border border-border-light uppercase">
                                {destNames.length} stops
                              </span>
                            </div>

                            {/* Route preview */}
                            {destNames.length > 0 ? (
                              <div className="text-xs font-semibold text-forest-green flex items-center flex-wrap gap-1 mb-3">
                                {destNames.slice(0, 3).map((name, i) => (
                                  <React.Fragment key={i}>
                                    {i > 0 && <span className="text-muted-text">→</span>}
                                    <span className="bg-beige/50 px-2 py-0.5 rounded-md border border-border-light">
                                      {name}
                                    </span>
                                  </React.Fragment>
                                ))}
                                {destNames.length > 3 && (
                                  <span className="text-[11px] text-muted-text font-bold">
                                    +{destNames.length - 3} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <p className="text-xs text-muted-text mb-3">Custom saved itinerary</p>
                            )}

                            {trip.notes && (
                              <p className="text-xs text-muted-text italic line-clamp-2 mb-4">
                                "{trip.notes}"
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleOpenSavedTrip(trip)}
                            className="w-full py-2 px-3 bg-forest-green/10 hover:bg-forest-green text-forest-green hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
                          >
                            <Compass size={13} />
                            <span>Open Trip Workspace</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 bg-[#faf9f6] rounded-3xl border border-dashed border-border-light flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center mb-4">
                      <MapIcon size={28} className="text-forest-green/60" />
                    </div>
                    <h4 className="text-base font-bold text-text-dark mb-1 font-display">
                      No saved trips yet
                    </h4>
                    <p className="text-xs text-muted-text max-w-sm mb-6 leading-relaxed">
                      Create custom travel routes across Kumaon and Garhwal with live distance and altitude estimations.
                    </p>
                    <Link
                      to="/trip-planner"
                      className="px-6 py-2.5 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                    >
                      Plan a Trip Now
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: MY BOOKINGS ─────────────────────────────────────────── */}
            {activeTab === 'bookings' && <MyBookings />}

            {/* ── TAB 4: MY REVIEWS ──────────────────────────────────────────── */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-border-light/60">
                <div className="flex items-center justify-between gap-4 mb-6 pb-5 border-b border-border-light/60">
                  <div>
                    <h3 className="text-lg font-black text-text-dark uppercase tracking-wide font-display">
                      MY REVIEWS
                    </h3>
                    <p className="text-xs text-muted-text font-medium mt-0.5">
                      Your feedback and experiences shared with the travel community.
                    </p>
                  </div>
                </div>

                {dataLoading ? (
                  <div className="grid grid-cols-1 gap-4">
                    <CardSkeleton />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((r) => (
                      <div
                        key={r._id}
                        className="p-5 bg-white rounded-2xl border border-border-light/70 card-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base font-bold text-text-dark font-display">
                            {r.target?.name || r.targetName || 'Reviewed Destination'}
                          </h4>
                          <div className="flex items-center gap-1 bg-beige px-2.5 py-1 rounded-full text-xs font-black">
                            <Star size={13} className="fill-earth-brown text-earth-brown" />
                            <span>{r.rating} / 5</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-text leading-relaxed font-medium mb-2">
                          "{r.comment}"
                        </p>
                        {r.createdAt && (
                          <span className="text-[10px] text-muted-text/80 font-bold">
                            {new Date(r.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 bg-[#faf9f6] rounded-3xl border border-dashed border-border-light flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center mb-4">
                      <MessageSquare size={28} className="text-forest-green/60" />
                    </div>
                    <h4 className="text-base font-bold text-text-dark mb-1 font-display">
                      No reviews written yet
                    </h4>
                    <p className="text-xs text-muted-text max-w-sm mb-6 leading-relaxed">
                      Visit destinations and share your authentic tips with fellow Himalayan travelers.
                    </p>
                    <Link
                      to="/"
                      className="px-6 py-2.5 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                    >
                      Browse Places to Review
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Partner Marketplace & Listings Manager */}
            {activeTab === 'partner' && (
              <PartnerListingsManager />
            )}
          </div>
        </div>
      </div>

      {/* ── EDIT PROFILE MODAL ──────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-border-light relative animate-scale-up">
            {/* Close Button */}
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-beige/60 text-muted-text hover:text-text-dark transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-black text-text-dark uppercase tracking-wide font-display mb-1">
              EDIT PROFILE
            </h3>
            <p className="text-xs text-muted-text font-medium mb-6">
              Update your traveler identity and contact information.
            </p>

            {/* Notification Alert */}
            {profileSaveMsg.text && (
              <div
                className={`mb-5 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  profileSaveMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : profileSaveMsg.type === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-beige text-forest-green border border-border-light'
                }`}
              >
                {profileSaveMsg.type === 'success' ? (
                  <CheckCircle size={15} />
                ) : (
                  <AlertCircle size={15} />
                )}
                <span>{profileSaveMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Profile Image Preview & Picker */}
              <div className="flex items-center gap-4 pb-2 border-b border-border-light/60">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-forest-green text-white font-black text-xl flex items-center justify-center shrink-0 border-2 border-beige shadow-sm">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-text-dark mb-1">
                    Profile Photo
                  </label>
                  <label className="inline-block cursor-pointer px-3 py-1.5 bg-beige hover:bg-beige/80 text-forest-green text-xs font-bold rounded-xl border border-border-light transition-colors">
                    <span>Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setProfileSaveMsg({ text: 'Image must be under 5MB', type: 'error' });
                            return;
                          }
                          setSelectedFile(file);
                          setPreviewUrl(URL.createObjectURL(file));
                          setProfileSaveMsg({ text: '', type: '' });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light focus:border-forest-green focus:outline-none text-sm text-text-dark font-medium bg-[#faf9f6]"
                  placeholder="Your Name"
                />
              </div>

              {/* Email (Read only indicator) */}
              <div>
                <label className="block text-xs font-bold text-muted-text uppercase tracking-wider mb-1">
                  Email Address (Account ID)
                </label>
                <input
                  type="email"
                  disabled
                  value={profileForm.email}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light text-sm text-muted-text font-medium bg-gray-100 cursor-not-allowed"
                />
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light focus:border-forest-green focus:outline-none text-sm text-text-dark font-medium bg-[#faf9f6]"
                  placeholder="+91 98765 43210"
                />
              </div>

              {/* Location Field */}
              <div>
                <label className="block text-xs font-bold text-text-dark uppercase tracking-wider mb-1">
                  Home City / State
                </label>
                <input
                  type="text"
                  value={profileForm.location}
                  onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-light focus:border-forest-green focus:outline-none text-sm text-text-dark font-medium bg-[#faf9f6]"
                  placeholder="e.g. Dehradun, Uttarakhand"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-light/60">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSavingProfile}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-muted-text hover:text-text-dark transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-6 py-2.5 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
