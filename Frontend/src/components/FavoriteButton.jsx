import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

/**
 * Reusable FavoriteButton for cards and item detail pages.
 * Integrates directly with FavoritesContext.
 * 
 * @param {string} itemType - e.g. "destination", "stay", "rental"
 * @param {object} item - The full item object (must contain _id or id and name)
 * @param {string} className - Optional override for button container styles
 * @param {string} iconClassName - Optional override for Heart icon styles
 * @param {number} size - Heart icon size (default 17)
 */
const FavoriteButton = ({ 
  itemType, 
  item, 
  className,
  iconClassName,
  size = 17 
}) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const destId = item?._id || item?.id;
  if (!destId || !itemType) return null;

  const favorited = isFavorite(itemType, destId);

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(itemType, item);
  };

  const defaultBtnClass = "absolute top-3.5 right-3.5 h-9 w-9 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-text-dark hover:bg-white hover:scale-110 transition-all duration-200 z-10 shadow-sm";
  const btnClass = className !== undefined ? className : defaultBtnClass;

  const activeIconClass = "fill-forest-green text-forest-green";
  const baseIconClass = iconClassName || "";
  
  return (
    <button
      onClick={handleFavorite}
      className={btnClass}
      aria-label={`${favorited ? 'Remove' : 'Add'} ${item?.name || 'item'} from favorites`}
      title={`${favorited ? 'Remove from favorites' : 'Add to favorites'}`}
    >
      <Heart
        size={size}
        className={`${baseIconClass} ${favorited ? activeIconClass : ''}`}
      />
    </button>
  );
};

export default FavoriteButton;
