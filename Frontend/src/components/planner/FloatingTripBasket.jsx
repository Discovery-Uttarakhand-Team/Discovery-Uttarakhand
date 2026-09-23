import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapStore } from '../../store/mapStore';
import { ShoppingBag, ArrowRight } from 'lucide-react';

const FloatingTripBasket = () => {
  const navigate = useNavigate();
  const tripDestinations = useMapStore((state) => state.tripDestinations);
  
  if (!tripDestinations || tripDestinations.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-in-up">
      <div className="bg-forest-green text-white rounded-full shadow-2xl pl-5 pr-2 py-2 flex items-center gap-4 border border-white/20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} />
          <span className="font-bold text-sm tracking-wide">
            {tripDestinations.length} item{tripDestinations.length !== 1 ? 's' : ''} in Trip
          </span>
        </div>
        <button
          onClick={() => navigate('/trip-planner')}
          className="bg-white text-forest-green px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 hover:bg-beige transition-colors"
        >
          Build Trip <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default FloatingTripBasket;
