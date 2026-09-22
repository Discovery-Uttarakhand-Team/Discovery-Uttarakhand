import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Mountain, ShieldCheck, Sparkles, Lock, ArrowRight, 
  Compass, Building2, AlertTriangle, ShieldAlert, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, partnerOnly = false }) => {
  const { 
    isAuthenticated, 
    isLoading, 
    currentUser, 
    setAuthModalOpen, 
    openPartnerAuth 
  } = useAuth();
  const location = useLocation();

  const isCopilot = location.pathname.startsWith('/copilot');

  // Automatically prompt auth modal when directly landing on a protected page
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (partnerOnly) {
        openPartnerAuth();
      } else {
        setAuthModalOpen(true);
      }
    }
  }, [isLoading, isAuthenticated, partnerOnly]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-forest-green/5 text-forest-green">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-forest-green/10 animate-ping absolute" />
          <div className="w-12 h-12 rounded-2xl bg-forest-green flex items-center justify-center text-white shadow-lg">
            <Mountain size={24} className="animate-pulse" />
          </div>
        </div>
        <p className="text-sm font-semibold tracking-wide text-forest-green/80">
          Connecting to Devbhoomi Network...
        </p>
      </div>
    );
  }

  // Case 1: Unauthenticated user trying to access partner portal
  if (!isAuthenticated && partnerOnly) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(26, 67, 49, 0.92) 100%), url('/assets/badrinath.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 dark:border-slate-800 text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center shadow-lg shadow-amber-700/20">
            <Building2 size={32} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck size={13} />
            <span>Verified Partner Network</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-dark dark:text-white tracking-tight mb-3">
            Partner Business Portal
          </h1>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
            Sign in to manage your homestay listings, vehicle fleet bookings, trek operations, and direct traveler payouts.
          </p>

          <div className="space-y-3">
            <button
              onClick={openPartnerAuth}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white font-bold text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              <span>Partner Sign In / Register</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/"
              className="inline-block text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pt-2 transition-colors"
            >
              ← Return to Traveler Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Unauthenticated user trying to access general protected route (e.g. Copilot, Profile)
  if (!isAuthenticated) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(10, 25, 20, 0.85) 0%, rgba(18, 42, 31, 0.94) 100%), url('/assets/kedarnath.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-xl h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 dark:border-slate-800 text-center animate-fadeIn">
          {/* Emblem */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-tr from-forest-green to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-900/30">
            {isCopilot ? <Sparkles size={30} className="text-amber-300" /> : <Lock size={28} />}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-forest-green dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Compass size={13} />
            <span>{isCopilot ? 'AI Travel Copilot Gate' : 'Devbhoomi Member Access'}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-text-dark dark:text-white tracking-tight mb-3">
            {isCopilot ? 'Experience Devbhoomi Copilot' : 'Sign In to Continue'}
          </h1>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto mb-6">
            {isCopilot
              ? 'Connect your free account to unlock conversational trip planning, multi-day itinerary saving, weather corridors, and instant stay reservations.'
              : 'Sign in to access your personal travel bookmarks, booking vouchers, and verified itinerary history.'}
          </p>

          {/* Value Checklist */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 mb-6 text-left text-xs space-y-2.5 border border-slate-200/70 dark:border-slate-700/60">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Real-time Char Dham & Alpine trail road status</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Persistent AI chat memory synced across your devices</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
              <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Direct bookings with zero mediator commissions</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-forest-green to-emerald-800 hover:from-dark-green hover:to-forest-green text-white font-bold text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-[0.99]"
            >
              <span>Sign In / Create Account</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/"
              className="inline-block text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pt-2 transition-colors"
            >
              ← Explore Uttarakhand as Guest
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Admin route restricted
  if (adminOnly && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-cream/50 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-red-200 dark:border-red-900/60 text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-600 flex items-center justify-center">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">403 Access Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            You do not possess administrative clearance to access the Uttarakhand central command console.
          </p>
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold">
            <span>Return to Home</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Case 4: Partner route accessed by non-partner
  if (partnerOnly && currentUser?.role !== 'partner' && currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-cream/50 dark:bg-slate-950">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-amber-200 dark:border-amber-900/60 text-center animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 flex items-center justify-center">
            <Building2 size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Partner Portal Restricted</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            This management workspace is designated for registered homestay hosts, fleet operators, and certified mountain guides in Uttarakhand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/profile" className="w-full sm:w-auto btn-primary px-6 py-2.5 rounded-full text-sm font-semibold">
              View Traveler Profile
            </Link>
            <button
              onClick={openPartnerAuth}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full text-sm font-semibold border border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
            >
              Switch / Register as Partner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;

