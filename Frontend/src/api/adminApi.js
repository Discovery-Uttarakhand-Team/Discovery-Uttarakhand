import api from './api';

export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// Generic CRUD operations
export const fetchItems = async (type) => {
  const response = await api.get(`/${type}`);
  return response.data;
};

export const createItem = async (type, data) => {
  const response = await api.post(`/${type}`, data);
  return response.data;
};

export const updateItem = async (type, id, data) => {
  const response = await api.patch(`/${type}/${id}`, data);
  return response.data;
};

export const deleteItem = async (type, id) => {
  const response = await api.delete(`/${type}/${id}`);
  return response.data;
};

// Bookings
export const getAllBookings = async () => {
  const response = await api.get('/admin/bookings');
  return response.data;
};

export const updateBookingStatus = async (id, statusData) => {
  const response = await api.patch(`/admin/bookings/${id}/status`, statusData);
  return response.data;
};

// Reviews
export const getAllReviewsAdmin = async () => {
  const response = await api.get('/admin/reviews');
  return response.data;
};

export const updateReviewStatusAdmin = async (id, status) => {
  const response = await api.patch(`/admin/reviews/${id}/status`, { status });
  return response.data;
};

export const deleteReviewAdmin = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

// Images
export const uploadAdminImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteAdminImage = async (publicId) => {
  const response = await api.delete(`/upload/${encodeURIComponent(publicId)}`);
  return response.data;
};
