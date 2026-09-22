import React from 'react';
import { Menu, Plus, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react';

const PartnerHeader = ({ 
  title, 
  partnerProfile, 
  onMenuClick, 
  onAddListingClick, 
  onRefresh, 
  isRefreshing 
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Tab Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <span>{partnerProfile?.businessName || 'Business Partner'}</span>
              <span>•</span>
              <span>{partnerProfile?.city || 'Uttarakhand'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh Data"
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin text-forest-green' : ''} />
          </button>

          <button
            onClick={onAddListingClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs md:text-sm font-semibold shadow-md shadow-forest-green/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Add Listing</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default PartnerHeader;
