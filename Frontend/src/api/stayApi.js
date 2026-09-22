import api from './api';

export const normalizeStay = (s) => {
  if (!s) return s;
  const isKmvn = s.name?.includes('KMVN') || s.category?.includes('Government') || s.category?.includes('Rest House') || s.category?.includes('Eco Camp');
  const city = s.city || s.district || 'Uttarakhand';
  const district = s.district || 'Uttarakhand';
  const displayLocation = s.city ? `${s.city}${s.district ? `, ${s.district}` : ''}` : district;
  const rawImg = (Array.isArray(s.images) && s.images[0]?.url) ||
                 (Array.isArray(s.images) && typeof s.images[0] === 'string' ? s.images[0] : null) ||
                 s.coverImage?.url ||
                 (typeof s.coverImage === 'string' ? s.coverImage : null) ||
                 s.image?.url ||
                 (typeof s.image === 'string' ? s.image : null);

  const finalImg = rawImg || (isKmvn ? '/assets/kmvn-stay.svg' : '/assets/fallback.svg');
  const priceVal = (s.price && typeof s.price === 'object' && s.price.amount != null) 
    ? s.price.amount 
    : (s.pricePerNight || (typeof s.price === 'number' ? s.price : null));

  return {
    ...s,
    id: s._id || s.slug,
    _id: s._id || s.slug,
    name: s.name,
    city: city,
    district: district,
    displayLocation: displayLocation,
    type: s.category || s.type || (isKmvn ? 'Government Tourist Rest House' : 'Hotel'),
    category: s.category || s.type || (isKmvn ? 'Government Tourist Rest House' : 'Hotel'),
    pricePerNight: priceVal,
    price: s.price || priceVal,
    amenities: (Array.isArray(s.facilities) && s.facilities.length > 0) ? s.facilities : (s.amenities || []),
    facilities: s.facilities || s.amenities || [],
    image: finalImg,
    images: s.images && s.images.length > 0 ? s.images : (finalImg ? [{ url: finalImg }] : []),
    isGovt: isKmvn,
    rating: s.rating || null
  };
};

export const getStays = async () => {
  const response = await api.get('/stays');
  if (response.data && response.data.success && Array.isArray(response.data.data)) {
    response.data.data = response.data.data.map(normalizeStay);
  }
  return response.data;
};

export const getStayById = async (id) => {
  const response = await api.get(`/stays/${id}`);
  return response.data;
};
export const createStay = async (data) => {
  const response = await api.post('/stays', data);
  return response.data;
};

export const updateStay = async (id, data) => {
  const response = await api.put(`/stays/${id}`, data);
  return response.data;
};

export const deleteStay = async (id) => {
  const response = await api.delete(`/stays/${id}`);
  return response.data;
};
