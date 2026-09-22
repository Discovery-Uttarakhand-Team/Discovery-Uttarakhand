import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';

const EarningsTab = ({ earningsData }) => {
  const data = earningsData || {};
  const breakdown = data.breakdown || { today: 0, week: 0, month: 0, year: 0 };
  const monthly = data.monthlyBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Top 3 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Gross Revenue */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Gross Bookings Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-forest-green/10 text-forest-green flex items-center justify-center">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-gray-900">
              ₹{(data.grossRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total value of all completed tourist bookings
          </p>
        </div>

        {/* Platform Fee */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Platform Service Fee (10%)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-800">
              ₹{(data.platformFee || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Payment gateway, hosting & marketplace guarantee
          </p>
        </div>

        {/* Net Partner Payout */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-forest-green to-emerald-900 text-white shadow-md shadow-forest-green/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Net Partner Earnings
            </span>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-emerald-200 flex items-center justify-center backdrop-blur-xs">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-white">
              ₹{((data.netPartnerEarnings !== undefined ? data.netPartnerEarnings : data.netEarnings) || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-emerald-200 mt-2">
            Realized income credited to your business account
          </p>
        </div>
      </div>

      {/* Time-based Revenue Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-forest-green mb-4">
          Time Period Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 font-medium">Today</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              ₹{(breakdown.today ?? data.todayEarnings ?? 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 font-medium">This Week</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              ₹{(breakdown.week || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 font-medium">This Month</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              ₹{(breakdown.month ?? data.thisMonthEarnings ?? 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <div className="text-xs text-gray-500 font-medium">This Year</div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              ₹{(breakdown.year || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly History Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Monthly Payout Breakdown</h3>
            <p className="text-xs text-gray-500 mt-0.5">Calculated in real-time from active and completed bookings</p>
          </div>
        </div>

        {monthly.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No booking transactions recorded for this fiscal period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Month</th>
                  <th className="px-5 py-3.5">Bookings</th>
                  <th className="px-5 py-3.5">Gross Revenue</th>
                  <th className="px-5 py-3.5">Platform Fee (10%)</th>
                  <th className="px-5 py-3.5 text-right">Net Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthly.map((m) => {
                  const fee = Math.round(m.revenue * 0.1);
                  const net = m.revenue - fee;
                  return (
                    <tr key={m.month} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 font-bold text-gray-900">{m.month}</td>
                      <td className="px-5 py-3.5 text-gray-600">{m.bookingsCount}</td>
                      <td className="px-5 py-3.5 text-gray-800 font-semibold">₹{m.revenue.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-amber-800">₹{fee.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 text-right font-extrabold text-forest-green">₹{net.toLocaleString('en-IN')}</td>
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

export default EarningsTab;
