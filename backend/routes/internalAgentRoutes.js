/**
 * Discovery Uttarakhand - Internal Agent Bridge Routes
 * Protected endpoints exclusively for the Python AI runtime (ai/).
 * Secured by header: X-Internal-Secret
 */
import express from 'express';
import Destination from '../models/Destination.js';
import Stay from '../models/Stay.js';
import Activity from '../models/Activity.js';
import Guide from '../models/Guide.js';
import PartnerListing from '../models/PartnerListing.js';
import WeatherAdapter from '../services/adapters/openMeteoAdapter.js';
import RoadAdvisoryAdapter from '../services/adapters/roadAdvisoryAdapter.js';
import TransitLiveAdapter from '../services/adapters/transitLiveAdapter.js';
import { BudgetEngine } from '../services/budgetEngine.js';
import { applyTripMutation, recalculateBudget } from '../services/tripMutationService.js';
import { resolveDestination } from '../services/destinationResolver.js';

const router = express.Router();

const INTERNAL_SECRET = process.env.INTERNAL_AGENT_SECRET || 'discovery_uttarakhand_internal_secret_9981';

// Internal Authentication Middleware
router.use((req, res, next) => {
  const secret = req.headers['x-internal-secret'];
  if (!secret || secret !== INTERNAL_SECRET) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid or missing X-Internal-Secret header'
    });
  }
  next();
});

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'internal-agent-bridge',
    timestamp: new Date().toISOString()
  });
});

// Canonical Destinations
router.get('/destinations', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;
    let query = {};
    if (q) {
      query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { district: { $regex: q, $options: 'i' } },
          { region: { $regex: q, $options: 'i' } }
        ]
      };
    }
    const destinations = await Destination.find(query)
      .select('name slug district region coordinates category bestTimeToVisit description')
      .limit(Number(limit))
      .lean();
    res.json({ success: true, count: destinations.length, data: destinations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verified Stays & Partner Stays
router.get('/stays', async (req, res) => {
  try {
    const { destination, tier, limit = 10 } = req.query;
    let query = {};
    if (destination) {
      query.$or = [
        { city: { $regex: destination, $options: 'i' } },
        { district: { $regex: destination, $options: 'i' } },
        { name: { $regex: destination, $options: 'i' } }
      ];
    }
    const stays = await Stay.find(query)
      .select('name title type location pricePerNight rating amenities images contact')
      .limit(Number(limit))
      .lean();

    // Also include verified partner homestays/hotels
    let partnerStays = [];
    try {
      partnerStays = await PartnerListing.find({
        status: 'ACTIVE',
        category: { $in: ['stay', 'homestay', 'hotel', 'resort'] },
        ...(destination ? { 'location.city': { $regex: destination, $options: 'i' } } : {})
      })
      .select('title category pricing location amenities rating')
      .limit(Number(limit))
      .lean();
    } catch (pErr) {
      // Non-blocking
    }

    res.json({
      success: true,
      count: stays.length + partnerStays.length,
      data: {
        curatedStays: stays,
        partnerListings: partnerStays
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Partner Listings (Marketplace)
router.get('/partner-listings', async (req, res) => {
  try {
    const { serviceType, destination, limit = 10 } = req.query;
    const query = { status: 'ACTIVE' };
    if (serviceType) {
      query.category = { $regex: serviceType, $options: 'i' };
    }
    if (destination) {
      query.$or = [
        { 'location.city': { $regex: destination, $options: 'i' } },
        { 'location.district': { $regex: destination, $options: 'i' } }
      ];
    }
    const listings = await PartnerListing.find(query)
      .populate('partner', 'businessName partnerType district city')
      .limit(Number(limit))
      .lean();

    res.json({ success: true, count: listings.length, data: listings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verified Activities
router.get('/activities', async (req, res) => {
  try {
    const { destination, category, limit = 10 } = req.query;
    const query = {};
    if (destination) {
      query.$or = [
        { name: { $regex: destination, $options: 'i' } },
        { district: { $regex: destination, $options: 'i' } },
        { region: { $regex: destination, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }
    const activities = await Activity.find(query).limit(Number(limit)).lean();
    res.json({ success: true, count: activities.length, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verified Guides
router.get('/guides', async (req, res) => {
  try {
    const { destination, limit = 10 } = req.query;
    const query = {};
    if (destination) {
      query.$or = [
        { location: { $regex: destination, $options: 'i' } },
        { specialties: { $regex: destination, $options: 'i' } }
      ];
    }
    const guides = await Guide.find(query).limit(Number(limit)).lean();
    res.json({ success: true, count: guides.length, data: guides });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Deterministic Budget Engine
router.post('/budget', (req, res) => {
  try {
    const { budget, durationDays = 3, travelers = 2, destination = 'Uttarakhand' } = req.body;
    const result = recalculateBudget(budget, durationDays, travelers);
    result.destination = destination;
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mountain Routing & Transit
router.post('/route', async (req, res) => {
  try {
    const { origin = 'Delhi', destination = 'Dehradun' } = req.body;
    const route = await TransitLiveAdapter.getRoute(origin, destination);
    res.json({ success: true, data: route });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Weather
router.get('/weather', async (req, res) => {
  try {
    const { location = 'Dehradun' } = req.query;
    const weather = await WeatherAdapter.getWeather(location);
    res.json({ success: true, data: weather });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Road Advisory
router.get('/road-advisory', async (req, res) => {
  try {
    const { destination = 'Uttarakhand' } = req.query;
    const advisory = await RoadAdvisoryAdapter.getAdvisory(destination);
    res.json({ success: true, data: advisory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Deterministic Trip Mutation (Rollback & Diff validation)
router.post('/trip-mutation', async (req, res) => {
  try {
    const { state, mutation, options } = req.body;
    const result = await applyTripMutation(state, mutation, options || {});
    res.json({ success: result.success, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
