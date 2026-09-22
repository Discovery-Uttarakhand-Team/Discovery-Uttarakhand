import express from 'express';
import { handleCreateOrder, handleVerifyPayment, handleGetPaymentStatus, handleWebhook } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// The webhook must use raw body parsing.
// Note: This is usually handled at the server.js level before global express.json(), 
// but if not, we handle it there. We just define the route here.
// POST /api/payments/webhook/razorpay
router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), handleWebhook);

router.post('/create-order', protect, handleCreateOrder);
router.post('/verify', protect, handleVerifyPayment);
router.get('/:paymentId/status', protect, handleGetPaymentStatus);

export default router;
