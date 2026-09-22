import api from './api';
import { VERIFIED_TRANSPORTS } from '../data/verifiedTransports';

/**
 * Fetch transports with resilient client-side static fallback
 */
export const getTransports = async (params = {}) => {
  try {
    const res = await api.get('/transports', { params });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('Backend transports fetch failed, falling back to verified static catalog:', err);
  }

  // Filter static registry fallback
  let filtered = [...VERIFIED_TRANSPORTS];
  if (params.mode) {
    const reg = new RegExp(params.mode, 'i');
    filtered = filtered.filter(t => reg.test(t.mode));
  }
  if (params.routingType) {
    filtered = filtered.filter(t => t.routingType === params.routingType);
  }
  return {
    success: true,
    count: filtered.length,
    data: filtered,
    isFallback: true
  };
};

/**
 * Query corridor transports
 */
export const getCorridorTransports = async (from, to) => {
  try {
    const res = await api.get('/transports/corridor', { params: { from, to } });
    if (res.data && res.data.success && Array.isArray(res.data.data)) {
      return res.data;
    }
  } catch (err) {
    console.warn('Backend corridor query failed, falling back to static match:', err);
  }

  const results = VERIFIED_TRANSPORTS.filter(item => {
    const matchDirect = new RegExp(from, 'i').test(item.origin.name) && new RegExp(to, 'i').test(item.destination.name);
    const matchStops = Array.isArray(item.stops) &&
      item.stops.some(s => new RegExp(from, 'i').test(s)) &&
      item.stops.some(s => new RegExp(to, 'i').test(s));
    return matchDirect || matchStops;
  });

  return {
    success: true,
    count: results.length,
    data: results,
    isFallback: true
  };
};
