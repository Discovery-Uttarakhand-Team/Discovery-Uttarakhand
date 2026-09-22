# DISCOVERY UTTARAKHAND — DEEP AGENTIC AI PYTHON MIGRATION AUDIT
**Document Version:** 3.0.0  
**Generated Date:** September 16, 2026  
**Status:** Approved Architectural Blueprint  

---

## 1. Executive Summary

This audit establishes the precise architectural boundary between the existing **Node/Express/MongoDB business backend** and the **new Python AI runtime (`ai/`)**. 

### Critical Architecture Rule
- **Node.js remains the primary business application layer:** Authentication, Users, Bookings, Partner Marketplace, Admin verification, Web3, Cloudinary, and MongoDB persistence remain strictly in Node.js.
- **Python (`ai/`) is the intelligent agentic orchestration runtime:** LangGraph state graph, intent classification, canonical entity resolution, parallel tool planning, RAG subsystem, recommendation ranking, and multi-provider LLM orchestration (OmniRoute -> Groq -> Gemini -> OpenAI -> Deterministic Fallback) live entirely in Python.
- **React/Vite communicates via Node API Gateway:** Frontend calls `POST /api/agent/chat` on Node (port 5000), which validates JWT/rate limits and delegates to Python FastAPI (`http://127.0.0.1:8000/api/chat`). The SSE stream flows from Python through Node back to React.

```text
React (Vite :5173)
       │
       ▼
Node.js API Gateway (:5000) ─── Auth / Rate Limit / Trip Security
       │
       ▼ HTTP / SSE
Python FastAPI AI Runtime (:8000)
       │
       ├── LangGraph Agent State Graph
       ├── Intent Understanding & Multi-Intent Classifier
       ├── Canonical Destination & Entity Resolver (219+ places, pronouns)
       ├── Dynamic Missing Information Reasoner (Slot Analysis)
       ├── Parallel Tool Orchestration (Weather, Stays, Route, Budget, Guides)
       ├── RAG Subsystem (ChromaDB / FAISS + Curated Knowledge)
       ├── Recommendation Engine (Relevance, Price Provenance, Season)
       ├── Trip Mutation Validator (tripMutationService)
       └── Provider Resolver (OmniRoute -> Groq -> Gemini -> OpenAI)
               │
               ▼ Calls Internal Node Endpoints
Node Internal Agent Services / MongoDB / Verified Partners
```

---

## 2. Component Responsibility Matrix

| Capability / Domain | Node.js Backend (`backend/`) | Python AI Runtime (`ai/`) | Notes |
| :--- | :--- | :--- | :--- |
| **Authentication & Users** | **Primary Owner** (`authRoutes.js`, `User.js`, JWT) | None | Python never manages passwords, sessions, or user tokens. |
| **Booking & Financials** | **Primary Owner** (`bookingRoutes.js`, `bookingService.js`) | Read-only eligibility checking (`checkBookingEligibility`) | Python never creates bookings or calculates final payment totals. |
| **Partner Marketplace** | **Primary Owner** (`partnerRoutes.js`, `Partner.js`, `PartnerListing.js`) | Recommender (`searchPartnerListings`) | Python only receives `ACTIVE` listings; PII is stripped. |
| **Web3 Attestations** | **Primary Owner** (`verificationRoutes.js`, smart contracts) | None | Verified badges consumed as metadata. |
| **Chat Persistence** | **Primary Owner** (`Chat.js`, MongoDB) | In-memory session / checkpointing | Node persists final messages, citations, tools, and provenance. |
| **Conversation Orchestration** | Secondary (Gateway / fallback) | **Primary Owner** (`LangGraph`, `FastAPI`) | Dynamic graph replaces hardcoded scripts. |
| **Entity & Pronoun Resolution** | Secondary fallback | **Primary Owner** (`entities.py`, aliases, spatial context) | Full 219+ destinations, resolves "wahan", "udhar". |
| **RAG Knowledge Subsystem** | None | **Primary Owner** (`rag/`, ChromaDB/FAISS) | Trusted Uttarakhand guides, cultural rules, trek data. |
| **Deterministic Live Tools** | Adapter provider (`openMeteo`, `OSRM`, `budgetEngine`) | Tool caller & synthesizer | Python executes tools in parallel and synthesizes trusted context. |
| **Trip Mutation Boundary** | Validator & DB modifier (`SavedTrip.js`) | Structured proposal generator (`mutations.py`) | LLM proposes structured diffs; validated deterministically. |
| **Frontend Workspace UI** | React (`/copilot`, 3-column workspace) | None (consumed via SSE stream) | Himalayan palette, live sync with conversation state. |

---

## 3. Root Cause Analysis: What Caused Generic Chatbot Behavior?

Our deep audit of `backend/services/agentService.js` and `backend/services/ai/providers/DeterministicFallbackProvider.js` revealed the exact technical root causes:

