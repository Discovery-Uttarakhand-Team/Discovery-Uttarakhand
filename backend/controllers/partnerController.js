/**
 * Discovery Uttarakhand — Partner Controller
 * Manages partner registration, business profile, listing drafts,
 * and verification submission workflow.
 * 
 * Strict Security Rules:
 * 1. Role is NEVER accepted from request body (Zero privilege escalation).
 * 2. Partners can NEVER set status to 'VERIFIED' or 'ACTIVE'.
 * 3. Cross-partner access is strictly prohibited (403 Forbidden).
 * 4. Editing is permitted only in DRAFT or REJECTED states.
 */

import Partner from '../models/Partner.js';
import PartnerListing from '../models/PartnerListing.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import PartnerExpense from '../models/PartnerExpense.js';
import Review from '../models/Review.js';
import Destination from '../models/Destination.js';
import { resolveDestination } from '../services/destinationResolver.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

// Helper slug generator
function generateSlug(title) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base}-${Date.now().toString(36)}`;
}

// Normalizes and validates coordinates into canonical GeoJSON [longitude, latitude]
async function resolveLocationAndDestination({ district, city, locality, destination, destinationSlug, location, latitude, longitude }) {
  let matchedDest = null;
  let canonicalSlug = destinationSlug ? destinationSlug.toLowerCase().trim() : null;

  // Search terms to locate destination
  const searchTerms = [canonicalSlug, destination, city, locality].filter(Boolean);
  for (const term of searchTerms) {
    if (!matchedDest) {
      matchedDest = await Destination.findOne({
        $or: [
          { slug: term.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
          { name: new RegExp(`^${term.trim()}$`, 'i') }
        ]
      }).lean();
    }
  }

  // Fallback to destinationResolver
  if (!matchedDest && searchTerms.length > 0) {
    for (const term of searchTerms) {
      const res = resolveDestination(term);
      if (res && res.slug) {
        canonicalSlug = res.slug;
        matchedDest = await Destination.findOne({ slug: res.slug }).lean();
        if (matchedDest) break;
      }
    }
  }

  const destId = matchedDest ? matchedDest._id : null;
  const resolvedSlug = matchedDest ? matchedDest.slug : (canonicalSlug || (destination ? destination.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null));

  // Determine coordinates
  let lon = null;
  let lat = null;

  if (location && typeof location === 'object') {
    if (Array.isArray(location.coordinates) && location.coordinates.length >= 2) {
      lon = Number(location.coordinates[0]);
      lat = Number(location.coordinates[1]);
    } else if (location.latitude !== undefined && location.longitude !== undefined) {
      lat = Number(location.latitude);
      lon = Number(location.longitude);
    } else if (location.lat !== undefined && (location.lng !== undefined || location.lon !== undefined)) {
      lat = Number(location.lat);
      lon = Number(location.lng !== undefined ? location.lng : location.lon);
    }
  } else if (latitude !== undefined && longitude !== undefined) {
    lat = Number(latitude);
    lon = Number(longitude);
  }

  // Fallback to matched destination coordinates if not supplied
  if ((lon === null || lat === null || isNaN(lon) || isNaN(lat)) && matchedDest?.location?.coordinates?.length === 2) {
    lon = Number(matchedDest.location.coordinates[0]);
    lat = Number(matchedDest.location.coordinates[1]);
  }

  let finalLocation = null;
  if (lon !== null && lat !== null && !isNaN(lon) && !isNaN(lat)) {
    // Canonical coordinate validation: longitude [-180, 180], latitude [-90, 90]
    if (lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
      finalLocation = {
        type: 'Point',
        coordinates: [lon, lat]
      };
    }
  }

  return {
    destination: destId,
    destinationSlug: resolvedSlug,
    location: finalLocation
  };
}

// ─────────────────────────────────────────────────────────────
// 1. Partner Profile Lifecycle
// ─────────────────────────────────────────────────────────────

/**
 * Register as a Partner / Create Partner Profile
 * POST /api/partners
 */
export const registerPartner = async (req, res) => {
  try {
    const userId = req.user._id;

    // Security Check: Block any client role injection attempt
    if (req.body.role) {
      // Intentionally ignore or reject if trying to escalate to admin/owner
      if (req.body.role === 'admin' || req.body.role === 'owner') {
        return res.status(403).json({
          success: false,
          message: 'Privilege escalation rejected: Cannot assign administrative roles.'
        });
      }
    }

    // Check if partner profile already exists for this user
    const existing = await Partner.findOne({ user: userId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Partner profile already exists for this user.'
      });
    }

    const {
      businessName,
      legalBusinessName,
      partnerType,
      phone,
      email,
      district,
      city,
      locality,
      address,
      location,
      latitude,
      longitude,
      description,
      credentialType,
      credentialReference
    } = req.body;

    if (!businessName || !partnerType || !phone || !email || !district) {
      return res.status(400).json({
        success: false,
        message: 'businessName, partnerType, phone, email, and district are mandatory.'
      });
    }

    const resolved = await resolveLocationAndDestination({
      district,
      city,
      locality,
      location,
      latitude,
      longitude
    });

    // Create partner record
    const partner = await Partner.create({
      user: userId,
      businessName,
      legalBusinessName,
      partnerType,
      phone,
      email,
      district,
      city: city || null,
      locality: locality || null,
      address,
      location: resolved.location,
      description,
      credentialType,
      credentialReference,
      status: 'APPROVED',
      verificationStatus: 'DRAFT'
    });

    // Server-controlled role assignment: Elevate user to 'partner'
    await User.findByIdAndUpdate(userId, { role: 'partner' });

    res.status(201).json({
      success: true,
      data: partner,
      message: 'Partner profile registered successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get current partner's profile
 * GET /api/partners/me
 */
export const getMyPartnerProfile = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }
    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update partner's business profile
 * PATCH /api/partners/me
 */
export const updateMyPartnerProfile = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    // Disallow arbitrary status elevation
    const allowedUpdates = [
      'businessName', 'legalBusinessName', 'phone', 'email',
      'district', 'city', 'locality', 'address', 'description', 'credentialType', 'credentialReference'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        partner[field] = req.body[field];
      }
    });

    if (req.body.location || req.body.latitude || req.body.longitude) {
      const resolved = await resolveLocationAndDestination({
        district: partner.district,
        city: partner.city,
        locality: partner.locality,
        location: req.body.location,
        latitude: req.body.latitude,
        longitude: req.body.longitude
      });
      if (resolved.location) {
        partner.location = resolved.location;
      }
    }

    await partner.save();
    res.status(200).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Partner Listing Lifecycle (Strict State Machine)
// ─────────────────────────────────────────────────────────────

/**
 * Create a new listing draft
 * POST /api/partners/me/listings
 */
export const createListingDraft = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(403).json({ success: false, message: 'Partner profile required.' });
    }

    // Security check: Partner cannot inject 'VERIFIED' or 'ACTIVE'
    if (req.body.status && ['VERIFIED', 'ACTIVE'].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: 'Illegal state transition: Partners cannot directly set status to VERIFIED or ACTIVE.'
      });
    }

    const {
      listingType,
      title,
      category,
      district,
      city,
      locality,
      destination,
      destinationSlug,
      address,
      location,
      latitude,
      longitude,
      description,
      amenities,
      images,
      pricing,
      specifications,
      pricingDetails,
      availabilityDetails
    } = req.body;

    if (!listingType || !title || !district || !pricing || !pricing.amount) {
      return res.status(400).json({
        success: false,
        message: 'listingType, title, district, and pricing with amount are required.'
      });
    }

    const resolved = await resolveLocationAndDestination({
      district,
      city,
      locality,
      destination,
      destinationSlug,
      location,
      latitude,
      longitude
    });

    // Structured pricing with PARTNER_CLAIMED provenance
    const normalizedPricing = {
      amount: Number(pricing.amount),
      unit: pricing.unit || 'night',
      currency: 'INR',
      provenance: 'PARTNER_CLAIMED',
      lastVerifiedAt: null
    };

    const listing = await PartnerListing.create({
      partner: partner._id,
      ownerUser: req.user._id,
      listingType,
      title,
      slug: generateSlug(title),
      category,
      district,
      city: city || null,
      locality: locality || null,
      destination: resolved.destination,
      destinationSlug: resolved.destinationSlug,
      address,
      location: resolved.location,
      description,
      amenities: Array.isArray(amenities) ? amenities : [],
      images: Array.isArray(images) ? images : [],
      specifications: specifications || {},
      pricingDetails: pricingDetails || {},
      availabilityDetails: availabilityDetails || {
        totalUnits: 1,
        availableUnits: 1,
        statusReason: 'Available',
        blockedDates: []
      },
      pricing: normalizedPricing,
      status: (req.body.submitForVerification || req.body.submit) ? 'PENDING_VERIFICATION' : 'DRAFT',
      submittedAt: (req.body.submitForVerification || req.body.submit) ? new Date() : null,
      verificationVersion: 1
    });

    res.status(201).json({
      success: true,
      data: listing,
      message: (req.body.submitForVerification || req.body.submit)
        ? 'Listing created and submitted for platform verification.'
        : 'Listing draft created successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all listings for current partner
 * GET /api/partners/me/listings
 */
export const getMyListings = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(403).json({ success: false, message: 'Partner profile required.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get specific listing details (must be owned by this partner)
 * GET /api/partners/me/listings/:id
 */
export const getMyListingById = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Strict multi-tenant isolation
    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not own this listing.'
      });
    }

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Edit listing (Allowed only in DRAFT or REJECTED state)
 * PATCH /api/partners/me/listings/:id
 */
export const updateListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Multi-tenant check
    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    // Security check: Partner cannot inject 'VERIFIED' or 'ACTIVE'
    if (req.body.status && ['VERIFIED', 'ACTIVE'].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: 'Illegal state transition: Partners cannot directly set status to VERIFIED or ACTIVE.'
      });
    }

    // Editing permitted only in DRAFT or REJECTED state
    if (!['DRAFT', 'REJECTED'].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `Listing in ${listing.status} status cannot be edited. It must be in DRAFT or REJECTED.`
      });
    }

    const editableFields = [
      'title', 'category', 'district', 'city', 'locality', 'address', 'description', 
      'amenities', 'images', 'specifications', 'pricingDetails', 'availabilityDetails'
    ];
    editableFields.forEach(f => {
      if (req.body[f] !== undefined) {
        listing[f] = req.body[f];
      }
    });

    if (req.body.destination || req.body.destinationSlug || req.body.location || req.body.latitude || req.body.longitude || req.body.city || req.body.locality) {
      const resolved = await resolveLocationAndDestination({
        district: listing.district,
        city: listing.city,
        locality: listing.locality,
        destination: req.body.destination || listing.destinationSlug,
        destinationSlug: req.body.destinationSlug,
        location: req.body.location,
        latitude: req.body.latitude,
        longitude: req.body.longitude
      });
      if (resolved.destination) listing.destination = resolved.destination;
      if (resolved.destinationSlug) listing.destinationSlug = resolved.destinationSlug;
      if (resolved.location) listing.location = resolved.location;
    }

    // Update pricing with PARTNER_CLAIMED provenance
    if (req.body.pricing && req.body.pricing.amount) {
      listing.pricing = {
        amount: Number(req.body.pricing.amount),
        unit: req.body.pricing.unit || listing.pricing.unit,
        currency: 'INR',
        provenance: 'PARTNER_CLAIMED',
        lastVerifiedAt: null
      };
    }

    await listing.save();
    res.status(200).json({ success: true, data: listing, message: 'Listing updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submit listing for admin verification
 * POST /api/partners/me/listings/:id/submit
 * Allowed transitions: DRAFT -> PENDING_VERIFICATION or REJECTED -> PENDING_VERIFICATION
 */
export const submitListingForVerification = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    // State machine check
    if (!['DRAFT', 'REJECTED'].includes(listing.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit listing with status [${listing.status}]. Must be DRAFT or REJECTED.`
      });
    }

    listing.status = 'PENDING_VERIFICATION';
    listing.submittedAt = new Date();
    listing.verificationVersion = (listing.verificationVersion || 1) + 1;
    await listing.save();

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Listing submitted for admin verification.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reopen rejected listing for correction
 * POST /api/partners/me/listings/:id/reopen
 * Allowed transition: REJECTED -> DRAFT
 */
