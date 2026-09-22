import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Footer = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <>
      {/* Inspirational Quote Section */}
      {isHome && (
        <section className="px-4 md:px-8 max-w-[1000px] mx-auto w-full mb-20 text-center relative mt-8">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-forest-green/10 text-9xl font-serif select-none pointer-events-none">
            "
          </div>
          <div className="relative z-10">
            <p className="text-2xl md:text-3xl lg:text-4xl text-forest-green font-bold leading-relaxed mb-6 font-serif italic">
              "Uttarakhand is not just a destination, it is a feeling you carry long after the mountains disappear from view."
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="w-8 h-px bg-earth-brown"></span>
              <span className="text-earth-brown font-bold tracking-widest uppercase text-sm">Discover Uttarakhand</span>
              <span className="w-8 h-px bg-earth-brown"></span>
            </div>
          </div>
        </section>
      )}

      {/* Actual Footer */}
      <footer className="bg-forest-green text-white pt-16 pb-8 px-4 md:px-8 rounded-t-[3rem] mt-auto">
        <div className="max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8 mb-16">
            
            <div className="md:col-span-1">
              <h2 className="text-2xl font-bold mb-3">Discover Uttarakhand</h2>
              <p className="text-white/80 font-medium leading-relaxed max-w-sm">
                Discover Uttarakhand beyond the usual.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-90">Explore</h3>
              <div className="flex flex-col gap-4 text-white/80 font-medium">
                <Link to="/" className="hover:text-beige transition-colors w-fit">Destinations</Link>
                <Link to="/culture" className="hover:text-beige transition-colors w-fit">Experiences</Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-90">Discover</h3>
              <div className="flex flex-col gap-4 text-white/80 font-medium">
                <Link to="/map" className="hover:text-beige transition-colors w-fit">Map</Link>
                <Link to="/guides" className="hover:text-beige transition-colors w-fit">Guides</Link>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm opacity-90">Plan</h3>
              <div className="flex flex-col gap-4 text-white/80 font-medium">
                <Link to="/trip-planner" className="hover:text-beige transition-colors w-fit">Trip Planner</Link>
                <Link to="/rentals" className="hover:text-beige transition-colors w-fit">Rentals</Link>
                <Link to="/stays" className="hover:text-beige transition-colors w-fit">Stays</Link>
              </div>
            </div>

          </div>

          <div className="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60 font-medium">
            <p>© 2026 Discover Uttarakhand. Explore responsibly.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
