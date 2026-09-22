import api from './api';

export const getCulturePlaces = async () => {
  const response = await api.get('/culture');
  return response.data;
};

export const getCultureBySlug = async (slug) => {
  const response = await api.get(`/culture/${slug}`);
  return response.data;
};

export const createCulture = async (data) => {
  const response = await api.post('/culture', data);
  return response.data;
};

export const updateCulture = async (id, data) => {
  const response = await api.patch(`/culture/${id}`, data);
  return response.data;
};

export const deleteCulture = async (id) => {
  const response = await api.delete(`/culture/${id}`);
  return response.data;
};
