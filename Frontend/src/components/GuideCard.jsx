import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ShieldCheck, Star } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

const GuideCard = ({ guide }) => {
  const navigate = useNavigate();

  const initials = guide.name
    ? guide.name.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
    : 'G';

  const specialties = Array.isArray(guide.specialties) && guide.specialties.length > 0
    ? guide.specialties
    : guide.speciality ? [guide.speciality] : [];

  const locationText = Array.isArray(guide.districts) && guide.districts.length > 0
    ? (guide.districts.length > 2 ? `${guide.districts[0]}, ${guide.districts[1]} +${guide.districts.length - 2}` : guide.districts.join(', '))
    : (guide.location || guide.district || 'Uttarakhand');

  return (
    <div className="bg-white rounded-3xl p-5 flex flex-col justify-between card-shadow border border-border-light hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative">
      <div>
        {/* Favorite */}
        <FavoriteButton 
          itemType="guide" 
          item={guide} 
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-beige flex items-center justify-center text-text-dark hover:bg-white transition-colors shadow-sm"
          size={16}
        />
        
        {/* Top Profile Header */}
        <div className="flex gap-4 items-start mb-4 pr-6">
          {guide.profileImage ? (
            <img 
              src={guide.profileImage?.url || guide.profileImage} 
              alt={guide.name}
              className="w-16 h-16 object-cover rounded-2xl bg-beige shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-green to-dark-green text-white font-black text-xl flex items-center justify-center shrink-0 shadow-sm">
              {initials}
            </div>
          )}
          
          <div className="flex flex-col min-w-0">
            <span className="flex items-center gap-1 text-[10px] font-bold text-forest-green uppercase tracking-wider mb-0.5">
              <ShieldCheck size={12} /> Govt. Verified
            </span>
            <h3 className="text-base font-black text-text-dark leading-tight truncate m-0 font-display">
              {guide.name}
            </h3>
            <p className="text-muted-text font-medium text-xs mt-0.5 truncate">
              {locationText}
            </p>
            {guide.experience && (
              <p className="text-muted-text text-[11px] mt-0.5">
                {guide.experience} experience
              </p>
            )}
          </div>
        </div>

        {/* Specialties Chips */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {specialties.slice(0, 3).map((spec, idx) => (
              <span key={idx} className="bg-beige/60 text-text-dark text-[11px] font-bold px-2.5 py-1 rounded-full border border-border-light">
                {spec}
              </span>
            ))}
            {specialties.length > 3 && (
              <span className="text-[10px] font-bold text-muted-text px-1 self-center">
                +{specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Languages */}
        {Array.isArray(guide.languages) && guide.languages.length > 0 && (
          <p className="text-xs text-muted-text mb-3">
            <span className="font-bold text-text-dark">Languages:</span> {guide.languages.join(', ')}
          </p>
        )}

        {/* Phone call link */}
        {guide.phone && (
          <a
            href={`tel:${guide.phone}`}
            className="flex items-center gap-2 text-xs font-bold text-earth-brown bg-[#faf9f6] p-2 rounded-xl border border-border-light mb-4 hover:border-earth-brown transition-colors"
          >
            <Phone size={13} />
            <span>Call: {guide.phone}</span>
          </a>
        )}
      </div>
      
      {/* View Profile Button */}
      <button 
        onClick={() => navigate(`/guides/${guide.slug}`)}
        className="w-full bg-forest-green hover:bg-dark-green text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors uppercase tracking-wider"
      >
        VIEW PROFILE
      </button>
    </div>
  );
};

export default GuideCard;
