/**
 * Discovery Uttarakhand — In-Memory TTL Cache with Stale-While-Revalidate
 * Zero-dependency cache for high-frequency live feeds (weather, road, transit).
 */

class MemoryCache {
  constructor(sweepIntervalMs = 600000) { // 10 minutes default sweep
    this.store = new Map();
    this.sweepInterval = setInterval(() => this.sweep(), sweepIntervalMs);
    // Don't keep Node process alive just for cache sweep in test environments
    if (this.sweepInterval.unref) {
      this.sweepInterval.unref();
    }
  }

  /**
   * Store a value in cache
   * @param {string} key 
   * @param {*} data 
   * @param {number} ttlSeconds Preferred freshness lifetime
   * @param {number} staleGraceSeconds Window after TTL where data is served as STALE
   */
  set(key, data, ttlSeconds = 1800, staleGraceSeconds = 3600) {
    const now = Date.now();
    const entry = {
      data,
      cachedAt: now,
      expiresAt: now + (ttlSeconds * 1000),
      staleUntil: now + ((ttlSeconds + staleGraceSeconds) * 1000),
      ttlSeconds
    };
    this.store.set(key, entry);
    return entry;
  }

  /**
   * Retrieve an item from cache
   * @param {string} key 
   * @returns {{ data: *, status: 'LIVE' | 'STALE' | null, expiresAt: number, cachedAt: number } | null}
   */
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    const now = Date.now();

    if (now <= entry.expiresAt) {
      return {
        data: entry.data,
        status: 'LIVE',
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt
      };
    }

    if (now <= entry.staleUntil) {
      return {
        data: entry.data,
        status: 'STALE',
        cachedAt: entry.cachedAt,
        expiresAt: entry.expiresAt
      };
    }

    // Past stale window: evicted / unavailable
    this.store.delete(key);
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  size() {
    return this.store.size;
  }

  sweep() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.staleUntil) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
    }
    this.store.clear();
  }
}

export const memoryCache = new MemoryCache();
export default memoryCache;
