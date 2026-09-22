import api from './api';

export const getVehicleImage = (name = '', type = '') => {
  const n = (name + ' ' + type).toLowerCase();
  
  // Scooters
  if (n.includes('activa')) {
    return '/assets/activa.jpg';
  }
  if (n.includes('jupiter')) {
    return 'https://images.unsplash.com/photo-1571188654248-7a89213915f7?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('ntorq')) {
    return 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('access') || n.includes('burgman') || n.includes('fascino') || n.includes('vespa') || n.includes('ray zr') || n.includes('dio')) {
    return '/assets/activa-2.jpg';
  }
  
  // Royal Enfield / Cruisers
  if (n.includes('himalayan')) {
    return 'https://images.unsplash.com/photo-1558980664-769d59546b3d?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('classic 350') || n.includes('classic')) {
    return 'https://images.unsplash.com/photo-1558981359-219d6364c9c8?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('bullet') || n.includes('standard')) {
    return 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('meteor') || n.includes('hunter') || n.includes('thunderbird') || n.includes('interceptor')) {
    return 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?auto=format&fit=crop&w=800&q=80';
  }
  
  // Bikes
  if (n.includes('apache')) {
    return 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('pulsar')) {
    return 'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('fz') || n.includes('r15') || n.includes('mt-15') || n.includes('duke')) {
    return 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('avenger')) {
    return 'https://images.unsplash.com/photo-1558980394-4c7c9299fe96?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('xpulse') || n.includes('impulse') || n.includes('scram')) {
    return 'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&w=800&q=80';
  }

  // SUVs / 4x4 / Big Cars
  if (n.includes('thar')) {
    return 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('scorpio') || n.includes('bolero') || n.includes('safari') || n.includes('harrier') || n.includes('xuv')) {
    return 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('innova') || n.includes('fortuner')) {
    return 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
  }
  if (n.includes('creta') || n.includes('seltos') || n.includes('brezza') || n.includes('duster')) {
    return 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80';
  }

  // Hatchback & Sedans
  if (n.includes('swift') || n.includes('dzire') || n.includes('i20') || n.includes('baleno') || n.includes('celerio') || n.includes('wagonr') || n.includes('alto') || n.includes('city') || n.includes('etios')) {
    return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80';
  }

  return 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=800&q=80';
};

export const getRentals = async () => {
  const response = await api.get('/rentals');
  if (response.data && response.data.success) {
    const flattened = [];
    response.data.data.forEach(biz => {
      const displayLocation = `${biz.city || ''}${biz.city && biz.district ? ', ' : ''}${biz.district || 'Uttarakhand'}`;
      if (biz.vehicles && Array.isArray(biz.vehicles) && biz.vehicles.length > 0) {
        biz.vehicles.forEach((v, index) => {
          flattened.push({
            ...biz,
            ...v,
            id: (biz._id || biz.id) + '_' + index,
            _id: biz._id || biz.id,
            slug: (biz.slug || '') + '-' + v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: v.name, // Vehicle name takes precedence
            businessName: biz.name,
            price: v.pricePerDay || biz.pricePerDay || null,
            pricePerDay: v.pricePerDay || biz.pricePerDay || null,
            type: v.type || v.category || biz.category,
            category: v.category || v.type || biz.category,
            city: biz.city,
            district: biz.district,
            location: displayLocation,
            available: true,
            image: v.image || null,
            rating: biz.rating,
            ratingSource: biz.ratingSource
          });
        });
      } else {
         flattened.push({
           ...biz,
           location: displayLocation,
           image: (biz.images && biz.images[0]) || null
         });
      }
    });
    response.data.data = flattened;
  }
  return response.data;
};

export const getRentalById = async (id) => {
  const response = await api.get(`/rentals/${id}`);
  return response.data;
};
export const createRental = async (data) => {
  const response = await api.post('/rentals', data);
  return response.data;
};

export const updateRental = async (id, data) => {
  const response = await api.put(`/rentals/${id}`, data);
  return response.data;
};

export const deleteRental = async (id) => {
  const response = await api.delete(`/rentals/${id}`);
  return response.data;
};
