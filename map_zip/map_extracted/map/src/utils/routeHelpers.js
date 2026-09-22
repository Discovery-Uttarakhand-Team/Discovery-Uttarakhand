// Haversine formula to compute great-circle distance between two [lat, lng] coordinates in km
export const calculateDistanceKm = (coord1, coord2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const lat1 = coord1[0];
  const lon1 = coord1[1];
  const lat2 = coord2[0];
  const lon2 = coord2[1];

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// Estimates mountain driving time based on winding road speed factor (approx 30-35 km/h in hills)
export const estimateDriveTime = (distanceKm) => {
  const averageHillSpeed = 32; // km/h in Himalayas
  const totalHours = distanceKm / averageHillSpeed;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hrs`;
  return `${hours}h ${minutes}m`;
};

// Calculates total route distance and estimated driving duration across an array of destinations
export const calculateItineraryStats = (destinations) => {
  if (!destinations || destinations.length < 2) {
    return { totalDistanceKm: 0, estimatedTime: '0 hrs', stopsCount: destinations ? destinations.length : 0 };
  }

  let totalDistanceKm = 0;
  for (let i = 0; i < destinations.length - 1; i++) {
    const from = destinations[i].coordinates;
    const to = destinations[i + 1].coordinates;
    // Apply a 1.45 winding road factor for realistic Himalayan road distances
    const directKm = calculateDistanceKm(from, to);
    totalDistanceKm += Math.round(directKm * 1.45);
  }

  return {
    totalDistanceKm,
    estimatedTime: estimateDriveTime(totalDistanceKm),
    stopsCount: destinations.length
  };
};
