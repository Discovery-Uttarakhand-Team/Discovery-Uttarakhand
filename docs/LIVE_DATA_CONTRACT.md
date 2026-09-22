# DISCOVERY UTTARAKHAND — LIVE DATA & SAFETY ADVISORY CONTRACT
**System Version:** `v3.6.0`  
**Phase:** 6 (Live Data Adapters & Deterministic Advisory Engine)  
**Status:** Active & Enforced

---

## 1. Architectural Invariant & Evidence Model

Live data functions strictly as an **additive evidence layer**. It does not replace, overwrite, or mutate:
- Deterministic route geometry (OSRM waypoints)
- Static destination coordinates & altitudes (89 destinations)
- Static verified transport corridors (8 corridors in `Transport.js`)
- Partner listing status and verified pricing provenance (Phase 3 & Phase 4)
- On-chain attestation digests (Phase 5)

```text
USER TRIP ➔ Deterministic Route/Transport/Budget ➔ Deterministic Itinerary ➔ LIVE DATA ADAPTERS ➔ Advisory Engine ➔ Companion UI / AI Context
```

---

## 2. Common Adapter Envelope Contract

Every live adapter (`WeatherAdapter`, `RoadAdvisoryAdapter`, `TransitLiveAdapter`) returns a uniform envelope:

```typescript
interface LiveDataEnvelope<T> {
  status: 'LIVE' | 'STALE' | 'UNAVAILABLE' | 'UNKNOWN';
  observedAt: string | null;       // ISO 8601 observation timestamp
  fetchedAt: string;              // ISO 8601 fetch timestamp
  expiresAt: string;              // ISO 8601 expiration timestamp
  freshnessSeconds: number;       // TTL duration
  source: string;                 // Entity name (e.g., 'Open-Meteo Alpine Model')
  sourceUrl: string;              // Link to official verification portal
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED';
  scope: {
    type: 'destination' | 'corridor' | 'region';
    id?: string;
    name?: string;
    coordinates?: [number, number];
    altitude?: number;
    highway?: string;
    district?: string;
  };
  data: T | null;                 // Normalized payload or null on failure
  warnings: string[];             // Descriptive warnings (e.g. stale/closure notes)
  error: string | null;           // Error message or null
}
```

---

## 3. Freshness State Machine & TTL Policies

| Domain | Preferred TTL (`LIVE`) | Stale Window (`STALE`) | Eviction (`UNKNOWN`) | Cache Key Pattern |
| :--- | :--- | :--- | :--- | :--- |
| **Weather** | 3,600s (1 hour) | 7,200s (2 hours) | >10,800s (3 hours) | `live:weather:${lat}:${lon}` |
| **Road Advisories** | 1,800s (30 mins) | 7,200s (2 hours) | >9,000s (2.5 hours) | `live:road:${corridor}` |
| **Transit Status** | 900s (15 mins) | 3,600s (1 hour) | >4,500s (1.25 hours) | `live:transit:${from}:${to}:${mode}` |
| **Trip Evaluation** | 300s (5 mins) | 600s (10 mins) | >900s (15 mins) | `live:trip:${tripId}` |

### Freshness States:
- `LIVE`: Queried recently from provider within domain TTL.
- `STALE`: Past preferred TTL but served from cache within stale window.
- `UNAVAILABLE`: Network failure, timeout (>3.5s), or HTTP 5xx with zero cached data.
- `UNKNOWN`: No official monitoring or bulletin exists on record (Honest disclosure).

---

## 4. Deterministic Advisory Rules & Severity Model

### Severity Enum:
- `INFO`: Calm awareness (e.g. standard mountain precautions).
- `LOW`: Minor delay (<30m) or telemetry stale notice.
- `MEDIUM`: Inclement weather, night driving curfew caution, or single-lane road restriction.
- `HIGH`: Alpine storm alert, snowstorm hold, or severe transit disruption.
- `CRITICAL`: Road closure, cloudburst curfew, or active disaster zone.

### Evaluation Rules:
1. **Alpine High-Altitude Weather Rule**:
   - `altitude > 2500m` AND (`rainfallMm >= 15` OR `snowfallCm >= 5` OR `windSpeedKmh >= 40`)
   - Type: `WEATHER_ADVISORY` | Severity: `HIGH`
2. **Moderate Mountain Weather Rule**:
   - `rainfallMm >= 8` OR `conditionSeverity in ['HIGH', 'CRITICAL']`
   - Type: `WEATHER_ADVISORY` | Severity: `MEDIUM`
3. **Corridor Road Closure Rule**:
   - Corridor bulletin `roadStatus === 'CLOSED'`
   - Type: `ROAD_CLOSURE` | Severity: `CRITICAL`
4. **Corridor Single-Lane / Restriction Rule**:
   - Corridor bulletin `roadStatus === 'RESTRICTED'`
   - Type: `ROAD_RESTRICTION` | Severity: `MEDIUM` or `HIGH`
5. **Night Driving Curfew Rule**:
   - Mountain road transit arrival `>= 18:00` (6:00 PM)
   - Type: `NIGHT_DRIVING_HAZARD` | Severity: `MEDIUM`
6. **Data Freshness Advisory**:
   - Feed `status === 'STALE'`
   - Type: `DATA_STALE_WARNING` | Severity: `LOW`
7. **No Telemetry Disclosure**:
   - Zero hazards or unmonitored corridor
   - Type: `INFORMATION_UNAVAILABLE` | Severity: `INFO`

---

## 5. API Endpoints

- `GET /api/live/weather?lat=...&lon=...` — Public live weather telemetry.
- `GET /api/live/road-advisories?corridor=...` — Public corridor road condition.
- `GET /api/live/bulletins` — Public active state-wide road bulletins list.
- `GET /api/live/transit?origin=...&destination=...&mode=...` — Public transit telemetry & booking links.
- `POST /api/live/advisories/evaluate` — Public trip context safety evaluation.
- `POST /api/live/admin/bulletins` — Admin bulletin publication (`protect` + `adminOnly`).
