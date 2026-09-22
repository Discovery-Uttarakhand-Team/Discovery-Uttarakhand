import express from 'express';
import { 
  getSpiritualPlaces, 
  getSpiritualBySlug, 
  createSpiritual, 
  updateSpiritual, 
  deleteSpiritual 
} from '../controllers/spiritualController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import Spiritual from '../models/Spiritual.js';
import { getRelatedBySlug } from '../controllers/relatedController.js';

const router = express.Router();

router.get('/', getSpiritualPlaces);
router.post('/', protect, adminOnly, createSpiritual);
router.get('/:slug/related', getRelatedBySlug(Spiritual, 'Spiritual'));
router.get('/:slug', getSpiritualBySlug);
router.patch('/:id', protect, adminOnly, updateSpiritual);
router.delete('/:id', protect, adminOnly, deleteSpiritual);

export default router;
