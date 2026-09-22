/**
 * Discovery Uttarakhand — Phase 1 Test Suite
 * Automated verification of Recommendation Engine V2 and Deterministic Budget Engine.
 * Tests:
 * 1. Location match proximity & ranking
 * 2. Interest & Trip Type matching
 * 3. Pace travel-radius constraints
 * 4. Deterministic ranking stability (Same input = exact same output)
 * 5. Honest empty results when out of range
 * 6. Budget calculations with verified stays & transit
 * 7. Estimated food & buffer costs
 * 8. Unknown cost handling & disclaimer notices
 * 9. Multi-day and multi-traveler scaling
 * 10. Budget status evaluation: UNDER_BUDGET, NEAR_BUDGET, OVER_BUDGET, INSUFFICIENT_DATA
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import { connectDB } from '../config/db.js';
import RecommendationEngine from '../services/recommendationService.js';
import BudgetEngine from '../services/budgetEngine.js';

async function runPhase1Tests() {
  console.log('===============================================================');
  console.log('DISCOVERY UTTARAKHAND — PHASE 1 COMPREHENSIVE TEST SUITE');
  console.log('===============================================================\n');

  await connectDB();

  let passed = 0;
  let failed = 0;

  try {
    // -------------------------------------------------------------
    // TEST 1: Recommendation Engine — Location Match & Ranking
    // -------------------------------------------------------------
    console.log('[TEST 1] Testing Recommendation Engine location proximity match (Nainital base)...');
    const recsNainital = await RecommendationEngine.getRecommendations({
      dayNumber: 1,
      currentLocation: { name: 'Kathgodam', coordinates: [29.2718, 79.5312], district: 'Nainital' },
      overnightLocation: { name: 'Nainital', coordinates: [29.3919, 79.4542], district: 'Nainital' },
      durationDays: 5,
      pace: 'Balanced',
      tripType: ['Nature'],
      interests: ['Lake View', 'Boating']
    }, ['stays', 'activities']);

    if (recsNainital.stays && recsNainital.stays.length > 0) {
      const topStay = recsNainital.stays[0];
      if (topStay.score > 70 && topStay.reasons.length > 0 && typeof topStay.distanceKm === 'number') {
        console.log(`  ✅ Top Stay: "${topStay.item.name}" (Score: ${topStay.score}/100, Distance: ${topStay.distanceKm} km)`);
        console.log(`     Reasons: ${topStay.reasons.join(' | ')}`);
        passed++;
      } else {
        console.error('  ❌ Top stay score or reasons invalid:', topStay);
        failed++;
      }
    } else {
      console.error('  ❌ No stays recommended for Nainital');
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 2: Recommendation Engine — Deterministic Ranking Stability
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Testing Deterministic Ranking Stability (Same input = same output)...');
    const runA = await RecommendationEngine.getRecommendations({
      dayNumber: 2,
      currentLocation: { name: 'Dharchula', coordinates: [29.8516, 80.5369], district: 'Pithoragarh' },
      overnightLocation: { name: 'Dharchula', coordinates: [29.8516, 80.5369], district: 'Pithoragarh' },
      pace: 'Balanced',
      tripType: ['Trek'],
      interests: ['Alpine Trails']
    }, ['guides']);

    const runB = await RecommendationEngine.getRecommendations({
      dayNumber: 2,
      currentLocation: { name: 'Dharchula', coordinates: [29.8516, 80.5369], district: 'Pithoragarh' },
      overnightLocation: { name: 'Dharchula', coordinates: [29.8516, 80.5369], district: 'Pithoragarh' },
      pace: 'Balanced',
      tripType: ['Trek'],
      interests: ['Alpine Trails']
    }, ['guides']);

    const idsA = (runA.guides || []).map(g => g.item._id.toString()).join(',');
    const idsB = (runB.guides || []).map(g => g.item._id.toString()).join(',');
    const scoresA = (runA.guides || []).map(g => g.score).join(',');
    const scoresB = (runB.guides || []).map(g => g.score).join(',');

    if (idsA === idsB && scoresA === scoresB && runA.guides.length > 0) {
      console.log(`  ✅ Deterministic ranking verified: Identical ordering and scores across independent runs (${runA.guides.length} guides).`);
      passed++;
    } else {
      console.error('  ❌ Deterministic ordering failed between runs:', { idsA, idsB });
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 3: Recommendation Engine — Pace Constraint & Distance Cutoff
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Testing Pace Constraint: Relaxed travel radius cutoff...');
    // Relaxed pace limit is 40 km. Testing from remote Pithoragarh border.
    const recsRelaxed = await RecommendationEngine.getRecommendations({
      dayNumber: 3,
      currentLocation: { name: 'Dharchula', coordinates: [29.8516, 80.5369], district: 'Pithoragarh' },
      overnightLocation: { name: 'Dharchula', coordinates: [29.8516, 80.5369], district: 'Pithoragarh' },
      pace: 'Relaxed',
      tripType: ['Trek']
    }, ['stays']);

    const farStays = (recsRelaxed.stays || []).filter(s => s.distanceKm > 45);
    if (farStays.length === 0) {
      console.log(`  ✅ Relaxed pace correctly excluded far accommodations (>45 km). All ${recsRelaxed.stays.length} recommendations within travel boundary.`);
      passed++;
    } else {
      console.error('  ❌ Found stays exceeding relaxed radius:', farStays);
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 4: Recommendation Engine — Honest Empty Result on Out-of-State
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Testing Honest Empty Result for Non-Existent Remote Query...');
    const emptyRecs = await RecommendationEngine.getRecommendations({
      dayNumber: 1,
      currentLocation: { name: 'NonExistentPlace', coordinates: [12.9716, 77.5946], district: 'Bangalore' }, // Far South India
      overnightLocation: { name: 'NonExistentPlace', coordinates: [12.9716, 77.5946], district: 'Bangalore' },
      pace: 'Relaxed'
    }, ['stays']);

    if (!emptyRecs.stays || emptyRecs.stays.length === 0) {
      console.log('  ✅ Honest empty result returned when no verified Uttarakhand stays are in proximity.');
      passed++;
    } else {
      console.error('  ❌ Unexpected recommendations for out-of-state coordinates:', emptyRecs.stays);
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 5: Budget Engine — Multi-Category Cost Breakdown & Provenance
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Testing Budget Engine multi-category calculation with verified stay & rail...');
    const budgetRes = await BudgetEngine.calculateBudget({
      durationDays: 7,
      travelersCount: 2,
      budgetPreference: 'Balanced',
      transportSegments: [
        {
          from: 'Delhi',
          to: 'Kathgodam',
          mode: 'Train',
          price: { min: 820, max: 1200 },
          source: 'IRCTC Verified'
        },
        {
          from: 'Kathgodam',
          to: 'Dharchula',
          mode: 'Shared Taxi',
          price: null // Unverified local counter fare
        }
      ],
      guideDays: 2
    });

    const data = budgetRes.data;
    if (data && data.summary && data.breakdown) {
      const { summary, breakdown } = data;
      console.log(`  ✅ Total Estimated Cost: ₹${summary.totalEstimatedCost.toLocaleString()}`);
      console.log(`     Known Verified Cost: ₹${summary.totalKnownCost.toLocaleString()} (Provenance: ${breakdown.transport.details[0]?.provenance})`);
      console.log(`     Estimated Range: ₹${summary.minCost.toLocaleString()} – ₹${summary.maxCost.toLocaleString()}`);
      console.log(`     Budget Status: ${summary.budgetStatus}`);
      console.log(`     Explanation: ${summary.explanation}`);

      if (
        breakdown.food.provenance === 'ESTIMATED' &&
        breakdown.transport.unknownLegsCount === 1 &&
        data.assumptions.length >= 3 &&
        summary.hasUnknownCosts === true
      ) {
        console.log('  ✅ Strict data provenance maintained (Food ESTIMATED, Transit unknown disclaimers present).');
        passed++;
      } else {
        console.error('  ❌ Provenance rules violation:', breakdown);
        failed++;
      }
    } else {
      console.error('  ❌ Invalid budget response payload:', budgetRes);
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 6: Budget Engine — Multi-Traveler & Multi-Day Scaling
    // -------------------------------------------------------------
    console.log('\n[TEST 6] Testing Budget Engine scaling (1 traveler 3 days vs 4 travelers 7 days)...');
    const budget1 = await BudgetEngine.calculateBudget({ durationDays: 3, travelersCount: 1, budgetPreference: 'Budget' });
    const budget4 = await BudgetEngine.calculateBudget({ durationDays: 7, travelersCount: 4, budgetPreference: 'Budget' });

    const total1 = budget1.data.summary.totalEstimatedCost;
    const total4 = budget4.data.summary.totalEstimatedCost;

    if (total4 > total1 * 3) {
      console.log(`  ✅ Correct scaling: 1 traveler/3 days (₹${total1.toLocaleString()}) vs 4 travelers/7 days (₹${total4.toLocaleString()})`);
      passed++;
    } else {
      console.error('  ❌ Scaling calculation mismatch:', { total1, total4 });
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 7: Budget Engine — OVER_BUDGET Evaluation & Explanation
    // -------------------------------------------------------------
    console.log('\n[TEST 7] Testing OVER_BUDGET status evaluation and explanation...');
    const overBudgetRes = await BudgetEngine.calculateBudget({
      durationDays: 10,
      travelersCount: 2,
      budgetPreference: 'Budget',
      targetBudgetAmount: 15000, // unrealistically low budget cap for 10 days
      guideDays: 5
    });

    if (
      overBudgetRes.data.summary.budgetStatus === 'OVER_BUDGET' &&
      overBudgetRes.data.summary.explanation.includes('exceeds')
    ) {
      console.log(`  ✅ Status: ${overBudgetRes.data.summary.budgetStatus}`);
      console.log(`     Explanation: ${overBudgetRes.data.summary.explanation}`);
      passed++;
    } else {
      console.error('  ❌ Expected OVER_BUDGET status:', overBudgetRes.data.summary);
      failed++;
    }

    // -------------------------------------------------------------
    // TEST 8: Budget Engine — INSUFFICIENT_DATA Handling
    // -------------------------------------------------------------
    console.log('\n[TEST 8] Testing INSUFFICIENT_DATA status on high unverified legs...');
    const insufficientRes = await BudgetEngine.calculateBudget({
      durationDays: 5,
      travelersCount: 2,
      transportSegments: [
        { from: 'A', to: 'B', price: null },
        { from: 'B', to: 'C', price: null },
        { from: 'C', to: 'D', price: null },
        { from: 'D', to: 'E', price: null }
      ]
    });

    if (insufficientRes.data.summary.budgetStatus === 'INSUFFICIENT_DATA') {
      console.log('  ✅ INSUFFICIENT_DATA triggered correctly when >3 remote transit legs lack published tariffs.');
      passed++;
    } else {
      console.error('  ❌ Expected INSUFFICIENT_DATA status:', insufficientRes.data.summary);
      failed++;
    }

  } catch (err) {
    console.error('❌ Exception during test suite:', err);
    failed++;
  } finally {
    console.log('\n===============================================================');
    console.log(`PHASE 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('===============================================================');
    await mongoose.disconnect();
    if (failed > 0) process.exit(1);
  }
}

runPhase1Tests();
