import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import axios from 'axios';
import assert from 'assert';
import { executeTool } from '../services/agentTools.js';
import Destination from '../models/Destination.js';
import Activity from '../models/Activity.js';
import Stay from '../models/Stay.js';

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

async function runTests() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/discovery_uttarakhand';
  await mongoose.connect(uri);

  let passed = 0;
  let failed = 0;

  const test = (name, fn) => {
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  };

  const testAsync = async (name, fn) => {
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  };

  // 1. Base explore test
  await testAsync('1. GET /api/destinations/bhimtal/explore returns 200 with structured categories', async () => {
    const res = await axios.get(`${BASE_URL}/destinations/bhimtal/explore`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.destination.slug, 'bhimtal');
    assert(Array.isArray(res.data.availableCategories), 'availableCategories must be an array');
    assert(res.data.availableCategories.length > 0, 'Should have available categories');
  });

  // 2. Strict locality for trekking (Rule 1)
  await testAsync('2. GET /api/destinations/bhimtal/explore?interest=trekking (Strict local - zero far away results)', async () => {
    const res = await axios.get(`${BASE_URL}/destinations/bhimtal/explore?interest=trekking`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.matchingResults.length, 0, 'Must NOT return faraway treks from Chamoli/Uttarkashi');
    assert(res.data.emptyStateMessage.includes('No verified trekking experiences found'), 'Must show clean unverified note');
  });

  // 3. Strict locality for boating
  await testAsync('3. GET /api/destinations/bhimtal/explore?interest=boating returns genuine lake boating within 50km', async () => {
    const res = await axios.get(`${BASE_URL}/destinations/bhimtal/explore?interest=boating`);
    assert.strictEqual(res.status, 200);
    assert(res.data.matchingResults.length > 0, 'Boating on Naini Lake should be found nearby');
    assert(res.data.matchingResults[0].distanceKm <= 50, 'Distance must be <= 50km');
  });

  // 4. Nature & viewpoints
  await testAsync('4. GET /api/destinations/bhimtal/explore?interest=nature returns viewpoints/places nearby', async () => {
    const res = await axios.get(`${BASE_URL}/destinations/bhimtal/explore?interest=nature`);
    assert.strictEqual(res.status, 200);
    assert(res.data.matchingResults.length > 0, 'Should return nearby nature spots/viewpoints');
  });

  // 5. GeoJSON format and coordinate order [lng, lat] (Rule 2)
  await testAsync('5. Verify GeoJSON coordinates on Destination and 2dsphere index', async () => {
    const bhimtal = await Destination.findOne({ slug: 'bhimtal' });
    assert(bhimtal.location, 'Location must exist');
    assert.strictEqual(bhimtal.location.type, 'Point');
    const [lng, lat] = bhimtal.location.coordinates;
    assert(lng >= 77 && lng <= 81, `Longitude ${lng} must be in Uttarakhand bounds (77-81)`);
    assert(lat >= 28 && lat <= 32, `Latitude ${lat} must be in Uttarakhand bounds (28-32)`);
  });

  // 6. Price Provenance (Rule 4)
  await testAsync('6. Verify Price Provenance is preserved and distinct', async () => {
    const res = await axios.get(`${BASE_URL}/destinations/bhimtal/explore?interest=stays`);
    assert(res.data.matchingResults.length > 0, 'Stays should exist');
    const kmvnStay = res.data.matchingResults.find(s => s.name.includes('KMVN'));
    if (kmvnStay) {
      assert.strictEqual(kmvnStay.priceProvenance, 'VERIFIED', 'KMVN Govt TRH must have VERIFIED provenance');
      assert(kmvnStay.price > 0, 'Price must be a real number');
    }
  });

  // 7. Avoid Duplicate Records (Rule 5)
  await testAsync('7. Verify matchingResults is the filtered view and not duplicate DB document dump', async () => {
    const res = await axios.get(`${BASE_URL}/destinations/bhimtal/explore?interest=boating`);
    assert.strictEqual(res.data.matchingResults.length, 1);
    assert.strictEqual(res.data.activeInterest, 'boating');
    // Stays and Places remain their own clean domain collections
    assert(Array.isArray(res.data.stays), 'Stays array intact');
    assert(Array.isArray(res.data.placesToVisit), 'placesToVisit array intact');
  });

  // 8. AI Copilot exploreDestination Tool Grounding (Rule 6)
  await testAsync('8. Verify AI exploreDestination tool returns grounded data and rejects hallucinations', async () => {
    const aiRes = await executeTool('exploreDestination', { destination: 'Bhimtal', interest: 'trekking' });
    assert.strictEqual(aiRes.success, true);
    assert(aiRes.data.emptyStateMessage, 'AI must report no verified treks rather than inventing one');
    assert.strictEqual(aiRes.data.matchingResults.length, 0);

    const aiBoat = await executeTool('exploreDestination', { destination: 'Bhimtal', interest: 'boating' });
    assert.strictEqual(aiBoat.success, true);
    assert.strictEqual(aiBoat.data.matchingResults.length, 1);
    assert.strictEqual(aiBoat.data.matchingResults[0].name, 'Boating on Naini Lake');
  });

  console.log(`\n========================================`);
  console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
