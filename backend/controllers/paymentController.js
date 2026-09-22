import { createOrder, verifyPayment, processWebhook, reconcilePayment } from '../services/paymentService.js';
import Payment from '../models/Payment.js';

export const handleCreateOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ success: false, message: 'bookingId required' });
    
    const userId = req.user.id || req.user._id;
    const payment = await createOrder(bookingId, userId);
    
    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        razorpayOrderId: payment.razorpayOrderId,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleVerifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing verification parameters' });
    }

    const userId = req.user.id || req.user._id;
    const payment = await verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature, userId);
    
    res.json({ success: true, message: 'Payment verified', data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const handleWebhook = async (req, res) => {
  try {
    // req.body must be a Buffer for accurate signature verification
    const rawBody = req.body.toString('utf8');
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];

    if (!signature || !eventId) {
      return res.status(400).json({ success: false, message: 'Missing headers' });
    }

    await processWebhook(rawBody, signature, eventId);
    res.status(200).json({ success: true });
  } catch (error) {
    // Return 200 even on expected failures (e.g., duplicates, invalid state transitions) to stop retries,
    // unless it's a structural 500 error, but Razorpay recommends 200 to acknowledge receipt.
    // If signature is invalid, we return 400.
    if (error.message.includes('Invalid webhook signature')) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
    res.status(200).json({ success: true, message: 'Event logged/handled with error' });
  }
};

export const handleGetPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id || req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Reconcile status with Razorpay
    const payment = await reconcilePayment(paymentId, userId, isAdmin);
    
    res.json({
      success: true,
      data: {
        status: payment.status,
        bookingId: payment.bookingId,
        amount: payment.amount
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
