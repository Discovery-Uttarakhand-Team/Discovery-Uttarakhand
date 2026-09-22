/**
 * Discovery Uttarakhand — Public Marketplace Controller
 * Serves verified partner inventory to travelers and the platform.
 * 
 * Strict Public Visibility Rules:
 * 1. ONLY listings with status === 'ACTIVE' and isActive === true are returned.
 * 2. DRAFT, PENDING_VERIFICATION, and REJECTED listings are strictly hidden.
 * 3. Private administrative fields (verificationNotes, reviewedBy, auditLogs) are omitted.
 * 4. PII Protection: Sensitive partner contact/credential details (phone, email, KYC) are NEVER exposed publicly.
 * 5. Category-Specific Location Hierarchy:
 *    - Hotel: Exact locality/destination -> City -> District -> Bounded proximity
 *    - Rental: Pickup location -> Operating city -> Operating district
 *    - Guide: Service area / destination -> Operating district
 */

import PartnerListing from '../models/PartnerListing.js';
import Destination from '../models/Destination.js';
import { resolveDestination } from '../services/destinationResolver.js';

// Haversine distance strictly for spatial ranking (in km)
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const getPublicListings = async (req, res) => {
  try {
    const { 
      type, 
      category,
      district, 
      city, 
      locality, 
      destination, 
      destinationSlug,
      search,
      lat, 
      lng, 
      radiusKm = 50 
    } = req.query;

    const baseFilter = {
      status: 'ACTIVE',
      isActive: true
    };

    // Normalize listing type
    const queryType = type || category;
    if (queryType) {
      // Map colloquial types to canonical: 'stay' -> 'Stay', 'rental' -> 'Rental', etc.
      const canonicalType = queryType.charAt(0).toUpperCase() + queryType.slice(1).toLowerCase();
      if (['Stay', 'Rental', 'Guide', 'Activity'].includes(canonicalType)) {
        baseFilter.listingType = canonicalType;
      }
    }

    // Resolve destination context if search / destination string provided
    const rawLocationQuery = search || destination || destinationSlug || city || locality || district;
    let resolvedDest = null;
    let targetDistrict = district ? district.trim() : null;
    let targetCity = city ? city.trim() : null;
    let targetLocality = locality ? locality.trim() : null;
    let anchorLat = lat ? Number(lat) : null;
    let anchorLng = lng ? Number(lng) : null;

    if (rawLocationQuery && typeof rawLocationQuery === 'string') {
      const destCandidate = await Destination.findOne({
        $or: [
          { slug: rawLocationQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-') },
          { name: new RegExp(`^${rawLocationQuery.trim()}$`, 'i') }
        ]
      }).lean();

      if (destCandidate) {
        resolvedDest = destCandidate;
        if (!targetDistrict && destCandidate.district) targetDistrict = destCandidate.district;
        if (!targetCity) targetCity = destCandidate.name;
        if ((!anchorLat || !anchorLng) && destCandidate.location?.coordinates?.length === 2) {
          anchorLng = destCandidate.location.coordinates[0];
          anchorLat = destCandidate.location.coordinates[1];
        }
      } else {
        const fallback = resolveDestination(rawLocationQuery);
        if (fallback) {
          if (!targetDistrict && fallback.district) targetDistrict = fallback.district;
          if (!targetCity) targetCity = fallback.name;
        }
      }
    }

    // Helper: Execute find with safety projection and safe partner population
    const executeQuery = async (query) => {
      return await PartnerListing.find(query)
        .select('-verificationNotes -reviewedBy -__v -ownerUser')
        .populate('partner', 'businessName partnerType district city logo description')
        .populate('destination', 'name slug district')
        .lean();
    };

    let listings = [];

    // Tier 1: Exact locality or destination match
    if (targetLocality || resolvedDest?.slug) {
      const tier1Filter = { ...baseFilter };
      const orConditions = [];
      if (targetLocality) {
        orConditions.push({ locality: new RegExp(`^${targetLocality}$`, 'i') });
        orConditions.push({ address: new RegExp(targetLocality, 'i') });
      }
      if (resolvedDest?.slug) {
        orConditions.push({ destinationSlug: resolvedDest.slug });
      }
      if (orConditions.length > 0) {
        tier1Filter.$or = orConditions;
        listings = await executeQuery(tier1Filter);
      }
    }

    // Tier 2: Same City (if Tier 1 had no results or if city specified)
    if (listings.length === 0 && targetCity) {
      const tier2Filter = {
        ...baseFilter,
        $or: [
          { city: new RegExp(`^${targetCity}$`, 'i') },
          { 'specifications.pickupLocation': new RegExp(targetCity, 'i') },
          { locality: new RegExp(targetCity, 'i') }
        ]
      };
      listings = await executeQuery(tier2Filter);
    }

    // Tier 3: Same District (category-specific constraint)
    if (listings.length === 0 && targetDistrict) {
      const tier3Filter = {
        ...baseFilter,
        district: new RegExp(`^${targetDistrict}$`, 'i')
      };
      listings = await executeQuery(tier3Filter);
    }

    // Tier 4: Proximity Search if anchor coordinates available
    if (listings.length === 0 && anchorLat !== null && anchorLng !== null) {
      const maxDistanceMeters = Math.min(Number(radiusKm) || 50, 60) * 1000;
      const tier4Filter = {
        ...baseFilter,
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [anchorLng, anchorLat]
            },
            $maxDistance: maxDistanceMeters
          }
        }
      };
      listings = await executeQuery(tier4Filter);
    }

    // Tier 5: If no location filter supplied at all, return latest active listings
    if (listings.length === 0 && !targetDistrict && !targetCity && !targetLocality && !resolvedDest) {
      listings = await executeQuery(baseFilter);
    }

    // Calculate straight-line spatial distance for ranking if anchor coords exist
    if (anchorLat !== null && anchorLng !== null) {
      listings = listings.map(item => {
        let distanceKm = null;
        if (item.location?.coordinates?.length === 2) {
          distanceKm = calculateHaversineDistanceKm(
            anchorLat,
            anchorLng,
            item.location.coordinates[1],
            item.location.coordinates[0]
          );
        }
        return {
          ...item,
          distanceKm
        };
      });

      // Sort by proximity
      listings.sort((a, b) => {
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm !== null) return -1;
        if (b.distanceKm !== null) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    } else {
      listings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Honest empty state when location query was provided but had zero matches
    if (listings.length === 0 && rawLocationQuery) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
        message: 'Is location ke liye abhi verified listing available nahi hai.'
      });
    }

    res.status(200).json({
      success: true,
      count: listings.length,
      data: listings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPublicListingBySlug = async (req, res) => {
  try {
    const listing = await PartnerListing.findOne({
      slug: req.params.slug,
      status: 'ACTIVE',
      isActive: true
    })
      .select('-verificationNotes -reviewedBy -__v -ownerUser')
      .populate('partner', 'businessName partnerType district city logo description')
      .populate('destination', 'name slug district location');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Marketplace listing not found.' });
    }

    res.status(200).json({ success: true, data: listing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
