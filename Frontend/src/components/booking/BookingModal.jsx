import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Users, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Building 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { createBooking } from '../../api/bookingApi';

export default function BookingModal({
  isOpen,
  onClose,
  item,
  defaultStartDate = '',
  defaultEndDate = '',
  tripId = null,
  onSuccess
}) {
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    startDate: defaultStartDate,
    endDate: defaultEndDate,
    guests: 1,
    name: '',
    email: '',
    phone: '',
    specialRequest: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  // Sync initial user details and dates when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        startDate: defaultStartDate || new Date().toISOString().slice(0, 10),
        endDate: defaultEndDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        guests: 1,
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        specialRequest: ''
      });
      setErrorMsg('');
      setSuccessBooking(null);
    }
  }, [isOpen, defaultStartDate, defaultEndDate, currentUser]);

  // Pricing calculation
  const calculation = useMemo(() => {
    if (!item) return { nights: 1, rate: 0, subtotal: 0, total: 0, unit: 'night', currency: 'INR' };

    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    let diffDays = 1;
    if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
      diffDays = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const rate = item.pricing?.amount || item.price?.amount || 0;
    const unit = item.pricing?.unit || 'night';
    const currency = item.pricing?.currency || item.price?.currency || 'INR';

    let subtotal = 0;
    if (unit === 'night' || unit === 'day') {
      subtotal = rate * diffDays;
    } else if (unit === 'person') {
      subtotal = rate * Number(formData.guests || 1);
    } else {
      subtotal = rate;
    }

    return {
      nights: diffDays,
      rate,
      subtotal,
      total: subtotal,
      unit,
      currency
    };
  }, [item, formData.startDate, formData.endDate, formData.guests]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMsg('');

    // Validation
    const s = new Date(formData.startDate);
    const eDate = new Date(formData.endDate);

    if (isNaN(s.getTime()) || isNaN(eDate.getTime())) {
      setErrorMsg('Please select valid check-in and check-out dates.');
      return;
    }

    if (eDate <= s) {
      setErrorMsg('Check-out date must be after check-in date.');
      return;
    }

    const maxGuests = item.capacity?.maxGuests;
    if (maxGuests && Number(formData.guests) > maxGuests) {
      setErrorMsg(`Guest count exceeds the maximum capacity of ${maxGuests}.`);
      return;
    }

    try {
      setSubmitting(true);

      const isPartnerListing = item.listingType || item.pricing?.provenance;
      const bookingPayload = {
        type: isPartnerListing ? 'partner_listing' : 'stay',
        bookingType: isPartnerListing ? 'partner_listing' : 'stay',
        partnerListing: isPartnerListing ? (item._id || item.id) : undefined,
        stay: !isPartnerListing ? (item._id || item.id) : undefined,
        item: item._id || item.id,
        trip: tripId || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        checkIn: formData.startDate,
        checkOut: formData.endDate,
        guests: Number(formData.guests) || 1,
        traveler: {
          name: formData.name || currentUser?.name || 'Traveler',
          email: formData.email || currentUser?.email || '',
          phone: formData.phone || '',
          guests: Number(formData.guests) || 1
        },
        specialRequest: formData.specialRequest || undefined
      };

      const res = await createBooking(bookingPayload);
      if (res?.success && res?.data) {
        setSuccessBooking(res.data);
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        setErrorMsg(res?.message || 'Failed to create reservation.');
      }
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Error creating reservation.';
      setErrorMsg(serverMsg);
    } finally {
      setSubmitting(false);
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
                {successBooking ? 'Reservation Confirmed' : 'Request Reservation'}
              </h3>
              <p className="text-[11px] text-muted-text">
                {item.title || item.name} • {item.district || (typeof item.location === 'string' ? item.location : item.city || 'Uttarakhand')}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {successBooking ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={36} />
              </div>
              <div>
                <h4 className="text-lg font-black text-text-dark font-display">
                  Reservation Created!
                </h4>
                <p className="text-xs text-muted-text mt-1">
                  Your reservation reference is:
                </p>
                <div className="inline-block mt-2 px-4 py-1.5 bg-forest-green/10 text-forest-green font-mono font-black text-sm rounded-xl border border-forest-green/20">
                  {successBooking.bookingReference || successBooking._id}
                </div>
              </div>

              <div className="bg-[#faf9f6] rounded-2xl p-4 border border-border-light text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-text">Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full uppercase text-[10px]">
                    {successBooking.status || 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">Dates:</span>
                  <span className="font-semibold text-text-dark">
                    {new Date(successBooking.startDate).toLocaleDateString()} — {new Date(successBooking.endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">Guests:</span>
                  <span className="font-semibold text-text-dark">
                    {successBooking.guests} {successBooking.guests === 1 ? 'Guest' : 'Guests'}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border-light font-bold">
                  <span className="text-text-dark">Total Reservation:</span>
                  <span className="text-forest-green font-black text-sm font-display">
                    ₹{successBooking.amount?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-text italic">
                You can manage and view this reservation anytime under your Profile → My Bookings.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                >
                  Close & View Trip
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Error Callout */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-text-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar size={13} className="text-forest-green" /> Check-in Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-text-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar size={13} className="text-forest-green" /> Check-out Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green bg-white font-medium"
                  />
                </div>
              </div>

              {/* Guests Count */}
              <div>
                <label className="text-[11px] font-bold text-text-dark uppercase tracking-wider flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1.5">
                    <Users size={13} className="text-forest-green" /> Number of Guests
                  </span>
                  {item.capacity?.maxGuests && (
                    <span className="text-[10px] text-muted-text font-normal">
                      (Max {item.capacity.maxGuests} guests)
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  max={item.capacity?.maxGuests || 50}
                  required
                  value={formData.guests}
                  onChange={(e) => setFormData(prev => ({ ...prev, guests: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:ring-2 focus:ring-forest-green/20 focus:border-forest-green bg-white font-medium"
                />
              </div>

              {/* Traveler Contact Fields */}
              <div className="space-y-2.5 pt-2 border-t border-border-light/60">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-text block">
                  Traveler Contact Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-medium text-text-dark mb-1 block">Full Name</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-2.5 text-muted-text" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-text-dark mb-1 block">Phone Number</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-2.5 text-muted-text" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                        placeholder="+91 9876543210"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium text-text-dark mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-2.5 text-muted-text" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:border-forest-green"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="text-[11px] font-bold text-text-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <FileText size={13} className="text-forest-green" /> Special Requests (Optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.specialRequest}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequest: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border-light focus:outline-none focus:border-forest-green resize-none"
                  placeholder="e.g. Ground floor room, late check-in..."
                />
              </div>

              {/* Price Calculation Card */}
              <div className="bg-beige/40 rounded-2xl p-4 border border-border-light space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-muted-text">
                  <span>Tariff:</span>
                  <span className="font-semibold text-text-dark">
                    ₹{calculation.rate.toLocaleString('en-IN')} / {calculation.unit}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-text">
                  <span>Duration:</span>
                  <span>{calculation.nights} {calculation.nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border-light/80 text-sm font-bold">
                  <span className="text-text-dark">Calculated Total:</span>
                  <span className="text-forest-green font-black font-display text-base">
                    ₹{calculation.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Non-payment Notice */}
              <div className="p-3 bg-forest-green/5 border border-forest-green/20 rounded-xl text-[11px] text-forest-green flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Final reservation is created by the Discovery Uttarakhand booking system. Direct payment processing is not included in this phase.
                </span>
              </div>

              {/* Confirm Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-forest-green hover:bg-dark-green text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating Reservation...
                    </>
                  ) : (
                    'Confirm Reservation'
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