export const reopenRejectedListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    if (listing.status !== 'REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Only REJECTED listings can be reopened to DRAFT. Current status: ${listing.status}`
      });
    }

    listing.status = 'DRAFT';
    await listing.save();

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Listing reopened to DRAFT for editing.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────
// 3. Partner Business Dashboard & Operations
// ─────────────────────────────────────────────────────────────

/**
 * Get unified partner business dashboard overview
 * GET /api/partners/dashboard or GET /api/partners/me/dashboard
 */
export const getPartnerDashboard = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id }).sort({ createdAt: -1 });
    const listingIds = listings.map(l => l._id);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Real bookings from DB
    const allBookings = await Booking.find({ partnerListing: { $in: listingIds } })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const todayBookings = allBookings.filter(b => {
      const cDate = new Date(b.createdAt);
      const sDate = b.startDate ? new Date(b.startDate) : null;
      const eDate = b.endDate ? new Date(b.endDate) : null;
      return (cDate >= startOfToday && cDate <= endOfToday) || 
             (sDate && eDate && sDate <= endOfToday && eDate >= startOfToday);
    });

    const upcomingBookings = allBookings.filter(b => {
      const sDate = b.startDate ? new Date(b.startDate) : null;
      return sDate && sDate > endOfToday && ['confirmed', 'CONFIRMED', 'pending', 'PENDING'].includes(b.status);
    });

    const validPaidBookings = allBookings.filter(b => 
      !['cancelled', 'CANCELLED'].includes(b.status)
    );

    const todayRevenue = allBookings
      .filter(b => {
        const cDate = new Date(b.createdAt);
        return cDate >= startOfToday && !['cancelled', 'CANCELLED'].includes(b.status);
      })
      .reduce((sum, b) => sum + (Number(b.pricingSnapshot?.total || b.amount) || 0), 0);

    const thisMonthRevenue = allBookings
      .filter(b => {
        const cDate = new Date(b.createdAt);
        return cDate >= startOfMonth && !['cancelled', 'CANCELLED'].includes(b.status);
      })
      .reduce((sum, b) => sum + (Number(b.pricingSnapshot?.total || b.amount) || 0), 0);

    const totalRevenue = validPaidBookings.reduce((sum, b) => 
      sum + (Number(b.pricingSnapshot?.total || b.amount) || 0), 0
    );

    const availableUnits = listings.reduce((sum, l) => {
      if (!l.isActive || l.status === 'SUSPENDED') return sum;
      if (l.availabilityDetails?.statusReason === 'Available') {
        return sum + (Number(l.availabilityDetails?.availableUnits) || 1);
      }
      return sum;
    }, 0);

    const rentedUnits = listings.reduce((sum, l) => {
      if (l.availabilityDetails?.statusReason === 'Rented') return sum + 1;
      return sum;
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        partner: {
          id: partner._id,
          businessName: partner.businessName,
          legalBusinessName: partner.legalBusinessName,
          partnerType: partner.partnerType,
          district: partner.district,
          city: partner.city,
          address: partner.address,
          phone: partner.phone,
          email: partner.email,
          verificationStatus: partner.verificationStatus,
          status: partner.status,
          verificationNotes: partner.verificationNotes,
          logo: partner.logo,
          coverImage: partner.coverImage
        },
        metrics: {
          todayBookingsCount: todayBookings.length,
          upcomingBookingsCount: upcomingBookings.length,
          totalBookingsCount: allBookings.length,
          availableUnits,
          rentedUnits,
          todayRevenue,
          thisMonthRevenue,
          totalRevenue
        },
        todayBookingsCount: todayBookings.length,
        upcomingBookingsCount: upcomingBookings.length,
        totalBookingsCount: allBookings.length,
        totalListingsCount: listings.length,
        activeListingsCount: listings.filter(l => l.status === 'ACTIVE' && l.isActive).length,
        availableUnits,
        rentedUnits,
        todayRevenue,
        thisMonthRevenue,
        totalRevenue,
        listingsSummary: {
          total: listings.length,
          active: listings.filter(l => l.status === 'ACTIVE' && l.isActive).length,
          pending: listings.filter(l => l.status === 'PENDING_VERIFICATION').length,
          draft: listings.filter(l => l.status === 'DRAFT').length,
          rejected: listings.filter(l => l.status === 'REJECTED').length
        },
        recentBookings: allBookings.slice(0, 6)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete or safely archive listing
 * DELETE /api/partners/me/listings/:id
 */
export const deleteListing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    // Check historical bookings
    const hasBookings = await Booking.exists({ partnerListing: listing._id });

    if (hasBookings) {
      // Safe archival/deactivation to preserve booking history
      listing.isActive = false;
      listing.status = 'SUSPENDED';
      await listing.save();
      return res.status(200).json({
        success: true,
        data: listing,
        message: 'Listing has historical bookings and was safely archived and deactivated.'
      });
    }

    // No historical bookings: safe deletion
    await PartnerListing.findByIdAndDelete(listing._id);
    res.status(200).json({
      success: true,
      message: 'Listing removed successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Dedicated pricing management endpoint
 * PATCH /api/partners/me/listings/:id/pricing
 * STRICT RULE: Always sets provenance to PARTNER_CLAIMED
 */
export const updateListingPricing = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    const finalAmount = req.body.amount || req.body.pricePerDay || req.body.pricingDetails?.pricePerDay;
    const { unit, currency, pricingDetails } = req.body;

    if (!finalAmount || Number(finalAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required.' });
    }

    // Strict invariant: Partner price updates are strictly PARTNER_CLAIMED until verified
    listing.pricing = {
      amount: Number(finalAmount),
      unit: unit || listing.pricing?.unit || 'day',
      currency: currency || 'INR',
      provenance: 'PARTNER_CLAIMED',
      lastVerifiedAt: null
    };

    if (pricingDetails || req.body.pricePerDay !== undefined || req.body.pricePerHour !== undefined) {
      const existingDetails = listing.pricingDetails ? listing.pricingDetails.toObject() : {};
      listing.pricingDetails = {
        ...existingDetails,
        ...(pricingDetails || {}),
        pricePerDay: Number(finalAmount)
      };
      if (req.body.pricePerHour !== undefined) listing.pricingDetails.pricePerHour = Number(req.body.pricePerHour);
      if (req.body.pricePerWeek !== undefined) listing.pricingDetails.pricePerWeek = Number(req.body.pricePerWeek);
      if (req.body.securityDeposit !== undefined) listing.pricingDetails.securityDeposit = Number(req.body.securityDeposit);
      if (req.body.extraCharges !== undefined) listing.pricingDetails.extraCharges = req.body.extraCharges;
      if (req.body.cancellationPolicy !== undefined) listing.pricingDetails.cancellationPolicy = req.body.cancellationPolicy;
    }

    await listing.save();

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Pricing updated successfully (marked PARTNER_CLAIMED pending admin verification).'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get bookings for current partner's listings
 * GET /api/partners/me/bookings
 */
export const getPartnerBookings = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id }).select('_id title listingType category images district');
    const listingIds = listings.map(l => l._id);

    const query = { partnerListing: { $in: listingIds } };

    // Filter by specific listing
    if (req.query.listingId) {
      query.partnerListing = req.query.listingId;
    }

    // Filter by status
    if (req.query.status && req.query.status !== 'all') {
      const s = req.query.status.toLowerCase();
      if (s === 'today') {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        query.$or = [
          { createdAt: { $gte: startOfToday, $lte: endOfToday } },
          { startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday } }
        ];
      } else if (s === 'upcoming') {
        query.startDate = { $gt: new Date() };
        query.status = { $in: ['confirmed', 'CONFIRMED', 'pending', 'PENDING'] };
      } else {
        query.status = { $in: [s.toLowerCase(), s.toUpperCase()] };
      }
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('partnerListing', 'title slug listingType category district images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update booking status by partner operator
 * PATCH /api/partners/me/bookings/:id/status
 */
export const updatePartnerBookingStatus = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Verify ownership through partnerListing
    const listing = await PartnerListing.findById(booking.partnerListing);
    if (!listing || !listing.partner.equals(partner._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: Booking does not belong to your listings.' });
    }

    const { status, notes } = req.body;
    const allowed = ['CONFIRMED', 'COMPLETED', 'CANCELLED', 'confirmed', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid booking status. Allowed: CONFIRMED, COMPLETED, CANCELLED.` });
    }

    booking.status = status.toUpperCase();
    if (notes) {
      booking.notes = notes;
    }
    if (status.toUpperCase() === 'CANCELLED') {
      booking.cancellation = {
        cancelledAt: new Date(),
        cancelledBy: req.user._id,
        reason: notes || 'Cancelled by partner operator'
      };
    }

    await booking.save();

    res.status(200).json({
      success: true,
      data: booking,
      message: `Booking status updated to ${booking.status}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get availability overview for partner listings
 * GET /api/partners/me/availability
 */
export const getPartnerAvailability = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id })
      .select('title slug listingType category district images availabilityDetails isActive status pricing specifications');

    res.status(200).json({
      success: true,
      data: listings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update listing availability
 * PATCH /api/partners/me/availability/:id or PATCH /api/partners/me/listings/:id/availability
 */
export const updatePartnerAvailability = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    const { statusReason, availableUnits, totalUnits, blockedDates, isActive } = req.body;

    if (!listing.availabilityDetails) {
      listing.availabilityDetails = {};
    }

    if (statusReason) listing.availabilityDetails.statusReason = statusReason;
    if (availableUnits !== undefined) listing.availabilityDetails.availableUnits = Number(availableUnits);
    if (totalUnits !== undefined) listing.availabilityDetails.totalUnits = Number(totalUnits);
    if (Array.isArray(blockedDates)) listing.availabilityDetails.blockedDates = blockedDates;
    if (isActive !== undefined) listing.isActive = Boolean(isActive);

    await listing.save();

    res.status(200).json({
      success: true,
      data: listing,
      message: 'Availability updated successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Real Earnings Calculation
 * GET /api/partners/me/earnings
 */
export const getPartnerEarnings = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id }).select('_id');
    const listingIds = listings.map(l => l._id);

    const bookings = await Booking.find({ partnerListing: { $in: listingIds } });

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    let grossRevenue = 0;
    let todayEarnings = 0;
    let thisWeekEarnings = 0;
    let thisMonthEarnings = 0;
    let thisYearEarnings = 0;
    let pendingAmount = 0;

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(now.getFullYear(), i, 1).toLocaleString('default', { month: 'short' }),
      revenue: 0,
      bookings: 0
    }));

    bookings.forEach(b => {
      const amt = Number(b.pricingSnapshot?.total || b.amount) || 0;
      const cDate = new Date(b.createdAt);

      if (['pending', 'PENDING'].includes(b.status)) {
        pendingAmount += amt;
      } else if (!['cancelled', 'CANCELLED'].includes(b.status)) {
        grossRevenue += amt;
        if (cDate >= startOfToday) todayEarnings += amt;
        if (cDate >= startOfWeek) thisWeekEarnings += amt;
        if (cDate >= startOfMonth) thisMonthEarnings += amt;
        if (cDate >= startOfYear) thisYearEarnings += amt;

        if (cDate.getFullYear() === now.getFullYear()) {
          const m = cDate.getMonth();
          if (monthlyBreakdown[m]) {
            monthlyBreakdown[m].revenue += amt;
            monthlyBreakdown[m].bookings += 1;
          }
        }
      }
    });

    const platformFeeRate = 0.10; // 10% platform standard
    const platformFee = Math.round(grossRevenue * platformFeeRate);
    const netPartnerEarnings = grossRevenue - platformFee;

    res.status(200).json({
      success: true,
      data: {
        grossRevenue,
        platformFee,
        netPartnerEarnings,
        todayEarnings,
        thisWeekEarnings,
        thisMonthEarnings,
        thisYearEarnings,
        pendingAmount,
        monthlyBreakdown
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Expenses Management
 * GET /api/partners/me/expenses
 */
export const getPartnerExpenses = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const expenses = await PartnerExpense.find({ partner: partner._id })
      .populate('listing', 'title category')
      .sort({ date: -1 });

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    res.status(200).json({
      success: true,
      count: expenses.length,
      totalExpenses,
      data: expenses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create new business expense
 * POST /api/partners/me/expenses
 */
export const createPartnerExpense = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const { category, amount, date, note, listing, receiptImage } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive amount is required.' });
    }

    const expense = await PartnerExpense.create({
      partner: partner._id,
      ownerUser: req.user._id,
      category: category || 'Other',
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
      note: note || '',
      listing: listing || null,
      receiptImage: receiptImage || null
    });

    res.status(201).json({
      success: true,
      data: expense,
      message: 'Expense recorded successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete business expense
 * DELETE /api/partners/me/expenses/:id
 */
export const deletePartnerExpense = async (req, res) => {
  try {
    const expense = await PartnerExpense.findOneAndDelete({
      _id: req.params.id,
      ownerUser: req.user._id
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found or unauthorized.' });
    }

    res.status(200).json({
      success: true,
      message: 'Expense removed successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Comprehensive Business Analytics
 * GET /api/partners/me/analytics
 */
export const getPartnerAnalytics = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id });
    const listingIds = listings.map(l => l._id);

    const bookings = await Booking.find({ partnerListing: { $in: listingIds } });
    const expenses = await PartnerExpense.find({ partner: partner._id });

    const totalRevenue = bookings
      .filter(b => !['cancelled', 'CANCELLED'].includes(b.status))
      .reduce((sum, b) => sum + (Number(b.pricingSnapshot?.total || b.amount) || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => ['completed', 'COMPLETED', 'confirmed', 'CONFIRMED'].includes(b.status)).length;
    const cancelledBookings = bookings.filter(b => ['cancelled', 'CANCELLED'].includes(b.status)).length;
    const cancellationRate = totalBookings > 0 ? Number(((cancelledBookings / totalBookings) * 100).toFixed(1)) : 0;
    const averageBookingValue = completedBookings > 0 ? Math.round(totalRevenue / completedBookings) : 0;

    // Category breakdown
    const categoryMap = {};
    listings.forEach(l => {
      const cat = l.listingType || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    // Top listings performance
    const listingPerf = listings.map(l => {
      const bList = bookings.filter(b => b.partnerListing && b.partnerListing.toString() === l._id.toString());
      const rev = bList
        .filter(b => !['cancelled', 'CANCELLED'].includes(b.status))
        .reduce((sum, b) => sum + (Number(b.pricingSnapshot?.total || b.amount) || 0), 0);
      return {
        id: l._id,
        title: l.title,
        listingType: l.listingType,
        category: l.category,
        image: l.images?.[0]?.url || null,
        status: l.status,
        price: l.pricing?.amount || 0,
        unit: l.pricing?.unit || 'day',
        bookingsCount: bList.length,
        revenue: rev
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Category breakdown list
    const categoryBreakdownList = Object.keys(categoryMap).map(cat => {
      const catListings = listings.filter(l => (l.listingType || 'Other') === cat).map(l => l._id.toString());
      const catBookings = bookings.filter(b => b.partnerListing && catListings.includes(b.partnerListing.toString()));
      const catRevenue = catBookings
        .filter(b => !['cancelled', 'CANCELLED'].includes(b.status))
        .reduce((sum, b) => sum + (Number(b.pricingSnapshot?.total || b.amount) || 0), 0);
      return {
        category: cat,
        count: catBookings.length,
        revenue: catRevenue
      };
    });

    // Top listings performance with listingId alias
    const formattedTopListings = listingPerf.slice(0, 5).map(item => ({
      ...item,
      listingId: item.id
    }));

    // Reviews summary
    const reviews = await Review.find({ targetType: 'PartnerListing', target: { $in: listingIds }, status: 'approved' });
    const avgRating = reviews.length > 0 
      ? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalBookings,
        completedBookings,
        cancelledBookings,
        cancellationRate,
        averageBookingValue,
        activeListingsCount: listings.filter(l => l.status === 'ACTIVE' && l.isActive).length,
        totalListingsCount: listings.length,
        averageRating: avgRating,
        totalReviewsCount: reviews.length,
        reviewsRating: {
          average: avgRating,
          count: reviews.length
        },
        categoryBreakdown: categoryBreakdownList,
        categoryMap,
        topListings: formattedTopListings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Partner Reviews
 * GET /api/partners/me/reviews
 */
export const getPartnerReviews = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const listings = await PartnerListing.find({ partner: partner._id }).select('_id title category images');
    const listingIds = listings.map(l => l._id);

    const reviews = await Review.find({ targetType: 'PartnerListing', target: { $in: listingIds } })
      .populate('user', 'name profileImage')
      .populate('target', 'title category images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reply to customer review
 * POST /api/partners/me/reviews/:id/reply
 */
export const replyToReview = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner profile not found.' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    // Verify listing belongs to this partner
    const listing = await PartnerListing.findById(review.target);
    if (!listing || !listing.partner.equals(partner._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own the reviewed listing.' });
    }

    const text = req.body.text || req.body.replyText;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Reply text is required.' });
    }

    review.reply = {
      text: text.trim(),
      repliedAt: new Date(),
      repliedBy: req.user._id
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Reply posted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Upload multiple images directly to a partner's own listing
 * POST /api/partners/me/listings/:id/images
 */
export const uploadListingImages = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Strict multi-tenant authorization
    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No image files provided.' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      let imageUrl = null;
      let publicId = null;

      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: `discovery-uttarakhand/partners/${listing._id}`,
            public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`
          });
          imageUrl = result.secure_url;
          publicId = result.public_id;
          try { fs.unlinkSync(file.path); } catch (e) {}
        } catch (cErr) {
          console.warn('[Cloudinary] Upload failed, falling back to local:', cErr.message);
        }
      }

      if (!imageUrl) {
        const host = req.get('host');
        const protocol = req.protocol;
        imageUrl = `${protocol}://${host}/uploads/${file.filename}`;
        publicId = file.filename;
      }

      uploadedImages.push({
        url: imageUrl,
        publicId,
        source: 'Partner Upload',
        alt: file.originalname || listing.title
      });
    }

    listing.images.push(...uploadedImages);
    await listing.save();

    res.status(200).json({
      success: true,
      data: listing.images,
      message: `${uploadedImages.length} image(s) uploaded to listing successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete an image from a partner's own listing
 * DELETE /api/partners/me/listings/:id/images/:imageId
 */
export const deleteListingImage = async (req, res) => {
  try {
    const listing = await PartnerListing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Strict multi-tenant authorization: Partner can only modify their own listing
    if (!listing.ownerUser.equals(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Access denied: You do not own this listing.' });
    }

    const imageIdOrPublicId = req.params.imageId;
    const imageIndex = listing.images.findIndex(img => 
      (img._id && img._id.toString() === imageIdOrPublicId) || 
      (img.publicId && img.publicId === imageIdOrPublicId) ||
      (img.url && img.url.includes(imageIdOrPublicId))
    );

    if (imageIndex === -1) {
      return res.status(404).json({ success: false, message: 'Image not found on this listing.' });
    }

    const [removedImage] = listing.images.splice(imageIndex, 1);

    // Destroy on Cloudinary if publicId exists
    if (removedImage?.publicId && process.env.CLOUDINARY_CLOUD_NAME) {
      try {
        await cloudinary.uploader.destroy(removedImage.publicId);
      } catch (cErr) {
        console.warn('[Cloudinary] Image destroy notice:', cErr.message);
      }
    }

    await listing.save();

    res.status(200).json({
      success: true,
      data: listing.images,
      message: 'Image removed from listing successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
