import api from './api';

export const getActivities = async () => {
  const response = await api.get('/activities');
  return response.data;
};

export const getActivityBySlug = async (slug) => {
  const response = await api.get(`/activities/${slug}`);
  return response.data;
};

export const createActivity = async (data) => {
  const response = await api.post('/activities', data);
  return response.data;
};

export const updateActivity = async (id, data) => {
  const response = await api.patch(`/activities/${id}`, data);
  return response.data;
};

export const deleteActivity = async (id) => {
  const response = await api.delete(`/activities/${id}`);
  return response.data;
};
