import React from 'react';
import { Heart, Star, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import FavoriteButton from './FavoriteButton';
import ImageCarousel from './common/ImageCarousel';
import { getCardImages } from '../utils/imageHelpers';

/**
 * DestinationCard — refined for better information hierarchy with auto image glider.
 */
const DestinationCard = ({ destination, distance }) => {
  // ── Location metadata — only renders when real values exist ────────────────
  const locationParts = [destination.district, destination.region].filter(Boolean);
  const locationLabel = locationParts.length > 0 ? locationParts.join(' • ') : null;

  // ── Image extraction (covers + gallery) ───────────────────────────────────
  const images = getCardImages(destination);

  return (
    <Link
      to={`/destinations/${destination.slug}`}
      className="bg-white rounded-3xl overflow-hidden card-shadow group flex flex-col h-full border border-border-light/50 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 block text-left"
    >
      {/* Image Container with Glider */}
      <div className="relative h-56 w-full overflow-hidden bg-beige">
        <ImageCarousel
          images={images}
          alt={destination.name || 'Destination'}
          aspectRatio="h-56 w-full"
        />

        {/* Favorite Button Overlay */}
        <div className="absolute top-3 right-3 z-20">
          <FavoriteButton itemType="destination" item={destination} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Destination name */}
          <h3 className="text-base font-bold text-text-dark mb-0.5 uppercase tracking-wide leading-tight">
            {destination.name}
          </h3>

          {/* District • Region — only if values exist */}
          {locationLabel && (
            <div className="flex items-center gap-1 text-muted-text text-xs font-medium mb-2.5">
              <MapPin size={11} strokeWidth={2} className="text-earth-brown flex-shrink-0" />
              <span>{locationLabel}</span>
            </div>
          )}

          {/* Tagline / short description */}
          <p className="text-muted-text text-sm font-medium line-clamp-2 leading-relaxed">
            {destination.tagline || destination.shortDescription || destination.district || ''}
          </p>

          {/* Distance badge if provided */}
          {distance && (
            <p className="text-earth-brown text-xs font-bold flex items-center gap-1 mt-2">
              <MapPin size={11} strokeWidth={2} />
              {distance.toFixed(1)} km away
            </p>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-4">
          {/* Rating — only when real rating > 0 */}
          {destination.rating && destination.rating > 0 ? (
            <div className="flex items-center gap-1 text-earth-brown font-bold text-xs">
              <Star size={13} className="fill-earth-brown text-earth-brown" />
              <span>{destination.rating}</span>
            </div>
          ) : (
            <div /> /* spacer to keep Explore btn right-aligned */
          )}

          <span className="bg-forest-green text-white text-xs font-bold px-4 py-2 rounded-full group-hover:bg-dark-green transition-colors uppercase tracking-wider">
            Explore →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default DestinationCard;
