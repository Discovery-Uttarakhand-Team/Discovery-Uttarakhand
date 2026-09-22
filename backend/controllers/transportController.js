import Transport from '../models/Transport.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load static seed data if DB collection is not yet populated
const loadSeedTransports = () => {
  try {
    const seedPath = path.join(__dirname, '../seed/transports.json');
    if (fs.existsSync(seedPath)) {
      const data = fs.readFileSync(seedPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading static seed transports:', err);
  }
  return [];
};

/**
 * @desc Get all verified transports with optional filters
 * @route GET /api/transports
 * @access Public
 */
export const getTransports = async (req, res) => {
  try {
    const { mode, routingType, origin, destination } = req.query;
    const filter = {};

    if (mode) filter.mode = new RegExp(mode, 'i');
    if (routingType) filter.routingType = routingType;
    if (origin) filter['origin.name'] = new RegExp(origin, 'i');
    if (destination) filter['destination.name'] = new RegExp(destination, 'i');

    let transports = await Transport.find(filter).lean();

    // If MongoDB doesn't have records yet, fallback to seed file
    if (!transports || transports.length === 0) {
      const seedData = loadSeedTransports();
      transports = seedData.filter(item => {
        if (mode && !new RegExp(mode, 'i').test(item.mode)) return false;
        if (routingType && item.routingType !== routingType) return false;
        if (origin && !new RegExp(origin, 'i').test(item.origin.name)) return false;
        if (destination && !new RegExp(destination, 'i').test(item.destination.name)) return false;
        return true;
      });
    }

    res.status(200).json({
      success: true,
      count: transports.length,
      data: transports
    });
  } catch (error) {
    console.error('getTransports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transport registry records',
      error: error.message
    });
  }
};

/**
 * @desc Query transports for a specific corridor
 * @route GET /api/transports/corridor
 * @access Public
 */
export const getCorridorTransports = async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Origin (from) and Destination (to) query parameters are required'
      });
    }

    const query = {
      $or: [
        {
          'origin.name': new RegExp(from, 'i'),
          'destination.name': new RegExp(to, 'i')
        },
        {
          stops: { $all: [new RegExp(from, 'i'), new RegExp(to, 'i')] }
        }
      ]
    };

    let results = await Transport.find(query).lean();

    if (!results || results.length === 0) {
      const seedData = loadSeedTransports();
      results = seedData.filter(item => {
        const matchDirect = new RegExp(from, 'i').test(item.origin.name) && new RegExp(to, 'i').test(item.destination.name);
        const matchStops = Array.isArray(item.stops) &&
          item.stops.some(s => new RegExp(from, 'i').test(s)) &&
          item.stops.some(s => new RegExp(to, 'i').test(s));
        return matchDirect || matchStops;
      });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('getCorridorTransports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to query corridor transports',
      error: error.message
    });
  }
};
