import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoGallery = ({ coverImage, gallery = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter out any missing URLs, then extract URLs
  const getUrl = (img) => (typeof img === 'object' ? (img.url || img.publicId) : img);
  
  const allPhotos = [];
  if (coverImage) allPhotos.push({ url: getUrl(coverImage), alt: 'Cover' });
  if (gallery && gallery.length > 0) {
    gallery.forEach(img => {
      const url = getUrl(img);
      if (url) allPhotos.push({ url, alt: typeof img === 'object' ? img.alt : 'Gallery image' });
    });
  }

  if (allPhotos.length === 0) {
    return (
      <div className="w-full h-48 bg-beige/50 rounded-3xl flex items-center justify-center border border-border-light text-muted-text font-medium">
        Photos coming soon
      </div>
    );
  }

  const openLightbox = (index) => {
    setCurrentIndex(index);
    setIsOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setIsOpen(false);
    document.body.style.overflow = 'auto';
  };

  const prevPhoto = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === 0 ? allPhotos.length - 1 : prev - 1));
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev === allPhotos.length - 1 ? 0 : prev + 1));
  };

  // Determine grid layout based on number of photos
  const displayPhotos = allPhotos.slice(0, 5);
  const remainingCount = allPhotos.length > 5 ? allPhotos.length - 5 : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 h-[300px] md:h-[400px] rounded-[2rem] overflow-hidden">
        {/* Main large image */}
        <div 
          className={`relative cursor-pointer group ${displayPhotos.length > 1 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-4'}`}
          onClick={() => openLightbox(0)}
        >
          <img 
            src={displayPhotos[0].url} 
            alt={displayPhotos[0].alt} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
        </div>
        
        {/* Smaller grid images */}
        {displayPhotos.slice(1).map((photo, idx) => {
          const actualIndex = idx + 1;
          const isLastVisible = idx === 3;
          return (
            <div 
              key={actualIndex} 
              className="relative cursor-pointer group hidden md:block overflow-hidden"
              onClick={() => openLightbox(actualIndex)}
            >
              <img 
                src={photo.url} 
                alt={photo.alt} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.src = '/assets/fallback.svg'; }}
              />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
              
              {isLastVisible && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                  <span className="text-white text-xl font-bold">+{remainingCount} Photos</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={closeLightbox}>
          <button 
            className="absolute top-4 right-4 md:top-8 md:right-8 text-white/70 hover:text-white p-2"
            onClick={closeLightbox}
          >
            <X size={32} />
          </button>
          
          <div className="relative w-full max-w-5xl aspect-video flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img 
              src={allPhotos[currentIndex].url} 
              alt={allPhotos[currentIndex].alt} 
              className="max-w-full max-h-full object-contain"
            />
            
            {allPhotos.length > 1 && (
              <>
                <button 
                  className="absolute left-4 md:-left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/50 transition-colors"
                  onClick={prevPhoto}
                >
                  <ChevronLeft size={48} />
                </button>
                <button 
                  className="absolute right-4 md:-right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/50 transition-colors"
                  onClick={nextPhoto}
                >
                  <ChevronRight size={48} />
                </button>
              </>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 font-medium text-sm">
              {currentIndex + 1} / {allPhotos.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
