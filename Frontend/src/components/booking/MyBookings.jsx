import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  MapPin, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Clock, 
  ChevronRight, 
  Eye, 
  RotateCcw,
  Loader2,
  Building
} from 'lucide-react';
import { getMyBookings, cancelBooking } from '../../api/bookingApi';
import BookingDetailsModal from './BookingDetailsModal';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Modal states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancellingLoading, setCancellingLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyBookings();
      if (res?.success && Array.isArray(res.data)) {
        setBookings(res.data);
      } else {
        setBookings([]);
      }
    } catch (err) {
      setError('Unable to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = useMemo(() => {
    if (activeFilter === 'ALL') return bookings;
    return bookings.filter(b => (b.status || 'PENDING').toUpperCase() === activeFilter);
  }, [bookings, activeFilter]);

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingBooking || cancellingLoading) return;

    try {
      setCancellingLoading(true);
      setCancelError('');
      const res = await cancelBooking(cancellingBooking._id, { reason: cancelReason });
      if (res?.success) {
        // Update local list
        setBookings(prev => prev.map(b => b._id === cancellingBooking._id ? { ...b, status: 'CANCELLED', cancellation: res.data.cancellation } : b));
        setCancellingBooking(null);
        setCancelReason('');
      } else {
        setCancelError(res?.message || 'Failed to cancel booking.');
      }
    } catch (err) {
      setCancelError(err.response?.data?.message || err.message || 'Error cancelling booking.');
    } finally {
      setCancellingLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 card-shadow border border-border-light/60">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-border-light/60">
        <div>
          <h3 className="text-lg font-black text-text-dark uppercase tracking-wide font-display">
            My Reservations
          </h3>
          <p className="text-xs text-muted-text font-medium mt-0.5">
            Your bookings for verified partner stays, heritage homestays, and local guides.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(status => (
            <button
              key={status}
              onClick={() => setActiveFilter(status)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all ${
                activeFilter === status
                  ? 'bg-forest-green text-white shadow-2xs'
                  : 'bg-beige/60 text-muted-text hover:text-text-dark hover:bg-beige'
              }`}
            >
              {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchBookings}
            className="font-bold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#faf9f6] rounded-3xl p-5 border border-border-light/60 animate-pulse space-y-3">
              <div className="h-5 bg-border-light/60 rounded w-2/3" />
              <div className="h-4 bg-border-light/40 rounded w-1/2" />
              <div className="h-4 bg-border-light/40 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredBookings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBookings.map((b) => {
            const status = (b.status || 'PENDING').toUpperCase();
            const statusColor =
              status === 'CONFIRMED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : status === 'CANCELLED'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : status === 'COMPLETED'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-amber-50 text-amber-700 border-amber-200';

            const itemName =
              b.listingSnapshot?.title ||
              b.partnerListing?.title ||
              b.stay?.name ||
              b.rental?.name ||
              b.vehicle?.name ||
              b.guide?.name ||
              'Himalayan Reservation';

            const district =
              b.listingSnapshot?.district ||
              b.partnerListing?.district ||
              b.stay?.district ||
              b.district;

            const checkIn = b.reservation?.checkIn || b.startDate;
            const checkOut = b.reservation?.checkOut || b.endDate;
            const canCancel = status === 'PENDING' || status === 'CONFIRMED';

            return (
              <div
                key={b._id}
                className="bg-white rounded-3xl p-5 border border-border-light/70 card-shadow hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top: Item Title & Status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-base font-bold text-text-dark font-display leading-tight">
                        {itemName}
                      </h4>
                      {b.bookingReference && (
                        <span className="text-[10px] font-mono text-muted-text block mt-0.5">
                          Ref: {b.bookingReference}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusColor}`}>
                      {status}
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-muted-text font-medium my-3">
                    {district && (
                      <p className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-forest-green" />
                        <span>{district}</span>
                      </p>
                    )}
                    {checkIn && checkOut && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-earth-brown" />
                        <span>
                          {new Date(checkIn).toLocaleDateString('en-IN', { dateStyle: 'medium' })} — {new Date(checkOut).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      </p>
                    )}
                    {(b.guests || b.traveler?.guests) && (
                      <p className="flex items-center gap-1.5">
                        <User size={13} className="text-earth-brown" />
                        <span>{b.guests || b.traveler?.guests} Guest(s)</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Bar: Pricing & Actions */}
                <div className="pt-3 border-t border-border-light/60 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider block">
                      Total
                    </span>
                    <span className="text-base font-black text-forest-green font-display">
                      ₹{(b.amount || b.pricingSnapshot?.total || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedBooking(b)}
                      className="px-3 py-1.5 bg-beige/60 hover:bg-beige text-text-dark font-bold text-[11px] rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Eye size={12} />
                      <span>Details</span>
                    </button>

                    {canCancel && (
                      <button
                        onClick={() => {
                          setCancellingBooking(b);
                          setCancelReason('');
                          setCancelError('');
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-[#faf9f6] rounded-3xl border border-dashed border-border-light flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-forest-green/10 text-forest-green flex items-center justify-center mb-4">
            <Calendar size={28} className="text-forest-green/60" />
          </div>
          <h4 className="text-base font-bold text-text-dark mb-1 font-display">
            No reservations found
          </h4>
          <p className="text-xs text-muted-text max-w-sm mb-6 leading-relaxed">
            Reserve authentic Himalayan homestays, KMVN tourist lodges, or licensed local guides for your trip.
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/stays"
              className="px-5 py-2.5 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
            >
              Explore Stays
            </Link>
            <Link
              to="/trip-planner"
              className="px-5 py-2.5 bg-white hover:bg-beige text-forest-green border border-forest-green/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
            >
              Plan a Trip
            </Link>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onPaymentSuccess={fetchBookings}
        />
      )}

      {/* Cancellation Confirmation Dialog */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border-light space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-base font-bold text-text-dark font-display">
                  Cancel Reservation?
                </h4>
                <p className="text-xs text-muted-text mt-0.5">
                  Ref: {cancellingBooking.bookingReference || cancellingBooking._id}
                </p>
              </div>
              <button
                onClick={() => setCancellingBooking(null)}
                className="text-muted-text hover:text-text-dark"
              >
                <X size={18} />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
                <AlertCircle size={14} />
                <span>{cancelError}</span>
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-text-dark uppercase tracking-wider block mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows="2"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule change, road conditions..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                Payment and financial refunds are not processed in this phase. The reservation will be marked as Cancelled.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={cancellingLoading}
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2 bg-beige/60 hover:bg-beige text-text-dark font-bold text-xs rounded-xl transition-colors"
                >
                  Keep Reservation
                </button>
                <button
                  type="submit"
                  disabled={cancellingLoading || !cancelReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {cancellingLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