1. **Rigid 800-Line Scripted Flow (`_processAgenticTravelFlow`):**
   - In `agentService.js`, lines 231–812 contained a 5-step rigid state machine:
     - Turn 1: Destination missing -> prompt for destination.
     - Turn 2: Origin missing -> prompt for origin.
     - Turn 3: Date missing -> prompt for date.
     - Turn 4: Travelers or duration missing -> prompt for travelers.
     - Turn 5: Budget missing -> prompt for budget.
   - This script **completely bypassed the LLM**, returning hardcoded text before the provider was even reached.
2. **Hardcoded 18-Destination Array:**
   - `DeterministicFallbackProvider.js` (lines 250–280) relied on a static list of only 18 destinations (`bhimtal`, `kedarnath`, `badrinath`, etc.).
   - Whenever a user asked for destinations outside this list (e.g., "Valley of Flowers", "Auli", "Munsiyari", "Chopta", "Kanatal"), the parser failed to detect the location, triggering line 412:
     `"Uttarakhand mein aap kahan travel karna chahte hain? (Jaise Badrinath, Kedarnath, Pithoragarh, Bhimtal, ya Nainital)..."` in an infinite loop!
3. **Provider Fallback Premature Triggering:**
   - OmniRoute local gateway (port 20128) was configured as primary. When the local gateway wasn't running, provider resolution failed to test Direct Groq, dropping directly into the deterministic provider.

---

## 4. Internal Node ↔ Python API Endpoints

To maintain clean separation without duplicating database schemas in Python, Node will expose authenticated internal endpoints (protected by `INTERNAL_API_SECRET` header):

1. `GET /internal/agent/destinations` — returns all 219+ canonical destinations with coordinates, district, and category.
2. `GET /internal/agent/stays?destination=:dest&budgetTier=:tier&limit=10` — returns verified active stays.
3. `GET /internal/agent/partner-listings?type=:type&destination=:dest` — returns active partner listings (verified pricing and claimed pricing tagged).
4. `GET /internal/agent/activities?destination=:dest&category=:cat` — returns verified attractions and activities.
5. `GET /internal/agent/guides?destination=:dest` — returns certified local guides.
6. `POST /internal/agent/budget` — executes deterministic `BudgetEngine` with verified breakdown.
7. `POST /internal/agent/route` — executes OSRM highway routing with road condition flags.
8. `GET /internal/agent/weather?location=:loc&lat=:lat&lon=:lon` — queries Open-Meteo verified live weather.
9. `GET /internal/agent/road-advisory?corridor=:corridor` — returns road advisories and daylight transit rules.
10. `POST /internal/agent/trip-mutation` — applies structured mutation to `SavedTrip` in MongoDB.

---

## 5. LangGraph Architecture for `ai/`

```text
               ┌───────────────────────┐
               │         START         │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │ Load Conversation     │
               │ State & Checkpoint    │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │ Intent & Entity       │
               │ Understanding         │
               │ (Canonical + Pronoun) │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │ Slot Analysis:        │
               │ Has enough info or    │
               │ pending clarification?│
               └───────────┬───────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
  [Missing Crucial Slot]       [Sufficient Context]
             │                           │
             ▼                           ▼
   ┌───────────────────┐       ┌───────────────────┐
   │ Dynamic Conversa- │       │ Parallel Tool     │
   │ tional Prompt     │       │ Execution Planner │
   │ (Natural Hinglish)│       │ (Weather, Route,  │
   └─────────┬─────────┘       │ Stays, Budget)    │
             │                 └─────────┬─────────┘
             │                           │
             │                           ▼
             │                 ┌───────────────────┐
             │                 │ RAG Retrieval     │
             │                 │ (Trusted Guides & │
             │                 │ Cultural Rules)   │
             │                 └─────────┬─────────┘
             │                           │
             │                           ▼
             │                 ┌───────────────────┐
             │                 │ Grounded LLM      │
             │                 │ Synthesis Node    │
             │                 │ (Groq / Gemini)   │
             │                 └─────────┬─────────┘
             │                           │
             │                           ▼
             │                 ┌───────────────────┐
             │                 │ Recommendation &  │
             │                 │ UI Action Node    │
             │                 └─────────┬─────────┘
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │ Stream SSE & Done     │
               └───────────┬───────────┘
                           │
                           ▼
               ┌───────────────────────┐
               │          END          │
               └───────────────────────┘
```

---

## 6. Migration Plan & Safety Guards

1. **Feature Flag in Node:**
   `AI_AGENT_RUNTIME=python` (default fallback to `node` if Python service is unreachable).
2. **Zero Breaking Changes:**
   - Frontend API client (`agentApi.js`) and store (`chatStore.js`) require no URL changes.
   - All 50 test scenarios must pass against the Python runtime.
3. **Provider Fallback Hierarchy:**
   - 1. OmniRoute Gateway (`http://localhost:20128/v1`)
   - 2. Direct Groq (`https://api.groq.com/openai/v1`, `openai/gpt-oss-120b`)
   - 3. Gemini (`gemini-3.6-flash`)
   - 4. OpenAI (`gpt-3.5-turbo`)
   - 5. Deterministic Fallback Engine

---

*This document serves as the formal architectural blueprint for Phase 10 / V3 Deep Agentic Python AI.*
