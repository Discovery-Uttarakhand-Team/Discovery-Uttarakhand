import { getDestinations } from './destinationApi';
import { getActivities } from './activityApi';
import { getStays } from './stayApi';
import { getRentals } from './rentalApi';
import api from './api';

// Haversine formula to calculate geographic distance in km
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper to filter entities based on priority:
// 1. Coordinates within 50km
// 2. Fallback to same district if no coords
const filterNearby = (entities, destCoords, destDistrict, destId) => {
  return entities
    .filter(entity => entity._id !== destId && entity.id !== destId) // exclude self
    .map(entity => {
      let distance = null;
      let valid = false;
      
      const entCoords = entity.location?.coordinates;
      
      // If both have coordinates, calculate distance
      if (destCoords && entCoords && Array.isArray(entCoords) && entCoords.length === 2) {
        // GeoJSON is [longitude, latitude]
        const destLon = destCoords[0];
        const destLat = destCoords[1];
        const entLon = entCoords[0];
        const entLat = entCoords[1];
        
        distance = calculateDistance(destLat, destLon, entLat, entLon);
        // within 50km
        if (distance !== null && distance <= 50) {
          valid = true;
        }
      } else if (entity.district && destDistrict && entity.district.toLowerCase() === destDistrict.toLowerCase()) {
        // Fallback to district if no coordinates exist on one or both
        valid = true;
      }

      return valid ? { ...entity, distance } : null;
    })
    .filter(e => e !== null)
    .sort((a, b) => {
      if (a.distance !== null && b.distance !== null) return a.distance - b.distance;
      if (a.distance !== null) return -1;
      if (b.distance !== null) return 1;
      return 0;
    });
};

export const fetchExploreData = async (destination) => {
  try {
    const destCoords = destination.location?.coordinates; // [lon, lat]
    const destDistrict = destination.district;
    const destId = destination._id || destination.id;

    // We fetch guides manually since guideApi might not exist or might need to be hit directly
    const fetchGuides = api.get('/guides').then(res => res.data?.data || []).catch(() => []);

    const [allDestsRes, allActsRes, allStaysRes, allRentalsRes, allGuides] = await Promise.all([
      getDestinations().catch(() => ({ data: [] })),
      getActivities().catch(() => ({ data: [] })),
      getStays().catch(() => ({ data: [] })),
      getRentals().catch(() => ({ data: [] })),
      fetchGuides
    ]);

    const allDests = allDestsRes.data || [];
    const allActs = allActsRes.data || [];
    const allStays = allStaysRes.data || [];
    const allRentals = allRentalsRes.data || []; // Note: getRentals already flattens rentals!

    // Resolve 'nearbyPlaces' strings to actual destination objects
    const resolvedNearbyPlaces = [];
    const rawNearby = destination.nearbyPlaces || [];
    
    // Create a map for fast lookup
    const destMap = new Map();
    allDests.forEach(d => {
      destMap.set(d.name.toLowerCase().trim(), d);
      if (d.slug) destMap.set(d.slug.toLowerCase().trim(), d);
    });

    rawNearby.forEach(placeName => {
      const lower = placeName.toLowerCase().trim();
      const matchedDest = destMap.get(lower);
      if (matchedDest) {
        resolvedNearbyPlaces.push(matchedDest);
      } else {
        // Just push the string for informational fallback rendering
        resolvedNearbyPlaces.push(placeName);
      }
    });

    // Also include destinations that are geographically nearby even if not explicitly in nearbyPlaces
    // Only if we haven't already included them
    const geoNearbyDests = filterNearby(allDests, destCoords, destDistrict, destId);
    
    const finalNearbyDests = [...resolvedNearbyPlaces];
    geoNearbyDests.forEach(geoDest => {
      // Check if it's already in the resolved list
      const alreadyExists = finalNearbyDests.some(d => typeof d === 'object' && (d._id === geoDest._id || d.id === geoDest.id));
      if (!alreadyExists && geoDest.distance !== null && geoDest.distance <= 50) {
        finalNearbyDests.push(geoDest);
      }
    });

    return {
      nearbyDestinations: finalNearbyDests,
      activities: filterNearby(allActs, destCoords, destDistrict, destId),
      stays: filterNearby(allStays, destCoords, destDistrict, destId),
      rentals: filterNearby(allRentals, destCoords, destDistrict, destId),
      guides: filterNearby(allGuides, destCoords, destDistrict, destId),
      allDests, // for map
    };
  } catch (error) {
    console.error("Error fetching explore data:", error);
    return {
      nearbyDestinations: [],
      activities: [],
      stays: [],
      rentals: [],
      guides: [],
      allDests: []
    };
  }
};
