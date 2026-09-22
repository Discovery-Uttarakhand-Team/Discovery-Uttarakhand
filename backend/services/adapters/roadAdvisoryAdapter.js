/**
 * Discovery Uttarakhand — Road Advisory Adapter
 * Ingests and normalizes mountain highway and transit corridor advisories.
 * Separates route geometry (OSRM) from live operational road conditions.
 */

import RoadBulletin from '../../models/RoadBulletin.js';
import { memoryCache } from '../cache/memoryCache.js';

export class RoadAdvisoryAdapter {
  static TTL_SECONDS = 1800; // 30 Minutes LIVE
  static STALE_GRACE_SECONDS = 7200; // 2 Hours STALE

  /**
   * Normalize corridor string for deterministic matching
   * @param {string} corridor 
   * @returns {string}
   */
  static normalizeCorridor(corridor) {
    if (!corridor || typeof corridor !== 'string') return '';
    return corridor
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/->|–|—/g, '→')
      .trim();
  }

  /**
   * Get road advisories for a specific corridor or search filters
   * @param {Object} query { corridor, highway, district, skipCache }
   * @returns {Promise<Object>} LiveDataEnvelope
   */
  static async getAdvisory(query = {}) {
    const rawCorridor = query.corridor || '';
    const normCorridor = this.normalizeCorridor(rawCorridor);
    const highway = query.highway ? query.highway.trim().toUpperCase() : null;
    const district = query.district ? query.district.trim() : null;

    const cacheKey = `live:road:${normCorridor || highway || district || 'all'}`;

    if (!query.skipCache) {
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return {
          ...cached.data,
          status: cached.status,
          fetchedAt: new Date(cached.cachedAt).toISOString(),
          expiresAt: new Date(cached.expiresAt).toISOString()
        };
      }
    }

    const now = new Date();

    try {
      // Build search query for active unexpired bulletins
      const filter = {
        isActive: true,
        expiresAt: { $gt: now }
      };

      if (rawCorridor) {
        // Match corridor bidirectionally or fuzzy regex
        const parts = rawCorridor.split(/→|->/).map(p => p.trim());
        if (parts.length === 2) {
          filter.$or = [
            { corridor: new RegExp(parts[0], 'i') },
            { corridor: new RegExp(parts[1], 'i') }
          ];
        } else {
          filter.corridor = new RegExp(rawCorridor.trim(), 'i');
        }
      } else if (highway) {
        filter.highway = highway;
      } else if (district) {
        filter.district = new RegExp(district, 'i');
      }

      const bulletin = await RoadBulletin.findOne(filter).sort({ severity: -1, createdAt: -1 }).lean();

      if (bulletin) {
        const envelope = {
          status: 'LIVE',
          observedAt: bulletin.effectiveFrom ? new Date(bulletin.effectiveFrom).toISOString() : now.toISOString(),
          fetchedAt: now.toISOString(),
          expiresAt: new Date(bulletin.expiresAt).toISOString(),
          freshnessSeconds: Math.max(0, Math.floor((new Date(bulletin.expiresAt) - now) / 1000)),
          source: bulletin.source || 'Border Roads Organisation (BRO) / UKSDMA',
          sourceUrl: bulletin.sourceUrl || 'https://usdma.uk.gov.in/',
          confidence: 'HIGH',
          scope: {
            type: 'corridor',
            id: bulletin.corridor,
            highway: bulletin.highway,
            district: bulletin.district
          },
          data: {
            bulletinId: bulletin._id.toString(),
            corridor: bulletin.corridor,
            highway: bulletin.highway,
            roadStatus: bulletin.roadStatus, // OPEN | RESTRICTED | CLOSED
            restrictionType: bulletin.restrictionType,
            severity: bulletin.severity, // INFO | LOW | MEDIUM | HIGH | CRITICAL
            title: bulletin.title,
            description: bulletin.description,
            effectiveFrom: bulletin.effectiveFrom,
            expiresAt: bulletin.expiresAt
          },
          warnings: [],
          error: null
        };

        memoryCache.set(cacheKey, envelope, this.TTL_SECONDS, this.STALE_GRACE_SECONDS);
        return envelope;
      }

      // If no bulletin exists: return honest UNKNOWN state (Zero Fabrication)
      const unknownEnvelope = {
        status: 'UNKNOWN',
        observedAt: null,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + (this.TTL_SECONDS * 1000)).toISOString(),
        freshnessSeconds: this.TTL_SECONDS,
        source: 'Uttarakhand State Road Safety Monitor',
        sourceUrl: 'https://usdma.uk.gov.in/',
        confidence: 'UNVERIFIED',
        scope: {
          type: 'corridor',
          id: rawCorridor || highway || district || 'corridor-unmonitored'
        },
        data: null,
        warnings: [
          `No active administrative road bulletin on file for ${rawCorridor || highway || 'this corridor'}. Confirm current status at police checkpost before mountain transit.`
        ],
        error: null
      };

      // Cache unknown status briefly (5 minutes) to prevent hammering
      memoryCache.set(cacheKey, unknownEnvelope, 300, 600);
      return unknownEnvelope;
    } catch (err) {
      return {
        status: 'UNAVAILABLE',
        observedAt: null,
        fetchedAt: now.toISOString(),
        expiresAt: now.toISOString(),
        freshnessSeconds: 0,
        source: 'Uttarakhand State Road Safety Monitor',
        sourceUrl: 'https://usdma.uk.gov.in/',
        confidence: 'LOW',
        scope: {
          type: 'corridor',
          id: rawCorridor || 'corridor-error'
        },
        data: null,
        warnings: [`Road advisory query failed: ${err.message}`],
        error: err.message
      };
    }
  }

  /**
   * List all active bulletins across the state
   */
  static async listActiveBulletins() {
    const now = new Date();
    return RoadBulletin.find({
      isActive: true,
      expiresAt: { $gt: now }
    }).sort({ severity: -1, createdAt: -1 }).lean();
  }
}

export default RoadAdvisoryAdapter;
