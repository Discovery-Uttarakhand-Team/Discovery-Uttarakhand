import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch live mountain weather for coordinates
 */
export const getLiveWeather = async (lat, lon, options = {}) => {
  const params = { lat, lon };
  if (options.name) params.name = options.name;
  if (options.altitude) params.altitude = options.altitude;

  const res = await axios.get(`${API_BASE_URL}/live/weather`, { params });
  return res.data;
};

/**
 * Fetch road advisories for corridor or highway
 */
export const getRoadAdvisories = async (params = {}) => {
  const res = await axios.get(`${API_BASE_URL}/live/road-advisories`, { params });
  return res.data;
};

/**
 * List all active state-wide road bulletins
 */
export const listRoadBulletins = async () => {
  const res = await axios.get(`${API_BASE_URL}/live/bulletins`);
  return res.data;
};

/**
 * Fetch transit status
 */
export const getTransitLive = async (origin, destination, mode = 'Bus') => {
  const res = await axios.get(`${API_BASE_URL}/live/transit`, {
    params: { origin, destination, mode }
  });
  return res.data;
};

/**
 * Evaluate trip-wide safety advisories
 */
export const evaluateTripAdvisories = async (tripContext, tripId = null) => {
  const res = await axios.post(`${API_BASE_URL}/live/advisories/evaluate`, {
    tripContext,
    tripId
  });
  return res.data;
};
