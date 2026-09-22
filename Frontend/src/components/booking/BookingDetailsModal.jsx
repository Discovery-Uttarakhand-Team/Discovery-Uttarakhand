import React from 'react';
import { 
  X, 
  Calendar, 
  User, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Building,
  CheckCircle2,
  CreditCard,
  Loader2
} from 'lucide-react';
import { createOrder, verifyPayment } from '../../api/paymentApi';

export default function BookingDetailsModal({ isOpen, onClose, booking, onPaymentSuccess }) {
  const [loadingPayment, setLoadingPayment] = React.useState(false);
  const [paymentError, setPaymentError] = React.useState(null);

  if (!isOpen || !booking) return null;

  const status = (booking.status || 'PENDING').toUpperCase();
  const statusColor =
    status === 'CONFIRMED'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : status === 'CANCELLED'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : status === 'COMPLETED'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';

  const title = booking.listingSnapshot?.title || 
    booking.partnerListing?.title || 
    booking.stay?.name || 
    booking.rental?.name || 
    booking.vehicle?.name || 
    booking.guide?.name || 
    'Himalayan Reservation';

  const location = booking.listingSnapshot?.location || 
    booking.partnerListing?.city || 
    booking.stay?.location || 
    booking.district || 
    'Uttarakhand';

  const checkIn = booking.reservation?.checkIn || booking.startDate;
  const checkOut = booking.reservation?.checkOut || booking.endDate;

  const handlePayment = async () => {
    if (loadingPayment) return;
    setLoadingPayment(true);
    setPaymentError(null);

    try {
      // 1. Create order on server
      const orderRes = await createOrder(booking._id);
      if (!orderRes.success) throw new Error(orderRes.message || 'Failed to create order');
      
      const { razorpayOrderId, amount, currency } = orderRes.data;

      // 2. Configure Razorpay Options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // fallback for UI without env
        amount: amount, 
        currency: currency,
        name: 'Discovery Uttarakhand',
        description: `Booking Ref: ${booking.bookingReference}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            setLoadingPayment(true);
            const verifyRes = await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            if (verifyRes.success) {
              if (onPaymentSuccess) {
                onPaymentSuccess(booking._id);
              }
              onClose();
            } else {
              setPaymentError('Payment verification failed.');
            }
          } catch (err) {
            setPaymentError(err.response?.data?.message || err.message || 'Verification error');
          } finally {
            setLoadingPayment(false);
          }
        },
        prefill: {
          name: booking.traveler?.name || '',
          email: booking.traveler?.email || '',
          contact: booking.traveler?.phone || ''
        },
        theme: {
          color: '#2d5a27'
        }
      };

      // 3. Open Razorpay widget
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setPaymentError(response.error.description || 'Payment failed');
        setLoadingPayment(false);
      });
      rzp.open();
    } catch (err) {
      setPaymentError(err.response?.data?.message || err.message || 'Error initializing payment');
      setLoadingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-border-light flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light/70 flex items-center justify-between bg-beige/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-forest-green/10 flex items-center justify-center text-forest-green">
              <Building size={16} />
            </div>
            <div>
              <h3 className="font-bold text-text-dark text-sm sm:text-base font-display">
                Reservation Details
              </h3>
              <p className="text-[11px] font-mono text-muted-text">
                Ref: {booking.bookingReference || booking._id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-beige flex items-center justify-center text-muted-text hover:text-text-dark transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Main Title & Status */}
          <div className="flex items-start justify-between gap-3 p-4 bg-[#faf9f6] rounded-2xl border border-border-light">
            <div>
              <h4 className="font-bold text-sm text-text-dark font-display leading-tight">
                {title}
              </h4>
              <p className="text-[11px] text-muted-text flex items-center gap-1 mt-1">
                <MapPin size={12} className="text-forest-green flex-shrink-0" />
                <span>{location}</span>
                {booking.listingSnapshot?.district && (
                  <span>({booking.listingSnapshot.district})</span>
                )}
              </p>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${statusColor}`}>
              {status}
            </span>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-border-light">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-forest-green" /> Check-In
              </span>
              <span className="font-semibold text-text-dark block">
                {checkIn ? new Date(checkIn).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A'}
              </span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-border-light">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1 flex items-center gap-1">
                <Calendar size={12} className="text-forest-green" /> Check-Out
              </span>
              <span className="font-semibold text-text-dark block">
                {checkOut ? new Date(checkOut).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'N/A'}
              </span>
            </div>
          </div>

          {/* Traveler Details */}
          <div className="p-3.5 bg-white rounded-xl border border-border-light space-y-1.5">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1 flex items-center gap-1">
              <User size={12} className="text-forest-green" /> Traveler Information
            </span>
            <div className="grid grid-cols-2 gap-2 text-text-dark">
              <div>
                <span className="text-muted-text text-[10px] block">Name:</span>
                <span className="font-medium">{booking.traveler?.name || 'Traveler'}</span>
              </div>
              <div>
                <span className="text-muted-text text-[10px] block">Guests:</span>
                <span className="font-medium">{booking.guests || booking.traveler?.guests || 1} Person(s)</span>
              </div>
              {booking.traveler?.phone && (
                <div>
                  <span className="text-muted-text text-[10px] block">Phone:</span>
                  <span className="font-medium">{booking.traveler.phone}</span>
                </div>
              )}
              {booking.traveler?.email && (
                <div>
                  <span className="text-muted-text text-[10px] block">Email:</span>
                  <span className="font-medium truncate block">{booking.traveler.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequest && (
            <div className="p-3 bg-beige/30 rounded-xl border border-border-light">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-1 flex items-center gap-1">
                <FileText size={12} className="text-forest-green" /> Special Requests
              </span>
              <p className="text-text-dark italic">{booking.specialRequest}</p>
            </div>
          )}

          {/* Pricing Snapshot */}
          <div className="p-4 bg-white rounded-2xl border border-border-light space-y-2">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block">
              Pricing Snapshot (Locked at Reservation)
            </span>
            <div className="flex justify-between text-muted-text">
              <span>Rate per {booking.pricingSnapshot?.unit || 'unit'}:</span>
              <span className="font-semibold text-text-dark">
                ₹{(booking.pricingSnapshot?.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>
            {booking.pricingSnapshot?.quantity && booking.pricingSnapshot.quantity > 1 && (
              <div className="flex justify-between text-muted-text">
                <span>Quantity / Units:</span>
                <span className="font-semibold text-text-dark">{booking.pricingSnapshot.quantity}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-text">
              <span>Provenance:</span>
              <span className="font-bold text-forest-green bg-forest-green/10 px-2 py-0.5 rounded-full text-[10px]">
                {booking.pricingSnapshot?.provenance || 'VERIFIED'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border-light font-bold text-sm">
              <span className="text-text-dark">Total Amount:</span>
              <span className="text-forest-green font-black font-display text-base">
                ₹{(booking.amount || booking.pricingSnapshot?.total || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Cancellation Info if cancelled */}
          {status === 'CANCELLED' && booking.cancellation?.cancelledAt && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle size={13} /> Cancelled on {new Date(booking.cancellation.cancelledAt).toLocaleDateString('en-IN')}
              </span>
              {booking.cancellation.reason && (
                <p className="text-[11px] text-rose-700">
                  Reason: {booking.cancellation.reason}
                </p>
              )}
            </div>
          )}

          {paymentError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-1.5">
              <AlertCircle size={14} />
              <span>{paymentError}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              onClick={onClose}
              disabled={loadingPayment}
              className={`flex-1 py-2.5 ${status === 'PENDING' ? 'bg-beige text-text-dark' : 'bg-forest-green text-white hover:bg-dark-green'} font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50`}
            >
              Close
            </button>
            {status === 'PENDING' && (
              <button
                onClick={handlePayment}
                disabled={loadingPayment}
                className="flex-1 py-2.5 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingPayment ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CreditCard size={16} />
                )}
                <span>Proceed to Payment</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
