/**
 * Discovery Uttarakhand - Image Extraction & Normalization Helper
 * Safely extracts an array of clean image URL strings from any listing/card item.
 */

export function getCardImages(item, fallbackUrl = '/assets/fallback.svg') {
  if (!item) return [fallbackUrl];

  const images = [];

  const addUrl = (val) => {
    if (!val) return;
    let url = null;
    if (typeof val === 'string' && val.trim() !== '') {
      url = val.trim();
    } else if (typeof val === 'object' && val !== null) {
      url = val.url || val.secure_url || val.src || null;
    }
    if (url && typeof url === 'string' && !images.includes(url)) {
      images.push(url);
    }
  };

  // 1. Primary cover image / image
  if (item.coverImage) addUrl(item.coverImage);
  if (item.image) addUrl(item.image);
  if (item.profileImage) addUrl(item.profileImage);

  // 2. Gallery array
  if (Array.isArray(item.gallery)) {
    item.gallery.forEach(g => addUrl(g));
  }

  // 3. Images array
  if (Array.isArray(item.images)) {
    item.images.forEach(img => addUrl(img));
  }

  // 4. Photos array
  if (Array.isArray(item.photos)) {
    item.photos.forEach(p => addUrl(p));
  }

  // If no valid images found, return fallback
  if (images.length === 0) {
    // Check for KMVN specific fallback
    if (item.isGovt || item.name?.includes('KMVN') || item.category?.includes('Government')) {
      return ['/assets/kmvn-stay.svg'];
    }
    return [fallbackUrl];
  }

  return images;
}
