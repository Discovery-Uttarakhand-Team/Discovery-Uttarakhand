export const buildQuery = (reqQuery, isTextIndexed = false) => {
  const queryObj = {};

  if (reqQuery.district) {
    queryObj.district = { $regex: new RegExp(reqQuery.district, 'i') };
  }
  if (reqQuery.category) {
    queryObj.category = { $regex: new RegExp(reqQuery.category, 'i') };
  }
  
  if (reqQuery.q) {
    if (isTextIndexed) {
      queryObj.$text = { $search: reqQuery.q };
    } else {
      queryObj.name = { $regex: new RegExp(reqQuery.q, 'i') };
    }
  }

  if (reqQuery.near) {
    const [lng, lat] = reqQuery.near.split(',').map(Number);
    if (!isNaN(lng) && !isNaN(lat)) {
      queryObj.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] }
        }
      };
      if (reqQuery.maxDistance) {
        queryObj.location.$near.$maxDistance = Number(reqQuery.maxDistance); // in meters
      }
    }
  }

  return queryObj;
};
