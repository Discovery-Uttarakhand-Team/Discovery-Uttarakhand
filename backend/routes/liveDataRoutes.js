import express from 'express';
import {
  getWeather,
  getElevation,
  getRoadAdvisories,
  listRoadBulletins,
  createRoadBulletin,
  getTransitStatus,
  evaluateTripAdvisories
} from '../controllers/liveDataController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/weather', getWeather);
router.get('/elevation', getElevation);
router.get('/road-advisories', getRoadAdvisories);
router.get('/bulletins', listRoadBulletins);
router.get('/transit', getTransitStatus);
router.post('/advisories/evaluate', evaluateTripAdvisories);

// Protected administrative routes
router.post('/admin/bulletins', protect, adminOnly, createRoadBulletin);

export default router;
