# Discovery Uttarakhand (Official Travel Portal & Tourism Ecosystem)

> **Production-grade, Web3-attested, and Agentic AI-powered Travel Portal & Partner Marketplace for Uttarakhand.**

---

## 🌟 Key Capabilities & Architecture

- **🗺️ Interactive Trip Planner & Companion Workspace (`/trip-planner`, `/my-trip/:tripId`)**:
  - Leaflet-powered visual journey tracker with topographic, road, and satellite layers.
  - Multi-day route optimization across 105 canonical Uttarakhand destinations.
  - Real-time weather, road advisories, and mountain telemetry integration.
- **🤖 Grounded AI Travel Copilot (`/copilot`)**:
  - Agentic travel assistant grounded with local destination database and marketplace inventories.
  - Multi-provider AI Gateway (OmniRoute, Groq, Gemini, OpenAI).
  - Contextual action chips with dynamic budget calculation and route preview.
- **🏢 Partner / Business Owner Dashboard (`/partner`, `/partner/:tab`)**:
  - Multi-tenant isolated workspace for local hotels, homestays, bike/scooty/car rentals, guides, and activity providers.
  - 6-category dynamic listing creation wizard with Cloudinary multi-image upload.
  - Provenance-tracked pricing (`PARTNER_CLAIMED` ➔ `VERIFIED`).
  - Real-time booking intake, earnings calculation (10% platform fee), and P&L expenses.
- **🛡️ Web3 Trust & Verification Layer**:
  - On-chain attestation for verified tourism partners and rental fleet vehicles.
  - Public cryptographic QR code verification.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS / Custom CSS design system, Zustand, Lucide React, Leaflet
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT Auth, Multer, Cloudinary CDN
- **AI Agentic Runtime**: Python LangGraph / Node Gateway, SSE Streaming, Provider Abstraction
- **Smart Contracts**: Solidity, Ethers.js, Hardhat (Attestation & Vehicle Registry)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- Python 3.10+ (for Python AI Agent runtime)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
npm run dev
```

### 4. Running Test Suites
```bash
# Partner Dashboard & Security Test Suite (20/20)
node backend/scripts/test_partner_dashboard_suite.js

# Partner Marketplace Test Suite (30/30)
node backend/scripts/test_partner_marketplace.js

# Phase 3 Marketplace Integrity Suite (30/30)
node backend/scripts/test_phase3_partner_marketplace.js
```

---

## 📄 License
ISC License — Discovery Uttarakhand.
