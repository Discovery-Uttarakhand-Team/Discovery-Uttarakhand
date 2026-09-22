/**
 * Discovery Uttarakhand — AI Controller
 * Handles POST /api/ai/plan with strict multi-tenant ownership enforcement,
 * transient planning support, and payload boundary sanitization.
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import SavedTrip from '../models/SavedTrip.js';
import { AiContextBuilder } from '../services/aiContextBuilder.js';
import { AiPlannerService } from '../services/aiPlannerService.js';

export const generatePlan = async (req, res) => {
  try {
    const { tripId, tripData, provider } = req.body;

    let targetTripData = null;

    // ─────────────────────────────────────────────────────────────
    // Mode A: SAVED TRIP (Authentication & Ownership Enforced)
    // ─────────────────────────────────────────────────────────────
    if (tripId) {
      // 1. Authenticate user via JWT header
      let token = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to generate AI insights for a saved trip.'
        });
      }

      let decodedUser = null;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        decodedUser = await User.findById(decoded.id).select('-password');
      } catch (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired session token.'
        });
      }

      if (!decodedUser) {
        return res.status(401).json({
          success: false,
          message: 'User session not found.'
        });
      }

      // 2. Fetch trip and verify ownership
      const savedTrip = await SavedTrip.findById(tripId)
        .populate('destinations')
        .populate('activities')
        .populate('stays');

      if (!savedTrip) {
        return res.status(404).json({
          success: false,
          message: 'Saved trip not found.'
        });
      }

      // Strict ownership check
      if (savedTrip.user && !savedTrip.user.equals(decodedUser._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to access this trip.'
        });
      }

      targetTripData = savedTrip.toObject();
    } 
    // ─────────────────────────────────────────────────────────────
    // Mode B: TRANSIENT TRIP (Public Planner Draft — No DB Persistence)
    // ─────────────────────────────────────────────────────────────
    else {
      if (!tripData || typeof tripData !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Either tripId or a valid tripData object must be provided.'
        });
      }

      // Validate transient input limits
      const durationDays = parseInt(tripData.duration) || 7;
      if (durationDays > 14) {
        return res.status(400).json({
          success: false,
          message: 'Trip duration cannot exceed 14 days.'
        });
      }

      const travelersCount = parseInt(tripData.travelers) || 2;
      if (travelersCount > 20) {
        return res.status(400).json({
          success: false,
          message: 'Traveler count cannot exceed 20.'
        });
      }

      if (tripData.notes && String(tripData.notes).length > 500) {
        tripData.notes = String(tripData.notes).slice(0, 500);
      }

      targetTripData = tripData;
    }

    // ─────────────────────────────────────────────────────────────
    // Execute AI Reasoning Pipeline
    // ─────────────────────────────────────────────────────────────
    // 1. Build bounded context with allowlist
    const { context, allowlist } = await AiContextBuilder.buildContext(targetTripData);

    // 2. Generate grounded structured plan
    const { plan, meta } = await AiPlannerService.generatePlan(context, allowlist, { provider });

    return res.status(200).json({
      success: true,
      plan,
      meta
    });

  } catch (error) {
    console.error('[AI Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'An error occurred while generating the AI trip plan.'
    });
  }
};

/**
 * Safe AI Health Check
 * Does NOT leak keys or credentials. Returns active provider name, enabled state, and health flag.
 */
export const getAiHealth = async (req, res) => {
  try {
    const aiService = new AiPlannerService();
    const activeProvider = aiService.provider;
    const isHealthy = await activeProvider.isHealthy();
    return res.status(200).json({
      success: true,
      provider: activeProvider.name,
      enabled: activeProvider.name === 'omniroute' 
        ? (process.env.OMNIROUTE_ENABLED !== 'false' && Boolean(process.env.OMNIROUTE_API_KEY))
        : true,
      healthy: Boolean(isHealthy)
    });
  } catch (err) {
    return res.status(200).json({
      success: true,
      provider: 'deterministic',
      enabled: true,
      healthy: true
    });
  }
};

