import React, { useState } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  Send, 
  Save, 
  Loader2, 
  Check, 
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

const ProfileTab = ({ 
  partnerProfile, 
  onUpdateProfile, 
  onSubmitVerification, 
  isUpdating 
}) => {
  const [form, setForm] = useState({
    businessName: partnerProfile?.businessName || '',
    businessType: partnerProfile?.businessType || 'Bike & Fleet Rentals',
    phone: partnerProfile?.phone || '',
    city: partnerProfile?.city || '',
    address: partnerProfile?.address || '',
    gstNumber: partnerProfile?.gstNumber || '',
    operatingHours: partnerProfile?.operatingHours || '07:00 AM - 09:00 PM',
    pickupInformation: partnerProfile?.pickupInformation || '',
    description: partnerProfile?.description || '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    await onUpdateProfile(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
      case 'ACTIVE':
        return (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-sm">Verified Discovery Uttarakhand Business Partner</span>
              <p className="mt-0.5 text-emerald-800">
                Your business credentials have been audited and approved by the platform administration. Your verified listings are visible to tourists across Uttarakhand.
              </p>
            </div>
          </div>
        );
      case 'PENDING_VERIFICATION':
        return (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-sm">Verification Under Review</span>
              <p className="mt-0.5 text-amber-800">
                Your business details are currently undergoing verification review by the platform team. You will be notified once complete.
              </p>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-sm">Verification Application Rejected</span>
              <p className="mt-0.5 text-rose-800">
                {partnerProfile?.rejectionReason || 'Please review your business registration and license details and resubmit for verification.'}
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Building2 size={20} className="text-gray-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-sm">Account Status: Draft</span>
                <p className="mt-0.5 text-gray-600">
                  Submit your business profile and government license for official platform verification to activate live bookings.
                </p>
              </div>
            </div>
            {onSubmitVerification && (
              <button
                type="button"
                onClick={onSubmitVerification}
                className="px-4 py-2 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs font-semibold shrink-0 shadow-xs flex items-center gap-1.5"
              >
                <Send size={13} />
                Submit Verification
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Verification Status Banner */}
      {getStatusBadge(partnerProfile?.verificationStatus)}

      {/* Business Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Business Profile & Credentials</h3>
            <p className="text-xs text-gray-500 mt-0.5">Official information displayed to tourists on booking confirmations and invoices</p>
          </div>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1">
              <Check size={14} /> Profile Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Business Name *</label>
            <input
              type="text"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Business Operating Type</label>
            <input
              type="text"
              value={form.businessType}
              onChange={(e) => setForm({ ...form, businessType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              placeholder="e.g. Motorcycle Rentals & Mountain Fleets"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Contact Phone / WhatsApp *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              placeholder="+91 98765 43210"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Primary Operating City / District *</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold"
              placeholder="e.g. Rishikesh"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700 mb-1">Physical Hub / Garage Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              placeholder="e.g. Shop 4, Tapovan Main Badrinath Road, Rishikesh, Uttarakhand 249192"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Trade License / GSTIN</label>
            <input
              type="text"
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-mono"
              placeholder="05AAAAA0000A1Z5"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Operating Hours</label>
            <input
              type="text"
              value={form.operatingHours}
              onChange={(e) => setForm({ ...form, operatingHours: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              placeholder="07:00 AM - 09:00 PM"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700 mb-1">Tourist Pickup Instructions & Documents Required</label>
            <textarea
              rows={2}
              value={form.pickupInformation}
              onChange={(e) => setForm({ ...form, pickupInformation: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              placeholder="e.g. Original Driving License + Aadhaar required for security. Helmet provided free. Vehicle inspection done together."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-gray-700 mb-1">About Your Business</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm"
              placeholder="Share your story, years of experience in Uttarakhand mountain terrain, Fleet quality..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white font-semibold text-xs md:text-sm shadow-md shadow-forest-green/20 transition-all disabled:opacity-50"
          >
            {isUpdating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileTab;
