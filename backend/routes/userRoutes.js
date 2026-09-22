import express from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { 
  getUserProfile, 
  updateUserProfile,
  getUserBookings,
  createBooking,
  getUserReviews,
  getUserTrips
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect); // Protect all routes below

router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/bookings', getUserBookings);
router.post('/bookings', createBooking);
router.get('/reviews', getUserReviews);
router.get('/trips', getUserTrips);

export default router;
