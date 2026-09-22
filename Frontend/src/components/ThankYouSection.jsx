import React from 'react';

const ThankYouSection = () => {
  return (
    <section className="relative px-4 md:px-8 max-w-[1440px] mx-auto w-full mt-12 mb-8">
      <div className="bg-gradient-to-b from-beige to-warm-white rounded-[2.5rem] p-10 md:p-16 lg:p-24 text-center card-shadow relative overflow-hidden border border-border-light/50">

        {/* Subtle Mountain Decoration */}
        <div className="absolute bottom-0 left-0 right-0 opacity-5 pointer-events-none flex justify-center">
          <svg width="100%" height="200" viewBox="0 0 1200 200" preserveAspectRatio="none" fill="currentColor" className="text-forest-green">
            <path d="M0,200 L0,100 L150,50 L300,120 L450,40 L600,150 L750,60 L900,130 L1050,30 L1200,90 L1200,200 Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
          <div className="text-forest-green mb-6">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3 4 7l4 4" />
              <path d="M4 7h16" />
              <path d="m16 21 4-4-4-4" />
              <path d="M20 17H4" />
            </svg>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-text-dark mb-6">
            Thank You for Visiting Uttarakhand
          </h2>

          <p className="text-lg md:text-xl text-muted-text leading-relaxed mb-8 font-medium">
            From peaceful lakes and Himalayan valleys to sacred temples and warm mountain villages, we hope Uttarakhand gave you memories worth carrying home.
          </p>

          <p className="text-forest-green font-bold text-lg tracking-wide uppercase">
            Take the memories with you, and leave only footprints behind.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ThankYouSection;
