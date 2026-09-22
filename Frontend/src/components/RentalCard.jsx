import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Minus, Plus, Bike, Car } from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import FavoriteButton from './FavoriteButton';
import ImageCarousel from './common/ImageCarousel';
import { getCardImages } from '../utils/imageHelpers';

const RentalCard = ({ rental }) => {
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);
  const { addToCart } = useCart();

  const increment = () => setQuantity(prev => prev + 1);
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  const getFormattedPrice = (price, pricePerDay) => {
    if (!price && !pricePerDay) return null;
    if (typeof price === 'object' && price !== null) {
      if (price.amount !== undefined && price.amount !== null) {
        return typeof price.amount === 'number' ? price.amount.toLocaleString('en-IN') : String(price.amount);
      }
      return null;
    }
    const val = price || pricePerDay;
    if (typeof val === 'number') return val.toLocaleString('en-IN');
    if (typeof val === 'string' && val.trim() !== '') return val;
    return null;
  };

  const formattedPrice = getFormattedPrice(rental.price, rental.pricePerDay);
  const locationText = rental.city 
    ? `${rental.city}${rental.district ? `, ${rental.district}` : ''}`
    : (rental.district || (typeof rental.location === 'string' && rental.location.length < 35 ? rental.location : 'Uttarakhand'));

  const isTwoWheeler = rental.type === 'Scooter' || rental.type === 'Motorcycle' || (rental.category && (rental.category.toLowerCase().includes('bike') || rental.category.toLowerCase().includes('scooter')));

  const images = getCardImages(rental);
  const hasImages = images.length > 0 && !images.includes('/assets/fallback.svg');

  return (
    <div className="bg-white rounded-3xl overflow-hidden card-shadow flex flex-col h-full border border-border-light/50">
      
      {/* Image Container (aspect-ratio ~4:3) with Glider */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-beige group">
        {hasImages ? (
          <>
            <ImageCarousel
              images={images}
              alt={rental.name}
              aspectRatio="aspect-[4/3] w-full"
            />
            {/* Representative photo badge */}
            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white/95 text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm pointer-events-none tracking-wide z-10">
              Representative photo
            </div>
          </>
        ) : (
          /* Clean vehicle-type icon placeholder (no broken image) */
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-beige/60 to-beige text-forest-green p-4 select-none">
            {isTwoWheeler ? (
              <Bike size={44} className="text-forest-green/70 mb-2" strokeWidth={1.5} />
            ) : (
              <Car size={44} className="text-forest-green/70 mb-2" strokeWidth={1.5} />
            )}
            <span className="text-xs font-bold text-text-dark text-center line-clamp-1">{rental.name}</span>
            <span className="text-[10px] text-muted-text font-medium mt-1 uppercase tracking-wider">Photo coming soon</span>
          </div>
        )}
        
        {/* Badges & Icons */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-20 pointer-events-none">
          {rental.badge && (
            <span className="bg-white/90 backdrop-blur-sm text-text-dark text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              {rental.badge}
            </span>
          )}
          {rental.available && (
            <span className="bg-forest-green/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm w-max">
              Available
            </span>
          )}
        </div>
        
        {/* Favorite Button */}
        <div className="absolute top-4 right-4 z-20">
          <FavoriteButton 
            itemType="rental" 
            item={rental} 
            className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-text-dark hover:bg-white transition-colors shadow-sm"
            size={20}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-text-dark mb-1 line-clamp-1">{rental.name}</h3>
        
        <div className="flex items-center justify-between mb-4">
          <p className="text-muted-text text-sm font-medium line-clamp-1" title={locationText}>
            {rental.businessName && rental.businessName !== rental.name ? `${rental.businessName} • ` : ''}{locationText}
          </p>
          {rental.rating && rental.rating > 0 && (
            <div 
              className="flex items-center gap-1 text-earth-brown font-bold text-sm shrink-0 ml-2 cursor-help"
              title={rental.ratingSource ? `Rating: ${rental.rating} (${rental.ratingSource})` : `Rating: ${rental.rating}`}
            >
              <Star size={16} className="fill-earth-brown text-earth-brown" />
              {rental.rating}
              {rental.ratingSource && (
                <span className="text-[10px] text-muted-text font-normal">*</span>
              )}
            </div>
          )}
        </div>
        
        <div className="mb-5">
          {formattedPrice ? (
            <>
              <span className="text-earth-brown text-xl font-bold">₹{formattedPrice}</span>
              <span className="text-muted-text text-sm font-medium ml-1">{rental.unit || '/day'}</span>
            </>
          ) : (
            <span className="text-muted-text text-base font-bold">Price on request</span>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-3">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between bg-beige/50 rounded-full p-1 border border-border-light">
            <button onClick={decrement} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-text-dark shadow-sm hover:bg-forest-green hover:text-white transition-colors">
              <Minus size={18} />
            </button>
            <span className="font-bold text-text-dark">{quantity}</span>
            <button onClick={increment} className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-text-dark shadow-sm hover:bg-forest-green hover:text-white transition-colors">
              <Plus size={18} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => addToCart(rental, quantity)}
              className="flex-1 bg-forest-green text-white text-xs font-bold py-3 rounded-full hover:bg-dark-green transition-colors"
            >
              ADD TO CART
            </button>
            <Link to={`/rentals/${rental.slug}`} className="flex-1 border-2 border-forest-green text-forest-green text-xs font-bold py-2.5 rounded-full hover:bg-forest-green hover:text-white transition-colors text-center block leading-loose">
              VIEW DETAILS
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default RentalCard;
