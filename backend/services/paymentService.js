import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import PaymentWebhookEvent from '../models/PaymentWebhookEvent.js';
import Booking from '../models/Booking.js';
import { toMinorUnit } from '../utils/money.js';

// Lazy initialize to allow startup without env vars if payments are unused
let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

const VALID_TRANSITIONS = {
  CREATED: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'],
  PENDING: ['AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'],
  AUTHORIZED: ['CAPTURED', 'FAILED'],
  CAPTURED: [], // Refunds are out of scope
  FAILED: [],
  CANCELLED: []
};

function isValidTransition(currentStatus, newStatus) {
  if (currentStatus === newStatus) return true; // Idempotent
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

export const createOrder = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');
  if (booking.user.toString() !== userId.toString()) throw new Error('Unauthorized');
  
  if (booking.status !== 'PENDING') {
    throw new Error(`Booking status is ${booking.status}. Only PENDING bookings can be paid.`);
  }

  // Check if a valid payment already exists
  const existingPayment = await Payment.findOne({
    bookingId,
    status: { $in: ['CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED'] }
  });
  
  if (existingPayment) {
    if (existingPayment.status === 'CAPTURED') {
      throw new Error('Booking is already paid');
    }
    // Idempotency: return existing order if PENDING/CREATED
    return existingPayment;
  }

  if (!booking.pricingSnapshot || !booking.pricingSnapshot.total) {
    throw new Error('Booking has no valid pricing snapshot');
  }

  // Convert to minor unit using safe utility
  const minorAmount = toMinorUnit(booking.pricingSnapshot.total);
  const currency = booking.currency || 'INR';

  const rzp = getRazorpay();
  const options = {
    amount: minorAmount,
    currency,
    receipt: `rcpt_${booking._id.toString().substring(0, 10)}_${Date.now()}`
  };

  const order = await rzp.orders.create(options);

  const payment = await Payment.create({
    bookingId: booking._id,
    userId,
    razorpayOrderId: order.id,
    amount: minorAmount,
    currency,
    status: 'CREATED'
  });

  return payment;
};

export const verifyPayment = async (razorpayOrderId, razorpayPaymentId, signature, userId) => {
  const payment = await Payment.findOne({ razorpayOrderId });
  if (!payment) throw new Error('Payment order not found');
  if (payment.userId.toString() !== userId.toString()) throw new Error('Unauthorized');

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${payment.razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid payment signature');
  }

  if (!isValidTransition(payment.status, 'CAPTURED')) {
    throw new Error(`Invalid state transition from ${payment.status} to CAPTURED`);
  }

  payment.razorpayPaymentId = razorpayPaymentId;
  payment.status = 'CAPTURED';
  await payment.save();

  await _confirmBookingSecurely(payment);

  return payment;
};

async function _confirmBookingSecurely(payment) {
  const booking = await Booking.findById(payment.bookingId);
  if (!booking) return;

  // Strict validation before confirming
  if (booking.status !== 'PENDING') return;
  
  const expectedMinorUnit = toMinorUnit(booking.pricingSnapshot?.total || 0);
  if (payment.amount !== expectedMinorUnit) {
    console.error(`[PAYMENT] Amount mismatch for Booking ${booking._id}`);
    return; // Reject confirmation
  }
  
  if (payment.userId.toString() !== booking.user.toString()) {
    console.error(`[PAYMENT] Ownership mismatch for Booking ${booking._id}`);
    return;
  }

  booking.status = 'CONFIRMED';
  await booking.save();
}

export const processWebhook = async (rawBody, signature, eventId) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error('Webhook secret not configured');

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw new Error('Invalid webhook signature');
  }

  const payload = JSON.parse(rawBody);
  
  // Idempotency check via PaymentWebhookEvent
  const existingEvent = await PaymentWebhookEvent.findOne({ eventId });
  if (existingEvent) {
    if (existingEvent.processingStatus === 'PROCESSED') return; // Already done
    // If pending/failed, we might retry or ignore depending on logic. Here we ignore duplicates.
    return;
  }

  const eventRecord = await PaymentWebhookEvent.create({
    eventId,
    eventType: payload.event,
    razorpayPaymentId: payload.payload?.payment?.entity?.id,
    razorpayOrderId: payload.payload?.payment?.entity?.order_id
  });

  try {
    const orderId = payload.payload?.payment?.entity?.order_id;
    if (orderId) {
      const payment = await Payment.findOne({ razorpayOrderId: orderId });
      if (payment) {
        let newStatus = null;
        if (payload.event === 'payment.captured') newStatus = 'CAPTURED';
        else if (payload.event === 'payment.failed') newStatus = 'FAILED';
        else if (payload.event === 'payment.authorized') newStatus = 'AUTHORIZED';

        if (newStatus && isValidTransition(payment.status, newStatus)) {
          payment.status = newStatus;
          payment.razorpayPaymentId = payload.payload?.payment?.entity?.id;
          await payment.save();

          if (newStatus === 'CAPTURED') {
            await _confirmBookingSecurely(payment);
          }
        }
      }
    }

    eventRecord.processingStatus = 'PROCESSED';
    eventRecord.processedAt = new Date();
    await eventRecord.save();
  } catch (err) {
    eventRecord.processingStatus = 'FAILED';
    eventRecord.errorMetadata = err.message;
    await eventRecord.save();
    throw err;
  }
};

export const reconcilePayment = async (paymentId, userId, isAdmin = false) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw new Error('Payment not found');
  
  if (!isAdmin && payment.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  // If we already captured it, nothing to do
  if (payment.status === 'CAPTURED') return payment;

  const rzp = getRazorpay();
  const order = await rzp.orders.fetch(payment.razorpayOrderId);
  
  let newStatus = payment.status;
  
  if (order.status === 'paid') {
    newStatus = 'CAPTURED';
  } else if (order.status === 'attempted') {
    // Might need to check payments under this order
    const payments = await rzp.orders.fetchPayments(payment.razorpayOrderId);
    const capturedPayment = payments.items.find(p => p.status === 'captured');
    if (capturedPayment) {
      newStatus = 'CAPTURED';
      payment.razorpayPaymentId = capturedPayment.id;
    } else {
      const authPayment = payments.items.find(p => p.status === 'authorized');
      if (authPayment) {
        newStatus = 'AUTHORIZED';
        payment.razorpayPaymentId = authPayment.id;
      }
    }
  }

  if (newStatus !== payment.status && isValidTransition(payment.status, newStatus)) {
    payment.status = newStatus;
    await payment.save();

    if (newStatus === 'CAPTURED') {
      await _confirmBookingSecurely(payment);
    }
  }

  return payment;
};
