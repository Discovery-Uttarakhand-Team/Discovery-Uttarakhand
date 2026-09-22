/**
 * Helper to safely extract a usable URL from an image field.
 * Handles both legacy string URLs and new Cloudinary {url, publicId} objects.
 * 
 * @param {string|object} image - The image data from MongoDB
 * @param {string} fallback - Optional fallback URL
 * @returns {string} The resolved image URL
 */
export const getImageUrl = (image, fallback = '/placeholder-image.jpg') => {
  if (!image) return fallback;
  
  if (typeof image === 'string') {
    return image;
  }
  
  if (image && typeof image === 'object' && image.url) {
    return image.url;
  }
  
  return fallback;
};
