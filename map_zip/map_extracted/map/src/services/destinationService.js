import destinationsData from '../data/destinations.json';

export const getAllDestinations = () => {
  return destinationsData;
};

export const getDestinationById = (id) => {
  return destinationsData.find((d) => d.id === id) || null;
};

export const filterDestinations = ({ category = 'all', region = 'all', searchQuery = '' } = {}) => {
  return destinationsData.filter((dest) => {
    // Filter by category
    if (category !== 'all' && dest.category !== category) {
      return false;
    }

    // Filter by region (Garhwal vs Kumaon)
    if (region !== 'all' && dest.region.toLowerCase() !== region.toLowerCase()) {
      return false;
    }

    // Filter by search text
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = dest.name.toLowerCase().includes(q);
      const matchDistrict = dest.district.toLowerCase().includes(q);
      const matchTags = dest.tags && dest.tags.some((t) => t.toLowerCase().includes(q));
      const matchDesc = dest.shortDesc && dest.shortDesc.toLowerCase().includes(q);
      if (!matchName && !matchDistrict && !matchTags && !matchDesc) {
        return false;
      }
    }

    return true;
  });
};

export const getNearbyDestinations = (destId, limit = 3) => {
  const target = getDestinationById(destId);
  if (!target) return [];

  // Sort other destinations by proximity
  return destinationsData
    .filter((d) => d.id !== destId)
    .map((d) => {
      const dLat = d.coordinates[0] - target.coordinates[0];
      const dLng = d.coordinates[1] - target.coordinates[1];
      const distSquared = dLat * dLat + dLng * dLng;
      return { ...d, distSquared };
    })
    .sort((a, b) => a.distSquared - b.distSquared)
    .slice(0, limit);
};
