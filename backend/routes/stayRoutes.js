import express from 'express';
import { 
  getStays, 
  getStayBySlug, 
  createStay, 
  updateStay, 
  deleteStay 
} from '../controllers/stayController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import Stay from '../models/Stay.js';
import { getRelatedBySlug } from '../controllers/relatedController.js';

const router = express.Router();

router.get('/', getStays);
router.post('/', protect, adminOnly, createStay);
router.get('/:slug/related', getRelatedBySlug(Stay, 'Stay'));
router.get('/:slug', getStayBySlug);
router.patch('/:id', protect, adminOnly, updateStay);
router.delete('/:id', protect, adminOnly, deleteStay);

export default router;
