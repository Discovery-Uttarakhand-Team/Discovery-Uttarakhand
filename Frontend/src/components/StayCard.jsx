import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Wifi, Car, Coffee, Mountain, Eye } from 'lucide-react';
import FavoriteButton from './FavoriteButton';

import ImageCarousel from './common/ImageCarousel';
import { getCardImages } from '../utils/imageHelpers';

const amenityIcons = {
  'Wifi': Wifi,
  'Parking': Car,
  'Breakfast': Coffee,
  'Mountain View': Mountain,
  'Pool': Eye
};

const StayCard = ({ stay }) => {
  const getFormattedPrice = (price, pricePerNight) => {
    if (!price && !pricePerNight) return null;
    if (typeof price === 'object' && price !== null) {
      if (price.amount !== undefined && price.amount !== null) {
        return typeof price.amount === 'number' ? price.amount.toLocaleString('en-IN') : String(price.amount);
      }
      return null;
    }
    const val = price || pricePerNight;
    if (typeof val === 'number') return val.toLocaleString('en-IN');
    if (typeof val === 'string' && val.trim() !== '') return val;
    return null;
  };

  const formattedPrice = getFormattedPrice(stay.price, stay.pricePerNight);
  const locationText = typeof stay.location === 'string' 
    ? stay.location 
    : (stay.city ? `${stay.city}${stay.district ? `, ${stay.district}` : ''}` : (stay.district || 'Uttarakhand'));

  const images = getCardImages(stay, (stay.isGovt || stay.name?.includes('KMVN')) ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg');

  return (
    <div className="bg-white rounded-[2rem] overflow-hidden card-shadow group border border-border-light/50 hover:border-beige transition-colors h-full flex flex-col">
      
      {/* Image Container with Glider */}
      <div className="relative h-64 w-full overflow-hidden bg-beige">
        <ImageCarousel
          images={images}
          alt={stay.name}
          aspectRatio="h-64 w-full"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-20 pointer-events-none">
          {(stay.isGovt || stay.name?.includes('KMVN') || stay.category?.includes('Government')) && (
            <span className="bg-forest-green text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 border border-white/20">
              ✓ Govt. TRH
            </span>
          )}
          {stay.rating && stay.rating > 0 && (
            <div className="bg-white/90 backdrop-blur-sm text-text-dark text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
              <Star size={14} className="fill-earth-brown text-earth-brown" />
              {stay.rating}
            </div>
          )}
        </div>
        
        {/* Favorite Button */}
        <div className="absolute top-4 right-4 z-20">
          <FavoriteButton 
            itemType="stay" 
            item={stay} 
            className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-dark hover:bg-white transition-colors shadow-sm"
            size={20}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-text-dark mb-1">{stay.name}</h3>
        
        <div className="flex flex-wrap items-center gap-1.5 text-muted-text text-sm font-medium mb-4">
          <span>📍</span> <span>{locationText}</span>
          {stay.locationSource && stay.locationSource.startsWith('APPROXIMATE') && (
            <span 
              className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/80 rounded px-1.5 py-0.5 font-medium ml-1"
              title="Location approximate — town/village centre"
            >
              Location approximate — town/village centre
            </span>
          )}
        </div>

        {/* Amenities / Facilities */}
        {((stay.facilities && stay.facilities.length > 0) || (stay.amenities && stay.amenities.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {((stay.facilities && stay.facilities.length > 0) ? stay.facilities : stay.amenities).slice(0, 4).map(amenity => {
              const Icon = amenityIcons[amenity];
              return Icon ? (
                <div key={amenity} className="text-muted-text bg-beige p-2 rounded-full" title={amenity}>
                  <Icon size={16} />
                </div>
              ) : (
                <span key={amenity} className="text-muted-text bg-beige px-2.5 py-1 rounded-full text-xs font-semibold">{amenity}</span>
              );
            })}
          </div>
        )}
        
        <div className="mb-6">
          {formattedPrice ? (
            <>
              <span className="text-earth-brown text-2xl font-bold">₹{formattedPrice}</span>
              <span className="text-muted-text text-sm font-medium ml-1">{stay.unit || '/night'}</span>
            </>
          ) : (
            <span className="text-muted-text text-base font-bold">Price on request</span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2">
          <button className="flex-1 bg-forest-green text-white text-xs font-bold py-3 rounded-full hover:bg-dark-green transition-colors tracking-wide">
            RESERVE
          </button>
          <Link to={`/stays/${stay.slug}`} className="flex-1 border-2 border-forest-green text-forest-green text-xs font-bold py-2.5 rounded-full hover:bg-forest-green hover:text-white transition-colors tracking-wide text-center block leading-loose">
            VIEW DETAILS
          </Link>
        </div>
      </div>
      
    </div>
  );
};

export default StayCard;
