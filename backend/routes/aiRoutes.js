/**
 * Discovery Uttarakhand — AI Trip Planner Routes
 * Exposes POST /api/ai/plan with rate limiting and payload validation.
 */

import express from 'express';
import { generatePlan, getAiHealth } from '../controllers/aiController.js';

const router = express.Router();

// Lightweight in-memory rate limiter for AI reasoning endpoint (30 requests / 15 mins per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 30;

const aiRateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  const record = rateLimitMap.get(clientIp);
  if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientIp, { count: 1, startTime: now });
    return next();
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded: Maximum 30 AI planning requests per 15-minute window. Please try again later.'
    });
  }

  record.count += 1;
  next();
};

// Safe AI Provider Health check
router.get('/health', getAiHealth);

// Mount planning route
router.post('/plan', aiRateLimiter, generatePlan);

export default router;
