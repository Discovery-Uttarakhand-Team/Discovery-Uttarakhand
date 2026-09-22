import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

// All slides use real DB slugs confirmed from the API.
// Kedarnath → /destinations/kedarnath (also in spiritual, but destinations/:slug is the correct page).
// Valley of Flowers → /destinations/valley-of-flowers-national-park (confirmed slug).
// Binsar → /destinations/binsar (confirmed slug).
const slides = [
  {
    id: 1,
    title: "Nainital",
    subtitle: "Lakes & Mountains",
    label: "Kumaon Hills",
    location: "Nainital • Kumaon",
    buttonText: "EXPLORE NAINITAL",
    link: "/destinations/nainital",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Nainital_metro.jpg/1920px-Nainital_metro.jpg"
  },
  {
    id: 2,
    title: "Mussoorie",
    subtitle: "Queen of Hills",
    label: "Hill Station",
    location: "Dehradun • Garhwal",
    buttonText: "EXPLORE MUSSOORIE",
    link: "/destinations/mussoorie",
    image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Mussoorie_Snow_Over_Dehradun_%2814831297545%29.jpg"
  },
  {
    id: 3,
    title: "Rishikesh",
    subtitle: "Ganga & Adventure",
    label: "Yoga Capital",
    location: "Dehradun • Garhwal",
    buttonText: "EXPLORE RISHIKESH",
    link: "/destinations/rishikesh",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Trayambakeshwar_Temple_VK.jpg/1920px-Trayambakeshwar_Temple_VK.jpg"
  },
  {
    id: 4,
    title: "Auli",
    subtitle: "Snow & Skiing",
    label: "Winter Wonderland",
    location: "Chamoli • Garhwal",
    buttonText: "EXPLORE AULI",
    link: "/destinations/auli",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Auli_Lake_in_Feburary_2015.jpg/1920px-Auli_Lake_in_Feburary_2015.jpg"
  },
  {
    id: 5,
    title: "Kedarnath",
    subtitle: "Himalayan Temple",
    label: "Spiritual Journeys",
    location: "Rudraprayag • Garhwal",
    buttonText: "EXPLORE KEDARNATH",
    link: "/destinations/kedarnath",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Kedarnath_Temple_in_Rainy_season.jpg/1920px-Kedarnath_Temple_in_Rainy_season.jpg"
  },
  {
    id: 6,
    title: "Valley of Flowers",
    subtitle: "Alpine Meadows",
    label: "Nature",
    location: "Chamoli • Garhwal",
    buttonText: "EXPLORE VALLEY",
    link: "/destinations/valley-of-flowers-national-park",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/50/Valley_of_flowers_national_park%2C_Uttarakhand%2C_India_03_%28edit%29.jpg/1920px-Valley_of_flowers_national_park%2C_Uttarakhand%2C_India_03_%28edit%29.jpg"
  },
  {
    id: 7,
    title: "Binsar",
    subtitle: "Himalayan Panorama",
    label: "Nature & Wildlife",
    location: "Almora • Kumaon",
    buttonText: "EXPLORE BINSAR",
    link: "/destinations/binsar",
    image: "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Binsar_1.jpg/1920px-Binsar_1.jpg"
  }
];

const HeroSection = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  // animKey forces re-mount of the content div each slide change, triggering the CSS animation
  const [animKey, setAnimKey] = useState(0);
  const totalSlides = slides.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
      setAnimKey((k) => k + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, [totalSlides, isPaused]);

  const goTo = (idx) => {
    setCurrentSlide(idx);
    setAnimKey((k) => k + 1);
  };

  const nextSlide = () => goTo((currentSlide + 1) % totalSlides);
  const prevSlide = () => goTo((currentSlide - 1 + totalSlides) % totalSlides);

  const slide = slides[currentSlide];

  return (
    <div className="pt-28 px-4 md:px-8 max-w-[1440px] mx-auto w-full">
      <div
        className="relative w-full min-h-[600px] md:min-h-[70vh] rounded-[2.5rem] overflow-hidden flex flex-col group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Images — crossfade */}
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{
              backgroundImage: `url(${s.image})`,
              backgroundColor: '#2a3a30'
            }}
          />
        ))}

        {/* Gradient overlay — stronger on left for text, subtle bottom band for dots */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-between z-10">

          {/* Prev Button */}
          <button
            onClick={prevSlide}
            className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all duration-200 z-20"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Slide content — key triggers re-mount and CSS animation */}
          <div key={animKey} className="max-w-xl pt-6 hero-content-animate">
            {/* Category label pill */}
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-full mb-5 uppercase shadow-sm">
              {slide.label}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-3 drop-shadow-md">
              {slide.title}
            </h1>

            <p className="text-xl md:text-2xl text-white/85 mb-3 font-light drop-shadow">
              {slide.subtitle}
            </p>

            {/* Location metadata — only rendered when value exists */}
            {slide.location && (
              <div className="flex items-center gap-1.5 text-white/70 text-sm font-medium mb-8">
                <MapPin size={13} strokeWidth={2} />
                <span>{typeof slide.location === 'string' ? slide.location : (slide.location?.name || '')}</span>
              </div>
            )}

            <Link
              to={slide.link}
              className="inline-flex items-center gap-2 bg-white text-forest-green text-sm font-bold px-8 py-4 rounded-full uppercase tracking-wider hover:bg-beige transition-colors duration-200 shadow-lg"
            >
              {slide.buttonText}
              <span className="text-base">→</span>
            </Link>
          </div>

          {/* Slide counter + dots */}
          <div className="flex items-end justify-between w-full mt-auto">
            {/* Slide number */}
            <span className="text-white/50 text-xs font-medium tabular-nums">
              {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
            </span>

            {/* Dot indicators */}
            <div className="flex gap-2 items-center">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === currentSlide
                      ? 'w-7 h-2 bg-white'
                      : 'w-2 h-2 bg-white/35 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HeroSection;
