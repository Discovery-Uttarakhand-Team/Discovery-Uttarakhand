import express from 'express';
import { 
  getGuides, 
  getGuideBySlug, 
  createGuide, 
  updateGuide, 
  deleteGuide 
} from '../controllers/guideController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getGuides);
router.post('/', protect, adminOnly, createGuide);
router.get('/:slug', getGuideBySlug);
router.patch('/:id', protect, adminOnly, updateGuide);
router.delete('/:id', protect, adminOnly, deleteGuide);

export default router;
