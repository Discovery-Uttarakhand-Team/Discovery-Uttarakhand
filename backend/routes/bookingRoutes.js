import express from 'express';
import { 
  createBooking, 
  getMyBookings, 
  getBookingById, 
  cancelBooking 
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Protect all booking routes

router.route('/')
  .get(getMyBookings)
  .post(createBooking);

router.route('/my')
  .get(getMyBookings);

router.route('/:id')
  .get(getBookingById);

router.route('/:id/cancel')
  .patch(cancelBooking);

export default router;
