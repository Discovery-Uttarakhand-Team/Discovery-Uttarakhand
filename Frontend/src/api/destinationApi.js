import api from './api';

export const getDestinations = async () => {
  const response = await api.get('/destinations');
  return response.data;
};

export const getDestinationBySlug = async (slug) => {
  const response = await api.get(`/destinations/${slug}`);
  return response.data;
};

export const getDestinationRelated = async (slug) => {
  const response = await api.get(`/destinations/${slug}/related`);
  return response.data;
};

export const getDestinationExplore = async (slug, params = {}) => {
  const response = await api.get(`/destinations/${slug}/explore`, { params });
  return response.data;
};
export const createDestination = async (data) => {
  const response = await api.post('/destinations', data);
  return response.data;
};

export const updateDestination = async (id, data) => {
  const response = await api.put(`/destinations/${id}`, data);
  return response.data;
};

export const deleteDestination = async (id) => {
  const response = await api.delete(`/destinations/${id}`);
  return response.data;
};
