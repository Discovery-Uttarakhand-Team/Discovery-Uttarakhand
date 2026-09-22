/**
 * Discovery Uttarakhand - Phase 7 Agent Routes
 * POST /api/agent/chat - AI Copilot conversational endpoint
 */
import express from "express";
import rateLimit from "express-rate-limit";
import { agentChat } from "../controllers/agentController.js";

const router = express.Router();

// Rate limiter: 20 requests per 15 minutes per IP (production)
// Uses express-rate-limit instead of a custom map — prevents x-forwarded-for spoofing
const agentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 500,
  standardHeaders: true,   // Returns RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    message: "Rate limit exceeded: Maximum 20 AI Copilot requests per 15-minute window. Please wait and try again."
  },
  // Use req.ip which respects Express trust proxy setting (set in server.js)
  keyGenerator: (req) => req.ip
});

// Message length guard
const messageLengthGuard = (req, res, next) => {
  const msg = req.body?.message;
  if (msg && String(msg).length > 2000) {
    return res.status(400).json({ success: false, message: "Message too long. Maximum 2000 characters." });
  }
  next();
};

router.post("/chat", agentRateLimiter, messageLengthGuard, agentChat);

export default router;