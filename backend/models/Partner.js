/**
 * Discovery Uttarakhand — Partner Mongoose Model
 * Represents registered tourism partners (homestay hosts, guides, trek operators, rental owners).
 * Identity documents and administrative notes remain strictly off-chain in MongoDB.
 */

import mongoose from 'mongoose';
import { imageSchema, pointSchema } from './sharedSchemas.js';

const partnerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  legalBusinessName: {
    type: String,
    trim: true,
    maxlength: 160
  },
  partnerType: {
    type: String,
    required: true,
    enum: ['Homestay', 'Hotel', 'Guide', 'TrekOperator', 'VehicleRental', 'ActivityProvider']
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    trim: true,
    default: null
  },
  locality: {
    type: String,
    trim: true,
    default: null
  },
  address: {
    type: String,
    trim: true
  },
  location: {
    type: pointSchema,
    default: null
  },
  logo: {
    type: imageSchema,
    default: null
  },
  coverImage: {
    type: imageSchema,
    default: null
  },
  operatingHours: {
    type: String,
    trim: true,
    default: '09:00 AM - 08:00 PM'
  },
  pickupInformation: {
    type: String,
    trim: true,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['PENDING_APPROVAL', 'APPROVED', 'SUSPENDED'],
    default: 'APPROVED'
  },
  verificationStatus: {
    type: String,
    enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
    default: 'DRAFT'
  },
  verificationNotes: {
    type: String,
    default: null
  },
  credentialType: {
    type: String,
    trim: true,
    default: null // e.g. "Uttarakhand Tourism Homestay Registration"
  },
  credentialReference: {
    type: String,
    trim: true,
    default: null // e.g. "UK-HS-2024-889"
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  submittedAt: {
    type: Date,
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

partnerSchema.index({ district: 1 });
partnerSchema.index({ city: 1 });
partnerSchema.index({ locality: 1 });
partnerSchema.index({ partnerType: 1 });
partnerSchema.index({ verificationStatus: 1 });
partnerSchema.index({ location: '2dsphere' }, { sparse: true });

const Partner = mongoose.model('Partner', partnerSchema);
export default Partner;
