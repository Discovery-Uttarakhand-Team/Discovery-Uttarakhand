# DISCOVERY UTTARAKHAND — PRODUCTION ENVIRONMENT VARIABLES SPECIFICATION
**Document:** `docs/PRODUCTION_ENV.md`  
**Security Rule:** NEVER print or commit actual credentials. This document lists variable names and specifications only.

---

## 1. Backend Environment Variables (`backend/.env`)

| Variable Name | Required? | Category | Description | Example / Recommended Value |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **YES** | System | Environment mode | `production` |
| `PORT` | **YES** | System | HTTP server listening port | `5000` |
| `FRONTEND_URL` | **YES** | Security | Allowed origin(s) for CORS. Comma-separate for multiple domains. | `https://discoveryuttarakhand.in,https://www.discoveryuttarakhand.in` |
| `JWT_SECRET` | **YES** | Security | HMAC key for signing user & partner authentication tokens | 64-character random hex string |
| `MONGODB_URI` / `MONGO_URI` | **YES** | Database | MongoDB Atlas connection string | `mongodb+srv://<USER>:<PASS>@<CLUSTER>.mongodb.net/<DB>?retryWrites=true&w=majority` |
| `CLOUDINARY_CLOUD_NAME` | OPTIONAL | Media | Cloudinary account cloud name | Alphanumeric name |
| `CLOUDINARY_API_KEY` | OPTIONAL | Media | Cloudinary public API key | Numeric string |
| `CLOUDINARY_API_SECRET` | OPTIONAL | Media | Cloudinary private secret key | Secret token (server-side only) |
| `AI_PROVIDER` | OPTIONAL | AI | Primary reasoning provider override (`omniroute`, `gemini`, `openai`, `deterministic`) | `gemini` (in cloud) or `omniroute` (with hosted gateway) |
| `OMNIROUTE_ENABLED` | OPTIONAL | AI | Toggle OmniRoute integration | `true` or `false` |
| `OMNIROUTE_BASE_URL` | OPTIONAL | AI | OmniRoute gateway base URL | `https://omniroute.yourdomain.com/v1` (Never use localhost on cloud!) |
| `OMNIROUTE_API_KEY` | OPTIONAL | AI | OmniRoute gateway authorization token | Secret token |
| `OMNIROUTE_MODEL` | OPTIONAL | AI | Model tag passed to OmniRoute | `auto` |
| `GEMINI_ENABLED` | OPTIONAL | AI | Toggle Google Gemini integration | `true` |
| `GEMINI_API_KEY` | OPTIONAL | AI | Google Gemini API key | `AIzaSy...` |
| `GEMINI_MODEL` | OPTIONAL | AI | Gemini model identifier | `gemini-1.5-flash` |
| `OPENAI_ENABLED` | OPTIONAL | AI | Toggle OpenAI integration | `false` |
| `OPENAI_API_KEY` | OPTIONAL | AI | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | OPTIONAL | AI | OpenAI model name | `gpt-4o-mini` |
| `WEB3_RPC_URL` | OPTIONAL | Web3 | JSON-RPC provider endpoint | `https://polygon-amoy.g.alchemy.com/v2/...` |
| `WEB3_ADMIN_PRIVATE_KEY` | OPTIONAL | Web3 | Operator wallet private key for on-chain proof logging | 64-character hex string (NEVER expose to frontend) |
| `WEB3_PARTNER_VERIFICATION_ADDRESS` | OPTIONAL | Web3 | Deployed PartnerVerification contract address | `0x...` (42 chars) |
| `WEB3_VEHICLE_REGISTRY_ADDRESS` | OPTIONAL | Web3 | Deployed VehicleRegistry contract address | `0x...` (42 chars) |
| `RAZORPAY_KEY_ID` | OPTIONAL | Payments | Razorpay API Key ID (Staged / Phase 8) | `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | OPTIONAL | Payments | Razorpay Secret | Secret string |

---

## 2. Frontend Environment Variables (`Frontend/.env`)

| Variable Name | Required? | Description | Example Value |
| :--- | :--- | :--- | :--- |
| `VITE_API_BASE_URL` | **YES** | Root endpoint of backend API | `https://api.discoveryuttarakhand.in/api` |
| `VITE_API_URL` | OPTIONAL | Alias for `VITE_API_BASE_URL` | `https://api.discoveryuttarakhand.in/api` |
| `VITE_MAP_TILE_URL` | OPTIONAL | Custom Leaflet map tile URL | `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png` |
| `VITE_MAP_ATTRIBUTION`| OPTIONAL | Custom Leaflet attribution string | `© OpenStreetMap contributors © CARTO` |

---

## 3. Strict Security Rules
1. **No Backend Secrets in Vite**: NEVER prefix backend secrets with `VITE_`. Any variable starting with `VITE_` is baked into client-side javascript bundles and visible in browser devtools.
2. **No MongoDB or Private Keys in Git**: Git will reject commits containing `.env` or `.env.production`.
3. **Rotation Protocol**: If any key is inadvertently exposed in logs or commits, immediately regenerate it in the respective provider dashboard.
