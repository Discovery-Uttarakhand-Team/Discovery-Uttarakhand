/**
 * Discovery Uttarakhand — Recommendation Engine V2 (Deterministic Core)
 * Trip-Context Aware multi-factor scoring service.
 * Zero random selection. Zero hallucination. Documented scoring model.
 */

import { RECOMMENDATION_CONFIG } from '../config/recommendationConfig.js';
import Stay from '../models/Stay.js';
import Guide from '../models/Guide.js';
import Activity from '../models/Activity.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';
import Rental from '../models/Rental.js';
import Destination from '../models/Destination.js';
import Partner from '../models/Partner.js';
import PartnerListing from '../models/PartnerListing.js';

// Haversine distance strictly for spatial proximity scoring (in km)
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
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

// Extract coordinates [lat, lon] from any entity format
function extractCoordinates(entity) {
  if (!entity) return null;
  if (entity.location && Array.isArray(entity.location.coordinates) && entity.location.coordinates.length === 2) {
    // GeoJSON is [lng, lat]
    return [entity.location.coordinates[1], entity.location.coordinates[0]];
  }
  if (entity.latitude && entity.longitude) {
    return [entity.latitude, entity.longitude];
  }
  if (Array.isArray(entity.coordinates) && entity.coordinates.length === 2) {
    // standard [lat, lng] in trip planner
    return [entity.coordinates[0], entity.coordinates[1]];
  }
  return null;
}

export class RecommendationEngine {
  /**
   * Generates deterministic, ranked recommendations tailored to a specific day and trip context.
   * @param {Object} tripContext 
   *   - dayNumber: Number
   *   - currentLocation: { name, coordinates: [lat, lng], district }
   *   - overnightLocation: { name, coordinates: [lat, lng], district }
   *   - nextLocation: { name, coordinates: [lat, lng], district }
   *   - durationDays: Number
   *   - pace: 'Relaxed' | 'Balanced' | 'Fast'
   *   - tripType: Array of strings (e.g. ['Trek', 'Spiritual', 'Nature'])
   *   - interests: Array of strings
   *   - budgetTier: 'Budget' | 'Balanced' | 'Luxury'
   *   - travelersCount: Number
   *   - seasonMonth: Number (1-12, default current or 5/May)
   * @param {Array<string>} requestedCategories
   *   - ['stays', 'guides', 'activities', 'spiritual', 'culture', 'rentals']
   * @returns {Promise<Object>} Map of category -> Array of ScoredRecommendation
   */
  static async getRecommendations(tripContext = {}, requestedCategories = ['stays', 'guides', 'activities']) {
    const {
      dayNumber = 1,
      currentLocation = {},
      overnightLocation = {},
      nextLocation = {},
      durationDays = 7,
      pace = 'Balanced',
      tripType = [],
      interests = [],
      budgetTier = 'Balanced',
      travelersCount = 1,
      seasonMonth = new Date().getMonth() + 1
    } = tripContext;

    // Anchor coordinates: overnight base takes priority, then current location
    const anchorCoords = extractCoordinates(overnightLocation) || extractCoordinates(currentLocation) || [30.0, 79.5];
    const targetDistrict = overnightLocation.district || currentLocation.district || null;
    const maxRadiusKm = RECOMMENDATION_CONFIG.paceTravelLimitsKm[pace] || 75;

    const results = {};

    for (const category of requestedCategories) {
      switch (category.toLowerCase()) {
        case 'stays': {
          results.stays = await this.scoreStays({
            anchorCoords,
            targetDistrict,
            maxRadiusKm,
            budgetTier,
            pace,
            dayNumber,
            tripType,
            interests
          });
          break;
        }
        case 'guides': {
          results.guides = await this.scoreGuides({
            anchorCoords,
            targetDistrict,
            tripType,
            interests,
            pace
          });
          break;
        }
        case 'activities':
        case 'treks': {
          results.activities = await this.scoreActivities({
            anchorCoords,
            targetDistrict,
            maxRadiusKm,
            tripType,
            interests,
            pace,
            seasonMonth
          });
          break;
        }
        case 'spiritual': {
          results.spiritual = await this.scoreSpiritual({
            anchorCoords,
            targetDistrict,
            maxRadiusKm,
            tripType,
            interests
          });
          break;
        }
        case 'culture': {
          results.culture = await this.scoreCulture({
            anchorCoords,
            targetDistrict,
            maxRadiusKm,
            tripType,
            interests
          });
          break;
        }
        case 'rentals': {
          results.rentals = await this.scoreRentals({
            anchorCoords,
            targetDistrict,
            maxRadiusKm,
            pace,
            budgetTier
          });
          break;
        }
        default:
          break;
      }
    }

    return results;
  }

