import express from 'express';
import { getAdminStats, getAllBookings, updateBookingStatus } from '../controllers/adminController.js';
import { getAllReviewsAdmin, updateReviewStatusAdmin, deleteReviewAdmin } from '../controllers/reviewController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

import {
  getAllPartners,
  getPendingListings,
  getListingForAdmin,
  verifyListing,
  rejectListing,
  suspendListing,
  revokeListing,
  getVerificationLogs
} from '../controllers/adminVerificationController.js';

router.get('/stats', protect, adminOnly, getAdminStats);
router.get('/bookings', protect, adminOnly, getAllBookings);
router.patch('/bookings/:id/status', protect, adminOnly, updateBookingStatus);

// Reviews
router.get('/reviews', protect, adminOnly, getAllReviewsAdmin);
router.patch('/reviews/:id/status', protect, adminOnly, updateReviewStatusAdmin);
router.delete('/reviews/:id', protect, adminOnly, deleteReviewAdmin);

// Partner Marketplace Verification
router.get('/partners', protect, adminOnly, getAllPartners);
router.get('/listings/pending', protect, adminOnly, getPendingListings);
router.get('/listings/:id', protect, adminOnly, getListingForAdmin);
router.post('/listings/:id/verify', protect, adminOnly, verifyListing);
router.post('/listings/:id/reject', protect, adminOnly, rejectListing);
router.post('/listings/:id/suspend', protect, adminOnly, suspendListing);
router.post('/listings/:id/revoke', protect, adminOnly, revokeListing);
router.get('/verification-logs', protect, adminOnly, getVerificationLogs);

export default router;
