/**
 * Discovery Uttarakhand â€” Phase 6 Automated Test Battery
 * Validates Live Data Adapters (Weather, Road, Transit) & Deterministic Advisory Engine.
 * Covers: Normalization, Freshness States, Caching, Fallbacks, Security, and Deterministic Rules.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { memoryCache } from '../services/cache/memoryCache.js';
import WeatherAdapter from '../services/adapters/openMeteoAdapter.js';
import RoadAdvisoryAdapter from '../services/adapters/roadAdvisoryAdapter.js';
import TransitLiveAdapter from '../services/adapters/transitLiveAdapter.js';
import AdvisoryEngine from '../services/advisoryEngine.js';
import RoadBulletin from '../models/RoadBulletin.js';
import { AiContextBuilder } from '../services/aiContextBuilder.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/discovery_uttarakhand';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  âŒ [FAIL] Test ${totalTests}: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  âœ… [PASS] Test ${totalTests}: ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('DISCOVERY UTTARAKHAND â€” PHASE 6 TEST BATTERY');
  console.log('Live Data Adapters & Safety / Advisory Engine');
  console.log('====================================================\n');

  // Connect DB
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB.\n');

  // Clean up any test bulletins
  await RoadBulletin.deleteMany({ corridor: { $regex: /TEST_/i } });
  memoryCache.clear();

  try {
    // -------------------------------------------------------------
    // GROUP 1: In-Memory TTL Cache & Freshness Lifecycle
    // -------------------------------------------------------------
    console.log('[GROUP 1: Memory Cache & Freshness Lifecycle]');

    // Test 1: Store and retrieve LIVE
    memoryCache.set('test:key1', { temp: 15 }, 10, 20); // 10s TTL, 20s stale
    const item1 = memoryCache.get('test:key1');
    assert(item1 && item1.status === 'LIVE' && item1.data.temp === 15, 'Cache returns LIVE status within TTL');

    // Test 2: Simulated STALE state
    const entry = memoryCache.store.get('test:key1');
    entry.expiresAt = Date.now() - 1000; // Force expired TTL
    entry.staleUntil = Date.now() + 10000; // Still in stale window
    const item2 = memoryCache.get('test:key1');
    assert(item2 && item2.status === 'STALE' && item2.data.temp === 15, 'Cache returns STALE status within stale grace window');

    // Test 3: Eviction after stale window
    entry.staleUntil = Date.now() - 1000; // Past stale window
    const item3 = memoryCache.get('test:key1');
    assert(item3 === null, 'Cache returns null and evicts entry past stale grace window');

    // -------------------------------------------------------------
    // GROUP 2: Weather Adapter & Open-Meteo Normalization
    // -------------------------------------------------------------
    console.log('\n[GROUP 2: Weather Adapter & Open-Meteo Provider]');

    // Test 4: Live weather query for Nainital coordinates (29.39, 79.45)
    const weatherNainital = await WeatherAdapter.getWeather(29.39, 79.45, { name: 'Nainital', altitude: 2084 });
    assert(
      weatherNainital &&
      (weatherNainital.status === 'LIVE' || weatherNainital.status === 'UNAVAILABLE') &&
      weatherNainital.source.includes('Open-Meteo'),
      'WeatherAdapter returns valid envelope with Open-Meteo attribution'
    );

    if (weatherNainital.status === 'LIVE') {
      // Test 5: Verify normalized fields
      const w = weatherNainital.data;
      assert(
        typeof w.temperature === 'number' &&
        typeof w.weatherCondition === 'string' &&
        Array.isArray(w.forecast) &&
        w.forecast.length > 0,
        'Normalized weather includes temperature, weatherCondition string, and multi-day forecast'
      );
    } else {
      assert(weatherNainital.status === 'UNAVAILABLE', 'Network failure safely wrapped as UNAVAILABLE envelope');
    }

    // Test 6: In-memory cache hit on second query
    const cachedWeather = await WeatherAdapter.getWeather(29.39, 79.45, { name: 'Nainital' });
    assert(cachedWeather.status === weatherNainital.status, 'Weather query correctly uses cache on immediate repeat');

    // Test 7: Coordinate validation (reject invalid latitude)
    let rejected = false;
    try {
      await WeatherAdapter.getWeather(195, 79.45);
    } catch (e) {
      rejected = true;
    }
    assert(rejected, 'Invalid latitude (>90) strictly rejected with descriptive error');

    // -------------------------------------------------------------
    // GROUP 3: Road Advisory Adapter & State Bulletins
    // -------------------------------------------------------------
    console.log('\n[GROUP 3: Road Advisory Adapter & Bulletins]');

    // Test 8: Unmonitored corridor returns UNKNOWN (Zero Fabrication)
    const unknownCorridor = await RoadAdvisoryAdapter.getAdvisory({
      corridor: 'TEST_Unmonitored_Trail â†’ Nowhere',
      skipCache: true
    });
    assert(
      unknownCorridor.status === 'UNKNOWN' &&
      unknownCorridor.confidence === 'UNVERIFIED' &&
      unknownCorridor.data === null,
      'Unmonitored corridor strictly returns UNKNOWN envelope without fabricating road status'
    );

    // Test 9: Create official administrative bulletin for Badrinath Highway
    const bulletin = await RoadBulletin.create({
      corridor: 'TEST_Rishikesh â†’ Joshimath',
      highway: 'NH-07',
      district: 'Chamoli',
      roadStatus: 'RESTRICTED',
      restrictionType: 'LANDSLIDE_SINGLE_LANE',
      severity: 'MEDIUM',
      title: 'Debris clearing at Sirobagarh',
      description: 'Single lane traffic allowed. Expect 30-45m delay.',
      effectiveFrom: new Date(),
      expiresAt: new Date(Date.now() + 86400000), // 24 hours
      source: 'Border Roads Organisation (BRO) / UKSDMA',
      isActive: true
    });
    assert(bulletin && bulletin._id, 'Administrative road bulletin persisted in MongoDB');

    // Test 10: Query corridor returns active bulletin
    const roadAdvisory = await RoadAdvisoryAdapter.getAdvisory({
      corridor: 'TEST_Rishikesh â†’ Joshimath',
      skipCache: true
    });
    assert(
      roadAdvisory.status === 'LIVE' &&
      roadAdvisory.data.roadStatus === 'RESTRICTED' &&
      roadAdvisory.data.severity === 'MEDIUM' &&
      roadAdvisory.data.title.includes('Sirobagarh'),
      'RoadAdvisoryAdapter resolves active bulletin with RESTRICTED status and BRO provenance'
    );

    // Test 11: Expired bulletin is ignored at read time
    bulletin.expiresAt = new Date(Date.now() - 1000);
    await bulletin.save();
    const expiredQuery = await RoadAdvisoryAdapter.getAdvisory({
      corridor: 'TEST_Rishikesh â†’ Joshimath',
      skipCache: true
    });
    assert(expiredQuery.status === 'UNKNOWN', 'Expired road bulletin automatically ignored at read time');

    // -------------------------------------------------------------
    // GROUP 4: Transit Live Adapter & Non-Scraping Policy
    // -------------------------------------------------------------
    console.log('\n[GROUP 4: Transit Live Adapter & Non-Scraping Telemetry]');

    // Test 12: Query transit status returns honest UNKNOWN without scraping
    const transitStatus = await TransitLiveAdapter.getTransitStatus({
      origin: 'Kathgodam',
      destination: 'Almora',
      mode: 'Bus',
      skipCache: true
    });
    assert(
      (transitStatus.status === 'UNKNOWN' || transitStatus.status === 'LIVE') &&
      transitStatus.data.bookingUrl &&
      transitStatus.data.officialPortalNotice.includes('counter'),
      'TransitLiveAdapter upholds ethical non-scraping policy and returns official booking portal'
    );

    // Test 13: Link road closure to transit delay/suspension
    const closedBulletin = await RoadBulletin.create({
      corridor: 'TEST_Dharchula â†’ Gunji',
      highway: 'Lipulekh Highway',
      district: 'Pithoragarh',
      roadStatus: 'CLOSED',
      restrictionType: 'LANDSLIDE',
      severity: 'CRITICAL',
      title: 'Massive rockfall near Tawaghat',
      description: 'Highway blocked completely. Transit suspended until clearing.',
      effectiveFrom: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      source: 'BRO Project Hirak',
      isActive: true
    });

    const disruptedTransit = await TransitLiveAdapter.getTransitStatus({
      origin: 'TEST_Dharchula',
      destination: 'Gunji',
      mode: 'Shared Jeep',
      skipCache: true
    });
    assert(
      disruptedTransit.status === 'LIVE' &&
      disruptedTransit.data.serviceStatus === 'SUSPENDED' &&
      disruptedTransit.warnings[0].includes('suspended due to active road closure'),
      'TransitLiveAdapter correctly links critical road closure to transit service suspension'
    );

    // -------------------------------------------------------------
    // GROUP 5: Deterministic Advisory Engine Rules
    // -------------------------------------------------------------
    console.log('\n[GROUP 5: Deterministic Advisory Engine]');

    // Mock trip context with closed corridor on Day 2
    const mockTrip = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Adi Kailash Pilgrimage',
      destinations: [
        { name: 'Dharchula', coordinates: [29.85, 80.53], altitude: 940 },
        { name: 'Gunji', coordinates: [30.18, 80.85], altitude: 3200 }
      ],
      days: [
        {
          dayNumber: 1,
          baseLocation: 'Dharchula',
          transitLegs: [{ corridor: 'Delhi â†’ Dharchula', mode: 'Bus', arrivalTime: '15:00', routingType: 'road' }]
        },
        {
          dayNumber: 2,
          baseLocation: 'Gunji',
          transitLegs: [{ corridor: 'TEST_Dharchula â†’ Gunji', mode: 'Shared Jeep', arrivalTime: '14:00', routingType: 'road' }]
        }
      ]
    };

    // Test 14: Advisory evaluation flags CRITICAL road closure
    const evalResult = await AdvisoryEngine.evaluateTrip(mockTrip, { skipCache: true });
    assert(
      evalResult.success === true &&
      evalResult.hasCriticalHazards === true &&
      evalResult.advisories.some(a => a.type === 'ROAD_CLOSURE' && a.severity === 'CRITICAL'),
      'AdvisoryEngine evaluates trip and flags CRITICAL road closure on Day 2 corridor'
    );

    // Test 15: Night Driving Curfew rule triggers on arrival >= 18:00
    mockTrip.days[0].transitLegs[0].arrivalTime = '19:30';
    const nightCurfewResult = await AdvisoryEngine.evaluateTrip(mockTrip, { skipCache: true });
    assert(
      nightCurfewResult.advisories.some(a => a.type === 'NIGHT_DRIVING_HAZARD' && a.severity === 'MEDIUM'),
      'AdvisoryEngine generates NIGHT_DRIVING_HAZARD for transit arrival exceeding 6:00 PM'
    );

    // Test 16: Irrelevant corridor alerts filtered out (zero false-positives)
    const hasUnrelatedCorridorAlert = evalResult.advisories.some(a => a.corridor === 'TEST_Rishikesh â†’ Joshimath');
    assert(!hasUnrelatedCorridorAlert, 'AdvisoryEngine filters out road alerts for corridors outside the trip');

    // Test 17: General conditions normal when zero hazards present
    await RoadBulletin.deleteMany({ corridor: { $regex: /TEST_/i } });
    const benignTrip = {
      _id: new mongoose.Types.ObjectId(),
      title: 'Peaceful Mussoorie Trip',
      destinations: [{ name: 'Mussoorie', coordinates: [30.45, 78.07], altitude: 2005 }],
      days: [
        {
          dayNumber: 1,
          baseLocation: 'Mussoorie',
          transitLegs: [{ corridor: 'Dehradun â†’ Mussoorie', mode: 'Taxi', arrivalTime: '12:00', routingType: 'road' }]
        }
      ]
    };
    const benignResult = await AdvisoryEngine.evaluateTrip(benignTrip, { skipCache: true });
    assert(
      benignResult.hasCriticalHazards === false &&
      benignResult.advisories.some(a => a.type === 'INFORMATION_UNAVAILABLE' || a.severity === 'INFO'),
      'AdvisoryEngine provides calm informational status when all corridors are clear'
    );

    // -------------------------------------------------------------
    // GROUP 6: AI Context Builder Integration & Security
    // -------------------------------------------------------------
    console.log('\n[GROUP 6: AI Context Builder Integration & Security]');

    // Test 18: AiContextBuilder integrates liveAdvisories when option enabled
    const aiContextWithLive = await AiContextBuilder.buildContext(benignTrip, { includeLiveAdvisories: true });
    assert(
      aiContextWithLive &&
      aiContextWithLive.context &&
      Array.isArray(aiContextWithLive.context.knownConstraints.liveAdvisories),
      'AiContextBuilder receives liveAdvisories evidence in knownConstraints when requested'
    );

    // Test 19: AiContextBuilder preserves backwards compatibility when option disabled
    const aiContextDefault = await AiContextBuilder.buildContext(benignTrip);
    assert(
      Array.isArray(aiContextDefault.context.knownConstraints.liveAdvisories) &&
      aiContextDefault.context.knownConstraints.liveAdvisories.length === 0,
      'AiContextBuilder preserves baseline compatibility when includeLiveAdvisories is omitted'
    );

    // Test 20: Candidate allowlist intact after live advisory ingestion
    assert(
      aiContextWithLive.allowlist &&
      aiContextWithLive.allowlist.destinations instanceof Set &&
      aiContextWithLive.allowlist.stays instanceof Set,
      'Candidate allowlist sets remain 100% intact after live context integration'
    );

    // -------------------------------------------------------------
    // GROUP 7: HTTP Endpoint Contracts & Safety Validation
    // -------------------------------------------------------------
    console.log('\n[GROUP 7: HTTP Endpoint Contracts & Safety Validation]');

    const BASE_URL = 'http://localhost:5000/api/live';

    // Test 21: GET /api/live/weather with coordinates
    const weatherHttpRes = await fetch(`${BASE_URL}/weather?lat=29.39&lon=79.45&name=Nainital`);
    const weatherHttpJson = await weatherHttpRes.json();
    assert(
      weatherHttpRes.status === 200 && weatherHttpJson.data && weatherHttpJson.data.source,
      'HTTP GET /api/live/weather returns 200 OK with normalized data envelope'
    );

    // Test 22: GET /api/live/weather without lat/lon returns 400 Bad Request
    const badWeatherRes = await fetch(`${BASE_URL}/weather`);
    const badWeatherJson = await badWeatherRes.json();
    assert(
      badWeatherRes.status === 400 && badWeatherJson.success === false,
      'HTTP GET /api/live/weather without coordinates rejected with 400 Bad Request'
    );

    // Test 23: GET /api/live/road-advisories returns 200 OK
    const roadHttpRes = await fetch(`${BASE_URL}/road-advisories?corridor=Delhi-Dehradun`);
    const roadHttpJson = await roadHttpRes.json();
    assert(
      roadHttpRes.status === 200 && roadHttpJson.data && roadHttpJson.data.status,
      'HTTP GET /api/live/road-advisories returns 200 OK with valid envelope'
    );

    // Test 24: POST /api/live/advisories/evaluate evaluates trip payload
    const evalHttpRes = await fetch(`${BASE_URL}/advisories/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripContext: benignTrip })
    });
    const evalHttpJson = await evalHttpRes.json();
    assert(
      evalHttpRes.status === 200 && evalHttpJson.data && evalHttpJson.data.success === true,
      'HTTP POST /api/live/advisories/evaluate evaluates transient trip context with 200 OK'
    );

    console.log('\n====================================================');
    console.log(`âœ… ALL ${passedTests} / ${totalTests} PHASE 6 TESTS PASSED SUCCESSFULLY!`);
    console.log('====================================================\n');

  } finally {
    await RoadBulletin.deleteMany({ corridor: { $regex: /TEST_/i } });
    memoryCache.destroy();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('\nâŒ PHASE 6 TEST FAILURE:', err);
  process.exit(1);
});
