/**
 * Discovery Uttarakhand — Admin Verification Controller
 * Manages the administrative audit, verification, rejection, publication,
 * and immutable audit trail for partner marketplace listings.
 */

import Partner from '../models/Partner.js';
import PartnerListing from '../models/PartnerListing.js';
import VerificationAuditLog from '../models/VerificationAuditLog.js';
import web3Service from '../services/web3Service.js';
import { generateSalt, buildListingCanonicalPayload, computeListingVerificationHash } from '../services/cryptoService.js';

/**
 * List all registered partners
 * GET /api/admin/partners
 */
export const getAllPartners = async (req, res) => {
  try {
    const partners = await Partner.find({}).populate('user', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: partners.length, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all listings currently in PENDING_VERIFICATION queue
 * GET /api/admin/listings/pending
 */
export const getPendingListings = async (req, res) => {
  try {
    const pendingListings = await PartnerListing.find({ status: 'PENDING_VERIFICATION' })
      .populate('partner', 'businessName partnerType district phone email credentialType credentialReference')
      .populate('ownerUser', 'name email')
      .sort({ submittedAt: 1 });

    res.status(200).json({
      success: true,
      count: pendingListings.length,
      data: pendingListings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get listing details for admin inspection
 * GET /api/admin/listings/:id
 */
export const getListingForAdmin = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id)
      .populate('partner')
      .populate('ownerUser', 'name email phone');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const auditHistory = await VerificationAuditLog.find({ targetId: listing._id })
      .populate('admin', 'name email')
      .sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: {
        listing,
        auditHistory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Approve Listing
 * POST /api/admin/listings/:id/verify
 * Allowed transition: PENDING_VERIFICATION -> VERIFIED (and sets ACTIVE for immediate public discovery)
 */
export const verifyListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // State machine check
    if (listing.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({
        success: false,
        message: `Illegal state transition: Only PENDING_VERIFICATION listings can be verified. Current: [${listing.status}]`
      });
    }

    const previousStatus = listing.status;
    const now = new Date();

    // Ensure attestation salt is initialized
    if (!listing.web3Sync?.attestationSalt) {
      if (!listing.web3Sync) listing.web3Sync = {};
      listing.web3Sync.attestationSalt = generateSalt();
    }

    listing.reviewedBy = req.user._id;
    listing.verificationNotes = req.body.notes || 'Approved by platform administrator.';
    listing.pricing.provenance = 'VERIFIED';
    listing.pricing.lastVerifiedAt = now;

    // Step 1: Transition to business VERIFIED, syncStatus PENDING
    listing.status = 'VERIFIED';
    listing.web3Sync.syncStatus = 'PENDING';
    listing.web3Sync.lastSyncError = null;

    // Build salted canonical payload
    const nextVersion = (listing.web3Sync.attestedVersion || 0) + 1;
    const canonicalPayload = buildListingCanonicalPayload(listing, nextVersion, listing.web3Sync.attestationSalt);
    const verificationHash = computeListingVerificationHash(canonicalPayload);

    // Step 2: Attempt on-chain attestation
    try {
      const onChainResult = await web3Service.attestListing(listing._id, verificationHash);

      // On confirmation, activate listing and record proof
      listing.status = 'ACTIVE';
      listing.verifiedAt = now;
      listing.web3Sync.syncStatus = 'CONFIRMED';
      listing.web3Sync.onChainStatus = 'ACTIVE';
      listing.web3Sync.txHash = onChainResult.txHash;
      listing.web3Sync.blockNumber = onChainResult.blockNumber;
      listing.web3Sync.blockTimestamp = onChainResult.blockTimestamp;
      listing.web3Sync.contractAddress = onChainResult.contractAddress;
      listing.web3Sync.verificationHash = verificationHash;
      listing.web3Sync.attestedVersion = onChainResult.attestedVersion;
      listing.web3Sync.lastSyncedAt = now;
    } catch (web3Err) {
      // Fail-safe semantics: listing remains VERIFIED, syncStatus FAILED, booking blocked
      console.warn('[AdminVerification] On-chain attestation failed:', web3Err.message);
      listing.status = 'VERIFIED';
      listing.web3Sync.syncStatus = 'FAILED';
      listing.web3Sync.lastSyncError = web3Err.message;
    }

    await listing.save();

    // Create immutable audit log entry
    await VerificationAuditLog.create({
      admin: req.user._id,
      targetType: 'PartnerListing',
      targetId: listing._id,
      action: 'APPROVE',
      previousStatus,
      newStatus: listing.status,
      reason: req.body.notes || 'Listing verified by platform administrator.',
      verificationVersion: listing.web3Sync?.attestedVersion || 1,
      changedFields: ['status', 'pricing.provenance', 'verifiedAt', 'web3Sync'],
      decisionSource: req.body.decisionSource || 'MANUAL_ADMIN_REVIEW'
    });

    res.status(200).json({
      success: true,
      data: listing,
      message: listing.status === 'ACTIVE' 
        ? 'Listing successfully verified and attested on-chain.' 
        : 'Listing verified off-chain; on-chain attestation queued for retry.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Suspend Listing
 * POST /api/admin/listings/:id/suspend
 */
export const suspendListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const previousStatus = listing.status;
    listing.status = 'SUSPENDED';

    if (listing.web3Sync?.onChainStatus === 'ACTIVE') {
      try {
        await web3Service.setListingStatus(listing._id, 'SUSPENDED');
        listing.web3Sync.onChainStatus = 'SUSPENDED';
      } catch (err) {
        console.warn('[AdminVerification] On-chain suspension failed:', err.message);
      }
    }

    await listing.save();

    await VerificationAuditLog.create({
      admin: req.user._id,
      targetType: 'PartnerListing',
      targetId: listing._id,
      action: 'SUSPEND',
      previousStatus,
      newStatus: 'SUSPENDED',
      reason: req.body.reason || 'Administrative suspension.',
      verificationVersion: listing.web3Sync?.attestedVersion || 1
    });

    res.status(200).json({ success: true, data: listing, message: 'Listing has been suspended.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Revoke Listing (Permanent Terminal Action)
 * POST /api/admin/listings/:id/revoke
 */
export const revokeListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const previousStatus = listing.status;
    listing.status = 'REVOKED';

    if (listing.web3Sync?.onChainStatus === 'ACTIVE' || listing.web3Sync?.onChainStatus === 'SUSPENDED') {
      try {
        await web3Service.setListingStatus(listing._id, 'REVOKED');
        listing.web3Sync.onChainStatus = 'REVOKED';
      } catch (err) {
        console.warn('[AdminVerification] On-chain revocation failed:', err.message);
      }
    }

    await listing.save();

    await VerificationAuditLog.create({
      admin: req.user._id,
      targetType: 'PartnerListing',
      targetId: listing._id,
      action: 'SUSPEND',
      previousStatus,
      newStatus: 'REVOKED',
      reason: req.body.reason || 'Permanent license revocation.',
      verificationVersion: listing.web3Sync?.attestedVersion || 1
    });

    res.status(200).json({ success: true, data: listing, message: 'Listing permanently revoked.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Admin Reject Listing
 * POST /api/admin/listings/:id/reject
 * Allowed transition: PENDING_VERIFICATION -> REJECTED
 */
export const rejectListing = async (req, res) => {
  try {
    const { reason } = req.body;

    // Mandatory rejection reason
    if (!reason || String(reason).trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'A rejection reason is mandatory to reject a listing.'
      });
    }

    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (listing.status !== 'PENDING_VERIFICATION') {
      return res.status(400).json({
        success: false,
        message: `Illegal state transition: Only PENDING_VERIFICATION listings can be rejected. Current: [${listing.status}]`
      });
    }

    const previousStatus = listing.status;
    const now = new Date();

    listing.status = 'REJECTED';
    listing.rejectedAt = now;
    listing.reviewedBy = req.user._id;
    listing.verificationNotes = String(reason).trim();
    await listing.save();

    // Create immutable audit log entry
    await VerificationAuditLog.create({
      admin: req.user._id,
      targetType: 'PartnerListing',
      targetId: listing._id,
      action: 'REJECT',
      previousStatus,
      newStatus: 'REJECTED',
      reason: String(reason).trim(),
      verificationVersion: listing.verificationVersion || 1,
      changedFields: ['status', 'rejectedAt', 'verificationNotes'],
      decisionSource: 'MANUAL_ADMIN_REVIEW'
    });

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Listing has been rejected with feedback provided to the partner.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get chronological verification audit history
 * GET /api/admin/verification-logs
 */
export const getVerificationLogs = async (req, res) => {
  try {
    const logs = await VerificationAuditLog.find({})
      .populate('admin', 'name email')
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
