import React from 'react';
import { 
  CalendarCheck, 
  DollarSign, 
  Layers, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  AlertCircle,
  Plus,
  ShieldCheck
} from 'lucide-react';

const OverviewTab = ({ 
  dashboardStats, 
  partnerProfile, 
  onNavigateTab 
}) => {
  const stats = dashboardStats || {};
  const listingsSummary = stats.listingsSummary || { total: 0, active: 0, pending: 0, draft: 0 };
  const recentBookings = stats.recentBookings || [];

  return (
    <div className="space-y-6">
      {/* Verification Notice Banner if not active */}
      {partnerProfile?.verificationStatus !== 'ACTIVE' && partnerProfile?.verificationStatus !== 'VERIFIED' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Partner Account Status: {partnerProfile?.verificationStatus || 'DRAFT'}
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Complete your business profile and submit for platform verification to make listings public to Uttarakhand tourists.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('profile')}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shrink-0 transition-colors shadow-xs"
          >
            Review Profile & Verification
          </button>
        </div>
      )}

      {/* 7 KPI Cards Grid as specified by Discovery Uttarakhand Business OS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Today's Bookings */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Today's Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats.todayBookingsCount !== undefined ? stats.todayBookingsCount : 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            Reservations active today
          </div>
        </div>

        {/* 2. Upcoming Bookings */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Upcoming Bookings
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <CalendarCheck size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats.upcomingBookingsCount !== undefined ? stats.upcomingBookingsCount : 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            Confirmed future departures
          </div>
        </div>

        {/* 3. Available Units */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Available Units
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-emerald-800">
              {stats.availableUnits !== undefined ? stats.availableUnits : 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            Ready for tourist booking
          </div>
        </div>

        {/* 4. Currently Rented */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Currently Rented
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-amber-800">
              {stats.rentedUnits !== undefined ? stats.rentedUnits : 0}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
            On the road or occupied
          </div>
        </div>

        {/* 5. Today's Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Today's Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-forest-green/10 text-forest-green flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              ₹{(stats.todayRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Income booked today
          </div>
        </div>

        {/* 6. This Month Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              This Month Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-forest-green/10 text-forest-green flex items-center justify-center">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              ₹{(stats.thisMonthRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Current calendar month
          </div>
        </div>

        {/* 7. Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-forest-green to-emerald-950 text-white shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-white">
              ₹{(stats.totalRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-200">
            All-time completed bookings
          </div>
        </div>

        {/* Inventory Status Card */}
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Listings
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-gray-900">
              {listingsSummary.active || 0}
            </span>
            <span className="text-xs text-gray-500 ml-1.5">/ {listingsSummary.total || 0} total</span>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {listingsSummary.pending > 0 ? (
              <span className="text-amber-700 font-semibold">{listingsSummary.pending} pending review</span>
            ) : (
              <span className="text-emerald-700 font-semibold">Verified inventory</span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-forest-green/5 via-cream/40 to-amber-500/5 border border-gray-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-forest-green mb-3">
          Quick Business Controls
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigateTab('add-listing')}
            className="p-3 rounded-xl bg-white border border-gray-200 hover:border-forest-green/40 hover:shadow-xs transition-all text-left flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-forest-green/10 text-forest-green flex items-center justify-center shrink-0">
              <Plus size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Add Listing</div>
              <div className="text-[10px] text-gray-500">Fleet/Room</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('availability')}
            className="p-3 rounded-xl bg-white border border-gray-200 hover:border-forest-green/40 hover:shadow-xs transition-all text-left flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Clock size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Availability</div>
              <div className="text-[10px] text-gray-500">Units & Dates</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('pricing')}
            className="p-3 rounded-xl bg-white border border-gray-200 hover:border-forest-green/40 hover:shadow-xs transition-all text-left flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <TrendingUp size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Pricing Matrix</div>
              <div className="text-[10px] text-gray-500">Day/Week Rates</div>
            </div>
          </button>

          <button
            onClick={() => onNavigateTab('expenses')}
            className="p-3 rounded-xl bg-white border border-gray-200 hover:border-forest-green/40 hover:shadow-xs transition-all text-left flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <DollarSign size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900">Log Expense</div>
              <div className="text-[10px] text-gray-500">P&L Tracking</div>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Bookings Section */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Customer Bookings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Real-time incoming reservations across your listings</p>
          </div>
          <button
            onClick={() => onNavigateTab('bookings')}
            className="text-xs font-semibold text-forest-green hover:underline flex items-center gap-1"
          >
            View All ({stats.totalBookingsCount || 0})
            <ArrowUpRight size={14} />
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-3 text-gray-400">
              <CalendarCheck size={20} />
            </div>
            <p className="font-medium text-gray-700">No bookings recorded yet.</p>
            <p className="text-gray-400 mt-1">Once verified and active, customer reservations will appear here in real-time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 text-gray-500 font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Listing</th>
                  <th className="px-5 py-3">Dates</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentBookings.map((b) => {
                  const bookingAmount = Number(b.pricingSnapshot?.total || b.amount || b.totalAmount || b.totalPrice || 0);
                  const statusUpper = (b.status || 'PENDING').toUpperCase();
                  return (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {b.user?.name || b.traveler?.name || 'Tourist Guest'}
                        <div className="text-[11px] text-gray-400 font-normal">{b.user?.phone || b.traveler?.phone || b.user?.email || 'Direct customer'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {b.partnerListing?.title || b.listingSnapshot?.title || b.details?.vehicleName || 'Listing reservation'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">
                        {b.startDate ? new Date(b.startDate).toLocaleDateString('en-IN') : 'N/A'} -{' '}
                        {b.endDate ? new Date(b.endDate).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-gray-900">
                        ₹{bookingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          statusUpper === 'CONFIRMED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : statusUpper === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : statusUpper === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
