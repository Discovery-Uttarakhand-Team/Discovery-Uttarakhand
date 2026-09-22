import api from './api';

export const getFavorites = async () => {
  const response = await api.get('/favorites');
  return response.data;
};

export const addFavorite = async (itemType, item) => {
  const response = await api.post('/favorites', { itemType, item });
  return response.data;
};

export const removeFavorite = async (itemType, item) => {
  const response = await api.delete(`/favorites/${itemType}/${item}`);
  return response.data;
};

export const toggleFavorite = async (itemType, item) => {
  const response = await api.post(`/favorites/${itemType}/${item}/toggle`);
  return response.data;
};
