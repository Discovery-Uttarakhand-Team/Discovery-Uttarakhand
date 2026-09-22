import { generatePersonalizedTripPlan } from '../../Frontend/src/utils/itineraryGenerator.js';

console.log('Testing Itinerary Journey Segment Generation...');

const mockDestination = {
  id: 'dest-adi-kailash',
  name: 'Adi Kailash',
  district: 'Pithoragarh',
  coordinates: [30.3165, 80.6385],
  shortDesc: 'Sacred Himalayan peak in the Kumaon region near the Indo-Tibetan border.'
};

const dayPlans = generatePersonalizedTripPlan({
  startingLocation: { name: 'Agra', coordinates: [27.1767, 78.0081] },
  destination: mockDestination,
  preferences: {
    duration: '7 Days',
    tripType: ['Trek', 'Spiritual'],
    transport: 'Train + Local Taxi',
    pace: 'Balanced'
  },
  routeData: {
    totalDistanceKm: 620,
    estimatedTime: '15 hrs',
    isRoadRoute: true
  },
  allActivities: [],
  allSpiritual: [],
  allStays: []
});

console.log(`Generated ${dayPlans.length} days strictly.`);

dayPlans.forEach((d) => {
  console.log(`\n--- DAY ${d.dayNumber}: ${d.title} (${d.badge}) ---`);
  console.log(`  Phase: ${d.phase}`);
  console.log(`  Journey Segments (${d.journeySegments?.length || 0}):`);
  (d.journeySegments || []).forEach(seg => {
    console.log(`    Leg ${seg.legIndex}: [${seg.mode} | ${seg.routingType}] ${seg.from} -> ${seg.to}`);
    if (seg.transferNote) console.log(`      Transfer: ${seg.transferNote}`);
    if (seg.operator) console.log(`      Operator: ${seg.operator}`);
    console.log(`      Departure: ${seg.departureTime || 'null (unverified)'}`);
    console.log(`      Fare: ${seg.price ? '₹' + seg.price.min : 'null (unverified)'}`);
    if (seg.isVerified) console.log(`      Verified Source: ${seg.source}`);
  });
});

console.log('\nValidation complete.');
