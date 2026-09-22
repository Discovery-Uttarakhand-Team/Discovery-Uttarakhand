import mongoose from 'mongoose';

const pricingSnapshotSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  unit: { type: String, enum: ['night', 'day', 'person', 'trip', 'custom'], default: 'night' },
  currency: { type: String, default: 'INR' },
  quantity: { type: Number, default: 1 },
  subtotal: { type: Number, required: true },
  total: { type: Number, required: true },
  provenance: { type: String, enum: ['PARTNER_CLAIMED', 'VERIFIED', 'UNKNOWN'], default: 'VERIFIED' }
}, { _id: false });

const listingSnapshotSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String },
  district: { type: String },
  listingType: { type: String },
  location: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const travelerSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  guests: { type: Number, min: 1, default: 1 }
}, { _id: false });

const reservationDatesSchema = new mongoose.Schema({
  checkIn: { type: Date },
  checkOut: { type: Date },
  startDate: { type: Date },
  endDate: { type: Date }
}, { _id: false });

const vehicleSnapshotSchema = new mongoose.Schema({
  name: { type: String },
  type: { type: String },
  pricePerDay: { type: Number }
}, { _id: false });

const cancellationSchema = new mongoose.Schema({
  cancelledAt: { type: Date, default: null },
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reason: { type: String, default: null }
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Canonical types: 'partner_listing', 'stay', 'rental', 'guide', 'transport'
  type: { 
    type: String, 
    enum: ['stay', 'rental', 'guide', 'partner_listing', 'transport'], 
    required: true 
  },
  
  // Associated references
  partnerListing: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerListing' },
  stay: { type: mongoose.Schema.Types.ObjectId, ref: 'Stay' },
  rental: { type: mongoose.Schema.Types.ObjectId, ref: 'Rental' },
  guide: { type: mongoose.Schema.Types.ObjectId, ref: 'Guide' },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'SavedTrip' },
  
  // Unique human-readable booking reference (e.g. DU-20260913-AB12CD)
  bookingReference: { 
    type: String, 
    unique: true, 
    sparse: true, 
    index: true 
  },

  // Vehicle sub-entity for rentals
  vehicle: vehicleSnapshotSchema,
  
  // Primary date window
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  guests: { type: Number, min: 1, default: 1 },
  
  // Financial snapshots
  amount: { type: Number }, // legacy & canonical backward-compatible amount
  currency: { type: String, default: "INR" },
  amountNotes: { type: String },
  
  // Immutable historical snapshots (Phase 4)
  pricingSnapshot: pricingSnapshotSchema,
  listingSnapshot: listingSnapshotSchema,
  traveler: travelerSchema,
  reservation: reservationDatesSchema,
  specialRequest: { type: String, trim: true, maxlength: 500 },
  cancellation: { type: cancellationSchema, default: () => ({}) },

  // Lifecycle status (Case-insensitive supported; canonical uppercase)
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'], 
    default: 'PENDING' 
  },
  
  notes: { type: String },

  // Backward compatibility fields
  bookingType: { type: String },
  item: { type: mongoose.Schema.Types.ObjectId },
  quantity: { type: Number, default: 1 },
  totalAmount: { type: Number },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' }

}, {
  timestamps: true,
});

bookingSchema.pre('validate', function() {
  // Normalize status to uppercase canonical
  if (this.status) {
    this.status = this.status.toUpperCase();
  }

  if (this.startDate && this.endDate) {
    if (new Date(this.endDate) <= new Date(this.startDate)) {
      this.invalidate('endDate', 'End date must be greater than start date.');
    }
  }

  if (this.type === 'stay' && !this.stay) {
    this.invalidate('stay', 'Stay reference is required for stay bookings.');
  }
  if (this.type === 'rental' && !this.rental) {
    this.invalidate('rental', 'Rental reference is required for rental bookings.');
  }
  if (this.type === 'guide' && !this.guide) {
    this.invalidate('guide', 'Guide reference is required for guide bookings.');
  }
  if (this.type === 'partner_listing' && !this.partnerListing) {
    this.invalidate('partnerListing', 'PartnerListing reference is required for partner listing bookings.');
  }
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ partnerListing: 1 });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
