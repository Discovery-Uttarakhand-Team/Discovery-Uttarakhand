import express from 'express';
import { getTrips, getTripById, createTrip, updateTrip, deleteTrip } from '../controllers/tripController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getTrips);
router.get('/:id', protect, getTripById);
router.post('/', protect, createTrip);
router.patch('/:id', protect, updateTrip);
router.delete('/:id', protect, deleteTrip);

export default router;
