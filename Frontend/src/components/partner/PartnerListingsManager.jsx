import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  Send, 
  Edit3, 
  RotateCcw,
  Sparkles,
  MapPin,
  Tag
} from 'lucide-react';
import { 
  getMyPartnerProfile, 
  registerPartner, 
  getMyListings, 
  createListingDraft, 
  submitListingForVerification, 
  reopenRejectedListing 
} from '../../api/partnerApi';

export default function PartnerListingsManager() {
  const [partner, setPartner] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Registration form
  const [partnerForm, setPartnerForm] = useState({
    businessName: '',
    partnerType: 'Homestay',
    phone: '',
    email: '',
    district: 'Nainital',
    credentialType: '',
    credentialReference: ''
  });

  // Listing form
  const [listingForm, setListingForm] = useState({
    listingType: 'Stay',
    title: '',
    district: 'Nainital',
    city: '',
    description: '',
    pricingAmount: '',
    pricingUnit: 'night'
  });

  const [message, setMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadPartnerData = async () => {
    setLoading(true);
    try {
      const pRes = await getMyPartnerProfile();
      if (pRes.success) {
        setPartner(pRes.data);
        const lRes = await getMyListings();
        if (lRes.success) {
          setListings(lRes.data || []);
        }
      } else {
        setPartner(null);
      }
    } catch (err) {
      setPartner(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartnerData();
  }, []);

  const handleApplyPartner = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await registerPartner(partnerForm);
      if (res.success) {
        setShowApplyModal(false);
        setMessage({ type: 'success', text: 'Partner profile registered successfully!' });
        loadPartnerData();
      } else {
        alert(res.message || 'Registration failed');
      }
    } catch (err) {
      alert('Error registering partner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        listingType: listingForm.listingType,
        title: listingForm.title,
        district: listingForm.district,
        city: listingForm.city,
        description: listingForm.description,
        pricing: {
          amount: Number(listingForm.pricingAmount),
          unit: listingForm.pricingUnit
        }
      };

      const res = await createListingDraft(payload);
      if (res.success) {
        setShowCreateModal(false);
        setMessage({ type: 'success', text: 'Listing draft created in DRAFT status.' });
        loadPartnerData();
      } else {
        alert(res.message || 'Failed to create listing');
      }
    } catch (err) {
      alert('Error creating listing draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVerification = async (id) => {
    if (!window.confirm('Submit this listing for admin verification review?')) return;
    try {
      const res = await submitListingForVerification(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Listing submitted for verification (Status: PENDING_VERIFICATION).' });
        loadPartnerData();
      } else {
        alert(res.message || 'Submission failed');
      }
    } catch (err) {
      alert('Error submitting listing');
    }
  };

  const handleReopen = async (id) => {
    try {
      const res = await reopenRejectedListing(id);
      if (res.success) {
        setMessage({ type: 'success', text: 'Listing reopened to DRAFT. You can now edit and resubmit.' });
        loadPartnerData();
      } else {
        alert(res.message || 'Failed to reopen');
      }
    } catch (err) {
      alert('Error reopening listing');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-muted-text">Loading partner portal...</div>;
  }

  // Not a partner yet: Show Partner Onboarding CTA
  if (!partner) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-border-light text-center max-w-xl mx-auto my-6">
        <div className="w-12 h-12 rounded-2xl bg-forest-green/10 text-forest-green flex items-center justify-center mx-auto mb-3">
          <Building size={24} />
        </div>
        <h3 className="font-display font-black text-xl text-text-dark mb-2">
          Become a Discovery Uttarakhand Partner
        </h3>
        <p className="text-xs text-muted-text leading-relaxed mb-6">
          List your authentic Kumaoni or Garhwali homestay, licensed mountain guide services, or registered taxi rental with transparent administrative verification.
        </p>
        <button
          onClick={() => setShowApplyModal(true)}
          className="btn-primary text-xs py-2.5 px-6 rounded-xl inline-flex items-center gap-2"
        >
          <Sparkles size={14} /> Register as Partner
        </button>

        {/* Onboarding Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 text-left shadow-xl border border-border-light">
              <h3 className="font-black text-lg text-text-dark mb-3">Partner Registration</h3>
              <form onSubmit={handleApplyPartner} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-muted-text mb-1">Business / Host Name</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.businessName}
                    onChange={(e) => setPartnerForm({ ...partnerForm, businessName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                    placeholder="e.g. Nanda Devi Eco Homestay"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">Partner Type</label>
                  <select
                    value={partnerForm.partnerType}
                    onChange={(e) => setPartnerForm({ ...partnerForm, partnerType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                  >
                    <option value="Homestay">Homestay Host</option>
                    <option value="Hotel">Hotel / Lodge</option>
                    <option value="Guide">Certified Mountain Guide</option>
                    <option value="TrekOperator">Trek Operator</option>
                    <option value="VehicleRental">Vehicle Rental / Cab</option>
                    <option value="ActivityProvider">Activity Provider</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-muted-text mb-1">Phone</label>
                    <input
                      type="text"
                      required
                      value={partnerForm.phone}
                      onChange={(e) => setPartnerForm({ ...partnerForm, phone: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-muted-text mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm({ ...partnerForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                      placeholder="host@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">Operating District</label>
                  <input
                    type="text"
                    required
                    value={partnerForm.district}
                    onChange={(e) => setPartnerForm({ ...partnerForm, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                    placeholder="e.g. Chamoli, Pithoragarh, Nainital"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-4 py-2 text-xs font-bold text-muted-text"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary text-xs py-2 px-5 rounded-xl"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Registered Partner Dashboard
  return (
    <div className="space-y-6">
      {/* Partner Business Banner */}
      <div className="bg-white rounded-3xl p-6 border border-border-light shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-forest-green/10 px-2.5 py-0.5 rounded-full">
              {partner.partnerType} Partner
            </span>
          </div>
          <h2 className="text-xl font-black text-text-dark font-display">
            {partner.businessName}
          </h2>
          <p className="text-xs text-muted-text flex items-center gap-1.5 mt-0.5">
            <MapPin size={12} /> {partner.district} District • {partner.phone} • {partner.email}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-2xs self-start md:self-auto"
        >
          <Plus size={14} /> New Listing Draft
        </button>
      </div>

      {message && (
        <div className="p-3 rounded-xl text-xs font-bold bg-green-50 text-forest-green border border-green-200">
          ✓ {message.text}
        </div>
      )}

      {/* Listings List */}
      <div>
        <h3 className="font-bold text-sm text-text-dark uppercase tracking-wider mb-3">
          My Marketplace Listings ({listings.length})
        </h3>

        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-border-light text-center">
            <p className="text-xs text-muted-text">No listings created yet. Click "New Listing Draft" above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listings.map((l) => {
              const statusColors = {
                DRAFT: 'bg-gray-100 text-gray-800',
                PENDING_VERIFICATION: 'bg-amber-100 text-amber-800',
                VERIFIED: 'bg-blue-100 text-blue-800',
                ACTIVE: 'bg-green-100 text-forest-green',
                REJECTED: 'bg-red-100 text-red-800'
              };

              return (
                <div key={l._id} className="bg-white rounded-2xl p-4 border border-border-light shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${statusColors[l.status] || 'bg-gray-100'}`}>
                        {l.status}
                      </span>
                      <span className="text-[10px] text-muted-text font-semibold">
                        {l.listingType}
                      </span>
                    </div>
                    <h4 className="font-bold text-text-dark text-sm">{l.title}</h4>
                    <p className="text-xs text-muted-text mt-1 flex items-center gap-1">
                      <MapPin size={11} /> {l.district}
                    </p>
                    <div className="mt-2 text-xs font-mono font-bold text-forest-green">
                      ₹{l.pricing?.amount} / {l.pricing?.unit}
                      <span className="text-[9px] font-normal text-muted-text block">
                        Provenance: {l.pricing?.provenance}
                      </span>
                    </div>

                    {/* Rejection Feedback if any */}
                    {l.status === 'REJECTED' && l.verificationNotes && (
                      <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
                        <strong>Admin Feedback:</strong> "{l.verificationNotes}"
                      </div>
                    )}
                  </div>

                  {/* State Action Buttons */}
                  <div className="pt-3 border-t border-border-light flex items-center justify-end gap-2 mt-4 text-xs">
                    {l.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSubmitVerification(l._id)}
                        className="px-3 py-1.5 font-bold text-white bg-forest-green hover:bg-forest-green/90 rounded-lg flex items-center gap-1.5 shadow-2xs"
                      >
                        <Send size={12} /> Submit for Verification
                      </button>
                    )}

                    {l.status === 'REJECTED' && (
                      <button
                        onClick={() => handleReopen(l._id)}
                        className="px-3 py-1.5 font-bold text-text-dark bg-beige hover:bg-beige/80 rounded-lg flex items-center gap-1.5"
                      >
                        <RotateCcw size={12} /> Reopen to DRAFT
                      </button>
                    )}

                    {l.status === 'ACTIVE' && (
                      <span className="text-[11px] font-bold text-forest-green flex items-center gap-1">
                        <CheckCircle size={12} /> Published on Marketplace
                      </span>
                    )}

                    {l.status === 'PENDING_VERIFICATION' && (
                      <span className="text-[11px] text-amber-700 flex items-center gap-1">
                        <Clock size={12} /> Awaiting Admin Audit
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Listing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-border-light">
            <h3 className="font-black text-lg text-text-dark mb-3">Create Listing Draft</h3>
            <form onSubmit={handleCreateListing} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-muted-text mb-1">Listing Type</label>
                <select
                  value={listingForm.listingType}
                  onChange={(e) => setListingForm({ ...listingForm, listingType: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                >
                  <option value="Stay">Stay / Homestay</option>
                  <option value="Guide">Local Guide Service</option>
                  <option value="Rental">Vehicle Rental</option>
                  <option value="Activity">Activity / Trek</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-muted-text mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={listingForm.title}
                  onChange={(e) => setListingForm({ ...listingForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                  placeholder="e.g. Traditional Himalayan Cedar Wood Cottage"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-muted-text mb-1">Tariff (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={listingForm.pricingAmount}
                    onChange={(e) => setListingForm({ ...listingForm, pricingAmount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                    placeholder="2500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-muted-text mb-1">Pricing Unit</label>
                  <select
                    value={listingForm.pricingUnit}
                    onChange={(e) => setListingForm({ ...listingForm, pricingUnit: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                  >
                    <option value="night">Per Night</option>
                    <option value="day">Per Day</option>
                    <option value="person">Per Person</option>
                    <option value="trip">Per Trip</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-muted-text mb-1">District</label>
                <input
                  type="text"
                  required
                  value={listingForm.district}
                  onChange={(e) => setListingForm({ ...listingForm, district: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                  placeholder="e.g. Nainital"
                />
              </div>
              <div>
                <label className="block font-bold text-muted-text mb-1">Description</label>
                <textarea
                  rows={3}
                  value={listingForm.description}
                  onChange={(e) => setListingForm({ ...listingForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-border-light bg-[#faf9f6]"
                  placeholder="Describe your authentic experience and facilities..."
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-muted-text"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs py-2 px-5 rounded-xl"
                >
                  Save Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
