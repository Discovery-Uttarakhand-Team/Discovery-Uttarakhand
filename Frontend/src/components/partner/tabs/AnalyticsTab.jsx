import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  XCircle, 
  Star,
  Award
} from 'lucide-react';

const AnalyticsTab = ({ analyticsData }) => {
  const data = analyticsData || {};
  const topListings = data.topListings || [];
  const categoryBreakdown = data.categoryBreakdown || [];

  return (
    <div className="space-y-6">
      {/* 4 Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Avg Booking Value
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-gray-900">
              ₹{(data.averageBookingValue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Average customer cart</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Cancellation Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
              <XCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-gray-900">
              {data.cancellationRate || 0}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Cancelled vs total bookings</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Customer Rating
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Star size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-gray-900">
              {data.reviewsRating?.average || 5.0}
            </span>
            <span className="text-xs text-gray-400">({data.reviewsRating?.count || 0} reviews)</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Direct tourist feedback</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Net Profit Margin
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-emerald-800">
              {data.profitMargin || 0}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Net profit / gross revenue</p>
        </div>
      </div>

      {/* Two Column Grid: Top Listings & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Listings */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
                Top Revenue Listings
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Highest earning fleet units and stays</p>
            </div>
            <Award size={18} className="text-amber-600" />
          </div>

          {topListings.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No revenue recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {topListings.map((item, idx) => (
                <div key={item.listingId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="w-6 h-6 rounded-lg bg-forest-green/10 text-forest-green font-bold flex items-center justify-center text-[11px]">
                      #{idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-bold text-gray-900 truncate">{item.title}</div>
                      <div className="text-[10px] text-gray-500">{item.bookingsCount} bookings</div>
                    </div>
                  </div>
                  <div className="font-extrabold text-gray-900 shrink-0">
                    ₹{item.revenue.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green">
                Revenue by Category
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Volume & revenue distribution</p>
            </div>
            <BarChart3 size={18} className="text-forest-green" />
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs">
              No category metrics recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 capitalize">{cat.category}</span>
                    <div className="text-[10px] text-gray-500">{cat.count} total reservations</div>
                  </div>
                  <div className="font-extrabold text-forest-green">
                    ₹{cat.revenue.toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
