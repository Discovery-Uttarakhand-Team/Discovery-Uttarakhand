/**
 * Location Detection and Reverse Geocoding Helpers for Discovery Uttarakhand
 * Compliant with user privacy: triggered strictly upon explicit user interaction,
 * never exposes raw GPS coordinates in the UI, and provides manual city fallback.
 */

export const POPULAR_START_HUBS = [
  { name: 'Delhi NCR', city: 'Delhi', state: 'Delhi', coordinates: [28.6139, 77.2090] },
  { name: 'Dehradun', city: 'Dehradun', state: 'Uttarakhand', coordinates: [30.3165, 78.0322] },
  { name: 'Haridwar', city: 'Haridwar', state: 'Uttarakhand', coordinates: [29.9457, 78.1642] },
  { name: 'Chandigarh', city: 'Chandigarh', state: 'Punjab', coordinates: [30.7333, 76.7794] },
  { name: 'Agra', city: 'Agra', state: 'Uttar Pradesh', coordinates: [27.1767, 78.0081] },
  { name: 'Lucknow', city: 'Lucknow', state: 'Uttar Pradesh', coordinates: [26.8467, 80.9462] },
  { name: 'Jaipur', city: 'Jaipur', state: 'Rajasthan', coordinates: [26.9124, 75.7873] },
  { name: 'Haldwani', city: 'Haldwani', state: 'Uttarakhand', coordinates: [29.2183, 79.5130] },
  { name: 'Rishikesh', city: 'Rishikesh', state: 'Uttarakhand', coordinates: [30.0869, 78.2676] },
  { name: 'Meerut', city: 'Meerut', state: 'Uttar Pradesh', coordinates: [28.9845, 77.7064] },
];

/**
 * Reverse geocodes latitude and longitude into a clean, human-friendly city/state name.
 */
export async function reverseGeocodeCoords(lat, lng) {
  try {
    // 1. Primary: Fast client-side BigDataCloud reverse geocode API (CORS friendly, no key required)
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || data.principalSubdivision;
      const state = data.principalSubdivision;
      if (city && state && city !== state) {
        return `${city}, ${state}`;
      }
      if (city || state) {
        return city || state;
      }
    }
  } catch {
    // Attempt fallback
  }

  try {
    // 2. Secondary: OpenStreetMap Nominatim
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const city = address.city || address.town || address.village || address.county || address.state_district;
      const state = address.state;
      if (city && state) return `${city}, ${state}`;
      if (city) return city;
    }
  } catch {
    // Fall through
  }

  return 'Detected Location';
}

/**
 * Request browser location cleanly upon user button click.
 * Handles permission denied, timeout, and positioning errors gracefully.
 */
export function detectBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocation is not supported by your browser. Please enter your starting city below.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const locationName = await reverseGeocodeCoords(lat, lng);
          resolve({
            success: true,
            name: locationName,
            coordinates: [lat, lng]
          });
        } catch {
          resolve({
            success: true,
            name: 'Current Location',
            coordinates: [lat, lng]
          });
        }
      },
      (err) => {
        let message = 'Unable to detect your location. Please enter your starting city below.';
        if (err.code === 1) {
          message = 'Location permission was denied. Please select or type your starting city below.';
        } else if (err.code === 3) {
          message = 'Location request timed out. Please select or type your starting city below.';
        }
        resolve({
          success: false,
          error: message
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 60000
      }
    );
  });
}

/**
 * Resolves a manually entered city name to approximate coordinates if not already known.
 */
export async function geocodeCityName(query) {
  if (!query || typeof query !== 'string') return null;
  const trimmed = query.trim().toLowerCase();

  // Check known hubs first for speed and offline reliability
  const matched = POPULAR_START_HUBS.find(h => 
    h.city.toLowerCase() === trimmed || 
    h.name.toLowerCase() === trimmed ||
    trimmed.includes(h.city.toLowerCase())
  );
  if (matched) {
    return {
      name: `${matched.city}, ${matched.state}`,
      coordinates: matched.coordinates
    };
  }

  // Geocode via Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', India')}&limit=1`,
      { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results) && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          return {
            name: item.display_name.split(',').slice(0, 2).join(',').trim(),
            coordinates: [lat, lon]
          };
        }
      }
    }
  } catch {
    // If geocoding fails, return default Dehradun coordinates as sensible gateway
  }

  return {
    name: query.trim(),
    coordinates: [30.3165, 78.0322] // Fallback Dehradun gateway
  };
}
