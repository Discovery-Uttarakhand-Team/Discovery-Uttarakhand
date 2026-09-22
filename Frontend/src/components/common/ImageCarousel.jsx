import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Discovery Uttarakhand - Image Glider / Card Image Carousel
 * 
 * - Seamless automatic rotation (approx 2.8s) when multiple images exist
 * - Staggered initial rotation timer to avoid all cards animating simultaneously
 * - Subtle dot indicators with direct click selection
 * - Hover pause on desktop / swipe gestures on mobile
 * - Stops event propagation to prevent accidental card navigation or link triggers
 * - Single image mode: static image with zero overhead/timers
 */
const ImageCarousel = ({
  images = [],
  alt = 'Image',
  aspectRatio = 'aspect-[4/3]',
  className = '',
  imageClassName = '',
  showControls = true,
  autoSlideInterval = 3000,
  fallback = '/assets/fallback.svg'
}) => {
  const validImages = Array.isArray(images) && images.length > 0 ? images : [fallback];
  const isMultiple = validImages.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imgErrorMap, setImgErrorMap] = useState({});

  // Touch swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Safe navigation
  const nextImage = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev + 1) % validImages.length);
  }, [validImages.length]);

  const prevImage = useCallback((e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
  }, [validImages.length]);

  const goToImage = useCallback((index, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentIndex(index);
  }, []);

  // Automatic rotation interval
  useEffect(() => {
    if (!isMultiple || isHovered) return;

    // Small random offset (0-400ms) on initial interval to desynchronize cards across grid
    const offset = Math.floor(Math.random() * 400);
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, autoSlideInterval + offset);

    return () => clearInterval(timer);
  }, [isMultiple, isHovered, autoSlideInterval, validImages.length]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 40;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        // Swiped Left -> Next
        nextImage(e);
      } else {
        // Swiped Right -> Previous
        prevImage(e);
      }
    }
  };

  // Image source resolution with fallback
  const currentSrc = imgErrorMap[currentIndex] ? fallback : validImages[currentIndex];

  return (
    <div
      className={`relative w-full overflow-hidden bg-beige group/carousel ${aspectRatio} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Active Image */}
      <img
        src={currentSrc}
        alt={`${alt} — image ${currentIndex + 1} of ${validImages.length}`}
        loading="lazy"
        onError={() => setImgErrorMap((prev) => ({ ...prev, [currentIndex]: true }))}
        className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${imageClassName}`}
      />

      {/* Subtle overlay gradient at bottom for indicator legibility */}
      {isMultiple && (
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
      )}

      {/* Left/Right Chevrons on Hover (Desktop) */}
      {isMultiple && showControls && (
        <>
          <button
            type="button"
            aria-label="Previous image"
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 z-10 shadow-sm"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-200 z-10 shadow-sm"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {isMultiple && (
        <div
          className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-1.5 z-10 px-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {validImages.slice(0, 6).map((_, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={idx}
                type="button"
                aria-label={`Show image ${idx + 1} of ${validImages.length}`}
                onClick={(e) => goToImage(idx, e)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? 'w-4 h-1.5 bg-white shadow-md'
                    : 'w-1.5 h-1.5 bg-white/60 hover:bg-white/90'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;
