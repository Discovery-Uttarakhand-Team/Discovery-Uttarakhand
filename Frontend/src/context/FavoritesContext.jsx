import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getFavorites, toggleFavorite as apiToggleFavorite, removeFavorite as apiRemoveFavorite } from '../api/favoriteApi';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated, currentUser, requireAuth } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to normalize keys
  const getNormalizedKey = (type, id) => {
    if (!type || !id) return null;
    const strId = String(id);
    const normalizedType = type.toLowerCase();
    return `${normalizedType}:${strId}`;
  };

  // Set of normalized keys for instant O(1) checks
  const favoriteKeys = useMemo(() => {
    const keys = new Set();
    favorites.forEach((fav) => {
      const type = fav.itemType || fav.targetType || 'destination';
      let id = null;
      if (fav.item?._id) id = fav.item._id;
      else if (fav.item?.id) id = fav.item.id;
      else if (fav.item && typeof fav.item === 'string') id = fav.item;
      else if (fav.targetId?._id) id = fav.targetId._id;
      else if (fav.targetId && typeof fav.targetId === 'string') id = fav.targetId;
      
      const key = getNormalizedKey(type, id);
      if (key) keys.add(key);
    });
    return keys;
  }, [favorites]);

  const fetchFavorites = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      setFavorites([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getFavorites();
      if (res?.success && Array.isArray(res.data)) {
        // Filter out any invalid items
        const valid = res.data.filter((f) => f && (f.item || f.targetId));
        setFavorites(valid);
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      setError('Unable to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [isAuthenticated, currentUser?._id, fetchFavorites]);

  const isFavorite = useCallback(
    (type, id) => {
      const idStr = typeof id === 'object' ? id._id || id.id : id;
      const key = getNormalizedKey(type, idStr);
      if (!key) return false;
      return favoriteKeys.has(key);
    },
    [favoriteKeys]
  );

  const toggleFavorite = useCallback(
    (type, itemObj) => {
      return new Promise((resolve) => {
        requireAuth(async () => {
          const id = typeof itemObj === 'object' ? itemObj._id || itemObj.id : itemObj;
          if (!id || !type) return resolve({ success: false });

          const strId = String(id);
          const normalizedType = type.toLowerCase();
          const capitalizedType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
          const key = getNormalizedKey(type, strId);
          const alreadyFav = favoriteKeys.has(key);

          // Optimistic update
          if (alreadyFav) {
            setFavorites((prev) =>
              prev.filter((f) => {
                const fType = f.itemType || f.targetType || 'destination';
                const fId = f.item?._id || f.item?.id || f.item || f.targetId?._id || f.targetId;
                return getNormalizedKey(fType, fId) !== key;
              })
            );
          } else {
            const tempFav = {
              _id: 'temp_' + Date.now(),
              itemType: capitalizedType,
              item: typeof itemObj === 'object' ? itemObj : { _id: strId },
              createdAt: new Date().toISOString()
            };
            setFavorites((prev) => [tempFav, ...prev]);
          }

          try {
            const res = await apiToggleFavorite(normalizedType, strId);
            if (res?.success) {
              // Background re-fetch to ensure server IDs and timestamps match
              fetchFavorites();
              resolve({ success: true, action: res.action, isFavorite: res.action === 'added' });
            } else {
              // Rollback
              await fetchFavorites();
              resolve({ success: false });
            }
          } catch (err) {
            console.error('Failed to toggle favorite:', err);
            await fetchFavorites();
            resolve({ success: false, error: err });
          }
        });
      });
    },
    [favoriteKeys, requireAuth, fetchFavorites]
  );

  const removeFavorite = useCallback(
    async (type, itemOrId) => {
      const id = typeof itemOrId === 'object' ? itemOrId._id || itemOrId.id : itemOrId;
      if (!id || !type) return false;

      const strId = String(id);
      const normalizedType = type.toLowerCase();
      const key = getNormalizedKey(type, strId);

      // Optimistic remove
      setFavorites((prev) =>
        prev.filter((f) => {
          const fType = f.itemType || f.targetType || 'destination';
          const fId = f.item?._id || f.item?.id || f.item || f.targetId?._id || f.targetId;
          return getNormalizedKey(fType, fId) !== key;
        })
      );

      try {
        const res = await apiRemoveFavorite(normalizedType, strId);
        if (!res?.success) {
          // If it failed, re-fetch
          await fetchFavorites();
        }
        return true;
      } catch (err) {
        console.error('Failed to remove favorite:', err);
        await fetchFavorites();
        return false;
      }
    },
    [fetchFavorites]
  );

  const value = {
    favorites,
    favoriteKeys,
    favoriteCount: favorites.length,
    loading,
    error,
    isFavorite,
    toggleFavorite,
    removeFavorite,
    refreshFavorites: fetchFavorites
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
