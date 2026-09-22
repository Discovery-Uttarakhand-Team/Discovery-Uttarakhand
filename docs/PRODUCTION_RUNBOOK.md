# DISCOVERY UTTARAKHAND — PRODUCTION DEPLOYMENT RUNBOOK
**Document:** `docs/PRODUCTION_RUNBOOK.md`  
**Step-by-Step Operator Guide for Live Production Deployment**

---

### STEP 1: Provision MongoDB Atlas Database
1. Log into [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create an M0/M10 cluster in region `ap-south-1` (Mumbai) for low latency.
3. Under **Database Access**, create a user `discovery_app` with `readWriteAnyDatabase` or scoped to `discovery_uttarakhand`.
4. Under **Network Access**, add the IP address of your cloud backend host (or `0.0.0.0/0` temporarily with strong password authentication).
5. Copy the connection string:
   `mongodb+srv://discovery_app:<PASSWORD>@cluster0.xxxxx.mongodb.net/discovery_uttarakhand?retryWrites=true&w=majority`

---

### STEP 2: Configure Cloudinary Media Bucket
1. Create a Cloudinary account.
2. Under Settings -> Product Environments, note down:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. Verify that the upload preset or API upload folder is permitted.

---

### STEP 3: Configure AI Reasoning Provider
Choose your production strategy:
- **Direct Gemini (Recommended for simplest cloud deployment)**:
  - Generate an API key at [Google AI Studio](https://aistudio.google.com/).
  - Set `AI_PROVIDER=gemini`, `GEMINI_API_KEY=AIzaSy...`, `GEMINI_MODEL=gemini-1.5-flash`.
- **Hosted OmniRoute (For private enterprise gateway)**:
  - Deploy OmniRoute to a secure cloud VM with HTTPS.
  - Set `OMNIROUTE_BASE_URL=https://omniroute.yourdomain.com/v1` and `OMNIROUTE_API_KEY`.
- **Deterministic Offline Fallback**:
  - Always active as a guaranteed fallback if external keys are missing or exhausted.

---

### STEP 4: Configure Web3 Verification (Optional)
- For local testing, Hardhat is used.
- For staging/production, deploy `PartnerVerification.sol` and `VehicleRegistry.sol` to Polygon Amoy or Sepolia testnet using Hardhat.
- Set `WEB3_RPC_URL`, `WEB3_ADMIN_PRIVATE_KEY`, and contract addresses.
- *Note: If omitted, the application operates normally with Web2 verification.*

---

### STEP 5: Deploy Backend
1. **Target: Render / Railway / Docker**:
   - Repository: `https://github.com/MaTrix-Mahesh/discover_uttarakhand.git`
   - Root Directory: `backend` (or build using `backend/Dockerfile`)
   - Build Command: `npm ci --omit=dev`
   - Start Command: `node server.js`
2. **Set Environment Variables in Host Dashboard**:
   ```env
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://discoveryuttarakhand.in,https://www.discoveryuttarakhand.in
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=<strong-random-hex>
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   AI_PROVIDER=gemini
   GEMINI_API_KEY=...
   ```
3. Deploy and note the public URL (e.g. `https://api.discoveryuttarakhand.in`).

---

### STEP 6: Verify Backend Health
Run the following curl commands against your deployed backend:
```bash
# 1. Process liveness
curl -i https://api.discoveryuttarakhand.in/api/health/live

# 2. Database readiness
curl -i https://api.discoveryuttarakhand.in/api/health/ready

# 3. Comprehensive service status
curl -i https://api.discoveryuttarakhand.in/api/health

# 4. AI provider status
curl -i https://api.discoveryuttarakhand.in/api/ai/health
```
Ensure HTTP 200 responses with `"status": "healthy"` and `"database": "connected"`.

---

### STEP 7: Seed Database (First-time deployment)
From a secure operator terminal:
```bash
cd backend
MONGODB_URI="mongodb+srv://..." node scripts/seed.js
```
*Creates initial destination catalogs, activities, transports, and demo partner accounts.*

---

### STEP 8: Deploy Frontend
1. **Target: Vercel / Netlify / Cloudflare Pages**:
   - Root Directory: `Frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. **Configure Environment Variable**:
   ```env
   VITE_API_BASE_URL=https://api.discoveryuttarakhand.in/api
   ```
3. Ensure SPA redirect rule is active (in Vercel, `vercel.json` rewrites `/* -> /index.html`; in Netlify, `_redirects` has `/* /index.html 200`).

---

### STEP 9: End-to-End Production Verification Checklist
- [ ] **Home Page**: Loads destinations with CARTO map tiles.
- [ ] **Trip Planner**: Auto-fills from prompt and generates multi-day itinerary.
- [ ] **Weather & Elevation**: Pulls live data from Open-Meteo for Badrinath/Kedarnath.
- [ ] **AI Copilot (SSE Streaming)**: Real-time responses stream without buffering delay.
- [ ] **Registration & Login**: Issues valid JWT; profile displays user state.
- [ ] **Partner Dashboard**: Partner logins at `/partner` view exclusively their own listings & bookings.
- [ ] **Multi-Tenant Isolation**: Partner B cannot see Partner A's bookings or modify listings.
- [ ] **Admin Console**: Verifies partner KYC and vehicle permits.
