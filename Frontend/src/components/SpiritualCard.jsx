import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import ImageCarousel from './common/ImageCarousel';
import { getCardImages } from '../utils/imageHelpers';

const SpiritualCard = ({ item }) => {
  const images = getCardImages(item);

  const tags = Array.isArray(item.experiences) && item.experiences.length > 0 
    ? item.experiences 
    : Array.isArray(item.highlights) && item.highlights.length > 0
    ? item.highlights
    : Array.isArray(item.tags) ? item.tags : [];

  const locationText = item.district ? `${item.district}${item.region ? `, ${item.region}` : ''}` : 'Uttarakhand';

  return (
    <Link 
      to={`/spiritual/${item.slug}`} 
      className="bg-white rounded-3xl overflow-hidden card-shadow flex flex-col h-full border border-border-light/50 block text-left group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image Container */}
      <div className="relative h-64 w-full overflow-hidden bg-beige group">
        <ImageCarousel 
          images={images} 
          alt={item.name} 
          aspectRatio="h-64 w-full"
        />
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4 bg-forest-green/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm z-10">
          {item.category || item.label || 'Spiritual Shrine'}
        </div>
        
        {/* Favorite */}
        <FavoriteButton 
          itemType="spiritual" 
          item={item} 
          className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-text-dark hover:bg-white transition-colors shadow-sm z-10"
          size={20}
        />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-text-dark mb-1 font-display group-hover:text-forest-green transition-colors">
          {item.name}
        </h3>
        
        <div className="flex items-center gap-1 text-muted-text text-xs font-medium mb-3">
          <MapPin size={12} className="text-earth-brown" />
          <span>{locationText}</span>
        </div>

        <p className="text-sm font-medium text-muted-text mb-4 line-clamp-2 leading-relaxed">
          {item.shortDescription || item.description || 'Sacred pilgrimage site nestled in the Himalayas.'}
        </p>
        
        <div className="text-muted-text text-xs mb-4 space-y-1 mt-auto">
          {item.elevation && <p className="font-semibold text-text-dark">Elevation: {item.elevation}m</p>}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="bg-beige/60 text-text-dark text-[10px] font-bold px-2 py-0.5 rounded-full border border-border-light">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {item.bestTimeToVisit && (
            <p className="mt-2 text-[11px] font-medium text-earth-brown">
              Best Time: {item.bestTimeToVisit}
            </p>
          )}
        </div>

        <div className="mt-auto pt-2">
          <span className="bg-forest-green text-center text-white text-xs font-bold py-3 rounded-full group-hover:bg-dark-green transition-colors tracking-wide block uppercase">
            Explore Sacred Site →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default SpiritualCard;
