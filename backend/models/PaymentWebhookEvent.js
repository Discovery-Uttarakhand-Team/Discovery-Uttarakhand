import mongoose from 'mongoose';

const paymentWebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true, required: true },
  eventType: { type: String, required: true },
  razorpayPaymentId: { type: String },
  razorpayOrderId: { type: String },
  receivedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  processingStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED', 'IGNORED'], default: 'PENDING' },
  errorMetadata: { type: String }
});

const PaymentWebhookEvent = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema);
export default PaymentWebhookEvent;
