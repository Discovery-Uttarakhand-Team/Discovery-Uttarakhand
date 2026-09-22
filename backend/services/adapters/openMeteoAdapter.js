/**
 * Discovery Uttarakhand — Weather Adapter
 * Ingests live mountain weather from Open-Meteo Alpine Forecast Model.
 * Implements provider abstraction, timeout defense, caching, and standard freshness lifecycle.
 */

import { memoryCache } from '../cache/memoryCache.js';

// WMO Weather Interpretation Codes (WMO-No. 306)
const WMO_CODE_MAP = {
  0: { condition: 'Clear Sky', severity: 'INFO' },
  1: { condition: 'Mainly Clear', severity: 'INFO' },
  2: { condition: 'Partly Cloudy', severity: 'INFO' },
  3: { condition: 'Overcast', severity: 'INFO' },
  45: { condition: 'Fog', severity: 'LOW' },
  48: { condition: 'Freezing Fog / Rime', severity: 'MEDIUM' },
  51: { condition: 'Light Drizzle', severity: 'LOW' },
  53: { condition: 'Moderate Drizzle', severity: 'LOW' },
  55: { condition: 'Dense Drizzle', severity: 'MEDIUM' },
  61: { condition: 'Slight Rain', severity: 'LOW' },
  63: { condition: 'Moderate Rain', severity: 'MEDIUM' },
  65: { condition: 'Heavy Rainfall', severity: 'HIGH' },
  71: { condition: 'Slight Snowfall', severity: 'MEDIUM' },
  73: { condition: 'Moderate Snowfall', severity: 'HIGH' },
  75: { condition: 'Heavy Snowstorm', severity: 'CRITICAL' },
  77: { condition: 'Snow Grains', severity: 'LOW' },
  80: { condition: 'Passing Rain Showers', severity: 'LOW' },
  81: { condition: 'Moderate Rain Showers', severity: 'MEDIUM' },
  82: { condition: 'Violent Cloudburst Rain', severity: 'CRITICAL' },
  85: { condition: 'Slight Snow Showers', severity: 'MEDIUM' },
  86: { condition: 'Heavy Snow Showers', severity: 'HIGH' },
  95: { condition: 'Thunderstorm', severity: 'HIGH' },
  96: { condition: 'Thunderstorm with Light Hail', severity: 'HIGH' },
  99: { condition: 'Severe Thunderstorm & Heavy Hail', severity: 'CRITICAL' }
};

export class OpenMeteoAdapter {
  static TTL_SECONDS = 3600; // 1 Hour LIVE
  static STALE_GRACE_SECONDS = 7200; // 2 Hours STALE
  static TIMEOUT_MS = 3500; // 3.5s Timeout

  /**
   * Fetch weather for geographic coordinates
   * @param {number} lat 
   * @param {number} lon 
   * @param {Object} [options]
   * @returns {Promise<Object>} LiveDataEnvelope
   */
  static async getWeather(lat, lon, options = {}) {
    let latitude = parseFloat(lat);
    let longitude = parseFloat(lon);

    // Auto-detect and swap if GeoJSON [lon, lat] format was passed
    // For Uttarakhand/India, Longitude is ~77-82°E, Latitude is ~28-32°N
    if (latitude > 50 && longitude < 40) {
      const temp = latitude;
      latitude = longitude;
      longitude = temp;
    }

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
    }

    const locationName = options.name || 'Uttarakhand Location';
    const altitude = options.altitude || null;
    const cacheKey = `live:weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

    // Check in-memory cache
    const cached = memoryCache.get(cacheKey);
    if (cached && !options.skipCache) {
      return {
        ...cached.data,
        status: cached.status,
        fetchedAt: new Date(cached.cachedAt).toISOString(),
        expiresAt: new Date(cached.expiresAt).toISOString(),
        warnings: cached.status === 'STALE'
          ? [`Weather telemetry is cached and past preferred 1-hour freshness.`]
          : []
      };
    }

    const now = new Date();

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,snowfall,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FKolkata&forecast_days=3`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = await response.json();
      const current = raw.current || {};
      const daily = raw.daily || {};

      const wmoInfo = WMO_CODE_MAP[current.weather_code] || { condition: 'Unknown Alpine Condition', severity: 'INFO' };

      // Build daily forecasts
      const forecastDays = [];
      if (Array.isArray(daily.time)) {
        for (let i = 0; i < daily.time.length; i++) {
          const dayCode = daily.weather_code ? daily.weather_code[i] : null;
          const dayInfo = WMO_CODE_MAP[dayCode] || { condition: 'Partly Cloudy' };
          forecastDays.push({
            date: daily.time[i],
            maxTemp: daily.temperature_2m_max ? daily.temperature_2m_max[i] : null,
            minTemp: daily.temperature_2m_min ? daily.temperature_2m_min[i] : null,
            precipitationProbability: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
            condition: dayInfo.condition
          });
        }
      }

      const normalizedPayload = {
        temperature: current.temperature_2m !== undefined ? current.temperature_2m : null,
        feelsLike: current.apparent_temperature !== undefined ? current.apparent_temperature : null,
        humidity: current.relative_humidity_2m !== undefined ? current.relative_humidity_2m : null,
        precipitationMm: current.precipitation !== undefined ? current.precipitation : 0,
        rainfallMm: current.rain !== undefined ? current.rain : 0,
        snowfallCm: current.snowfall !== undefined ? current.snowfall : 0,
        windSpeedKmh: current.wind_speed_10m !== undefined ? current.wind_speed_10m : null,
        visibilityMeters: current.visibility !== undefined ? current.visibility : null,
        wmoCode: current.weather_code,
        weatherCondition: wmoInfo.condition,
        conditionSeverity: wmoInfo.severity,
        forecast: forecastDays
      };

