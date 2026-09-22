/**
 * Discovery Uttarakhand — Partner Listing Model
 * Implements the full discrete marketplace lifecycle:
 * DRAFT -> PENDING_VERIFICATION -> VERIFIED -> ACTIVE (or REJECTED -> DRAFT)
 * Supports structured pricing provenance (PARTNER_CLAIMED vs VERIFIED vs UNKNOWN).
 */

import mongoose from 'mongoose';
import { imageSchema, pointSchema } from './sharedSchemas.js';
import { generateSalt } from '../services/cryptoService.js';

const partnerListingPricingSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    enum: ['night', 'day', 'person', 'trip', 'custom'],
    default: 'night'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  provenance: {
    type: String,
    enum: ['PARTNER_CLAIMED', 'VERIFIED', 'UNKNOWN'],
    default: 'PARTNER_CLAIMED'
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const partnerListingSchema = new mongoose.Schema({
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true
  },
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  listingType: {
    type: String,
    enum: ['Stay', 'Guide', 'Rental', 'Activity'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 140
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    trim: true
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  locality: {
    type: String,
    trim: true,
    default: null
  },
  destination: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Destination',
    default: null
  },
  destinationSlug: {
    type: String,
    trim: true,
    lowercase: true,
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
  description: {
    type: String,
    trim: true,
    maxlength: 3000
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [imageSchema],
  
  capacity: {
    maxGuests: { type: Number, default: null },
    bedrooms: { type: Number, default: null },
    bathrooms: { type: Number, default: null }
  },

  // Extended specifications for vehicles / stays / equipment
  specifications: {
    brand: { type: String, trim: true, default: null },
    model: { type: String, trim: true, default: null },
    year: { type: Number, default: null },
    engineCapacity: { type: String, trim: true, default: null }, // e.g. "125cc", "450cc"
    transmission: { type: String, trim: true, default: null }, // "Automatic", "Manual"
    fuelType: { type: String, trim: true, default: null }, // "Petrol", "Electric", "Diesel"
    seatingCapacity: { type: Number, default: null },
    registrationNumber: { type: String, trim: true, default: null },
    pickupLocation: { type: String, trim: true, default: null }
  },

  // Detailed pricing breakdown
  pricingDetails: {
    pricePerHour: { type: Number, default: null },
    pricePerDay: { type: Number, default: null },
    pricePerWeek: { type: Number, default: null },
    securityDeposit: { type: Number, default: 0 },
    extraCharges: { type: String, trim: true, default: null },
    cancellationPolicy: { type: String, trim: true, default: 'Flexible' }
  },

  // Dynamic unit & availability management
  availabilityDetails: {
    totalUnits: { type: Number, default: 1 },
    availableUnits: { type: Number, default: 1 },
    statusReason: { 
      type: String, 
      enum: ['Available', 'Rented', 'Maintenance', 'Blocked'],
      default: 'Available'
    },
    blockedDates: [{ type: Date }]
  },

  // Structured Pricing Provenance
  pricing: {
    type: partnerListingPricingSchema,
    required: true
  },

  // State Machine Lifecycle
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_VERIFICATION', 'VERIFIED', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'REVOKED'],
    default: 'DRAFT'
  },
  verificationVersion: {
    type: Number,
    default: 1
  },
  verificationNotes: {
    type: String,
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
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // Web3 Attestation & Sync Metadata
  web3Sync: {
    syncStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'CONFIRMED', 'FAILED'],
      default: 'NONE'
    },
    onChainStatus: {
      type: String,
      enum: ['NONE', 'ACTIVE', 'SUSPENDED', 'REVOKED'],
      default: 'NONE'
    },
    attestationSalt: {
      type: String,
      default: null
    },
    contractAddress: { type: String, default: null },
    network: { type: String, default: 'hardhat-local' },
    txHash: { type: String, default: null },
    blockNumber: { type: Number, default: null },
    blockTimestamp: { type: Number, default: null },
    verificationHash: { type: String, default: null },
    attestedVersion: { type: Number, default: 0 },
    lastSyncError: { type: String, default: null },
    lastSyncedAt: { type: Date, default: null }
  }
}, {
  timestamps: true
});

// Auto-populate attestation salt on initialization if missing
partnerListingSchema.pre('save', function () {
  if (!this.web3Sync) {
    this.web3Sync = {};
  }
  if (!this.web3Sync.attestationSalt) {
    this.web3Sync.attestationSalt = generateSalt();
  }
});

partnerListingSchema.index({ partner: 1 });
partnerListingSchema.index({ ownerUser: 1 });
partnerListingSchema.index({ status: 1 });
partnerListingSchema.index({ district: 1 });
partnerListingSchema.index({ city: 1 });
partnerListingSchema.index({ locality: 1 });
partnerListingSchema.index({ destinationSlug: 1 });
partnerListingSchema.index({ destination: 1 });
partnerListingSchema.index({ listingType: 1 });
partnerListingSchema.index({ location: '2dsphere' }, { sparse: true });

const PartnerListing = mongoose.model('PartnerListing', partnerListingSchema);
export default PartnerListing;
