/**
 * Discovery Uttarakhand — Partner API Routes
 * Mounts endpoints for partner onboarding, profiles, listing drafts,
 * verification submissions, availability, bookings, earnings, expenses, and analytics.
 */

import express from 'express';
import { protect, partnerOnly } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  registerPartner,
  getMyPartnerProfile,
  updateMyPartnerProfile,
  createListingDraft,
  getMyListings,
  getMyListingById,
  updateListing,
  deleteListing,
  updateListingPricing,
  submitListingForVerification,
  reopenRejectedListing,
  getPartnerDashboard,
  getPartnerBookings,
  updatePartnerBookingStatus,
  getPartnerAvailability,
  updatePartnerAvailability,
  getPartnerEarnings,
  getPartnerExpenses,
  createPartnerExpense,
  deletePartnerExpense,
  getPartnerAnalytics,
  getPartnerReviews,
  replyToReview,
  uploadListingImages,
  deleteListingImage
} from '../controllers/partnerController.js';

const router = express.Router();

// ── 1. Onboarding & Profile ─────────────────────────────────────────
router.post('/', protect, registerPartner);
router.get('/me', protect, partnerOnly, getMyPartnerProfile);
router.patch('/me', protect, partnerOnly, updateMyPartnerProfile);
router.get('/profile', protect, partnerOnly, getMyPartnerProfile);
router.patch('/profile', protect, partnerOnly, updateMyPartnerProfile);

// ── 2. Dashboard Overview ───────────────────────────────────────────
router.get('/dashboard', protect, partnerOnly, getPartnerDashboard);
router.get('/me/dashboard', protect, partnerOnly, getPartnerDashboard);

// ── 3. Listings Operations ──────────────────────────────────────────
router.post('/me/listings', protect, partnerOnly, createListingDraft);
router.post('/listings', protect, partnerOnly, createListingDraft);
router.get('/me/listings', protect, partnerOnly, getMyListings);
router.get('/listings', protect, partnerOnly, getMyListings);
router.get('/me/listings/:id', protect, partnerOnly, getMyListingById);
router.get('/listings/:id', protect, partnerOnly, getMyListingById);
router.patch('/me/listings/:id', protect, partnerOnly, updateListing);
router.patch('/listings/:id', protect, partnerOnly, updateListing);
router.put('/me/listings/:id', protect, partnerOnly, updateListing);
router.put('/listings/:id', protect, partnerOnly, updateListing);
router.delete('/me/listings/:id', protect, partnerOnly, deleteListing);
router.delete('/listings/:id', protect, partnerOnly, deleteListing);

// Dedicated pricing (strictly PARTNER_CLAIMED)
router.patch('/me/listings/:id/pricing', protect, partnerOnly, updateListingPricing);
router.patch('/listings/:id/pricing', protect, partnerOnly, updateListingPricing);
router.put('/me/listings/:id/pricing', protect, partnerOnly, updateListingPricing);
router.put('/listings/:id/pricing', protect, partnerOnly, updateListingPricing);

// Verification submissions
router.post('/me/listings/:id/submit', protect, partnerOnly, submitListingForVerification);
router.post('/listings/:id/submit', protect, partnerOnly, submitListingForVerification);
router.post('/me/listings/:id/reopen', protect, partnerOnly, reopenRejectedListing);
router.post('/listings/:id/reopen', protect, partnerOnly, reopenRejectedListing);

// Listing-specific Image Management (Strict Server Ownership)
router.post('/me/listings/:id/images', protect, partnerOnly, upload.array('images', 10), uploadListingImages);
router.post('/listings/:id/images', protect, partnerOnly, upload.array('images', 10), uploadListingImages);
router.delete('/me/listings/:id/images/:imageId', protect, partnerOnly, deleteListingImage);
router.delete('/listings/:id/images/:imageId', protect, partnerOnly, deleteListingImage);

// ── 4. Bookings ─────────────────────────────────────────────────────
router.get('/me/bookings', protect, partnerOnly, getPartnerBookings);
router.get('/bookings', protect, partnerOnly, getPartnerBookings);
router.patch('/me/bookings/:id/status', protect, partnerOnly, updatePartnerBookingStatus);
router.patch('/bookings/:id/status', protect, partnerOnly, updatePartnerBookingStatus);
router.put('/me/bookings/:id/status', protect, partnerOnly, updatePartnerBookingStatus);
router.put('/bookings/:id/status', protect, partnerOnly, updatePartnerBookingStatus);

// ── 5. Availability ─────────────────────────────────────────────────
router.get('/me/availability', protect, partnerOnly, getPartnerAvailability);
router.get('/availability', protect, partnerOnly, getPartnerAvailability);
router.patch('/me/availability/:id', protect, partnerOnly, updatePartnerAvailability);
router.patch('/availability/:id', protect, partnerOnly, updatePartnerAvailability);
router.put('/me/availability/:id', protect, partnerOnly, updatePartnerAvailability);
router.put('/availability/:id', protect, partnerOnly, updatePartnerAvailability);
router.patch('/me/listings/:id/availability', protect, partnerOnly, updatePartnerAvailability);
router.patch('/listings/:id/availability', protect, partnerOnly, updatePartnerAvailability);
router.put('/me/listings/:id/availability', protect, partnerOnly, updatePartnerAvailability);
router.put('/listings/:id/availability', protect, partnerOnly, updatePartnerAvailability);

// ── 6. Financials & P&L ─────────────────────────────────────────────
router.get('/me/earnings', protect, partnerOnly, getPartnerEarnings);
router.get('/earnings', protect, partnerOnly, getPartnerEarnings);

router.get('/me/expenses', protect, partnerOnly, getPartnerExpenses);
router.get('/expenses', protect, partnerOnly, getPartnerExpenses);
router.post('/me/expenses', protect, partnerOnly, createPartnerExpense);
router.post('/expenses', protect, partnerOnly, createPartnerExpense);
router.delete('/me/expenses/:id', protect, partnerOnly, deletePartnerExpense);
router.delete('/expenses/:id', protect, partnerOnly, deletePartnerExpense);

// ── 7. Analytics & Reviews ──────────────────────────────────────────
router.get('/me/analytics', protect, partnerOnly, getPartnerAnalytics);
router.get('/analytics', protect, partnerOnly, getPartnerAnalytics);

router.get('/me/reviews', protect, partnerOnly, getPartnerReviews);
router.get('/reviews', protect, partnerOnly, getPartnerReviews);
router.post('/me/reviews/:id/reply', protect, partnerOnly, replyToReview);
router.post('/reviews/:id/reply', protect, partnerOnly, replyToReview);

// ── 8. Image Upload (Cloudinary Multi-Photo) ────────────────────────
router.post('/me/upload', protect, partnerOnly, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded.' });
    }
    const uploadedImages = req.files.map(f => ({
      url: f.path,
      publicId: f.filename,
      source: 'Partner Upload',
      alt: f.originalname
    }));
    res.status(200).json({
      success: true,
      data: uploadedImages,
      urls: uploadedImages.map(img => img.url),
      message: `${uploadedImages.length} image(s) uploaded successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/upload', protect, partnerOnly, upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files uploaded.' });
    }
    const uploadedImages = req.files.map(f => ({
      url: f.path,
      publicId: f.filename,
      source: 'Partner Upload',
      alt: f.originalname
    }));
    res.status(200).json({
      success: true,
      data: uploadedImages,
      urls: uploadedImages.map(img => img.url),
      message: `${uploadedImages.length} image(s) uploaded successfully.`
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

