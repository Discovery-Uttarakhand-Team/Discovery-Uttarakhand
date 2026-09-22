import React from 'react';

const CategoryHero = ({ title, subtitle, description, bgImage }) => {
  return (
    <div className="px-4 md:px-8 max-w-[1440px] mx-auto w-full mb-12">
      <div className="relative w-full h-[350px] md:h-[450px] rounded-[2.5rem] overflow-hidden bg-forest-green shadow-sm flex flex-col items-center justify-center text-center">
        {bgImage && (
          <img 
            src={bgImage} 
            alt={title} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Subtle dark/green overlay so text remains highly readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-forest-green/40 to-black/60"></div>
        
        <div className="relative z-10 px-6 max-w-3xl flex flex-col items-center justify-center mt-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-md">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl md:text-2xl text-white/95 font-medium drop-shadow-sm mb-4">
              {subtitle}
            </p>
          )}
          {description && (
            <p className="text-base md:text-lg text-white/80 font-medium drop-shadow-sm max-w-xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryHero;
