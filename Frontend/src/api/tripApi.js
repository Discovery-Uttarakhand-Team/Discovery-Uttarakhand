import api from './api';

export const getTrips = async () => {
  const response = await api.get('/trips');
  return response.data;
};

export const getTripById = async (id) => {
  const response = await api.get(`/trips/${id}`);
  return response.data;
};

export const createTrip = async (data) => {
  const response = await api.post('/trips', data);
  return response.data;
};

export const updateTrip = async (id, data) => {
  const response = await api.patch(`/trips/${id}`, data);
  return response.data;
};

export const deleteTrip = async (id) => {
  const response = await api.delete(`/trips/${id}`);
  return response.data;
};
