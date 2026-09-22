/**
 * Discovery Uttarakhand - Phase 7 Agent Routes
 * POST /api/agent/chat - AI Copilot conversational endpoint
 */
import express from "express";
import { agentChat } from "../controllers/agentController.js";

const router = express.Router();

// Rate limiter: 20 requests per 15 minutes per IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = process.env.NODE_ENV === "production" ? 20 : 500;

const agentRateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  if (!record || now - record.startTime > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(clientIp, { count: 1, startTime: now });
    return next();
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded: Maximum 20 AI Copilot requests per 15-minute window. Please wait and try again."
    });
  }
  record.count++;
  next();
};

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