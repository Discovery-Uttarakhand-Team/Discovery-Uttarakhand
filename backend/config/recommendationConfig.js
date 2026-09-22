/**
 * Discovery Uttarakhand — Recommendation Engine Configuration
 * Centralized weights, thresholds, and seasonal rules for deterministic scoring.
 * Same input + same dataset = same deterministic score and ranking.
 */

export const RECOMMENDATION_CONFIG = {
  // Dimension weights (Sum = 100)
  weights: {
    locationMatch: 30,    // Proximity to current day's overnight base or trail route
    interestMatch: 20,    // Overlap with user interests (e.g. Photography, Alpine, Birding)
    tripTypeMatch: 15,    // Match with trip type (Trek, Spiritual, Nature, Adventure)
    paceMatch: 10,        // Fit for pace preference (Relaxed, Balanced, Fast)
    seasonMatch: 10,      // Seasonal suitability (Monsoon avoid, Winter snow, Summer peak)
    durationFit: 5,       // Activity/Stay fits within day's available time
    travelTimeFit: 5,     // Feasibility of transit within daylight hours
    budgetFit: 5          // Alignment with budget tier
  },

  // Proximity scoring bands (Distance in km from day's overnight location or base)
  proximityBands: [
    { maxKm: 15, score: 1.0, label: 'Immediate vicinity (<15 km)' },
    { maxKm: 35, score: 0.8, label: 'Short local drive (<35 km)' },
    { maxKm: 60, score: 0.5, label: 'Day-trip range (<60 km)' },
    { maxKm: 100, score: 0.2, label: 'Extended excursion (<100 km)' }
  ],
  maxAcceptableDistanceKm: 100, // Beyond 100 km from day's overnight base, item is excluded for that day

  // Pace parameters: Maximum travel radius per day
  paceTravelLimitsKm: {
    Relaxed: 40,
    Balanced: 75,
    Fast: 110
  },

  // High altitude seasonality rules for Uttarakhand
  seasonalRules: {
    // Months 7 & 8 (July, August) = Monsoon
    monsoonMonths: [7, 8],
    monsoonRiskDistricts: ['Rudraprayag', 'Chamoli', 'Pithoragarh', 'Uttarkashi'],
    // Months 11, 12, 1, 2 (Nov - Feb) = Heavy Snow / High Pass closures
    winterPassClosures: ['Adi Kailash', 'Roopkund', 'Milam Glacier', 'Kuari Pass', 'Hemkund Sahib']
  }
};
