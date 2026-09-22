import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('====================================================');
  console.log('DISCOVERY UTTARAKHAND — TRANSPORT ENGINE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Audit backend/seed/transports.json
  const seedPath = path.join(__dirname, '../seed/transports.json');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ seed/transports.json not found');
    failed++;
    return;
  }
  const transports = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  console.log(`[TEST 1] Auditing ${transports.length} seed transport records...`);

  let invalidRecords = 0;
  let unverifiedWithFakeTime = 0;
  let unverifiedWithFakePrice = 0;

  transports.forEach((t, i) => {
    if (!t.mode || !t.routingType || !t.origin?.name || !t.destination?.name || !t.source || !t.sourceUrl) {
      console.error(`  ❌ Record #${i} missing required schema field:`, t);
      invalidRecords++;
    }
    // Strict zero fabricated facts rule
    if (t.departureTime !== null && typeof t.departureTime !== 'string') {
      unverifiedWithFakeTime++;
    }
    if (t.price !== null && typeof t.price !== 'object') {
      unverifiedWithFakePrice++;
    }
  });

  if (invalidRecords === 0 && unverifiedWithFakeTime === 0 && unverifiedWithFakePrice === 0) {
    console.log('  ✅ All seed transport records adhere strictly to schema & data integrity rules.');
    passed++;
  } else {
    console.error(`  ❌ Failed integrity audit. Invalid: ${invalidRecords}`);
    failed++;
  }

  // 2. Query backend API endpoints
  console.log('\n[TEST 2] Querying GET http://localhost:5000/api/transports...');
  try {
    const res = await fetch('http://localhost:5000/api/transports');
    const json = await res.json();
    if (json.success && json.count > 0 && Array.isArray(json.data)) {
      console.log(`  ✅ GET /api/transports returned ${json.count} verified corridors.`);
      passed++;
    } else {
      console.error('  ❌ Unexpected API response:', json);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ API fetch error:', err.message);
    failed++;
  }

  // 3. Query Corridor search
  console.log('\n[TEST 3] Querying GET http://localhost:5000/api/transports/corridor?from=Delhi&to=Haldwani...');
  try {
    const res = await fetch('http://localhost:5000/api/transports/corridor?from=Delhi&to=Haldwani');
    const json = await res.json();
    if (json.success && json.count >= 1) {
      console.log(`  ✅ Corridor search returned ${json.count} matched service: "${json.data[0].serviceName}" (${json.data[0].operator}).`);
      passed++;
    } else {
      console.error('  ❌ Corridor query returned 0 matches:', json);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Corridor fetch error:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) process.exit(1);
}

runTests();
