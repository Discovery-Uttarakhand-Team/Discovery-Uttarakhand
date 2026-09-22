/**
 * Discovery Uttarakhand — Vehicle Permit Record Model
 * Tracks commercial tourist vehicle permits with off-chain salts for zero-leakage Web3 attestation.
 */

import mongoose from 'mongoose';
import { generateSalt } from '../services/cryptoService.js';

const vehiclePermitRecordSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  operatorName: {
    type: String,
    trim: true,
    default: null
  },
  district: {
    type: String,
    required: true,
    trim: true
  },
  permitType: {
    type: String,
    enum: ['ALL_UTTARAKHAND_HILL_PERMIT', 'CHAR_DHAM_SPECIAL', 'GREEN_CARD'],
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  fitnessCertificateExpiry: {
    type: Date,
    required: true
  },
  insuranceExpiry: {
    type: Date,
    required: true
  },

  // Private Off-Chain Cryptographic Salts (Never written on-chain)
  vehicleSalt: {
    type: String,
    required: true
  },
  permitSalt: {
    type: String,
    required: true
  },

  // Web3 Synchronization & On-Chain Proof
  web3Sync: {
    syncStatus: {
      type: String,
      enum: ['NONE', 'PENDING', 'CONFIRMED', 'FAILED'],
      default: 'NONE'
    },
    onChainStatus: {
      type: String,
      enum: ['NONE', 'VALID', 'SUSPENDED', 'REVOKED'],
      default: 'NONE'
    },
    vehicleHash: { type: String, default: null },
    permitDigest: { type: String, default: null },
    txHash: { type: String, default: null },
    blockNumber: { type: Number, default: null },
    blockTimestamp: { type: Number, default: null },
    contractAddress: { type: String, default: null },
    lastSyncError: { type: String, default: null }
  }
}, {
  timestamps: true
});

// Generate salts automatically before saving if not supplied
vehiclePermitRecordSchema.pre('validate', function () {
  if (!this.vehicleSalt) {
    this.vehicleSalt = generateSalt();
  }
  if (!this.permitSalt) {
    this.permitSalt = generateSalt();
  }
});

vehiclePermitRecordSchema.index({ 'web3Sync.vehicleHash': 1 });

const VehiclePermitRecord = mongoose.model('VehiclePermitRecord', vehiclePermitRecordSchema);
export default VehiclePermitRecord;
