/**
 * Discovery Uttarakhand — Transit Live Adapter
 * Provides time-sensitive transit status while strictly upholding ethical non-scraping policies.
 * Connects road corridor disruptions to mountain transit availability.
 */

import Transport from '../../models/Transport.js';
import RoadBulletin from '../../models/RoadBulletin.js';
import { memoryCache } from '../cache/memoryCache.js';

export class TransitLiveAdapter {
  static TTL_SECONDS = 900; // 15 Minutes LIVE
  static STALE_GRACE_SECONDS = 3600; // 1 Hour STALE

  /**
   * Get transit live status for an origin, destination, and mode
   * @param {Object} params { origin, destination, mode, skipCache }
   * @returns {Promise<Object>} LiveDataEnvelope
   */
  static async getTransitStatus(params = {}) {
    const origin = (params.origin || '').trim();
    const destination = (params.destination || '').trim();
    const mode = (params.mode || 'Bus').trim();

    const corridor = `${origin} → ${destination}`;
    const cacheKey = `live:transit:${origin.toLowerCase()}:${destination.toLowerCase()}:${mode.toLowerCase()}`;

    if (!params.skipCache) {
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
      // 1. Check if an active RoadBulletin impacts this corridor
      const roadDisruption = await RoadBulletin.findOne({
        isActive: true,
        expiresAt: { $gt: now },
        roadStatus: { $in: ['RESTRICTED', 'CLOSED'] },
        $or: [
          { corridor: new RegExp(origin, 'i') },
          { corridor: new RegExp(destination, 'i') }
        ]
      }).sort({ severity: -1 }).lean();

      // 2. Query Transport registry for official booking portals and baseline info
      const transportRecord = await Transport.findOne({
        'origin.name': new RegExp(origin, 'i'),
        'destination.name': new RegExp(destination, 'i')
      }).lean();

      const bookingUrl = transportRecord?.bookingUrl || 
        (mode.toLowerCase() === 'train' ? 'https://www.irctc.co.in/' : 'https://www.utconline.uk.gov.in/');
      const operator = transportRecord?.operator || (mode.toLowerCase() === 'train' ? 'Indian Railways (IRCTC)' : 'Uttarakhand Transport Corporation (UTC)');

      // If road is actively closed/restricted, road transit is disrupted
      if (roadDisruption && ['Bus', 'Taxi', 'Shared Jeep', 'Local Transfer'].includes(mode)) {
        const isClosed = roadDisruption.roadStatus === 'CLOSED';
        const envelope = {
          status: 'LIVE',
          observedAt: roadDisruption.effectiveFrom ? new Date(roadDisruption.effectiveFrom).toISOString() : now.toISOString(),
          fetchedAt: now.toISOString(),
          expiresAt: new Date(roadDisruption.expiresAt).toISOString(),
          freshnessSeconds: this.TTL_SECONDS,
          source: roadDisruption.source || 'State Transit & Disaster Advisory',
          sourceUrl: roadDisruption.sourceUrl || 'https://usdma.uk.gov.in/',
          confidence: 'HIGH',
          scope: {
            type: 'corridor',
            id: corridor,
            origin,
            destination,
            mode
          },
          data: {
            serviceStatus: isClosed ? 'SUSPENDED' : 'DELAYED',
            delayEstimatedMinutes: isClosed ? null : 45,
            disruptionReason: roadDisruption.title,
            disruptionDetails: roadDisruption.description,
            operator,
            bookingUrl,
            officialPortalNotice: 'Check counter or official state roadway portal before departing.'
          },
          warnings: [
            isClosed
              ? `Mountain transit along ${corridor} is suspended due to active road closure: ${roadDisruption.title}`
              : `Transit delays expected along ${corridor} due to single-lane road restriction: ${roadDisruption.title}`
          ],
          error: null
        };

        memoryCache.set(cacheKey, envelope, this.TTL_SECONDS, this.STALE_GRACE_SECONDS);
        return envelope;
      }

      // If no disruption is logged, return honest UNKNOWN telemetry without fake scraping
      const unknownEnvelope = {
        status: 'UNKNOWN',
        observedAt: null,
        fetchedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + (this.TTL_SECONDS * 1000)).toISOString(),
        freshnessSeconds: this.TTL_SECONDS,
        source: operator,
        sourceUrl: bookingUrl,
        confidence: 'UNVERIFIED',
        scope: {
          type: 'corridor',
          id: corridor,
          origin,
          destination,
          mode
        },
        data: {
          serviceStatus: 'SCHEDULED_OFFLINE_VERIFICATION',
          delayEstimatedMinutes: null,
          disruptionReason: null,
          operator,
          bookingUrl,
          officialPortalNotice: 'State roadways and railways do not offer public live REST API. Verify current schedule at station ticket counters or official portals.'
        },
        warnings: [
          `Live seat telemetry not available via public API. Use official deep link to verify departure timing.`
        ],
        error: null
      };

      memoryCache.set(cacheKey, unknownEnvelope, 300, 600);
      return unknownEnvelope;
    } catch (err) {
      return {
        status: 'UNAVAILABLE',
        observedAt: null,
        fetchedAt: now.toISOString(),
        expiresAt: now.toISOString(),
        freshnessSeconds: 0,
        source: 'Transit Adapter',
        sourceUrl: 'https://www.utconline.uk.gov.in/',
        confidence: 'LOW',
        scope: {
          type: 'corridor',
          id: corridor,
          origin,
          destination,
          mode
        },
        data: null,
        warnings: [`Transit telemetry unavailable: ${err.message}`],
        error: err.message
      };
    }
  }
}

export default TransitLiveAdapter;
