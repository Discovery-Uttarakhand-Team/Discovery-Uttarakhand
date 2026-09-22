import Destination from '../models/Destination.js';
import Activity from '../models/Activity.js';
import Spiritual from '../models/Spiritual.js';
import Culture from '../models/Culture.js';
import Stay from '../models/Stay.js';
import Guide from '../models/Guide.js';

/**
 * Helper to query items using MongoDB 2dsphere $near (within 60km = 60,000 meters)
 * and fall back / supplement with district matching if items lack location or return fewer than limit.
 */
const queryNearWithFallback = async (Model, near, sameDistrict, limit, excludeSlug = null) => {
  let results = [];
  const baseFilter = excludeSlug ? { slug: { $ne: excludeSlug } } : {};

  if (near) {
    try {
      results = await Model.find({ ...near, ...baseFilter }).limit(limit);
    } catch (err) {
      console.warn(`[relatedController] Geo query error for ${Model.modelName}:`, err.message);
    }
  }

  // If geo returned fewer than limit (or near was null, e.g. KMVN stays without coordinates),
  // supplement or fallback using district match
  if (results.length < limit && sameDistrict && sameDistrict.district) {
    const existingIds = results.map(r => r._id);
    const districtFilter = {
      ...sameDistrict,
      ...baseFilter,
      _id: { $nin: existingIds }
    };
    try {
      const fallbackResults = await Model.find(districtFilter).limit(limit - results.length);
      results = [...results, ...fallbackResults];
    } catch (err) {
      console.warn(`[relatedController] District fallback error for ${Model.modelName}:`, err.message);
    }
  }

  return results;
};

/**
 * Reusable controller for GET /api/:resource/:slug/related
 * Supports Destination, Spiritual, Culture, Activity
 */
export const getRelatedBySlug = (Model, modelName) => async (req, res) => {
  try {
    const { slug } = req.params;
    const doc = await Model.findOne({ slug });

    if (!doc) {
      return res.status(404).json({ success: false, message: `${modelName} not found` });
    }

    const hasCoords = doc.location && 
                      Array.isArray(doc.location.coordinates) && 
                      doc.location.coordinates.length === 2 &&
                      typeof doc.location.coordinates[0] === 'number' &&
                      typeof doc.location.coordinates[1] === 'number';

    const near = hasCoords
      ? { location: { $near: { $geometry: doc.location, $maxDistance: 60000 } } }
      : null;

    const sameDistrict = doc.district ? { district: doc.district } : null;

    // Parallel queries across collections
    const [thingsToDo, spirituals, cultures, nearbyDestinations, stays, guides] = await Promise.all([
      // Things to do (Activity, limit 6)
      queryNearWithFallback(
        Activity, 
        near, 
        sameDistrict, 
        6, 
        modelName === 'Activity' ? doc.slug : null
      ),
      
      // Spiritual places to visit (limit 4)
      queryNearWithFallback(
        Spiritual, 
        near, 
        sameDistrict, 
        4, 
        modelName === 'Spiritual' ? doc.slug : null
      ),
      
      // Cultural places to visit (limit 4)
      queryNearWithFallback(
        Culture, 
        near, 
        sameDistrict, 
        4, 
        modelName === 'Culture' ? doc.slug : null
      ),
      
      // Nearby destinations (Destination, limit 8)
      queryNearWithFallback(
        Destination, 
        near, 
        sameDistrict, 
        8, 
        modelName === 'Destination' ? doc.slug : null
      ),
      
      // Where to stay (Stay, limit 6)
      queryNearWithFallback(
        Stay, 
        near, 
        sameDistrict, 
        6
      ),
      
      // Local guides for this district (limit 4)
      doc.district
        ? Guide.find({ districts: doc.district }).limit(4)
        : Guide.find().limit(4)
    ]);

    const placesToVisit = [...spirituals, ...cultures];
    const nearbyPlacesListed = Array.isArray(doc.nearbyPlaces) ? doc.nearbyPlaces : [];

    res.status(200).json({
      success: true,
      data: {
        thingsToDo,
        placesToVisit,
        nearbyDestinations,
        nearbyPlacesListed,
        stays,
        guides
      }
    });
  } catch (error) {
    console.error(`[relatedController] Error generating related items for ${modelName}:`, error);
    res.status(500).json({ success: false, message: 'Failed to load related items', error: error.message });
  }
};
