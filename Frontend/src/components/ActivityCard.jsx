import React from 'react';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import ImageCarousel from './common/ImageCarousel';
import { getCardImages } from '../utils/imageHelpers';

const ActivityCard = ({ item }) => {
  const images = getCardImages(item, "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80");

  return (
    <Link to={`/activities/${item.slug}`} className="block group h-full">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border-light h-full flex flex-col">
        <div className="aspect-[4/3] overflow-hidden relative">
          <ImageCarousel
            images={images}
            alt={item.name}
            aspectRatio="aspect-[4/3] w-full"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-text-dark z-10">
            {item.category}
          </div>
          <FavoriteButton 
            itemType="activity" 
            item={item} 
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-dark hover:bg-white transition-colors shadow-sm z-10"
          />
        </div>
        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-black text-text-dark mb-2 font-display">{item.name}</h3>
          <p className="text-earth-brown text-sm font-medium mb-3">
            <i className="ri-map-pin-line mr-1"></i>
            {item.district}
          </p>
          <p className="text-muted-text text-sm line-clamp-2 mb-4 flex-grow">
            {item.description}
          </p>
          <div className="mt-auto">
             <span className="text-forest-green text-xs font-bold px-4 py-2 rounded-full border border-forest-green group-hover:bg-forest-green group-hover:text-white transition-colors block text-center uppercase">
                View Activity
             </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ActivityCard;
