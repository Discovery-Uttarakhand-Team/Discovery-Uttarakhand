/**
 * Discovery Uttarakhand — Deterministic Safety & Advisory Engine
 * Algorithmic rules engine evaluating normalized live evidence against trip context.
 * NEVER relies on LLMs for safety truth; produces typed, verifiable advisories.
 */

import WeatherAdapter from './adapters/openMeteoAdapter.js';
import RoadAdvisoryAdapter from './adapters/roadAdvisoryAdapter.js';
import TransitLiveAdapter from './adapters/transitLiveAdapter.js';
import { memoryCache } from './cache/memoryCache.js';

export class AdvisoryEngine {
  /**
   * Evaluate safety advisories for a trip context
   * @param {Object} tripContext 
   * @param {Object} [options]
   * @returns {Promise<Object>}
   */
  static async evaluateTrip(tripContext, options = {}) {
    if (!tripContext) {
      throw new Error('Trip context is required for advisory evaluation');
    }

    const tripId = tripContext._id ? tripContext._id.toString() : (tripContext.tripId || 'transient-trip');
    const cacheKey = `live:trip:${tripId}`;

    if (!options.skipCache) {
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return cached.data;
      }
    }

    const now = new Date();
    const advisories = [];
    const evidence = {
      weather: [],
      road: [],
      transit: []
    };

    // 1. Extract destinations to query
    const destinations = [];
    if (Array.isArray(tripContext.destinations)) {
      for (const dest of tripContext.destinations) {
        if (dest && typeof dest === 'object') {
          destinations.push({
            name: dest.name || 'Destination',
            coordinates: Array.isArray(dest.coordinates) ? dest.coordinates : [29.39, 79.45],
            altitude: dest.altitude || null
          });
        }
      }
    } else if (tripContext.destination && typeof tripContext.destination === 'object') {
      destinations.push({
        name: tripContext.destination.name || 'Destination',
        coordinates: Array.isArray(tripContext.destination.coordinates) ? tripContext.destination.coordinates : [29.39, 79.45],
        altitude: tripContext.destination.altitude || null
      });
    }

    // Default to Nainital coordinates if empty
    if (destinations.length === 0) {
      destinations.push({
        name: tripContext.title?.replace(/^My\s+|\s+Adventure$/gi, '') || 'Uttarakhand',
        coordinates: [29.3919, 79.4542],
        altitude: 2084
      });
    }

    // 2. Extract journey corridors from itinerary days
    const days = Array.isArray(tripContext.days) ? tripContext.days : (tripContext.generatedItinerary?.days || []);
    const corridorsMap = new Map(); // corridor -> dayNumber

    days.forEach((day, index) => {
      const dayNum = day.dayNumber || (index + 1);
      const legs = Array.isArray(day.transitLegs) ? day.transitLegs : (day.transit ? [day.transit] : []);

      legs.forEach(leg => {
        let corridorStr = null;
        if (leg.corridor) {
          corridorStr = leg.corridor;
        } else if (leg.from && leg.to) {
          corridorStr = `${leg.from} → ${leg.to}`;
        } else if (leg.origin && leg.destination) {
          corridorStr = `${leg.origin} → ${leg.destination}`;
        }

        if (corridorStr) {
          corridorsMap.set(corridorStr, {
            dayNumber: dayNum,
            mode: leg.mode || 'Bus',
            arrivalTime: leg.arrivalTime || null,
            routingType: leg.routingType || 'road'
          });
        }
      });
    });

    // 3. Fetch Weather Telemetry for destinations
    for (const dest of destinations) {
      const [lat, lon] = dest.coordinates;
      try {
        const weatherEnvelope = await OpenMeteoAdapter.getWeather(lat, lon, {
          name: dest.name,
          altitude: dest.altitude
        });
        evidence.weather.push(weatherEnvelope);

        // RULE 1: Alpine High-Altitude Severe Weather
        const wData = weatherEnvelope.data;
        if (weatherEnvelope.status === 'LIVE' && wData) {
          const isHighAltitude = (dest.altitude && dest.altitude > 2500);
          const hasHeavyPrecip = (wData.rainfallMm >= 15 || wData.snowfallCm >= 5 || (wData.windSpeedKmh && wData.windSpeedKmh >= 40));

          if (isHighAltitude && hasHeavyPrecip) {
            advisories.push({
              id: `adv_weather_${dest.name.toLowerCase().replace(/\s+/g, '_')}_severe`,
              type: 'WEATHER_ADVISORY',
              severity: 'HIGH',
              title: `High-Altitude Weather Alert: ${dest.name} (${dest.altitude}m)`,
              message: `Severe alpine conditions detected: ${wData.weatherCondition} (Rain: ${wData.rainfallMm}mm, Snow: ${wData.snowfallCm}cm, Wind: ${wData.windSpeedKmh}km/h). High trail trekking restricted.`,
              location: dest.name,
              corridor: null,
              dayNumber: null,
              status: weatherEnvelope.status,
              source: weatherEnvelope.source,
              observedAt: weatherEnvelope.observedAt
            });
          } else if (wData.conditionSeverity === 'HIGH' || wData.conditionSeverity === 'CRITICAL' || wData.rainfallMm >= 8) {
            // RULE 2: Moderate Mountain Rainfall / Storm
            advisories.push({
              id: `adv_weather_${dest.name.toLowerCase().replace(/\s+/g, '_')}_rain`,
              type: 'WEATHER_ADVISORY',
              severity: wData.conditionSeverity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
              title: `Weather Advisory: ${dest.name}`,
              message: `Inclement mountain weather expected: ${wData.weatherCondition} with ${wData.rainfallMm}mm rainfall. Maintain road transit buffers.`,
              location: dest.name,
              corridor: null,
              dayNumber: null,
              status: weatherEnvelope.status,
              source: weatherEnvelope.source,
              observedAt: weatherEnvelope.observedAt
            });
          }
        }

        // RULE: Stale Weather Warning
        if (weatherEnvelope.status === 'STALE') {
          advisories.push({
            id: `adv_stale_weather_${dest.name.toLowerCase().replace(/\s+/g, '_')}`,
            type: 'DATA_STALE_WARNING',
            severity: 'LOW',
            title: `Weather Telemetry Stale for ${dest.name}`,
            message: `Latest weather observation is past preferred freshness. Confirm local mountain conditions at base before departure.`,
            location: dest.name,
            corridor: null,
            dayNumber: null,
            status: 'STALE',
            source: weatherEnvelope.source,
            observedAt: weatherEnvelope.observedAt
          });
        }
      } catch (err) {
        // Handled via envelope in adapter
      }
    }