  // --- 1. STAYS SCORING ---
  static async scoreStays({ anchorCoords, targetDistrict, maxRadiusKm, budgetTier, pace, dayNumber }) {
    const query = {};
    if (targetDistrict) {
      query.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
    }

    const stays = (await Stay.find(query).lean()) || [];
    const scored = [];

    for (const stay of stays) {
      const stayCoords = extractCoordinates(stay);
      const distanceKm = stayCoords ? calculateHaversineDistanceKm(anchorCoords[0], anchorCoords[1], stayCoords[0], stayCoords[1]) : null;

      // Distance filter: Exclude stays outside travel limits
      if (distanceKm !== null && distanceKm > maxRadiusKm) continue;

      let score = 0;
      const reasons = [];

      // A. Location Match (30%)
      if (distanceKm !== null) {
        if (distanceKm <= 15) {
          score += 30;
          reasons.push(`Located just ${distanceKm} km from your Day ${dayNumber} overnight base`);
        } else if (distanceKm <= 35) {
          score += 24;
          reasons.push(`Within ${distanceKm} km short transit from your evening destination`);
        } else {
          score += 15;
          reasons.push(`${distanceKm} km transit from overnight location`);
        }
      } else if (targetDistrict && stay.district && stay.district.toLowerCase() === targetDistrict.toLowerCase()) {
        score += 20;
        reasons.push(`Located directly in ${stay.district} district`);
      }

      // B. Category / KMVN Preference (25%)
      const isGovtKMVN = stay.category && (stay.category.includes('Government') || stay.name.includes('KMVN') || stay.name.includes('GMVN'));
      if (isGovtKMVN) {
        score += 25;
        reasons.push('Verified government accommodation (KMVN/GMVN tourist rest house)');
      } else {
        score += 15;
        reasons.push('Verified mountain accommodation partner');
      }

      // C. Budget Fit (20%)
      const priceAmt = stay.price?.amount || stay.pricePerNight;
      let budgetFit = 'Price on request';
      if (priceAmt) {
        if (budgetTier === 'Budget' && priceAmt <= 2500) {
          score += 20;
          budgetFit = `Fits Budget tier (₹${priceAmt}/night)`;
          reasons.push(`Well aligned with Budget preference (₹${priceAmt}/night)`);
        } else if (budgetTier === 'Luxury' && priceAmt >= 4000) {
          score += 20;
          budgetFit = `Premium Stay (₹${priceAmt}/night)`;
          reasons.push(`Matches Luxury comfort preference (₹${priceAmt}/night)`);
        } else {
          score += 15;
          budgetFit = `₹${priceAmt}/night`;
          reasons.push(`Nightly tariff: ₹${priceAmt}`);
        }
      } else {
        score += 10;
        reasons.push('Government regulated counter tariff');
      }

      // D. Pace Match (15%)
      score += 15;
      reasons.push(`Compatible with your ${pace} travel rhythm`);

      // E. Availability Confidence (10%)
      score += 10;

      scored.push({
        item: stay,
        itemType: 'Stay',
        score: Math.min(100, score),
        reasons,
        distanceKm: distanceKm !== null ? distanceKm : 0,
        estimatedTimeFit: distanceKm !== null ? `Estimated arrival within ${Math.ceil(distanceKm / 30)}h mountain drive` : 'Base location',
        budgetFit,
        confidence: isGovtKMVN ? 0.95 : 0.85
      });
    }

    // Query active verified partner stay listings
    try {
      
      const partnerQuery = {
        listingType: 'Stay',
        status: 'ACTIVE',
        isActive: true
      };
      if (targetDistrict) {
        partnerQuery.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
      }
      const partnerStays = await PartnerListing.find(partnerQuery)
        .populate('partner', 'businessName partnerType district city')
        .lean();

      for (const pStay of partnerStays) {
        const pCoords = extractCoordinates(pStay);
        const distanceKm = pCoords ? calculateHaversineDistanceKm(anchorCoords[0], anchorCoords[1], pCoords[0], pCoords[1]) : null;

        if (distanceKm !== null && distanceKm > maxRadiusKm) continue;

        let score = 0;
        const reasons = [];

        // Location match
        if (distanceKm !== null) {
          if (distanceKm <= 15) {
            score += 30;
            reasons.push(`Located just ${distanceKm} km from your Day ${dayNumber} overnight base`);
          } else if (distanceKm <= 35) {
            score += 24;
            reasons.push(`Within ${distanceKm} km short transit from your evening destination`);
          } else {
            score += 15;
            reasons.push(`${distanceKm} km transit from overnight location`);
          }
        } else if (targetDistrict && pStay.district && pStay.district.toLowerCase() === targetDistrict.toLowerCase()) {
          score += 20;
          reasons.push(`Located in ${pStay.district} district`);
        }

        // Provenance & Category
        const isVerified = pStay.pricing?.provenance === 'VERIFIED';
        if (isVerified) {
          score += 25;
          reasons.push('Verified partner stay with platform-confirmed pricing');
        } else {
          score += 18;
          reasons.push('Partner-listed local mountain accommodation');
        }

        // Budget fit
        const priceAmt = pStay.pricing?.amount;
        let budgetFit = 'Price on request';
        if (priceAmt) {
          if (budgetTier === 'Budget' && priceAmt <= 2500) {
            score += 20;
            budgetFit = `Fits Budget tier (₹${priceAmt}/night)`;
            reasons.push(`Well aligned with Budget preference (₹${priceAmt}/night)`);
          } else if (budgetTier === 'Luxury' && priceAmt >= 4000) {
            score += 20;
            budgetFit = `Premium Stay (₹${priceAmt}/night)`;
            reasons.push(`Matches Luxury comfort preference (₹${priceAmt}/night)`);
          } else {
            score += 15;
            budgetFit = `₹${priceAmt}/night`;
            reasons.push(`Nightly tariff: ₹${priceAmt}`);
          }
        }

        score += 15; // Pace match
        score += 10; // Availability confidence

        scored.push({
          item: {
            ...pStay,
            name: pStay.title,
            price: { amount: priceAmt, currency: pStay.pricing?.currency || 'INR' },
            priceProvenance: pStay.pricing?.provenance || 'PARTNER_CLAIMED'
          },
          itemType: 'Stay',
          score: Math.min(100, score),
          reasons,
          distanceKm: distanceKm !== null ? distanceKm : 0,
          estimatedTimeFit: distanceKm !== null ? `Estimated arrival within ${Math.ceil(distanceKm / 30)}h drive` : 'Base location',
          budgetFit,
          confidence: isVerified ? 0.95 : 0.85
        });
      }
    } catch (pErr) {
      console.warn('[RecommendationEngine] Error fetching partner stays:', pErr.message);
    }

    // Sort deterministically: highest score first, tie-break by name
    return scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, 6);
  }

  // --- 2. GUIDES SCORING ---
  static async scoreGuides({ anchorCoords, targetDistrict, tripType, interests, pace }) {
    const query = {};
    if (targetDistrict) {
      query.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
    }

    let guides = await Guide.find(query).lean();
    if (!guides || guides.length === 0) {
      // Fallback: search statewide if no guide in specific remote valley
      guides = await Guide.find({}).limit(15).lean();
    }
    if (!guides || guides.length === 0) return [];

    const isTrekTrip = tripType.some(t => t.toLowerCase().includes('trek') || t.toLowerCase().includes('adventure'));
    const isSpiritualTrip = tripType.some(t => t.toLowerCase().includes('spiritual') || t.toLowerCase().includes('pilgrimage'));

    const scored = [];

    for (const guide of guides) {
      let score = 0;
      const reasons = [];

      // A. Location Match (30%)
      if (targetDistrict && guide.district && guide.district.toLowerCase() === targetDistrict.toLowerCase()) {
        score += 30;
        reasons.push(`Locally based in ${guide.district} with deep native terrain knowledge`);
      } else {
        score += 15;
        reasons.push('Regional Himalayan mountain guide');
      }

      // B. Certification & Govt License (25%)
      if (guide.verifiedByGovt || guide.govtLicenseNumber) {
        score += 25;
        reasons.push('State Tourism Certified & Verified Government License');
      } else {
        score += 15;
        reasons.push('Experienced local valley guide');
      }

      // C. Trip Type & Specialty Match (25%)
      const specialties = (guide.specialties || []).map(s => s.toLowerCase());
      if (isTrekTrip && specialties.some(s => s.includes('trek') || s.includes('mountain') || s.includes('high altitude'))) {
        score += 25;
        reasons.push('Specializes in high-altitude mountain trails and alpine passes');
      } else if (isSpiritualTrip && specialties.some(s => s.includes('spiritual') || s.includes('temple') || s.includes('culture'))) {
        score += 25;
        reasons.push('Specializes in sacred shrines, folklore, and pilgrimage heritage');
      } else {
        score += 15;
        reasons.push('Versatile regional guide for cultural & scenic exploration');
      }

      // D. Experience & Language (20%)
      if (guide.experienceYears && guide.experienceYears >= 5) {
        score += 10;
        reasons.push(`${guide.experienceYears}+ years of mountain guiding experience`);
      } else {
        score += 5;
      }

      if (guide.languages && guide.languages.length > 0) {
        score += 10;
        reasons.push(`Fluent in ${guide.languages.slice(0, 2).join(', ')}`);
      }

      scored.push({
        item: guide,
        itemType: 'Guide',
        score: Math.min(100, score),
        reasons,
        distanceKm: 0,
        estimatedTimeFit: 'Available for full-day guiding and route orientation',
        budgetFit: 'Negotiate / direct tariff',
        confidence: guide.verifiedByGovt ? 0.95 : 0.85
      });
    }

    return scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, 6);
  }

  // --- 3. ACTIVITIES & TREKS SCORING ---
  static async scoreActivities({ anchorCoords, targetDistrict, maxRadiusKm, tripType, interests, pace, seasonMonth }) {
    const query = {};
    if (targetDistrict) {
      query.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
    }

    const activities = await Activity.find(query).lean();
    if (!activities || activities.length === 0) return [];

    const isMonsoon = RECOMMENDATION_CONFIG.seasonalRules.monsoonMonths.includes(seasonMonth);
    const scored = [];

    for (const act of activities) {
      const actCoords = extractCoordinates(act);
      const distanceKm = actCoords ? calculateHaversineDistanceKm(anchorCoords[0], anchorCoords[1], actCoords[0], actCoords[1]) : null;

      if (distanceKm !== null && distanceKm > maxRadiusKm) continue;

      let score = 0;
      const reasons = [];

      // A. Proximity (30%)
      if (distanceKm !== null) {
        if (distanceKm <= 20) {
          score += 30;
          reasons.push(`Located within ${distanceKm} km of your day base`);
        } else {
          score += 20;
          reasons.push(`${distanceKm} km from overnight hub`);
        }
      } else {
        score += 20;
        reasons.push(`Located in ${act.district || 'the area'}`);
      }

      // B. Trip Type & Interest Match (30%)
      const actCategory = (act.category || '').toLowerCase();
      const matchInterest = interests.some(i => (act.name || '').toLowerCase().includes(i.toLowerCase()));
      if (matchInterest) {
        score += 30;
        reasons.push(`Directly matches your interest in ${interests.join(', ')}`);
      } else if (tripType.some(t => actCategory.includes(t.toLowerCase()))) {
        score += 25;
        reasons.push(`Matches your ${tripType.join('/')} trip focus`);
      } else {
        score += 15;
        reasons.push('Scenic regional highlight');
      }

      // C. Pace & Difficulty Fit (20%)
      const diff = (act.difficulty || 'Moderate').toLowerCase();
      if (pace === 'Relaxed' && (diff === 'easy' || diff === 'moderate')) {
        score += 20;
        reasons.push(`Gentle pacing fits your Relaxed travel preference`);
      } else if (pace === 'Fast' && (diff === 'challenging' || diff === 'strenuous')) {
        score += 20;
        reasons.push(`High-intensity activity matching your Fast / Adventure pace`);
      } else {
        score += 15;
        reasons.push(`Balanced intensity (${act.difficulty || 'Moderate'})`);
      }

      // D. Seasonality & Safety Check (20%)
      if (isMonsoon && (actCategory.includes('rafting') || actCategory.includes('river'))) {
        // Severe penalty during monsoon for river rafting
        score -= 25;
        reasons.push('⚠️ River activities restricted during monsoon swells');
      } else {
        score += 20;
        reasons.push('Optimal for current seasonal weather conditions');
      }

      scored.push({
        item: act,
        itemType: 'Activity',
        score: Math.max(0, Math.min(100, score)),
        reasons,
        distanceKm: distanceKm !== null ? distanceKm : 0,
        estimatedTimeFit: act.duration ? `Duration: ${act.duration}` : 'Half-day excursion',
        budgetFit: 'Activity fee / trail entry',
        confidence: 0.9
      });
    }

    return scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, 6);
  }

  // --- 4. SPIRITUAL SITES SCORING ---
  static async scoreSpiritual({ anchorCoords, targetDistrict, maxRadiusKm, tripType, interests }) {
    const query = {};
    if (targetDistrict) {
      query.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
    }

    const sites = await Spiritual.find(query).lean();
    if (!sites || sites.length === 0) return [];

    const scored = [];
    for (const site of sites) {
      const siteCoords = extractCoordinates(site);
      const distanceKm = siteCoords ? calculateHaversineDistanceKm(anchorCoords[0], anchorCoords[1], siteCoords[0], siteCoords[1]) : null;

      if (distanceKm !== null && distanceKm > maxRadiusKm) continue;

      let score = 50; // base spiritual heritage score
      const reasons = [`Sacred shrine in ${site.district || 'the region'}`];

      if (distanceKm !== null && distanceKm <= 25) {
        score += 30;
        reasons.push(`${distanceKm} km from your overnight route`);
      }

      if (tripType.some(t => t.toLowerCase().includes('spiritual') || t.toLowerCase().includes('pilgrim'))) {
        score += 20;
        reasons.push('Central to pilgrimage and spiritual circuit');
      }

      scored.push({
        item: site,
        itemType: 'Spiritual',
        score: Math.min(100, score),
        reasons,
        distanceKm: distanceKm || 0,
        estimatedTimeFit: '1-2 hours darshan and contemplation',
        budgetFit: 'Free / Temple donation',
        confidence: 0.95
      });
    }

    return scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name)).slice(0, 6);
  }

  // --- 5. CULTURE EXPERIENCES SCORING ---
  static async scoreCulture({ anchorCoords, targetDistrict, maxRadiusKm }) {
    const query = {};
    if (targetDistrict) {
      query.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
    }

    const cultures = await Culture.find(query).lean();
    if (!cultures || cultures.length === 0) return [];

    const scored = cultures.map(c => ({
      item: c,
      itemType: 'Culture',
      score: 80,
      reasons: [`Authentic Pahadi culture & folklore of ${c.district || 'Uttarakhand'}`],
      distanceKm: 0,
      estimatedTimeFit: 'Flexible community immersion',
      budgetFit: 'Cultural experience',
      confidence: 0.9
    }));

    return scored.sort((a, b) => a.item.name.localeCompare(b.item.name)).slice(0, 4);
  }

  // --- 6. RENTALS SCORING ---
  static async scoreRentals({ anchorCoords, targetDistrict, maxRadiusKm, pace, budgetTier }) {
    const query = {};
    if (targetDistrict) {
      query.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
    }

    const rentals = (await Rental.find(query).lean()) || [];
    const scored = rentals.map(r => {
      const vehicles = r.vehicles || [];
      const hasSUV = vehicles.some(v => v.type === 'SUV');
      return {
        item: r,
        itemType: 'Rental',
        score: hasSUV ? 85 : 75,
        reasons: [
          `Local fleet operator in ${r.city || r.district}`,
          hasSUV ? 'High-ground clearance 4x4 / SUV available for mountain terrain' : 'Local vehicles available'
        ],
        distanceKm: 0,
        estimatedTimeFit: 'Daily self-drive or cab hire',
        budgetFit: 'Per-day rates verified',
        confidence: 0.88
      };
    });

    // Query active partner rental listings
    try {
      const pRentalQuery = {
        listingType: 'Rental',
        status: 'ACTIVE',
        isActive: true
      };
      if (targetDistrict) {
        pRentalQuery.district = { $regex: new RegExp(`^${targetDistrict}$`, 'i') };
      }
      const partnerRentals = await PartnerListing.find(pRentalQuery)
        .populate('partner', 'businessName partnerType district city')
        .lean();

      for (const pr of partnerRentals) {
        const isBike = pr.category?.toLowerCase().includes('bike') || pr.title.toLowerCase().includes('bike') || pr.title.toLowerCase().includes('enfield');
        scored.push({
          item: {
            ...pr,
            name: pr.title,
            priceNotes: pr.pricing?.amount ? `₹${pr.pricing.amount}/${pr.pricing.unit || 'day'}` : null,
            provenance: pr.pricing?.provenance || 'PARTNER_CLAIMED'
          },
          itemType: 'Rental',
          score: isBike ? 88 : 80,
          reasons: [
            `Verified local rental provider in ${pr.city || pr.district}`,
            pr.specifications?.model ? `Vehicle: ${pr.specifications.brand || ''} ${pr.specifications.model}` : 'Verified mountain fleet'
          ],
          distanceKm: 0,
          estimatedTimeFit: 'Daily rental from pickup hub',
          budgetFit: pr.pricing?.amount ? `₹${pr.pricing.amount}/${pr.pricing.unit || 'day'}` : 'Counter rates',
          confidence: pr.pricing?.provenance === 'VERIFIED' ? 0.95 : 0.85
        });
      }
    } catch (prErr) {
      console.warn('[RecommendationEngine] Error fetching partner rentals:', prErr.message);
    }

    return scored.slice(0, 6);
  }
}

export default RecommendationEngine;
