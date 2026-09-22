import api from './api';

export const createOrder = async (bookingId) => {
  const response = await api.post('/payments/create-order', { bookingId });
  return response.data;
};

export const verifyPayment = async (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const response = await api.post('/payments/verify', {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  });
  return response.data;
};

export const getPaymentStatus = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/status`);
  return response.data;
};
