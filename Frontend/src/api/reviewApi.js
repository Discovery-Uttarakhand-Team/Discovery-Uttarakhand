import api from './api';

export const getReviewsForTarget = async (targetType, targetId) => {
  const response = await api.get(`/reviews/${targetType}/${targetId}`);
  return response.data;
};

export const createReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export const getMyReviews = async () => {
  const response = await api.get('/reviews/my-reviews');
  return response.data;
};