    // 4. Fetch Road Advisories for active corridors
    for (const [corridor, legInfo] of corridorsMap.entries()) {
      try {
        const roadEnvelope = await RoadAdvisoryAdapter.getAdvisory({ corridor });
        evidence.road.push(roadEnvelope);

        if (roadEnvelope.status === 'LIVE' && roadEnvelope.data) {
          const rData = roadEnvelope.data;

          // RULE 3: Corridor Road Closure (CRITICAL)
          if (rData.roadStatus === 'CLOSED') {
            advisories.push({
              id: `adv_road_closure_${corridor.replace(/\s+/g, '_')}`,
              type: 'ROAD_CLOSURE',
              severity: 'CRITICAL',
              title: `Road Closed: ${corridor}`,
              message: `Corridor ${corridor} is CLOSED due to ${rData.restrictionType}: ${rData.title}. Day ${legInfo.dayNumber} transit blocked.`,
              location: null,
              corridor,
              dayNumber: legInfo.dayNumber,
              status: 'LIVE',
              source: roadEnvelope.source,
              observedAt: roadEnvelope.observedAt
            });
          } else if (rData.roadStatus === 'RESTRICTED') {
            // RULE 4: Corridor Single-Lane / Restriction (MEDIUM / HIGH)
            advisories.push({
              id: `adv_road_restrict_${corridor.replace(/\s+/g, '_')}`,
              type: 'ROAD_RESTRICTION',
              severity: rData.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
              title: `Transit Delay Alert: ${corridor}`,
              message: `${rData.title}. Transit restriction on Day ${legInfo.dayNumber}: ${rData.description}`,
              location: null,
              corridor,
              dayNumber: legInfo.dayNumber,
              status: 'LIVE',
              source: roadEnvelope.source,
              observedAt: roadEnvelope.observedAt
            });
          }
        }

        // RULE: Night Driving Curfew
        if (legInfo.routingType === 'road' && legInfo.arrivalTime) {
          const hour = parseInt(legInfo.arrivalTime.split(':')[0], 10);
          if (!isNaN(hour) && hour >= 18) {
            advisories.push({
              id: `adv_night_curfew_day_${legInfo.dayNumber}`,
              type: 'NIGHT_DRIVING_HAZARD',
              severity: 'MEDIUM',
              title: `Night Mountain Transit Caution (Day ${legInfo.dayNumber})`,
              message: `Planned arrival (${legInfo.arrivalTime}) exceeds 6:00 PM. High Himalayan roads prohibit non-emergency night transit. Depart earlier.`,
              location: null,
              corridor,
              dayNumber: legInfo.dayNumber,
              status: 'LIVE',
              source: 'Uttarakhand State Road Safety Guidelines',
              observedAt: now.toISOString()
            });
          }
        }

        // 5. Query Transit Live Status
        const parts = corridor.split(/→|->/).map(p => p.trim());
        if (parts.length === 2) {
          const transitEnvelope = await TransitLiveAdapter.getTransitStatus({
            origin: parts[0],
            destination: parts[1],
            mode: legInfo.mode
          });
          evidence.transit.push(transitEnvelope);
        }
      } catch (err) {
        // Handled via envelopes
      }
    }

    // 6. Always append a general baseline advisory for traveler awareness
    advisories.push({
      id: 'adv_general_conditions_normal',
      type: 'INFORMATION_UNAVAILABLE',
      severity: 'INFO',
      title: advisories.length === 0 ? 'Himalayan Transit Conditions Normal' : 'Himalayan Safety Baseline',
      message: advisories.length === 0
        ? 'No active road closures or severe weather warnings reported on your travel corridors. Maintain standard daylight driving precautions.'
        : 'Above advisories are based on current live data. Conditions in Himalayan regions can change rapidly. Always verify locally before departure.',
      location: null,
      corridor: null,
      dayNumber: null,
      status: 'LIVE',
      source: 'Discovery Uttarakhand Safety Engine',
      observedAt: now.toISOString()
    });

    const hasCriticalHazards = advisories.some(a => a.severity === 'CRITICAL');
    const result = {
      success: true,
      tripId,
      evaluatedAt: now.toISOString(),
      hasCriticalHazards,
      advisoriesCount: advisories.length,
      advisories,
      evidenceSummary: {
        weatherCount: evidence.weather.length,
        roadCount: evidence.road.length,
        transitCount: evidence.transit.length
      }
    };

    // Cache trip evaluation for 5 minutes
    memoryCache.set(cacheKey, result, 300, 600);

    return result;
  }
}

export default AdvisoryEngine;

