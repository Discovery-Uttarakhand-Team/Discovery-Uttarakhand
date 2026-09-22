/**
 * Discovery Uttarakhand — Live Data & Safety Controller
 * Exposes endpoints for weather, road advisories, transit status, and trip safety evaluation.
 */

import OpenMeteoAdapter from '../services/adapters/openMeteoAdapter.js';
import RoadAdvisoryAdapter from '../services/adapters/roadAdvisoryAdapter.js';
import TransitLiveAdapter from '../services/adapters/transitLiveAdapter.js';
import AdvisoryEngine from '../services/advisoryEngine.js';
import RoadBulletin from '../models/RoadBulletin.js';
import SavedTrip from '../models/SavedTrip.js';

/**
 * @desc Get live mountain weather
 * @route GET /api/live/weather
 * @access Public
 */
export const getWeather = async (req, res) => {
  try {
    const { lat, lon, name, altitude, skipCache } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) and Longitude (lon) query parameters are required.'
      });
    }

    const envelope = await OpenMeteoAdapter.getWeather(lat, lon, {
      name,
      altitude: altitude ? parseInt(altitude, 10) : null,
      skipCache: skipCache === 'true'
    });

    return res.status(200).json({
      success: envelope.status !== 'UNAVAILABLE',
      data: envelope
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc Get elevation for a destination
 * @route GET /api/live/elevation
 * @access Public
 */
export const getElevation = async (req, res) => {
  try {
    const { lat, lon, name, skipCache } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        message: 'Latitude (lat) and Longitude (lon) query parameters are required.'
      });
    }

    const envelope = await OpenMeteoAdapter.getElevation(lat, lon, {
      name,
      skipCache: skipCache === 'true'
    });

    return res.status(200).json({
      success: envelope.status !== 'UNAVAILABLE',
      data: envelope
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * @desc Get road advisory for a corridor or highway
 * @route GET /api/live/road-advisories
 * @access Public
 */
export const getRoadAdvisories = async (req, res) => {
  try {
    const { corridor, highway, district, skipCache } = req.query;

    const envelope = await RoadAdvisoryAdapter.getAdvisory({
      corridor,
      highway,
      district,
      skipCache: skipCache === 'true'
    });

    return res.status(200).json({
      success: true,
      data: envelope
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve road advisories',
      error: err.message
    });
  }
};

/**
 * @desc List all active state-wide road bulletins
 * @route GET /api/live/bulletins
 * @access Public
 */
export const listRoadBulletins = async (req, res) => {
  try {
    const bulletins = await RoadAdvisoryAdapter.listActiveBulletins();
    return res.status(200).json({
      success: true,
      count: bulletins.length,
      data: bulletins
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to list road bulletins',
      error: err.message
    });
  }
};

/**
 * @desc Create administrative road bulletin (Admin only)
 * @route POST /api/live/admin/bulletins
 * @access Private (Admin)
 */
export const createRoadBulletin = async (req, res) => {
  try {
    const {
      corridor,
      highway,
      district,
      roadStatus,
      restrictionType,
      severity,
      title,
      description,
      effectiveFrom,
      expiresAt,
      source,
      sourceUrl
    } = req.body;

    if (!corridor || !title || !description || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Corridor, title, description, and expiresAt are required.'
      });
    }

    const bulletin = await RoadBulletin.create({
      corridor,
      highway,
      district,
      roadStatus: roadStatus || 'OPEN',
      restrictionType: restrictionType || 'NONE',
      severity: severity || 'INFO',
      title,
      description,
      effectiveFrom: effectiveFrom || Date.now(),
      expiresAt: new Date(expiresAt),
      source: source || 'Border Roads Organisation (BRO) / UKSDMA',
      sourceUrl: sourceUrl || 'https://usdma.uk.gov.in/',
      createdBy: req.user?._id || null
    });

    return res.status(201).json({
      success: true,
      message: 'Road bulletin published successfully',
      data: bulletin
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: 'Failed to create road bulletin',
      error: err.message
    });
  }
};

/**
 * @desc Get transit live status
 * @route GET /api/live/transit
 * @access Public
 */
export const getTransitStatus = async (req, res) => {
  try {
    const { origin, destination, mode, skipCache } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Origin and destination query parameters are required.'
      });
    }

    const envelope = await TransitLiveAdapter.getTransitStatus({
      origin,
      destination,
      mode: mode || 'Bus',
      skipCache: skipCache === 'true'
    });

    return res.status(200).json({
      success: true,
      data: envelope
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to query transit live status',
      error: err.message
    });
  }
};

/**
 * @desc Evaluate live safety advisories for a trip
 * @route POST /api/live/advisories/evaluate
 * @access Public (accepts transient context or saved trip ID)
 */
export const evaluateTripAdvisories = async (req, res) => {
  try {
    let tripContext = req.body.tripContext;

    // If tripId provided, attempt to load saved trip if not supplied in body
    if (!tripContext && req.body.tripId) {
      const trip = await SavedTrip.findById(req.body.tripId)
        .populate('destinations')
        .lean();
      if (trip) {
        tripContext = trip;
      }
    }

    if (!tripContext) {
      return res.status(400).json({
        success: false,
        message: 'Trip context (tripContext) or valid tripId is required for advisory evaluation.'
      });
    }

    const result = await AdvisoryEngine.evaluateTrip(tripContext, {
      skipCache: req.body.skipCache === true
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to evaluate trip safety advisories',
      error: err.message
    });
  }
};
