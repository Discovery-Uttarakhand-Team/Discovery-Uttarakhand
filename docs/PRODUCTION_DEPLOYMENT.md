# Discovery Uttarakhand - Production Deployment Guide

## 1. Prerequisites
- Node.js v18+
- MongoDB instance (MongoDB Atlas Recommended)
- Razorpay Production Account
- Web3 RPC Provider (e.g. Infura/Alchemy) if blockchain anchor is enabled
- Cloudinary Account (for image uploads)
- Domain names with SSL (e.g. Let's Encrypt / Cloudflare)

## 2. Environment Variables
**MANDATORY FOR PRODUCTION:**
- `NODE_ENV=production`
- `MONGO_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

**Frontend Requirements (build time):**
- `VITE_API_URL`
- `VITE_RAZORPAY_KEY_ID`

## 3. MongoDB Setup
- Ensure IP access list restricts connections only to production servers.
- Indexes are automatically created by Mongoose, but verify performance for scale.

## 4. Backend Deployment
```bash
npm install
npm run start
```
- We strongly recommend using PM2 or Docker.

## 5. Frontend Deployment
```bash
npm install
npm run build
```
- Serve the `dist` folder using Nginx or Vercel/Netlify. Ensure history API fallback is configured for SPA routing.

## 6. CORS Configuration
- In production, CORS strictly allows only the URL specified in `FRONTEND_URL`. Ensure this perfectly matches your deployed domain.

## 7. Razorpay Configuration
- Update keys in backend environment.
- Register Webhook URL: `https://api.yourdomain.com/api/payments/webhook/razorpay`
- Subscribe to: `payment.captured`, `payment.authorized`, `payment.failed`.

## 8. Webhook Deployment Safety
- **CRITICAL:** Webhooks must hit `express.raw` parser before any generic JSON parsing. This is configured natively in `server.js`. DO NOT add JSON parsers before this route.

## 9. Rollback Procedure
- If an update fails, revert to the previous Git tag.
- Ensure database migrations are backwards compatible. The current data layer relies strictly on append-only patterns.

## 10. Post-Deployment Smoke Tests
1. Verify `GET /api/health` returns `200 OK`.
2. Verify `GET /api/ready` returns `200 OK`.
3. Test login flow.
4. Verify AI planner generation.
5. Create a test booking and navigate to payment flow.
