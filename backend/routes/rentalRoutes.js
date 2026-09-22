import express from 'express';
import { 
  getRentals, 
  getRentalBySlug, 
  createRental, 
  updateRental, 
  deleteRental 
} from '../controllers/rentalController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import Rental from '../models/Rental.js';
import { getRelatedBySlug } from '../controllers/relatedController.js';

const router = express.Router();

router.get('/', getRentals);
router.post('/', protect, adminOnly, createRental);
router.get('/:slug/related', getRelatedBySlug(Rental, 'Rental'));
router.get('/:slug', getRentalBySlug);
router.patch('/:id', protect, adminOnly, updateRental);
router.delete('/:id', protect, adminOnly, deleteRental);

export default router;
