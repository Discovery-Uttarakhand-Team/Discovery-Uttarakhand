import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  PlusCircle, 
  CalendarCheck, 
  Clock, 
  Tag, 
  DollarSign, 
  TrendingDown, 
  BarChart3, 
  MessageSquare, 
  Building2, 
  ArrowLeft,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'listings', label: 'My Listings', icon: Layers },
  { id: 'add-listing', label: 'Add Listing', icon: PlusCircle },
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'pricing', label: 'Pricing', icon: Tag },
  { id: 'earnings', label: 'Earnings', icon: DollarSign },
  { id: 'expenses', label: 'Expenses & P&L', icon: TrendingDown },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'profile', label: 'Business Profile', icon: Building2 },
];

const PartnerSidebar = ({ activeTab, setActiveTab, partnerProfile, isOpen, onClose }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck size={12} /> Verified
          </span>
        );
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle size={12} /> Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Draft
          </span>
        );
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand / Logo */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-green flex items-center justify-center text-white font-bold shadow-md shadow-forest-green/20">
              DU
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900 tracking-tight leading-none">
                Discovery Uttarakhand
              </div>
              <div className="text-xs font-medium text-emerald-700 mt-1 uppercase tracking-wider">
                Partner Business
              </div>
            </div>
          </Link>
        </div>

        {/* Partner Quick Identity Card */}
        <div className="p-4 mx-4 mt-4 rounded-2xl bg-gradient-to-br from-forest-green/5 via-cream/30 to-amber-500/5 border border-forest-green/10">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h4 className="text-sm font-bold text-gray-900 truncate">
                {partnerProfile?.businessName || 'Business Partner'}
              </h4>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {partnerProfile?.businessType || 'Fleet / Hospitality Operator'}
              </p>
            </div>
            {getStatusBadge(partnerProfile?.verificationStatus)}
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-600">
            <span>Location:</span>
            <span className="font-semibold text-gray-800">{partnerProfile?.city || 'Uttarakhand'}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-forest-green text-white shadow-sm shadow-forest-green/25 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer / Switch back to Tourist View */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
          <Link
            to="/profile"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors shadow-xs"
          >
            <ArrowLeft size={14} />
            Switch to Tourist Profile
          </Link>
          <div className="text-[11px] text-center text-gray-400">
            Discovery Uttarakhand Partner OS v2.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default PartnerSidebar;
