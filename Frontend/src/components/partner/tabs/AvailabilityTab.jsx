import React, { useState } from 'react';
import { 
  Clock, 
  CheckCircle2, 
  Wrench, 
  AlertOctagon, 
  Calendar, 
  Plus, 
  Trash2, 
  Loader2, 
  Save,
  Check
} from 'lucide-react';

const statusOptions = [
  { id: 'Available', label: 'Available for Tourists', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { id: 'Rented', label: 'Currently Rented / In-Use', icon: Clock, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'Maintenance', label: 'Servicing & Repairs'
    , icon: Wrench, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  { id: 'Blocked', label: 'Temporarily Blocked', icon: AlertOctagon, color: 'text-rose-700 bg-rose-50 border-rose-200' }
];

const AvailabilityTab = ({ 
  listings = [], 
  onUpdateAvailability, 
  isUpdating 
}) => {
  const [selectedListingId, setSelectedListingId] = useState(listings[0]?._id || null);
  const selectedListing = listings.find((l) => l._id === selectedListingId) || listings[0];

  // Local state for editing the selected listing's availability
  const [totalUnits, setTotalUnits] = useState(selectedListing?.availabilityDetails?.totalUnits || 1);
  const [availableUnits, setAvailableUnits] = useState(selectedListing?.availabilityDetails?.availableUnits || 1);
  const [statusReason, setStatusReason] = useState(selectedListing?.availabilityDetails?.statusReason || 'Available');
  const [blockedDates, setBlockedDates] = useState(selectedListing?.availabilityDetails?.blockedDates || []);

  // New blocked date input form
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newReason, setNewReason] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // When selected listing changes, sync local form
  const handleSelectListing = (l) => {
    setSelectedListingId(l._id);
    setTotalUnits(l.availabilityDetails?.totalUnits ?? 1);
    setAvailableUnits(l.availabilityDetails?.availableUnits ?? 1);
    setStatusReason(l.availabilityDetails?.statusReason || 'Available');
    setBlockedDates(l.availabilityDetails?.blockedDates || []);
    setSaveSuccess(false);
  };

  const handleAddBlockedDate = () => {
    if (!newStartDate || !newEndDate) return;
    const item = {
      startDate: newStartDate,
      endDate: newEndDate,
      reason: newReason.trim() || 'Partner Block'
    };
    setBlockedDates([...blockedDates, item]);
    setNewStartDate('');
    setNewEndDate('');
    setNewReason('');
  };

  const handleRemoveBlockedDate = (idx) => {
    setBlockedDates(blockedDates.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!selectedListing?._id) return;
    const payload = {
      totalUnits: Number(totalUnits),
      availableUnits: Number(availableUnits),
      statusReason,
      blockedDates
    };
    await onUpdateAvailability(selectedListing._id, payload);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Clock size={24} />
        </div>
        <h3 className="text-base font-bold text-gray-900">No Listings Available</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          Create a listing first to configure fleet unit counts, operational statuses, and blocked dates.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Listings Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 h-fit">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Select Fleet / Unit
        </h3>
        <div className="space-y-2">
          {listings.map((item) => {
            const isSelected = item._id === selectedListing?._id;
            return (
              <button
                key={item._id}
                onClick={() => handleSelectListing(item)}
                className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-forest-green bg-forest-green/5 ring-1 ring-forest-green'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 truncate capitalize">
                    {item.category} • {item.city || 'Uttarakhand'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-emerald-800">
                    {item.availabilityDetails?.availableUnits ?? 1} / {item.availabilityDetails?.totalUnits ?? 1}
                  </span>
                  <div className="text-[10px] text-gray-400 capitalize">
                    {item.availabilityDetails?.statusReason || 'Available'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Availability & Blocked Dates Editor */}
      <div className="lg:col-span-2 space-y-6">
        {/* Selected Listing Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-forest-green">
                Managing Availability For:
              </span>
              <h2 className="text-lg font-bold text-gray-900 mt-0.5">
                {selectedListing?.title}
              </h2>
            </div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <Check size={14} /> Availability Updated
              </span>
            )}
          </div>

          {/* Unit Counts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Total Units in Fleet
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-gray-900 bg-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Total identical vehicles or rooms owned for this listing.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Currently Available for Rent
              </label>
              <input
                type="number"
                min="0"
                max={totalUnits}
                value={availableUnits}
                onChange={(e) => setAvailableUnits(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-bold text-emerald-800 bg-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Units ready for tourists right now.
              </p>
            </div>
          </div>

          {/* Operational Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">
              Current Fleet Status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = statusReason === opt.id;
                return (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setStatusReason(opt.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-forest-green/20`
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-bold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blocked Dates Section */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-forest-green">
                Blocked Dates & Maintenance Periods
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Block specific calendar dates when this vehicle/stay cannot be booked by tourists.
              </p>
            </div>

            {/* Add Blocked Date Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-gray-50 border border-gray-200">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">From</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">To</label>
                <input
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-0.5">Reason</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    placeholder="e.g. Festival / Overhaul"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddBlockedDate}
                    className="px-3 py-1.5 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white text-xs font-semibold shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Blocked Dates Table */}
            {blockedDates.length > 0 && (
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden text-xs">
                {blockedDates.map((b, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="font-semibold text-gray-800">
                        {new Date(b.startDate).toLocaleDateString('en-IN')} - {new Date(b.endDate).toLocaleDateString('en-IN')}
                      </span>
                      <span className="text-gray-500 text-[11px]">({b.reason || 'Blocked'})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(idx)}
                      className="text-gray-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green/90 text-white text-xs md:text-sm font-semibold shadow-md shadow-forest-green/20 transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Availability & Unit Rules</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityTab;
