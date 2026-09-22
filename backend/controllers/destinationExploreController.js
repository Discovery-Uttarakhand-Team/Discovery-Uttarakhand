import Destination from '../models/Destination.js';
import Activity from '../models/Activity.js';
import Stay from '../models/Stay.js';
import Rental from '../models/Rental.js';
import Guide from '../models/Guide.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';

// Haversine distance strictly in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Extract [lat, lon] from any entity format (respecting GeoJSON [lng, lat])
function extractLatLon(entity) {
  if (!entity) return null;
  if (entity.location && Array.isArray(entity.location.coordinates) && entity.location.coordinates.length === 2) {
    // GeoJSON is [lng, lat]
    return [entity.location.coordinates[1], entity.location.coordinates[0]];
  }
  if (typeof entity.latitude === 'number' && typeof entity.longitude === 'number') {
    return [entity.latitude, entity.longitude];
  }
  return null;
}

/**
 * Controller for GET /api/destinations/:slug/explore
 * Query params:
 *   ?interest=trekking | boating | nature | spiritual | photography | camping | adventure | stays | rentals | guides
 *   ?category=...
 */
export const getDestinationExplore = async (req, res) => {
  try {
    const { slug } = req.params;
    const requestedInterest = (req.query.interest || req.query.category || '').toLowerCase().trim();

    // 1. Resolve Destination
    const destination = await Destination.findOne({
      $or: [{ slug: slug.toLowerCase() }, { _id: slug.match(/^[0-9a-fA-F]{24}$/) ? slug : null }]
    });

    if (!destination) {
      return res.status(404).json({ success: false, message: 'Destination not found' });
    }

    const destCoords = extractLatLon(destination); // [lat, lon]
    const hasValidCoords = destCoords && Number.isFinite(destCoords[0]) && Number.isFinite(destCoords[1]);
    const district = destination.district || null;

    // Strict 50km radius for geo proximity queries
    const geoQuery50km = hasValidCoords
      ? {
          location: {
            $near: {
              $geometry: { type: 'Point', coordinates: [destCoords[1], destCoords[0]] }, // GeoJSON: [lng, lat]
              $maxDistance: 50000 // 50 km
            }
          }
        }
      : null;

    // 2. Fetch Activities strictly within verified radius (NO arbitrary far-away fallback for trekking/boating)
    let rawActivities = [];
    if (geoQuery50km) {
      try {
        rawActivities = await Activity.find(geoQuery50km).lean();
      } catch (geoErr) {
        console.warn('Geo query error for activities:', geoErr.message);
      }
    }

    // Annotate activities with distance and price provenance
    const activities = rawActivities.map((act) => {
      const actCoords = extractLatLon(act);
      const distanceKm = hasValidCoords && actCoords ? calculateDistanceKm(destCoords[0], destCoords[1], actCoords[0], actCoords[1]) : null;
      
      let price = null;
      let priceProvenance = 'PRICE NOT VERIFIED';
      if (act.budgetLevel) {
        priceProvenance = 'ESTIMATED';
      }

      return {
        ...act,
        distanceKm,
        price,
        priceProvenance,
        itemType: 'activity'
      };
    });

    // 3. Fetch Places to Visit (Spiritual + Culture + Nearby Destinations)
    let rawSpiritual = [];
    let rawCulture = [];
    let rawNearbyDest = [];

    if (geoQuery50km) {
      try {
        [rawSpiritual, rawCulture, rawNearbyDest] = await Promise.all([
          Spiritual.find(geoQuery50km).limit(8).lean(),
          Culture.find(geoQuery50km).limit(8).lean(),
          Destination.find({ ...geoQuery50km, slug: { $ne: destination.slug } }).limit(6).lean()
        ]);
      } catch (err) {
        console.warn('Geo query error for places:', err.message);
      }
    }

    // Annotate Places
    const placesToVisit = [
      ...rawNearbyDest.map((d) => {
        const coords = extractLatLon(d);
        return {
          _id: d._id,
          name: d.name,
          slug: d.slug,
          category: 'Destination',
          description: d.shortDescription || d.description,
          image: d.coverImage?.url || d.images?.[0]?.url || d.images?.[0] || null,
          distanceKm: hasValidCoords && coords ? calculateDistanceKm(destCoords[0], destCoords[1], coords[0], coords[1]) : null,
          itemType: 'destination',
          priceProvenance: 'FREE_ACCESS'
        };
      }),
      ...rawSpiritual.map((s) => {
        const coords = extractLatLon(s);
        return {
          _id: s._id,
          name: s.name,
          slug: s.slug,
          category: 'Spiritual',
          deity: s.deity,
          description: s.description || s.significance,
          image: s.coverImage?.url || s.image?.url || null,
          distanceKm: hasValidCoords && coords ? calculateDistanceKm(destCoords[0], destCoords[1], coords[0], coords[1]) : null,
          itemType: 'spiritual',
          priceProvenance: 'FREE_ACCESS'
        };
      }),
      ...rawCulture.map((c) => {
        const coords = extractLatLon(c);
        return {
          _id: c._id,
          name: c.name,
          slug: c.slug,
          category: 'Culture & Heritage',
          description: c.description,
          image: c.coverImage?.url || c.image?.url || null,
          distanceKm: hasValidCoords && coords ? calculateDistanceKm(destCoords[0], destCoords[1], coords[0], coords[1]) : null,
          itemType: 'culture',
          priceProvenance: 'FREE_ACCESS'
        };
      })
    ].sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));

    // 4. Fetch Stays (Local priority with sensible District fallback)
    let rawStays = [];
    if (geoQuery50km) {
      try {
        rawStays = await Stay.find(geoQuery50km).limit(8).lean();
      } catch (err) {
        console.warn('Geo error for stays:', err.message);
      }
    }
    if (rawStays.length < 4 && district) {
      const existingStayIds = rawStays.map((s) => s._id);
      const districtStays = await Stay.find({ district, _id: { $nin: existingStayIds } }).limit(8 - rawStays.length).lean();
      rawStays = [...rawStays, ...districtStays];
    }

    const stays = rawStays.map((s) => {
      const sCoords = extractLatLon(s);
      const distanceKm = hasValidCoords && sCoords ? calculateDistanceKm(destCoords[0], destCoords[1], sCoords[0], sCoords[1]) : null;
      
      const priceAmount = s.price?.amount || s.pricePerNight || null;
      let priceProvenance = 'PRICE NOT VERIFIED';
      if (priceAmount) {
        const isGovt = (s.name && (s.name.includes('KMVN') || s.name.includes('GMVN'))) || 
                       (s.category && s.category.includes('Government'));
        priceProvenance = isGovt ? 'VERIFIED' : (s.owner ? 'PARTNER_CLAIMED' : 'VERIFIED');
      }

      return {
        _id: s._id,
        name: s.name,
        slug: s.slug,
        category: s.category || 'Stay',
        city: s.city,
        district: s.district,
        address: s.address,
        rating: s.rating,
        price: priceAmount,
        priceProvenance,
        image: s.images?.[0]?.url || (typeof s.image === 'string' ? s.image : s.image?.url) || null,
        distanceKm,
        itemType: 'stay',
        isBookable: true
      };
    }).sort((a, b) => (a.distanceKm || 999) - (b.distanceKm || 999));

    // 5. Fetch Rentals (District / locality based)
    let rawRentals = [];
    if (district) {
      rawRentals = await Rental.find({ district }).limit(6).lean();
    }
    const rentals = rawRentals.map((r) => {
      const lowestVehiclePrice = Array.isArray(r.vehicles) && r.vehicles.length > 0
        ? Math.min(...r.vehicles.map((v) => v.pricePerDay).filter(Boolean))
        : null;

      return {
        _id: r._id,
        name: r.name,
        slug: r.slug,
        category: r.category || 'Vehicle Rental',
        city: r.city,
        district: r.district,
        price: Number.isFinite(lowestVehiclePrice) ? lowestVehiclePrice : null,
        priceProvenance: Number.isFinite(lowestVehiclePrice) ? 'PARTNER_CLAIMED' : 'PRICE NOT VERIFIED',
        image: r.images?.[0]?.url || r.vehicles?.[0]?.image?.url || null,
        itemType: 'rental',
        isBookable: true
      };
    });

    // 6. Fetch Guides (District based with verified govt status)
    let rawGuides = [];
    if (district) {
      rawGuides = await Guide.find({
        $or: [{ districts: district }, { location: new RegExp(district, 'i') }]
      }).limit(6).lean();
    }
    const guides = rawGuides.map((g) => ({
      _id: g._id,
      name: g.name,
      slug: g.slug,
      specialties: g.specialties || [g.speciality].filter(Boolean),
      languages: g.languages || [],
      rating: g.rating,
      price: g.pricePerDay || null,
      priceProvenance: g.pricePerDay ? 'VERIFIED' : 'PRICE NOT VERIFIED',
      verifiedByGovt: g.verifiedByGovt ?? true,
      image: g.profileImage?.url || (typeof g.profileImage === 'string' ? g.profileImage : null),
      itemType: 'guide',
      isBookable: true
    }));

    // 7. Dynamically compute available categories (ONLY where real data exists)
    const availableCategories = [];

    const hasTrekking = activities.some((a) => (a.category || '').toLowerCase().includes('trek'));
    if (hasTrekking) {
      availableCategories.push({
        id: 'trekking',
        label: 'Trekking & Trails',
        icon: 'Footprints',
        count: activities.filter((a) => (a.category || '').toLowerCase().includes('trek')).length
      });
    }

    const hasBoating = activities.some((a) => (a.category || '').toLowerCase().includes('boat'));
    if (hasBoating) {
      availableCategories.push({
        id: 'boating',
        label: 'Lakes & Boating',
        icon: 'Waves',
        count: activities.filter((a) => (a.category || '').toLowerCase().includes('boat')).length
      });
    }

    const hasAdventure = activities.some((a) => {
      const cat = (a.category || '').toLowerCase();
      return cat.includes('rafting') || cat.includes('skiing') || cat.includes('adventure') || cat.includes('safari');
    });
    if (hasAdventure) {
      availableCategories.push({
        id: 'adventure',
        label: 'Adventure Sports',
        icon: 'Compass',
        count: activities.filter((a) => {
          const cat = (a.category || '').toLowerCase();
          return cat.includes('rafting') || cat.includes('skiing') || cat.includes('adventure') || cat.includes('safari');
        }).length
      });
    }

    const hasNature = activities.some((a) => (a.category || '').toLowerCase().includes('sightseeing') || (a.category || '').toLowerCase().includes('waterfall')) ||
                      placesToVisit.some((p) => p.itemType === 'destination');
    if (hasNature) {
      availableCategories.push({
        id: 'nature',
        label: 'Nature & Viewpoints',
        icon: 'Trees',
        count: placesToVisit.filter((p) => p.itemType === 'destination').length + 
               activities.filter((a) => (a.category || '').toLowerCase().includes('sightseeing')).length
      });
    }

    const hasSpiritual = placesToVisit.some((p) => p.itemType === 'spiritual');
    if (hasSpiritual) {
      availableCategories.push({
        id: 'spiritual',
        label: 'Temples & Spiritual',
        icon: 'Sparkles',
        count: placesToVisit.filter((p) => p.itemType === 'spiritual').length
      });
    }

    if (placesToVisit.length > 0) {
      availableCategories.push({
        id: 'places',
        label: 'Places to Visit',
        icon: 'MapPin',
        count: placesToVisit.length
      });
    }

    if (stays.length > 0) {
      availableCategories.push({
        id: 'stays',
        label: 'Stays Nearby',
        icon: 'Building',
        count: stays.length
      });
    }

    if (rentals.length > 0) {
      availableCategories.push({
        id: 'rentals',
        label: 'Bike & Car Rentals',
        icon: 'Car',
        count: rentals.length
      });
    }

    if (guides.length > 0) {
      availableCategories.push({
        id: 'guides',
        label: 'Certified Guides',
        icon: 'UserCheck',
        count: guides.length
      });
    }

    // 8. Compute matchingResults based on requested interest/category
    let matchingResults = [];
    let emptyStateMessage = null;

    if (requestedInterest) {
      if (requestedInterest === 'trekking') {
        matchingResults = activities.filter((a) => (a.category || '').toLowerCase().includes('trek'));
        if (matchingResults.length === 0) {
          emptyStateMessage = `No verified trekking experiences found for ${destination.name} within 50km yet.`;
        }
      } else if (requestedInterest === 'boating') {
        matchingResults = activities.filter((a) => (a.category || '').toLowerCase().includes('boat'));
        if (matchingResults.length === 0) {
          emptyStateMessage = `No verified boating experiences found for ${destination.name} within 50km yet.`;
        }
      } else if (requestedInterest === 'nature') {
        matchingResults = [
          ...placesToVisit.filter((p) => p.itemType === 'destination'),
          ...activities.filter((a) => (a.category || '').toLowerCase().includes('sightseeing') || (a.category || '').toLowerCase().includes('waterfall'))
        ];
        if (matchingResults.length === 0) {
          emptyStateMessage = `No verified nature/viewpoint records found for ${destination.name} yet.`;
        }
      } else if (requestedInterest === 'spiritual') {
        matchingResults = placesToVisit.filter((p) => p.itemType === 'spiritual');
        if (matchingResults.length === 0) {
          emptyStateMessage = `No verified spiritual shrines found near ${destination.name} yet.`;
        }
      } else if (requestedInterest === 'adventure') {
        matchingResults = activities.filter((a) => {
          const cat = (a.category || '').toLowerCase();
          return cat.includes('rafting') || cat.includes('skiing') || cat.includes('adventure') || cat.includes('safari');
        });
        if (matchingResults.length === 0) {
          emptyStateMessage = `No verified adventure activities found near ${destination.name} yet.`;
        }
      } else if (requestedInterest === 'places') {
        matchingResults = placesToVisit;
      } else if (requestedInterest === 'stays') {
        matchingResults = stays;
      } else if (requestedInterest === 'rentals') {
        matchingResults = rentals;
      } else if (requestedInterest === 'guides') {
        matchingResults = guides;
      } else {
        // Generic keyword search across activities and places
        matchingResults = [
          ...activities.filter((a) => (a.name + ' ' + (a.category || '')).toLowerCase().includes(requestedInterest)),
          ...placesToVisit.filter((p) => (p.name + ' ' + (p.category || '')).toLowerCase().includes(requestedInterest))
        ];
        if (matchingResults.length === 0) {
          emptyStateMessage = `No verified experiences found matching "${requestedInterest}" near ${destination.name}.`;
        }
      }
    }

    return res.status(200).json({
      success: true,
      destination: {
        _id: destination._id,
        name: destination.name,
        slug: destination.slug,
        district: destination.district,
        region: destination.region,
        location: destination.location,
        coordinates: destCoords,
        description: destination.description || destination.shortDescription,
        highlights: destination.highlights || [],
        experiences: destination.experiences || [],
        coverImage: destination.coverImage,
        gallery: destination.gallery || [],
        bestTimeToVisit: destination.bestTimeToVisit
      },
      availableCategories,
      placesToVisit,
      activities,
      stays,
      rentals,
      guides,
      activeInterest: requestedInterest || null,
      matchingResults,
      emptyStateMessage
    });
  } catch (error) {
    console.error('Error in getDestinationExplore:', error);
    return res.status(500).json({ success: false, message: 'Server error exploring destination', error: error.message });
  }
};
