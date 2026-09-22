/**
 * Discovery Uttarakhand — Verification Audit Log
 * Immutable audit trail tracking all administrative verification, approval, rejection,
 * publication, and suspension actions across partner listings.
 */

import mongoose from 'mongoose';

const verificationAuditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    enum: ['PartnerListing', 'Partner'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  action: {
    type: String,
    enum: ['APPROVE', 'REJECT', 'PUBLISH', 'SUSPEND', 'UPDATE_PRICE_PROVENANCE'],
    required: true
  },
  previousStatus: {
    type: String,
    required: true
  },
  newStatus: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    default: null
  },
  verificationVersion: {
    type: Number,
    default: 1
  },
  changedFields: [{
    type: String
  }],
  decisionSource: {
    type: String,
    enum: ['MANUAL_ADMIN_REVIEW', 'GOVT_PORTAL_CROSS_CHECK', 'SYSTEM_ENFORCEMENT'],
    default: 'MANUAL_ADMIN_REVIEW'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false // Immutable log entries
});

verificationAuditLogSchema.index({ targetId: 1, timestamp: -1 });
verificationAuditLogSchema.index({ admin: 1 });

const VerificationAuditLog = mongoose.model('VerificationAuditLog', verificationAuditLogSchema);
export default VerificationAuditLog;