      const envelope = {
        status: 'LIVE',
        observedAt: current.time ? new Date(current.time).toISOString() : now.toISOString(),
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + (this.TTL_SECONDS * 1000)).toISOString(),
        freshnessSeconds: this.TTL_SECONDS,
        source: 'Open-Meteo High-Resolution Alpine Model',
        sourceUrl: 'https://open-meteo.com/',
        confidence: 'HIGH',
        scope: {
          type: 'destination',
          name: locationName,
          coordinates: [latitude, longitude],
          altitude
        },
        data: normalizedPayload,
        warnings: [],
        error: null
      };

      // Store in memory cache
      memoryCache.set(cacheKey, envelope, this.TTL_SECONDS, this.STALE_GRACE_SECONDS);

      return envelope;
    } catch (err) {
      // If we had stale cached data, serve it now with STALE status
      if (cached) {
        return {
          ...cached.data,
          status: 'STALE',
          fetchedAt: new Date(cached.cachedAt).toISOString(),
          expiresAt: new Date(cached.expiresAt).toISOString(),
          warnings: [
            `Live provider query failed (${err.message}). Serving cached weather data.`
          ]
        };
      }

      // No cache available: return honest UNAVAILABLE envelope
      return {
        status: 'UNAVAILABLE',
        observedAt: null,
        fetchedAt: now.toISOString(),
        expiresAt: now.toISOString(),
        freshnessSeconds: 0,
        source: 'Open-Meteo High-Resolution Alpine Model',
        sourceUrl: 'https://open-meteo.com/',
        confidence: 'LOW',
        scope: {
          type: 'destination',
          name: locationName,
          coordinates: [latitude, longitude],
          altitude
        },
        data: null,
        warnings: [`Weather telemetry temporarily unavailable: ${err.message}`],
        error: err.message
      };
    }
  }

  /**
   * Fetch elevation for geographic coordinates
   * @param {number} lat 
   * @param {number} lon 
   * @param {Object} [options]
   * @returns {Promise<Object>} LiveDataEnvelope
   */
  static async getElevation(lat, lon, options = {}) {
    let latitude = parseFloat(lat);
    let longitude = parseFloat(lon);

    if (latitude > 50 && longitude < 40) {
      const temp = latitude;
      latitude = longitude;
      longitude = temp;
    }

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90.`);
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude: ${lon}. Must be between -180 and 180.`);
    }

    const locationName = options.name || 'Uttarakhand Location';
    const cacheKey = `live:elevation:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;

    // Elevation is extremely static, cache it for a long time (24 hours)
    const ELEVATION_TTL = 86400; 

    const cached = memoryCache.get(cacheKey);
    if (cached && !options.skipCache) {
      return {
        ...cached.data,
        status: cached.status,
        fetchedAt: new Date(cached.cachedAt).toISOString(),
        expiresAt: new Date(cached.expiresAt).toISOString()
      };
    }

    const now = new Date();

    try {
      const url = `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`;
      
      const response = await fetch(url, {
        signal: AbortSignal.timeout(this.TIMEOUT_MS)
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo HTTP ${response.status}: ${response.statusText}`);
      }

      const raw = await response.json();
      
      if (!raw.elevation || !raw.elevation.length) {
        throw new Error('Open-Meteo returned malformed elevation array');
      }

      const elevationMeters = raw.elevation[0];

      const envelope = {
        status: 'LIVE',
        observedAt: now.toISOString(),
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + (ELEVATION_TTL * 1000)).toISOString(),
        freshnessSeconds: ELEVATION_TTL,
        source: 'Open-Meteo Digital Elevation Model',
        sourceUrl: 'https://open-meteo.com/',
        confidence: 'HIGH',
        scope: {
          type: 'location',
          name: locationName,
          coordinates: [latitude, longitude]
        },
        data: {
          elevation: elevationMeters,
          unit: 'meters'
        },
        warnings: [],
        error: null
      };

      memoryCache.set(cacheKey, envelope, ELEVATION_TTL, ELEVATION_TTL);

      return envelope;
    } catch (err) {
      if (cached) {
        return {
          ...cached.data,
          status: 'STALE',
          fetchedAt: new Date(cached.cachedAt).toISOString(),
          expiresAt: new Date(cached.expiresAt).toISOString(),
          warnings: [`Provider query failed (${err.message}). Serving cached elevation.`]
        };
      }

      return {
        status: 'UNAVAILABLE',
        observedAt: null,
        fetchedAt: now.toISOString(),
        expiresAt: now.toISOString(),
        freshnessSeconds: 0,
        source: 'Open-Meteo Digital Elevation Model',
        sourceUrl: 'https://open-meteo.com/',
        confidence: 'LOW',
        scope: {
          type: 'location',
          name: locationName,
          coordinates: [latitude, longitude]
        },
        data: null,
        warnings: [`Elevation data temporarily unavailable: ${err.message}`],
        error: err.message
      };
    }
  }
}

export default OpenMeteoAdapter;

