import api from './api';

export const getGuides = async () => {
  const response = await api.get('/guides');
  return response.data;
};

export const getGuideById = async (id) => {
  const response = await api.get(`/guides/${id}`);
  return response.data;
};
export const createGuide = async (data) => {
  const response = await api.post('/guides', data);
  return response.data;
};

export const updateGuide = async (id, data) => {
  const response = await api.put(`/guides/${id}`, data);
  return response.data;
};

export const deleteGuide = async (id) => {
  const response = await api.delete(`/guides/${id}`);
  return response.data;
};
