import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { validateEnv } from './config/envValidator.js';
import destinationRoutes from './routes/destinationRoutes.js';
import spiritualRoutes from './routes/spiritualRoutes.js';
import cultureRoutes from './routes/cultureRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import rentalRoutes from './routes/rentalRoutes.js';
import stayRoutes from './routes/stayRoutes.js';
import guideRoutes from './routes/guideRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import transportRoutes from './routes/transportRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import marketplaceRoutes from './routes/marketplaceRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import liveDataRoutes from './routes/liveDataRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import internalAgentRoutes from './routes/internalAgentRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';

// Validate production environment variables
validateEnv();

// Connect to MongoDB
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();

// Middleware - allow cross-origin resource policy so uploaded images can be loaded from frontend port
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

let allowedOrigins = true;
if (process.env.NODE_ENV === 'production') {
  if (process.env.FRONTEND_URL) {
    const rawOrigins = process.env.FRONTEND_URL.split(',').map(u => u.trim());
    allowedOrigins = (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server, SSE)
      if (!origin) return callback(null, true);
      if (rawOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy blocked access from origin: ${origin}`));
    };
  } else {
    console.warn('[SECURITY WARNING] FRONTEND_URL is not configured in production mode.');
    allowedOrigins = false;
  }
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Serve static uploaded assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// We need raw body for Stripe/Razorpay webhooks
app.use('/api/payments/webhook/razorpay', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '2mb' })); // Limit JSON payloads to 2MB to prevent large payload DoS

// Routes
app.use('/api/destinations', destinationRoutes);
app.use('/api/spiritual', spiritualRoutes);
app.use('/api/culture', cultureRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/stays', stayRoutes);
app.use('/api/guides', guideRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/transports', transportRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/partner', partnerRoutes); // Canonical singular alias
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/live', liveDataRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/internal/agent', internalAgentRoutes);

// Liveness & Application Health Check
app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isCloudinaryConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
  const activeAi = (process.env.AI_PROVIDER || (process.env.OMNIROUTE_API_KEY ? 'omniroute' : (process.env.GEMINI_API_KEY ? 'gemini' : 'deterministic'))).toLowerCase();

  res.status(200).json({
    success: true,
    message: 'Discovery Uttarakhand API process is alive',
    status: isMongoConnected ? 'healthy' : 'degraded',
    services: {
      database: isMongoConnected ? 'connected' : 'disconnected',
      ai: 'available',
      aiProvider: activeAi,
      cloudinary: isCloudinaryConfigured ? 'configured' : 'local_fallback'
    },
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Liveness probe (container orchestrators)
app.get('/api/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Readiness probe (checks DB readiness)
app.get(['/api/health/ready', '/api/ready'], (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  if (isMongoConnected) {
    res.status(200).json({ success: true, status: 'ready', message: 'API is ready to receive traffic' });
  } else {
    res.status(503).json({ success: false, status: 'not_ready', message: 'API is not ready (Database disconnected)' });
  }
});

// Basic error handling for unknown routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API route not found'
  });
});

// Advanced error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('Discovery Uttarakhand API');
  console.log(`Server running on port ${PORT}`);
});
