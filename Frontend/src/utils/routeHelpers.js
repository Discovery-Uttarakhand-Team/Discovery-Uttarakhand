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

export const estimateDriveTime = (distanceKm) => {
  const averageHillSpeed = 32; // km/h in Himalayas
  const totalHours = distanceKm / averageHillSpeed;
  const hours = Math.floor(totalHours);
  const minutes = Math.round((totalHours - hours) * 60);

  if (hours === 0) return `${minutes} mins`;
  if (minutes === 0) return `${hours} hrs`;
  return `${hours}h ${minutes}m`;
};

// Calculates total route distance using OSRM
export const fetchOSRMRoute = async (destinations) => {
  if (!destinations || destinations.length < 2) {
    return {
      totalDistanceKm: 0,
      estimatedTime: '0 hrs',
      stopsCount: destinations ? destinations.length : 0,
      geometry: null,
      legs: []
    };
  }

  // OSRM requires coordinates in longitude, latitude format
  const coordsString = destinations
    .map(dest => `${dest.coordinates[1]},${dest.coordinates[0]}`)
    .join(';');

  try {
    const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceKm = Math.round(route.distance / 1000);
      
      // OSRM duration is in seconds. Convert to hours/mins
      const totalHours = route.duration / 3600;
      const hours = Math.floor(totalHours);
      const minutes = Math.round((totalHours - hours) * 60);
      
      let estimatedTime = '';
      if (hours === 0) estimatedTime = `${minutes} mins`;
      else if (minutes === 0) estimatedTime = `${hours} hrs`;
      else estimatedTime = `${hours}h ${minutes}m`;

      // Extract each leg between consecutive destinations
      const legs = (route.legs || []).map(leg => {
        const legDist = Math.round(leg.distance / 1000);
        const lHours = Math.floor(leg.duration / 3600);
        const lMins = Math.round((leg.duration % 3600) / 60);
        let lTime = '';
        if (lHours === 0) lTime = `${lMins} mins`;
        else if (lMins === 0) lTime = `${lHours} hrs`;
        else lTime = `${lHours}h ${lMins}m`;
        return {
          distanceKm: legDist,
          estimatedTime: lTime
        };
      });

      // Return flipped geometry (Leaflet expects Lat,Lng)
      const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

      return {
        isRoadRoute: true,
        totalDistanceKm: distanceKm,
        estimatedTime,
        stopsCount: destinations.length,
        geometry: latLngs,
        legs,
        routeStatus: 'OK'
      };
    }
  } catch (error) {
    console.error("OSRM Route Fetch Error:", error);
  }

  // Honest failure state: Do NOT draw straight lines across peaks as if they were roads
  return {
    isRoadRoute: false,
    totalDistanceKm: null,
    estimatedTime: null,
    stopsCount: destinations.length,
    geometry: null,
    legs: [],
    routeStatus: 'UNAVAILABLE',
    routeError: 'Road route could not be calculated for this mountain segment. Refer to local roadhead / counter guidance.'
  };
};

export const calculateItineraryStats = (destinations) => {
  if (!destinations || destinations.length < 2) {
    return { totalDistanceKm: 0, estimatedTime: '0 hrs', stopsCount: destinations ? destinations.length : 0 };
  }

  let totalDistanceKm = 0;
  for (let i = 0; i < destinations.length - 1; i++) {
    const from = destinations[i].coordinates;
    const to = destinations[i + 1].coordinates;
    const directKm = calculateDistanceKm(from, to);
    totalDistanceKm += Math.round(directKm * 1.45);
  }

  return {
    totalDistanceKm,
    estimatedTime: estimateDriveTime(totalDistanceKm),
    stopsCount: destinations.length
  };
};
