# DISCOVERY UTTARAKHAND — OMNIROUTE PRODUCTION ARCHITECTURE
**Document:** `docs/OMNIROUTE_PRODUCTION.md`  
**Scope:** Local vs. Production OmniRoute Topology, Failover Mechanics, and Security  

---

## 1. Overview & Problem Definition

Discovery Uttarakhand uses an OpenAI-compatible LLM Gateway called **OmniRoute** to route reasoning and chat requests to optimal models (e.g. Qwen, Llama, DeepSeek, Gemini, OpenAI).

In local developer environments:
```
[Backend: Node.js] ---> http://localhost:20128/v1 ---> [OmniRoute Gateway on Developer PC]
```
When the backend is deployed to a cloud server (e.g., Render, Railway, AWS ECS, VPS), `http://localhost:20128` points to the cloud instance's loopback interface where OmniRoute does **NOT** exist. Calling `localhost:20128` from a cloud backend will result in `ECONNREFUSED`.

---

## 2. Supported Architectural Topologies

### Option A: Hosted / Cloud OmniRoute (Recommended for Private Self-Hosting)
Deploy OmniRoute on a persistent cloud VM or container with a secure HTTPS domain and private network authentication:
```
[Cloud Backend]
       |
  (HTTPS + Bearer Token)
       v
https://omniroute.internal.discoveryuttarakhand.in/v1
       |
 [OmniRoute Gateway]
   /        |         \
Ollama   vLLM     Cloud APIs
```
- **Configuration**:
  ```env
  OMNIROUTE_ENABLED=true
  OMNIROUTE_BASE_URL=https://omniroute.internal.discoveryuttarakhand.in/v1
  OMNIROUTE_API_KEY=sk_omniroute_production_secure_token
  OMNIROUTE_MODEL=auto
  ```

---

### Option B: Direct Cloud Provider in Production (Zero Infrastructure Overhead)
In cloud production, bypass local OmniRoute and configure direct cloud providers like Google Gemini or OpenAI:
```
[Cloud Backend]
       |
  (Direct HTTPS)
       +---------> Google Gemini API (gemini-1.5-flash)
       |
       +---------> OpenAI API (gpt-4o-mini)
       |
       +---------> DeterministicFallbackProvider (Zero-Network)
```
- **Configuration**:
  ```env
  AI_PROVIDER=gemini
  OMNIROUTE_ENABLED=false
  GEMINI_API_KEY=AIzaSy...
  GEMINI_MODEL=gemini-1.5-flash
  ```

---

### Option C: Local Development Topology
For local offline testing on developer machines:
```
[Local Backend:5000] ---> http://localhost:20128/v1 ---> [OmniRoute Desktop:20128]
```
- **Configuration**:
  ```env
  AI_PROVIDER=omniroute
  OMNIROUTE_ENABLED=true
  OMNIROUTE_BASE_URL=http://localhost:20128/v1
  OMNIROUTE_API_KEY=your_local_key
  OMNIROUTE_MODEL=auto
  ```

---

## 3. Fallback & Resilience Chain

Discovery Uttarakhand implements a strict multi-tier fallback hierarchy in `backend/services/agentService.js` and `backend/services/aiPlannerService.js`:

```
Tier 1: OmniRoute Gateway (if OMNIROUTE_ENABLED=true and OMNIROUTE_API_KEY is present)
   │
   ▼ (on connection failure or timeout)
Tier 2: Google Gemini (if GEMINI_API_KEY is present)
   │
   ▼ (on failure / quota exhaustion)
Tier 3: OpenAI (if OPENAI_API_KEY is present)
   │
   ▼ (on total network or provider failure)
Tier 4: DeterministicFallbackProvider (Rule-based, 100% offline, guaranteed response)
```

### Key Guarantees:
1. **Never Crash**: The backend will never crash or return 500 if OmniRoute is offline or unreachable.
2. **Safe Degradation**: If OmniRoute fails, requests seamlessly degrade to Gemini or the DeterministicFallbackProvider.
3. **No Hallucination**: Every provider, including DeterministicFallbackProvider, adheres strictly to verified candidate IDs, road corridors, and live weather cache.

---

## 4. Safe AI Health Check Endpoint

Backend exposes a public health probe that reports provider readiness without leaking keys:
```http
GET /api/ai/health
```

### Sample Response (OmniRoute Online):
```json
{
  "success": true,
  "provider": "omniroute",
  "enabled": true,
  "healthy": true
}
```

### Sample Response (OmniRoute Offline / Fallback Active):
```json
{
  "success": true,
  "provider": "omniroute",
  "enabled": true,
  "healthy": false
}
```
*Note: The frontend receives standard responses regardless of whether Tier 1 (OmniRoute) or Tier 4 (Deterministic) fulfilled the request.*

---

## 5. Security & Secret Protection Guidelines

1. **Frontend Isolation**: The frontend NEVER connects directly to OmniRoute. All AI traffic flows through the authenticated Node.js backend (`POST /api/agent/chat` and `POST /api/ai/plan`).
2. **Key Masking**: `OMNIROUTE_API_KEY` and `GEMINI_API_KEY` are never logged in console outputs, never exposed via `/api/health`, and never bundled into client JS.
3. **Prompt Boundary Defense**: All user inputs in AI Planner and Agent Copilot are enclosed within `<UNTRUSTED_USER_NOTES>` and `<UNTRUSTED_USER_MESSAGE>` boundary tags to prevent prompt injection.

---

## 6. Latency & Timeout Configuration

| Parameter | Recommended Value | Rationale |
| :--- | :--- | :--- |
| **Connection Timeout** | 3500ms | Fail fast if local gateway or private network is unreachable |
| **Planner Reasoning Timeout** | 35000ms | Allows deep reasoning models sufficient token generation window |
| **SSE Stream Chunk Delay** | Real-time | Uses `X-Accel-Buffering: no` to prevent proxy buffer lag |
| **Max Tokens** | 1024 | Bounds memory usage and latency |
