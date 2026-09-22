import express from 'express';
import { 
  getDestinations, 
  getDestinationBySlug, 
  createDestination, 
  updateDestination, 
  deleteDestination 
} from '../controllers/destinationController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

import Destination from '../models/Destination.js';
import { getRelatedBySlug } from '../controllers/relatedController.js';
import { getDestinationExplore } from '../controllers/destinationExploreController.js';

const router = express.Router();

router.get('/', getDestinations);
router.post('/', protect, adminOnly, createDestination);
router.get('/:slug/explore', getDestinationExplore);
router.get('/:slug/related', getRelatedBySlug(Destination, 'Destination'));
router.get('/:slug', getDestinationBySlug);
router.patch('/:id', protect, adminOnly, updateDestination);
router.delete('/:id', protect, adminOnly, deleteDestination);

export default router;
