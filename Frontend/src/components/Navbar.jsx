import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const { favoriteCount } = useFavorites();
  const { isAuthenticated, currentUser, requireAuth } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const navItems = [
    { name: 'Explore', path: '/' },
    { name: 'Rentals', path: '/rentals' },
    { name: 'Stays', path: '/stays' },
    { name: 'Spiritual', path: '/spiritual' },
    { name: 'Culture', path: '/culture' },
    { name: 'Activities', path: '/activities' },
    { name: 'Guides', path: '/guides' },
    { name: 'Map', path: '/map' },
    { name: 'Trip Planner', path: '/trip-planner' },
    { name: 'AI Copilot', path: '/copilot' },
  ];

  const handleUserClick = () => {
    requireAuth(() => {
      if (currentUser?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/profile');
      }
    });
  };

  const handleHeartClick = () => {
    requireAuth(() => {
      navigate('/profile');
    });
  };

  const handleBookingsClick = () => {
    requireAuth(() => {
      navigate('/profile');
    });
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="bg-warm-white bg-opacity-95 backdrop-blur-md rounded-full card-shadow px-6 py-3 flex items-center justify-between w-full max-w-[1440px]">
        
        {/* Mobile Hamburger Menu */}
        <div className="lg:hidden flex items-center mr-4">
          <button className="text-text-dark hover:text-forest-green transition-colors">
            <Menu size={24} />
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-2 mr-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-forest-green">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L8 8C8 8 5 9 5 13C5 17 8 20 12 22C16 20 19 17 19 13C19 9 16 8 16 8L12 2Z" />
                <path d="M12 22V10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="font-bold text-text-dark leading-tight flex flex-col">
              <span className="text-[15px]">Discover</span>
              <span className="text-[15px] -mt-1">Uttarakhand</span>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const itemPathname = item.path.split('#')[0];
            const itemHash = item.path.split('#')[1] ? `#${item.path.split('#')[1]}` : '';
            
            let isActive = false;
            if (itemHash) {
              isActive = location.pathname === itemPathname && location.hash === itemHash;
            } else {
              if (itemPathname === '/') {
                isActive = location.pathname === '/';
              } else {
                isActive = location.pathname.startsWith(itemPathname) && !location.hash;
              }
            }

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                  isActive 
                    ? 'text-forest-green' 
                    : 'text-muted-text hover:text-text-dark hover:bg-beige'
                }`}
              >
                {item.name}
                {isActive && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-forest-green" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right Icons */}
        <div className="flex items-center gap-5 ml-8 relative">
          <button onClick={() => setShowSearch(!showSearch)} className="text-text-dark hover:text-forest-green transition-colors">
            <Search size={20} />
          </button>

          {showSearch && (
            <div className="absolute top-12 right-40 bg-white p-2 rounded-xl shadow-lg border border-gray-100 flex items-center">
              <input type="text" placeholder="Search..." className="p-2 outline-none w-48 text-sm" />
              <button className="bg-forest-green text-white p-2 rounded-lg text-xs font-bold">Go</button>
            </div>
          )}

          <button onClick={handleHeartClick} className="text-text-dark hover:text-forest-green transition-colors relative">
            <Heart size={20} />
            {favoriteCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-forest-green text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {favoriteCount}
              </span>
            )}
          </button>
          
          <button onClick={handleBookingsClick} className="text-text-dark hover:text-forest-green transition-colors relative">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-forest-green text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
          
          <button onClick={handleUserClick} className="text-text-dark hover:text-forest-green transition-colors flex items-center gap-2">
            <User size={20} />
            {isAuthenticated && <span className="text-xs font-bold hidden xl:block">{currentUser?.name?.split(' ')[0]}</span>}
          </button>

          {isAuthenticated && (currentUser?.role === 'partner' || currentUser?.role === 'admin') && (
            <Link
              to="/partner"
              className="hidden lg:inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-forest-green/10 text-forest-green hover:bg-forest-green hover:text-white transition-all border border-forest-green/20 shadow-xs"
            >
              🏢 Partner Portal
            </Link>
          )}
          
          <Link to="/trip-planner" className="hidden sm:flex btn-primary ml-2 px-5 py-2.5 text-sm">
            PLAN MY TRIP
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
