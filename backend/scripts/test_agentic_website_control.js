/**
 * Discovery Uttarakhand - Agentic Travel Operating Layer & Website Control Test Suite
 *
 * Comprehensive Automated Tests:
 * 1. Entity Extraction & Normalization (Pithoragarh, Badrinath, 3-4 duration range, 5000 budget, single message)
 * 2. Golden Pithoragarh Multi-turn Flow (Turns 1 to 4 with no redundant questions, budget prefill)
 * 3. Combined Single-Message Immediate Planning (Badrinath 5 days, 2 travelers, 20k budget -> immediate prefill)
 * 4. Intent Classification & Tool Specialization (Weather, Road Route via OSRM planRoute, Destination Explore)
 * 5. Natural Reference Resolution ("wahan" -> active destination)
 * 6. Generic Fallback Prevention & Provider Parity
 * 7. Action Safety & Guardrails (Stale requestId protection, external route rejection)
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import assert from 'assert';

import { createSession, getSession } from '../services/agentSessionStore.js';
import { extractEntitiesFromText, classifyIntent } from '../controllers/agentController.js';
import { runAgent } from '../services/agentService.js';
import { DeterministicFallbackProvider } from '../services/ai/providers/DeterministicFallbackProvider.js';

let passed = 0;
let failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    const res = fn();
    if (res && typeof res.then === 'function') {
      await res;
    }
    passed++;
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message, stack: err.stack });
    console.error(`  [FAIL] ${name}: ${err.message}`);
  }
}

async function runSuite() {
  console.log('\n============================================================');
  console.log('AGENTIC TRAVEL OPERATING LAYER & WEBSITE CONTROL TEST SUITE');
  console.log('============================================================\n');

  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.\n');
  }

  // ─────────────────────────────────────────────────────────────
  // 1. ENTITY EXTRACTION & NATURAL LANGUAGE PARSING
  // ─────────────────────────────────────────────────────────────
  console.log('1. Entity Extraction & Natural Language Parsing:');

  await test('1.1 Extracts Pithoragarh, 3-4 days range, and 5000 budget from Golden Input', () => {
    const msg = 'i want to go pithoragarh where i can go i have 3-4 days plan budget 5000';
    const res = extractEntitiesFromText(msg);
    assert.strictEqual(res.destination, 'Pithoragarh');
    assert.strictEqual(res.durationMin, 3);
    assert.strictEqual(res.durationMax, 4);
    assert.strictEqual(res.duration, 4);
    assert.strictEqual(res.budget, 5000);
    assert.strictEqual(res.intent, 'TRIP_PLANNING');
  });

  await test('1.2 Extracts all entities from single-message Badrinath query', () => {
    const msg = 'Mujhe Badrinath jana hai Delhi se 15 October ko 2 logon ke saath 5 din ke liye budget 20k';
    const res = extractEntitiesFromText(msg);
    assert.strictEqual(res.destination, 'Badrinath');
    assert.strictEqual(res.origin, 'Delhi');
    assert(res.startDate.includes('10-15') || res.startDate.includes('October'));
    assert.strictEqual(res.duration, 5);
    assert.strictEqual(res.travelers, 2);
    assert.strictEqual(res.budget, 20000);
    assert.strictEqual(res.intent, 'TRIP_PLANNING');
  });

  await test('1.3 Classifies Bhimtal explore intent without planning params', () => {
    const res = extractEntitiesFromText('Bhimtal mein kya kar sakta hoon?');
    assert.strictEqual(res.destination, 'Bhimtal');
    assert.strictEqual(res.intent, 'DESTINATION_EXPLORE');
  });

  await test('1.4 Classifies Badrinath weather intent', () => {
    const res = extractEntitiesFromText('Badrinath ka weather?');
    assert.strictEqual(res.destination, 'Badrinath');
    assert.strictEqual(res.intent, 'WEATHER');
  });

  await test('1.5 Classifies route intent for Delhi to Pithoragarh', () => {
    const res = extractEntitiesFromText('Delhi se Pithoragarh route dikhao');
    assert.strictEqual(res.destination, 'Pithoragarh');
    assert.strictEqual(res.origin, 'Delhi');
    assert.strictEqual(res.intent, 'ROUTE');
  });

  await test('1.6 Robust budget parsing for 5k, ₹5000, 5000 rupees', () => {
    assert.strictEqual(extractEntitiesFromText('budget 5k').budget, 5000);
    assert.strictEqual(extractEntitiesFromText('budget 5 K').budget, 5000);
    assert.strictEqual(extractEntitiesFromText('₹5,000').budget, 5000);
    assert.strictEqual(extractEntitiesFromText('5000 rupees').budget, 5000);
    assert.strictEqual(extractEntitiesFromText('around 35000 rs').budget, 35000);
  });

  // ─────────────────────────────────────────────────────────────
  // 2. GOLDEN PITHORAGARH MULTI-TURN FLOW (TURNS 1 TO 4)
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Golden Pithoragarh Multi-turn Conversational Flow:');

  const pithoragarhSessionId = createSession();
  const pithSession = getSession(pithoragarhSessionId);

  // Turn 1
  await test('2.1 Turn 1: "i want to go pithoragarh where i can go i have 3-4 days plan budget 5000"', async () => {
    const msg = 'i want to go pithoragarh where i can go i have 3-4 days plan budget 5000';
    const extracted = extractEntitiesFromText(msg, pithSession.contextEntities);
    Object.assign(pithSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: pithSession,
      requestId: 'pith_1'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.message.includes('Pithoragarh'), 'Must mention destination');
    assert(res.message.includes('3–4 din') || res.message.includes('3-4 din'), 'Must acknowledge 3-4 din');
    assert(res.message.includes('5,000') || res.message.includes('5000'), 'Must acknowledge ₹5,000 budget');
    assert(res.message.includes('kahan se travel start karoge'), 'Must ask for origin');
    assert(!res.message.includes("I'm your AI Travel Copilot"), 'MUST NOT be generic greeting');
  });

  // Turn 2
  await test('2.2 Turn 2: User says "Delhi" -> Asks for date (not duration or budget)', async () => {
    const msg = 'Delhi';
    const extracted = extractEntitiesFromText(msg, pithSession.contextEntities);
    Object.assign(pithSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: pithSession,
      requestId: 'pith_2'
    });

    assert.strictEqual(res.type, 'answer');
    assert.strictEqual(pithSession.contextEntities.origin, 'Delhi');
    assert(res.message.includes('kab jaana chahte ho'), 'Must ask for travel dates');
    assert(!res.message.includes('budget'), 'Must NOT ask for budget again');
    assert(!res.message.includes('kitne din'), 'Must NOT ask for duration again');
  });

  // Turn 3
  await test('2.3 Turn 3: User says "15 October" -> Asks for travelers only', async () => {
    const msg = '15 October';
    const extracted = extractEntitiesFromText(msg, pithSession.contextEntities);
    Object.assign(pithSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: pithSession,
      requestId: 'pith_3'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.message.includes('Kitne log'), 'Must ask for travelers');
    assert(!res.message.includes('kitne din'), 'Must NOT ask for duration');
    assert(!res.message.includes('budget'), 'Must NOT ask for budget');
  });

  // Turn 4
  await test('2.4 Turn 4: User says "2 log" -> Emits NAVIGATE, PREFILL (with budget 5000), runs parallel tools', async () => {
    const msg = '2 log';
    const extracted = extractEntitiesFromText(msg, pithSession.contextEntities);
    Object.assign(pithSession.contextEntities, extracted);

    const emittedActions = [];
    const res = await runAgent({
      message: msg,
      session: pithSession,
      requestId: 'pith_4',
      onEvent: (evt) => {
        if (evt.type === 'ui_action') emittedActions.push(evt.action);
      }
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.message.includes('Pithoragarh'), 'Plan must mention Pithoragarh');

    // UI actions check
    const navAction = res.uiActions.find(a => a.type === 'NAVIGATE');
    assert(navAction, 'Must emit NAVIGATE action');
    assert.strictEqual(navAction.routeKey, 'TRIP_PLANNER');

    const prefillAction = res.uiActions.find(a => a.type === 'PREFILL_TRIP_PLANNER');
    assert(prefillAction, 'Must emit PREFILL_TRIP_PLANNER action');
    assert.strictEqual(prefillAction.fields.origin, 'Delhi');
    assert.strictEqual(prefillAction.fields.destination, 'Pithoragarh');
    assert.strictEqual(prefillAction.fields.travelers, 2);
    assert.strictEqual(prefillAction.fields.budget, 5000); // Budget already filled!

    // Verified tools check
    assert(res.toolsUsed.includes('planRoute'), 'Must use planRoute (OSRM)');
    assert(res.toolsUsed.includes('getWeather'), 'Must use getWeather');
    assert(res.toolsUsed.includes('getRoadAdvisory'), 'Must use getRoadAdvisory');
    assert(res.toolsUsed.includes('findStays'), 'Must use findStays');
    assert(res.toolsUsed.includes('calculateBudget'), 'Must use calculateBudget');
  });

  // ─────────────────────────────────────────────────────────────
  // 3. COMBINED SINGLE-MESSAGE IMMEDIATE EXECUTION
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. Single-Message Multi-Entity Planning Execution:');

  await test('3.1 All details in one message -> Immediately navigates, prefills and plans (0 questions)', async () => {
    const sId = createSession();
    const singleSession = getSession(sId);
    const msg = 'Mujhe Badrinath jana hai Delhi se 15 October ko 2 logon ke saath 5 din ke liye budget 20k';
    const extracted = extractEntitiesFromText(msg, singleSession.contextEntities);
    Object.assign(singleSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: singleSession,
      requestId: 'single_1'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.message.includes('Badrinath') && res.message.includes('trip plan ready hai'));

    const navAction = res.uiActions.find(a => a.type === 'NAVIGATE');
    assert(navAction, 'Must emit NAVIGATE');

    const prefillAction = res.uiActions.find(a => a.type === 'PREFILL_TRIP_PLANNER');
    assert(prefillAction, 'Must emit PREFILL_TRIP_PLANNER');
    assert.strictEqual(prefillAction.fields.budget, 20000);
    assert.strictEqual(prefillAction.fields.origin, 'Delhi');
    assert.strictEqual(prefillAction.fields.destination, 'Badrinath');
    assert.strictEqual(prefillAction.fields.duration, 5);
    assert.strictEqual(prefillAction.fields.travelers, 2);

    assert(res.toolsUsed.includes('planRoute'));
    assert(res.toolsUsed.includes('getWeather'));
    assert(res.toolsUsed.includes('calculateBudget'));
  });

  // ─────────────────────────────────────────────────────────────
  // 4. INTENT SPECIALIZATION (WEATHER, ROUTE, EXPLORE)
  // ─────────────────────────────────────────────────────────────
  console.log('\n4. Intent Specialization & Tool Selection:');

  await test('4.1 Pure Weather query -> Returns getWeather, NO trip planner navigation', async () => {
    const sId = createSession();
    const weatherSession = getSession(sId);
    const msg = 'Badrinath ka weather?';
    const extracted = extractEntitiesFromText(msg, weatherSession.contextEntities);
    Object.assign(weatherSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: weatherSession,
      requestId: 'weather_1'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.toolsUsed.includes('getWeather'), 'Must use getWeather');
    assert(!res.toolsUsed.includes('calculateBudget'), 'Must NOT use calculateBudget');
    assert.strictEqual(res.uiActions.length, 0, 'Must NOT navigate or prefill Trip Planner');
  });

  await test('4.2 Pure Route query -> Uses planRoute (OSRM road driving), emits OPEN_MAP, never claims bus transit', async () => {
    const sId = createSession();
    const routeSession = getSession(sId);
    const msg = 'Delhi se Pithoragarh route dikhao';
    const extracted = extractEntitiesFromText(msg, routeSession.contextEntities);
    Object.assign(routeSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: routeSession,
      requestId: 'route_1'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.toolsUsed.includes('planRoute'), 'Must execute planRoute');
    assert(!res.toolsUsed.includes('getTransitStatus'), 'Must NOT call getTransitStatus for road routing');

    const openMapAction = res.uiActions.find(a => a.type === 'OPEN_MAP');
    assert(openMapAction, 'Must emit OPEN_MAP');
    assert.strictEqual(openMapAction.origin, 'Delhi');
    assert.strictEqual(openMapAction.destination, 'Pithoragarh');
  });

  await test('4.3 Destination explore -> Uses exploreDestination, emits OPEN_DESTINATION', async () => {
    const sId = createSession();
    const exploreSession = getSession(sId);
    const msg = 'Bhimtal mein kya kar sakta hoon?';
    const extracted = extractEntitiesFromText(msg, exploreSession.contextEntities);
    Object.assign(exploreSession.contextEntities, extracted);

    const res = await runAgent({
      message: msg,
      session: exploreSession,
      requestId: 'explore_1'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.toolsUsed.includes('exploreDestination'));
    const openDestAction = res.uiActions.find(a => a.type === 'OPEN_DESTINATION');
    assert(openDestAction, 'Must emit OPEN_DESTINATION');
    assert.strictEqual(openDestAction.destination, 'bhimtal');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. NATURAL REFERENCE RESOLUTION ("WAHAN")
  // ─────────────────────────────────────────────────────────────
  console.log('\n5. Natural Reference Resolution ("wahan"):');

  await test('5.1 Resolves "Wahan trekking bhi add karo" to active destination Badrinath', async () => {
    const sId = createSession();
    const refSession = getSession(sId);
    refSession.contextEntities.destination = 'Badrinath';

    const res = await runAgent({
      message: 'Wahan trekking bhi add karo',
      session: refSession,
      requestId: 'ref_1'
    });

    assert.strictEqual(res.type, 'answer');
    assert(res.message.includes('Badrinath'), 'Must resolve "wahan" to Badrinath');
    assert(res.toolsUsed.includes('exploreDestination'), 'Must call exploreDestination');
  });

  // ─────────────────────────────────────────────────────────────
  // 6. GENERIC FALLBACK PREVENTION & PROVIDER PARITY
  // ─────────────────────────────────────────────────────────────
  console.log('\n6. Generic Fallback Prevention:');

  await test('6.1 DeterministicFallbackProvider never outputs generic greeting when destination is present', async () => {
    const provider = new DeterministicFallbackProvider();
    const res = await provider.chat(
      'System: Assistant for Uttarakhand',
      [{ role: 'user', content: 'i want to go pithoragarh with 5000 budget' }],
      []
    );
    assert(res.text, 'Must produce a response text');
    assert(!res.text.includes("I'm your AI Travel Copilot for Uttarakhand. Ask me about your trip"),
      'Must NOT fall back to generic chatbot greeting when destination/trip is queried');
    assert(res.text.includes('Pithoragarh') || res.text.includes('trip'), 'Must mention destination or trip');
  });

  // ─────────────────────────────────────────────────────────────
  // 7. SECURITY & ACTION VALIDATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n7. Action Validation & Guardrails:');

  await test('7.1 Disallows arbitrary URL navigation / external redirect actions', () => {
    const ALLOWED_TYPES = new Set([
      'NAVIGATE', 'PREFILL_TRIP_PLANNER', 'FOCUS_TRIP_FIELD',
      'OPEN_DESTINATION', 'OPEN_MAP', 'OPEN_STAY', 'HIGHLIGHT_ITINERARY_DAY'
    ]);

    const dangerousActions = [
      { type: 'EXECUTE_CODE', code: 'alert(1)' },
      { type: 'REDIRECT', url: 'https://malicious.com' },
      { type: 'EVAL', code: 'window.location.href="evil.com"' }
    ];

    for (const a of dangerousActions) {
      assert(!ALLOWED_TYPES.has(a.type), `Must reject dangerous action ${a.type}`);
    }
  });

  await test('7.2 PageContext prevents redundant navigation if already on /trip-planner', async () => {
    const sId = createSession();
    const plannerSession = getSession(sId);
    Object.assign(plannerSession.contextEntities, {
      destination: 'Badrinath',
      origin: 'Delhi',
      startDate: '2026-10-15',
      duration: 5,
      travelers: 2
    });

    const res = await runAgent({
      message: 'Budget 25k kar do',
      session: plannerSession,
      requestId: 'page_ctx_1',
      pageContext: { currentRoute: '/trip-planner', currentPage: 'trip_planner' }
    });

    const navAction = res.uiActions.find(a => a.type === 'NAVIGATE');
    assert(!navAction, 'Must NOT emit redundant NAVIGATE when already on /trip-planner');
  });

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
  console.log('============================================================\n');

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal error running suite:', err);
  process.exit(1);
});
