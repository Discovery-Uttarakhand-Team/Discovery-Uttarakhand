import api from './api';

/**
 * Fetch deterministic, trip-context aware recommendations
 * @param {Object} tripContext
 * @param {Array<string>} categories
 */
export const getRecommendations = async (tripContext, categories = ['stays', 'guides', 'activities', 'spiritual']) => {
  try {
    const response = await api.post('/recommendations', {
      tripContext,
      categories
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      success: false,
      data: { stays: [], guides: [], activities: [], spiritual: [] }
    };
  }
};
