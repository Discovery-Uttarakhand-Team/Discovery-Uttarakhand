import express from 'express';
import RecommendationEngine from '../services/recommendationService.js';

const router = express.Router();

/**
 * @route   POST /api/recommendations
 * @desc    Generate deterministic, trip-context aware recommendations
 * @access  Public
 */
router.post('/', async (req, res) => {
  try {
    const { tripContext, categories } = req.body;

    if (!tripContext) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tripContext containing at least dayNumber and location information'
      });
    }

    const requestedCats = Array.isArray(categories) && categories.length > 0
      ? categories
      : ['stays', 'guides', 'activities', 'spiritual'];

    const recommendations = await RecommendationEngine.getRecommendations(tripContext, requestedCats);

    res.status(200).json({
      success: true,
      count: Object.keys(recommendations).reduce((acc, cat) => acc + (recommendations[cat]?.length || 0), 0),
      data: recommendations,
      meta: {
        timestamp: new Date().toISOString(),
        freshness: 'STATIC_VERIFIED',
        scoringEngine: 'RecommendationEngine V2 (Deterministic Multi-Factor)'
      }
    });
  } catch (error) {
    console.error('Recommendation Engine Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message
    });
  }
});

export default router;
