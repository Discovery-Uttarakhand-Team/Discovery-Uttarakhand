import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId: { type: String, unique: true, required: true },
  razorpayPaymentId: { type: String, sparse: true, unique: true },
  amount: { type: Number, required: true }, // in minor units (paise)
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED'],
    default: 'CREATED'
  },
  idempotencyKey: { type: String }
}, { timestamps: true });

paymentSchema.index({ bookingId: 1, userId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
