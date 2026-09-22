import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

/**
 * Reusable ImageUploader for Admin Forms
 */
const ImageUploader = ({ 
  label, 
  images = [], 
  onChange, 
  multiple = false,
  maxFiles = 10
}) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate sizes and types
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        alert(`${file.name} has an invalid type`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (multiple) {
      if (images.length + validFiles.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} images`);
        return;
      }
      onChange([...images, ...validFiles]);
    } else {
      onChange([validFiles[0]]);
    }
  };

  const handleRemove = (indexToRemove) => {
    onChange(images.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-text-dark mb-2">{label}</label>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
        {images.map((img, idx) => {
          // If it's a File object (pending upload), create a local blob URL
          // If it's a string or Cloudinary object (already saved), use getImageUrl
          const isFile = img instanceof File;
          const src = isFile ? URL.createObjectURL(img) : getImageUrl(img);

          return (
            <div key={idx} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50 group">
              <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 bg-white/80 p-1 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white shadow-sm"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
        
        {(!images.length || (multiple && images.length < maxFiles)) && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-forest-green hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-forest-green"
          >
            <Upload size={24} className="mb-2" />
            <span className="text-xs font-semibold">Upload Image</span>
          </button>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        multiple={multiple}
      />
      <p className="text-xs text-muted-text mt-1">
        JPG, PNG, WEBP (Max 5MB){multiple ? ` - Up to ${maxFiles} images` : ''}
      </p>
    </div>
  );
};

export default ImageUploader;
