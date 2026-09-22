import express from 'express';
import { 
  getReviews, 
  createReview, 
  getOwnReviews 
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/:targetType/:targetId', getReviews);
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getOwnReviews);

export default router;
