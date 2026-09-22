import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MapPin, Calendar, Users, Mountain, Sparkles, Compass, CloudSun, DollarSign, BedDouble, ShieldCheck } from 'lucide-react';
import api from '../../api/api';
import useChatStore from '../../store/chatStore';

export default function TripContextPanel({ tripId, isOpen, onClose }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { sendMessage, activeChat, sending } = useChatStore();

  useEffect(() => {
    if (tripId) {
      setLoading(true);
      api.get(`/trips/${tripId}`)
        .then(res => setTrip(res.data.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setTrip(null);
    }
  }, [tripId]);

  // Extract latest live context and cards from conversation
  const latestAssistantMsg = (activeChat?.messages || []).slice().reverse().find(
    m => m && m.role === 'assistant' && (m.metadata?.structuredCards || m.metadata?.tripContext)
  );
  const liveCards = latestAssistantMsg?.metadata?.structuredCards || {};
  const liveRoute = liveCards.route;
  const liveWeather = liveCards.weather;
  const liveBudget = liveCards.budget;
  const liveStays = liveCards.stays;

  const hasLiveContext = liveRoute || liveWeather || liveBudget || (liveStays && liveStays.length > 0);

  const handleQuickAction = (text) => {
    if (sending) return;
    sendMessage(activeChat?._id, text, tripId);
  };

  return (
    <div className={`copilot-context-panel ${isOpen ? 'open' : ''}`}>
      <div className="context-header flex items-center justify-between p-4 border-b border-border-light">
        <h3 className="font-bold text-sm text-text-dark font-display flex items-center gap-1.5">
          <Mountain size={16} className="text-emerald-700" />
          <span>Trip Workspace</span>
        </h3>
        {onClose && (
          <button 
            className="lg:hidden p-1.5 rounded-lg text-muted-text hover:text-text-dark hover:bg-black/5 transition-colors flex items-center justify-center" 
            onClick={onClose}
            aria-label="Close context"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="context-loading p-6 text-xs text-muted-text text-center">
          Loading trip data...
        </div>
      ) : trip ? (
        <div className="trip-summary-card p-4 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-green/10 text-forest-green flex items-center justify-center mx-auto">
            <Mountain size={24} />
          </div>
          <h4 className="font-bold text-sm text-text-dark text-center font-display">
            {trip.title || trip.name || 'Uttarakhand Trip'}
          </h4>
          <div className="trip-meta text-xs text-muted-text space-y-1.5 bg-[#faf9f6] p-3 rounded-xl border border-border-light">
             <div className="flex items-center gap-1.5 text-text-dark">
               <MapPin size={13} className="text-forest-green flex-shrink-0" />
               <span className="truncate">{trip.destinations?.map(d => d.name).join(', ') || trip.destination?.name || 'Uttarakhand'}</span>
             </div>
             <div className="flex items-center gap-1.5 text-text-dark">
               <Calendar size={13} className="text-forest-green flex-shrink-0" />
               <span>{trip.duration || trip.days?.length || '?'} Days</span>
             </div>
             <div className="flex items-center gap-1.5 text-text-dark">
               <Users size={13} className="text-forest-green flex-shrink-0" />
               <span>{trip.travelers || '2 Adults'}</span>
             </div>
          </div>
          
          <div className="quick-actions-section pt-2">
            <h4 className="text-[11px] font-bold text-muted-text uppercase tracking-wider mb-2">
              Quick Inquiries
            </h4>
            <div className="quick-action-btns space-y-1.5">
              <button 
                className="w-full text-left p-2.5 text-xs font-semibold bg-[#faf9f6] hover:bg-beige text-text-dark rounded-xl border border-border-light transition-colors flex items-center gap-2"
                onClick={() => handleQuickAction("Optimize my trip budget")} 
                disabled={sending}
              >
                <Sparkles size={13} className="text-forest-green" />
                <span>Optimize my budget</span>
              </button>
              <button 
                className="w-full text-left p-2.5 text-xs font-semibold bg-[#faf9f6] hover:bg-beige text-text-dark rounded-xl border border-border-light transition-colors flex items-center gap-2"
                onClick={() => handleQuickAction("Check the route for my current trip")} 
                disabled={sending}
              >
                <Compass size={13} className="text-forest-green" />
                <span>Check my route</span>
              </button>
            </div>
          </div>
        </div>
      ) : hasLiveContext ? (
        <div className="live-context-card p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Live Trip Context
            </span>
            <span className="text-[11px] text-muted-text flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" /> Grounded
            </span>
          </div>

          {liveRoute && (
            <div className="p-3 bg-[#faf9f6] rounded-xl border border-border-light text-xs space-y-1">
              <div className="font-bold text-text-dark flex items-center gap-1.5">
                <Compass size={14} className="text-emerald-700" />
                <span>{liveRoute.origin || 'Origin'} → {liveRoute.destination || 'Destination'}</span>
              </div>
              <div className="text-muted-text flex items-center gap-2">
                <span>{liveRoute.estimatedDistanceKm ? `${liveRoute.estimatedDistanceKm} km` : ''}</span>
                {liveRoute.estimatedDurationHours && <span>• ~{liveRoute.estimatedDurationHours} hrs drive</span>}
              </div>
              {liveRoute.corridor && (
                <div className="text-[11px] text-slate-600 mt-1">{liveRoute.corridor}</div>
              )}
            </div>
          )}

          {liveWeather && (
            <div className="p-3 bg-[#faf9f6] rounded-xl border border-border-light text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudSun size={18} className="text-amber-500" />
                <div>
                  <div className="font-bold text-text-dark">{liveWeather.condition || 'Mountain Weather'}</div>
                  <div className="text-[11px] text-muted-text">Wind: {liveWeather.windSpeedKmh || 5} km/h</div>
                </div>
              </div>
              <div className="text-base font-bold text-emerald-800">
                {liveWeather.temperatureC != null ? `${liveWeather.temperatureC}°C` : ''}
              </div>
            </div>
          )}

          {liveBudget && (
            <div className="p-3 bg-[#faf9f6] rounded-xl border border-border-light text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-dark flex items-center gap-1">
                  <DollarSign size={13} className="text-emerald-700" /> Budget Breakdown
                </span>
                <span className="font-bold text-emerald-800">
                  ₹{Number(liveBudget.totalEstimatedCost || 0).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-text">
                <div>Stay: ₹{Number(liveBudget.breakdown?.accommodation || 0).toLocaleString()}</div>
                <div>Transit: ₹{Number(liveBudget.breakdown?.transport || 0).toLocaleString()}</div>
                <div>Food: ₹{Number(liveBudget.breakdown?.food || 0).toLocaleString()}</div>
                <div>Buffer: ₹{Number(liveBudget.breakdown?.activitiesAndBuffer || 0).toLocaleString()}</div>
              </div>
            </div>
          )}

          {liveStays && liveStays.length > 0 && (
            <div className="p-3 bg-[#faf9f6] rounded-xl border border-border-light text-xs space-y-1.5">
              <div className="font-bold text-text-dark flex items-center gap-1">
                <BedDouble size={13} className="text-emerald-700" /> Verified Stays ({liveStays.length})
              </div>
              <div className="space-y-1">
                {liveStays.slice(0, 3).map((st, sIdx) => (
                  <div key={sIdx} className="text-[11px] text-slate-700 truncate">
                    • {st.name || st.title} {st.pricePerNight ? `(₹${st.pricePerNight})` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="quick-actions-section pt-1">
            <h4 className="text-[11px] font-bold text-muted-text uppercase tracking-wider mb-2">
              Conversational Actions
            </h4>
            <div className="quick-action-btns space-y-1.5">
              <button 
                className="w-full text-left p-2.5 text-xs font-semibold bg-[#faf9f6] hover:bg-beige text-text-dark rounded-xl border border-border-light transition-colors flex items-center gap-2"
                onClick={() => handleQuickAction("What are the road conditions and daylight driving safety?")} 
                disabled={sending}
              >
                <ShieldCheck size={13} className="text-emerald-700" />
                <span>Road safety advisory</span>
              </button>
              <button 
                className="w-full text-left p-2.5 text-xs font-semibold bg-[#faf9f6] hover:bg-beige text-text-dark rounded-xl border border-border-light transition-colors flex items-center gap-2"
                onClick={() => handleQuickAction("Show verified local activities and sacred spots")} 
                disabled={sending}
              >
                <Sparkles size={13} className="text-emerald-700" />
                <span>Explore activities</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-trip-context p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-green/10 text-forest-green flex items-center justify-center mx-auto">
            <Mountain size={24} />
          </div>
          <p className="font-bold text-sm text-text-dark">
            Trip Workspace
          </p>
          <p className="text-xs text-muted-text leading-relaxed">
            Mention any Uttarakhand destination in chat to see live route, stays, weather, and budget metrics here.
          </p>
          <button 
            className="w-full bg-forest-green hover:bg-dark-green text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-2xs"
            onClick={() => handleQuickAction("I want to explore Chopta and Tungnath")}
          >
            Start Exploring
          </button>
        </div>
      )}
    </div>
  );
}
