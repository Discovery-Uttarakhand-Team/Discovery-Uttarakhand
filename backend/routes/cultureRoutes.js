import express from 'express';
import { 
  getCulturePlaces, 
  getCultureBySlug, 
  createCulture, 
  updateCulture, 
  deleteCulture 
} from '../controllers/cultureController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import Culture from '../models/Culture.js';
import { getRelatedBySlug } from '../controllers/relatedController.js';

const router = express.Router();

router.get('/', getCulturePlaces);
router.post('/', protect, adminOnly, createCulture);
router.get('/:slug/related', getRelatedBySlug(Culture, 'Culture'));
router.get('/:slug', getCultureBySlug);
router.patch('/:id', protect, adminOnly, updateCulture);
router.delete('/:id', protect, adminOnly, deleteCulture);

export default router;
