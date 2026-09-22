import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import ImageCarousel from './common/ImageCarousel';
import { getCardImages } from '../utils/imageHelpers';

const CultureCard = ({ item }) => {
  const images = getCardImages(item);
  const locationText = item.district ? `${item.district}${item.region ? `, ${item.region}` : ''}` : 'Uttarakhand';

  return (
    <Link 
      to={`/culture/${item.slug}`} 
      className="bg-white rounded-3xl overflow-hidden card-shadow group border border-border-light/50 flex flex-col h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block text-left"
    >
      {/* Image */}
      <div className="relative h-60 w-full overflow-hidden bg-beige">
        <ImageCarousel 
          images={images} 
          alt={item.name} 
          aspectRatio="h-60 w-full"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-text-dark text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10">
          {item.category || 'Cultural Heritage'}
        </div>
        
        {/* Favorite */}
        <FavoriteButton 
          itemType="culture" 
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

        {item.shortDescription || item.description ? (
          <p className="text-sm font-medium text-muted-text mb-4 line-clamp-2 leading-relaxed">
            {item.shortDescription || item.description}
          </p>
        ) : null}
        
        <div className="mt-auto pt-4 w-full">
          <span className="bg-forest-green text-white text-xs font-bold py-3 rounded-full group-hover:bg-dark-green transition-colors tracking-wider uppercase text-center block">
            Discover Heritage →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CultureCard;
