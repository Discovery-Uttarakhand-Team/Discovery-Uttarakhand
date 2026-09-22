# DISCOVERY UTTARAKHAND — PRODUCTION DEPLOYMENT ARCHITECTURE
**Document:** `docs/DEPLOYMENT_ARCHITECTURE.md`  
**Target Environment:** Cloud Production (Vercel/Render/Atlas/Cloudinary)  

---

## 1. System Topology Diagram

```
                              🌍 USERS (Browsers / Mobile)
                                          │
                                       HTTPS (TLS 1.3)
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │                                             │
                   ▼                                             ▼
       ┌────────────────────────┐                   ┌────────────────────────┐
       │     FRONTEND HOST      │                   │     CDN / CACHING      │
       │      React + Vite      │                   │   Static Assets & Map  │
       │    (Vercel/Netlify/    │                   │   Tiles (CARTO/OSM)    │
       │     Docker Nginx)      │                   └────────────────────────┘
       └───────────┬────────────┘
                   │
              HTTPS REST / SSE Streaming
              (CORS restricted to FRONTEND_URL)
                   │
                   ▼
       ┌────────────────────────┐
       │     BACKEND SERVER     │
       │     Node.js + Express  │
       │  (Render / Railway /   │
       │     AWS ECS / VPS)     │
       └───────────┬────────────┘
                   │
    ┌──────────────┼──────────────────────────┬────────────────────────┐
    │              │                          │                        │
    ▼              ▼                          ▼                        ▼
┌────────────┐ ┌──────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  DATABASE  │ │ MEDIA ASSETS │      │   AI GATEWAY    │      │  EXTERNAL DATA  │
│  MongoDB   │ │  Cloudinary  │      │    OmniRoute    │      │  & ADAPTERS     │
│   Atlas    │ │  (Signed     │      │   / Gemini /    │      │                 │
│  Cluster   │ │   Uploads)   │      │     OpenAI      │      │ • Open-Meteo    │
└────────────┘ └──────────────┘      └────────┬────────┘      │ • OSRM Routing  │
                                              │               │ • UTC / IRCTC   │
                                     ┌────────▼────────┐      └─────────────────┘
                                     │  Deterministic  │
                                     │    Fallback     │
                                     │    Provider     │
                                     └─────────────────┘
```

---

## 2. Component Roles & Specifications

### 2.1 Frontend (React + Vite)
- **Deployment Targets**: Vercel (recommended for zero-config SPA), Netlify, or Dockerized Nginx Alpine container.
- **Routing**: Client-side React Router DOM with SPA fallback redirect (`/* -> index.html`).
- **Environment**: Configured via `VITE_API_BASE_URL`.
- **Assets**: Minified, hashed, and compressed chunks. Leaflet map tiles fetched directly from CARTO Voyager CDN (no backend proxy needed).

### 2.2 Backend (Node.js + Express)
- **Deployment Targets**: Render, Railway, Fly.io, or AWS ECS with Node 20 / Docker.
- **Protocol**: HTTP/2 or HTTPS reverse proxy with real-time SSE support.
- **Security Headers**: Helmet, rate limiting per IP, strict origin whitelist for CORS.
- **Health Probes**:
  - `GET /api/health` -> System overview & service statuses.
  - `GET /api/health/live` -> Process liveness.
  - `GET /api/health/ready` -> Database readiness check.
  - `GET /api/ai/health` -> AI provider status.

### 2.3 MongoDB Atlas
- **Topology**: Replica set cluster on AWS/GCP (M0 for staging, M10+ for production).
- **Access Control**: Network Access restricted to Backend server static IP / NAT Gateway.
- **Indexing**: 2dsphere spatial indexes for geospatial queries; compound indexes on bookings, listings, and chats.

### 2.4 Cloudinary Media Store
- **Security**: Direct frontend uploads are disabled. All uploads authenticate via JWT to `POST /api/upload`, validate MIME types and sizes (5MB), and pipe securely to Cloudinary.

### 2.5 AI Reasoning & Copilot Engine
- **Gateway**: OmniRoute (Hosted Private HTTPS) or Direct Google Gemini (`gemini-1.5-flash`).
- **Resilience**: Automatic degradation to `DeterministicFallbackProvider` ensuring zero downtime and 100% grounded itineraries.
- **Streaming**: Native Server-Sent Events (SSE) with `X-Accel-Buffering: no` for real-time word-by-word streaming without buffering.

### 2.6 Web3 Blockchain Registry
- **Status**: **STAGING / NOT PRODUCTION READY**.
- Local Hardhat network runs on `127.0.0.1:8545`. When deploying to Ethereum/Polygon mainnet or testnet, configure `WEB3_RPC_URL`, deployed contract addresses, and deployer key. Web3 failures degrade safely and do not halt traditional web bookings.
