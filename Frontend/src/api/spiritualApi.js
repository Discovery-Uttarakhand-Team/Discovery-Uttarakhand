import api from './api';

export const getSpiritualPlaces = async () => {
  const response = await api.get('/spiritual');
  return response.data;
};

export const getSpiritualBySlug = async (slug) => {
  const response = await api.get(`/spiritual/${slug}`);
  return response.data;
};

export const createSpiritual = async (data) => {
  const response = await api.post('/spiritual', data);
  return response.data;
};

export const updateSpiritual = async (id, data) => {
  const response = await api.patch(`/spiritual/${id}`, data);
  return response.data;
};

export const deleteSpiritual = async (id) => {
  const response = await api.delete(`/spiritual/${id}`);
  return response.data;
};
