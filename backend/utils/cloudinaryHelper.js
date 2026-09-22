import cloudinary from '../config/cloudinary.js';

export const destroyCloudinaryImage = async (image) => {
  if (image && typeof image === 'object' && image.publicId) {
    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (err) {
      console.error(`Failed to delete Cloudinary image: ${image.publicId}`, err);
    }
  }
};

export const destroyMultipleCloudinaryImages = async (imagesArray) => {
  if (Array.isArray(imagesArray)) {
    for (const img of imagesArray) {
      await destroyCloudinaryImage(img);
    }
  }
};

export const handleImageUpdates = async (oldImage, newImage) => {
  // If old image exists, is an object, has a publicId, and it's different from the new image's publicId (or new image is replaced/removed)
  if (oldImage && typeof oldImage === 'object' && oldImage.publicId) {
    const isReplaced = !newImage || (typeof newImage === 'object' && newImage.publicId !== oldImage.publicId);
    if (isReplaced) {
      await destroyCloudinaryImage(oldImage);
    }
  }
};

export const handleMultipleImageUpdates = async (oldImagesArray, newImagesArray) => {
  if (Array.isArray(oldImagesArray)) {
    const newPublicIds = Array.isArray(newImagesArray) 
      ? newImagesArray.map(img => typeof img === 'object' ? img.publicId : null).filter(Boolean)
      : [];
      
    for (const oldImg of oldImagesArray) {
      if (oldImg && typeof oldImg === 'object' && oldImg.publicId) {
        if (!newPublicIds.includes(oldImg.publicId)) {
          await destroyCloudinaryImage(oldImg);
        }
      }
    }
  }
};
