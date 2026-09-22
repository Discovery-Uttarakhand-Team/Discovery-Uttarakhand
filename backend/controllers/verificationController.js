/**
 * Discovery Uttarakhand — Public Verification Controller
 * Provides public read-only blockchain integrity inspection and dynamic on-demand QR code generation.
 * Enforces zero-PII scrubbing and neutral branding.
 */

import qrcode from 'qrcode';
import PartnerListing from '../models/PartnerListing.js';
import VehiclePermitRecord from '../models/VehiclePermitRecord.js';
import web3Service from '../services/web3Service.js';
import { 
  buildListingCanonicalPayload, 
  computeListingVerificationHash,
  computeSaltedVehicleHash,
  computeSaltedPermitDigest 
} from '../services/cryptoService.js';

/**
 * Public Inspection for Partner Listing Verification Proof
 * GET /api/verification/inspect/listing/:id
 */
export const inspectListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id)
      .populate('partner', 'businessName partnerType district');

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found.'
      });
    }

    // Public sanitized representation (Zero PII, zero private KYC documents, zero salts, zero reviewer IDs)
    const publicData = {
      listingId: String(listing._id),
      title: listing.title,
      category: listing.category || listing.listingType,
      listingType: listing.listingType,
      district: listing.district,
      city: listing.city || null,
      pricing: {
        amount: listing.pricing?.amount || 0,
        currency: listing.pricing?.currency || 'INR',
        unit: listing.pricing?.unit || 'night'
      },
      capacity: {
        maxGuests: listing.capacity?.maxGuests || null,
        bedrooms: listing.capacity?.bedrooms || null,
        bathrooms: listing.capacity?.bathrooms || null
      },
      partner: listing.partner ? {
        businessName: listing.partner.businessName,
        partnerType: listing.partner.partnerType,
        district: listing.partner.district
      } : null
    };

    // If never attested on-chain
    if (!listing.web3Sync || listing.web3Sync.syncStatus === 'NONE') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'NOT_ATTESTED',
          verdictDetails: {
            message: 'This listing has not undergone blockchain integrity attestation.'
          }
        }
      });
    }

    // If attestation failed or is pending
    if (listing.web3Sync.syncStatus === 'PENDING') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'ATTESTATION_PENDING',
          verdictDetails: {
            message: 'Listing attestation transaction is awaiting network confirmation.'
          }
        }
      });
    }

    if (listing.web3Sync.syncStatus === 'FAILED') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'BLOCKCHAIN_UNAVAILABLE',
          verdictDetails: {
            message: 'Blockchain verification network is currently unreachable. Database record is verified off-chain.'
          }
        }
      });
    }

    // Recompute current canonical hash using off-chain salt
    const canonicalPayload = buildListingCanonicalPayload(
      listing, 
      listing.web3Sync.attestedVersion || 1, 
      listing.web3Sync.attestationSalt
    );
    const liveComputedHash = computeListingVerificationHash(canonicalPayload);

    // Live smart contract read
    const onChainQuery = await web3Service.verifyListing(listing._id, liveComputedHash);

    if (!onChainQuery.isAvailable) {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'BLOCKCHAIN_UNAVAILABLE',
          verdictDetails: {
            message: 'Blockchain node is temporarily unreachable. Attestation record exists in verified state.'
          }
        }
      });
    }

    // Handle contract statuses
    if (onChainQuery.onChainStatus === 'REVOKED') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'REVOKED',
          verdictDetails: {
            isTamperFree: false,
            onChainStatus: 'REVOKED',
            message: 'Platform certification for this listing has been permanently revoked.'
          }
        }
      });
    }

    if (onChainQuery.onChainStatus === 'SUSPENDED') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'SUSPENDED',
          verdictDetails: {
            isTamperFree: false,
            onChainStatus: 'SUSPENDED',
            message: 'Listing certification is temporarily suspended pending administrative review.'
          }
        }
      });
    }

    // Tamper detection: hash mismatch between current MongoDB data and anchored on-chain record
    if (!onChainQuery.isActive) {
      return res.status(200).json({
        success: true,
        data: {
          ...publicData,
          verificationVerdict: 'TAMPER_DETECTED',
          verdictDetails: {
            isTamperFree: false,
            onChainStatus: onChainQuery.onChainStatus,
            message: 'Listing data has diverged from the immutable on-chain record without administrative re-attestation.'
          }
        }
      });
    }

    // Block timestamp derived ISO date
    const blockTimestamp = Number(listing.web3Sync.blockTimestamp || onChainQuery.blockTimestamp);
    const verifiedAtIso = blockTimestamp ? new Date(blockTimestamp * 1000).toISOString() : null;

    return res.status(200).json({
      success: true,
      data: {
        ...publicData,
        verificationVerdict: 'BLOCKCHAIN_VERIFIED',
        verdictDetails: {
          isTamperFree: true,
          onChainStatus: 'ACTIVE',
          contractAddress: listing.web3Sync.contractAddress,
          attestedVersion: listing.web3Sync.attestedVersion,
          blockNumber: listing.web3Sync.blockNumber,
          blockTimestamp: blockTimestamp,
          verifiedAt: verifiedAtIso,
          verifierAddress: onChainQuery.verifierAddress,
          txHash: listing.web3Sync.txHash
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Public Inspection for Commercial Tourist Vehicle Permit
 * GET /api/verification/inspect/vehicle/:vehicleNumber
 */
export const inspectVehicle = async (req, res) => {
  try {
    const rawNumber = String(req.params.vehicleNumber).replace(/[\s-]/g, '').toUpperCase();
    const vehicle = await VehiclePermitRecord.findOne({ vehicleNumber: rawNumber });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: `No registered commercial tourist permit found for vehicle [${rawNumber}].`
      });
    }

    const publicVehicle = {
      vehicleNumber: vehicle.vehicleNumber,
      district: vehicle.district,
      permitType: vehicle.permitType,
      validUntil: vehicle.validUntil,
      fitnessCertificateExpiry: vehicle.fitnessCertificateExpiry,
      insuranceExpiry: vehicle.insuranceExpiry
    };

    if (!vehicle.web3Sync || vehicle.web3Sync.syncStatus !== 'CONFIRMED') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicVehicle,
          verificationVerdict: 'NOT_ATTESTED'
        }
      });
    }

    const validUntilSec = Math.floor(new Date(vehicle.validUntil).getTime() / 1000);
    const onChainQuery = await web3Service.verifyVehiclePermit(
      vehicle.vehicleNumber,
      vehicle.vehicleSalt,
      vehicle.permitType,
      vehicle.district,
      validUntilSec,
      vehicle.permitSalt
    );

    if (!onChainQuery.isAvailable) {
      return res.status(200).json({
        success: true,
        data: {
          ...publicVehicle,
          verificationVerdict: 'BLOCKCHAIN_UNAVAILABLE'
        }
      });
    }

    // Check expiration both off-chain (validUntil) and on-chain (isExpired)
    const isPastDue = (vehicle.validUntil && new Date(vehicle.validUntil).getTime() < Date.now()) || onChainQuery.isExpired;
    if (isPastDue) {
      return res.status(200).json({
        success: true,
        data: {
          ...publicVehicle,
          verificationVerdict: 'EXPIRED',
          verdictDetails: {
            expiresAt: vehicle.validUntil,
            message: 'Tourist permit has passed its valid expiration date.'
          }
        }
      });
    }

    if (onChainQuery.onChainStatus === 'SUSPENDED' || onChainQuery.onChainStatus === 'REVOKED') {
      return res.status(200).json({
        success: true,
        data: {
          ...publicVehicle,
          verificationVerdict: onChainQuery.onChainStatus
        }
      });
    }

    if (onChainQuery.onChainStatus === 'NONE' || !onChainQuery.isValid) {
      return res.status(200).json({
        success: true,
        data: {
          ...publicVehicle,
          verificationVerdict: 'INVALID_PERMIT',
          verdictDetails: {
            message: 'Vehicle permit digest does not match verified on-chain record.'
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...publicVehicle,
        verificationVerdict: 'PERMIT_VALID',
        verdictDetails: {
          isValid: true,
          onChainStatus: 'VALID',
          contractAddress: vehicle.web3Sync.contractAddress,
          blockNumber: vehicle.web3Sync.blockNumber,
          blockTimestamp: vehicle.web3Sync.blockTimestamp,
          verifiedAt: vehicle.web3Sync.blockTimestamp ? new Date(vehicle.web3Sync.blockTimestamp * 1000).toISOString() : null,
          expiresAt: new Date(onChainQuery.expiresAt * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Dynamic On-Demand QR Code Generator
 * GET /api/verification/qr/listing/:id
 * Streams image/png dynamically with 0 database storage.
 */
export const getListingQr = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Build canonical public verification URL
    const host = req.get('host') || 'discoveryuttarakhand.in';
    const protocol = req.protocol || 'https';
    const verificationUrl = `${protocol}://${host}/verify/listing/${listing._id}`;

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24h

    // Stream QR code directly to response
    await qrcode.toFileStream(res, verificationUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#1b4332',  // Forest Green
        light: '#faf9f6' // Cream background
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
