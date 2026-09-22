import api from './api';

export const getMyBookings = async (params = {}) => {
  const response = await api.get('/bookings', { params });
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings', bookingData);
  return response.data;
};

export const cancelBooking = async (id, data = {}) => {
  const response = await api.patch(`/bookings/${id}/cancel`, data);
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`/bookings/${id}`);
  return response.data;
};
