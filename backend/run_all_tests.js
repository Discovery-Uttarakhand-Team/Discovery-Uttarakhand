import { spawnSync } from 'child_process';

const tests = [
  'test_phase1_recommendation_budget.js',
  'test_phase2_ai_planner.js',
  'test_phase3_partner_marketplace.js',
  'test_phase4_booking_engine.js',
  'test_phase5_web3_trust.js',
  'test_phase6_live_data.js',
  'test_phase7_agent.js',
  'test_phase7b_7c_hardening.js',
  'test_phase8_payments.js',
  'test_phase9_production.js'
];

let allPassed = true;

console.log('Running all regression tests...');

tests.forEach(test => {
  console.log(`\n--- Running ${test} ---`);
  const result = spawnSync('node', [`scripts/${test}`], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) {
    console.error(`\n❌ ${test} FAILED with code ${result.status}`);
    allPassed = false;
  } else {
    console.log(`\n✅ ${test} PASSED`);
  }
});

if (!allPassed) {
  process.exit(1);
}
console.log('\n✅ ALL REGRESSION TESTS PASSED!');
