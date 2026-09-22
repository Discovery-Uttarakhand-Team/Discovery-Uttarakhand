import React, { useState } from 'react';
import { 
  CalendarCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Loader2,
  Calendar,
  AlertCircle,
  MessageSquare
} from 'lucide-react';

const BookingsTab = ({ 
  bookings = [], 
  onUpdateStatus, 
  isUpdating 
}) => {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForNote, setSelectedBookingForNote] = useState(null);
  const [partnerNote, setPartnerNote] = useState('');

  const filteredBookings = bookings.filter((b) => {
    let matchesStatus = true;
    const statusLower = (b.status || '').toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];
    const startDateVal = b.startDate || b.bookingDates?.startDate || b.checkIn;
    const bookingStartStr = startDateVal ? new Date(startDateVal).toISOString().split('T')[0] : '';

    if (filterStatus === 'today') {
      matchesStatus = bookingStartStr === todayStr;
    } else if (filterStatus === 'upcoming') {
      matchesStatus = statusLower === 'confirmed' && bookingStartStr > todayStr;
    } else if (filterStatus === 'completed') {
      matchesStatus = statusLower === 'completed';
    } else if (filterStatus === 'cancelled') {
      matchesStatus = statusLower === 'cancelled';
    } else if (filterStatus === 'pending') {
      matchesStatus = statusLower === 'pending';
    }

    const matchesSearch = 
      !searchQuery ||
      b.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user?.phone?.includes(searchQuery) ||
      b.partnerListing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b._id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (bookingId, newStatus) => {
    onUpdateStatus(bookingId, newStatus, partnerNote);
    setSelectedBookingForNote(null);
    setPartnerNote('');
  };

  const getStatusBadge = (rawStatus) => {
    const status = (rawStatus || '').toLowerCase();
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={12} /> Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock size={12} /> Pending Confirmation
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, phone, booking ID or title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs md:text-sm bg-white focus:outline-none focus:border-forest-green focus:ring-1 focus:ring-forest-green"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Bookings' },
            { id: 'today', label: "Today's Check-ins" },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'pending', label: 'Pending' },
            { id: 'completed', label: 'Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFilterStatus(pill.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                filterStatus === pill.id
                  ? 'bg-forest-green text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
            <CalendarCheck size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Reservations Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No bookings match your search query.'
              : 'There are no bookings matching the selected filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Booking / Customer</th>
                  <th className="px-5 py-3.5">Listing Reserved</th>
                  <th className="px-5 py-3.5">Rental / Stay Dates</th>
                  <th className="px-5 py-3.5">Total Fare</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map((b) => {
                  const statusLower = (b.status || '').toLowerCase();
                  const startDateVal = b.startDate || b.bookingDates?.startDate || b.checkIn;
                  const endDateVal = b.endDate || b.bookingDates?.endDate || b.checkOut;
                  const totalFare = Number(b.pricingSnapshot?.total || b.amount || b.totalAmount || b.totalPrice || 0);

                  return (
                    <tr key={b._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-xs md:text-sm">
                          {b.user?.name || b.customerName || 'Tourist Guest'}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
                          {(b.user?.phone || b.customerPhone) && (
                            <span className="flex items-center gap-1">
                              <Phone size={11} className="text-gray-400" />
                              {b.user?.phone || b.customerPhone}
                            </span>
                          )}
                          {(b.user?.email || b.customerEmail) && (
                            <span className="flex items-center gap-1">
                              <Mail size={11} className="text-gray-400" />
                              {b.user?.email || b.customerEmail}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                          ID: {b._id}
                        </div>
                      </td>

                      {/* Listing Title */}
                      <td className="px-5 py-4 font-medium text-gray-800">
                        <div>{b.partnerListing?.title || b.details?.vehicleName || b.details?.propertyName || 'Listing item'}</div>
                        <div className="text-[11px] text-gray-400 capitalize">
                          {b.partnerListing?.category || b.type || 'Direct Booking'}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4 text-gray-600">
                        <div className="flex items-center gap-1 font-semibold text-gray-800">
                          <Calendar size={12} className="text-forest-green" />
                          <span>
                            {startDateVal ? new Date(startDateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                            {' '}-{' '}
                            {endDateVal ? new Date(endDateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">
                          Created {new Date(b.createdAt || Date.now()).toLocaleDateString('en-IN')}
                        </div>
                      </td>

                      {/* Total Price */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-sm">
                          ₹{totalFare.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                          {b.paymentStatus || 'CONFIRMED'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {getStatusBadge(b.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {statusLower === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(b._id, 'confirmed')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors"
                            >
                              Accept
                            </button>
                          )}

                          {statusLower === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(b._id, 'completed')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] shadow-xs transition-colors"
                            >
                              Complete
                            </button>
                          )}

                          {statusLower !== 'cancelled' && statusLower !== 'completed' && (
                            <button
                              onClick={() => handleStatusChange(b._id, 'cancelled')}
                              disabled={isUpdating}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-600 hover:text-rose-600 font-semibold text-[11px] transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsTab;
