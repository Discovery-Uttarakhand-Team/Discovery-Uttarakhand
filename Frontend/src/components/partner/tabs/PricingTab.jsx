import React, { useState } from 'react';
import { 
  Tag, 
  ShieldAlert, 
  Edit3, 
  Save, 
  Loader2, 
  Check, 
  AlertCircle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

const PricingTab = ({ 
  listings = [], 
  onUpdatePricing, 
  isUpdating 
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    pricePerDay: 0,
    pricePerHour: 0,
    pricePerWeek: 0,
    securityDeposit: 0,
    extraCharges: '',
    cancellationPolicy: ''
  });
  const [successId, setSuccessId] = useState(null);

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      pricePerDay: item.pricingDetails?.pricePerDay || item.pricing?.amount || item.pricing?.price || 0,
      pricePerHour: item.pricingDetails?.pricePerHour || 0,
      pricePerWeek: item.pricingDetails?.pricePerWeek || 0,
      securityDeposit: item.pricingDetails?.securityDeposit || 0,
      extraCharges: item.pricingDetails?.extraCharges || '',
      cancellationPolicy: item.pricingDetails?.cancellationPolicy || 'Flexible (Full refund up to 24h before)'
    });
  };

  const handleSave = async (id) => {
    const payload = {
      amount: Number(editForm.pricePerDay),
      pricePerDay: Number(editForm.pricePerDay),
      pricePerHour: Number(editForm.pricePerHour) || 0,
      pricePerWeek: Number(editForm.pricePerWeek) || 0,
      securityDeposit: Number(editForm.securityDeposit) || 0,
      extraCharges: editForm.extraCharges.trim(),
      cancellationPolicy: editForm.cancellationPolicy
    };
    await onUpdatePricing(id, payload);
    setEditingId(null);
    setSuccessId(id);
    setTimeout(() => setSuccessId(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Policy Notice Box */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <ShieldAlert size={20} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800">
          <p className="font-bold">Transparent Marketplace Pricing Policy</p>
          <p className="mt-0.5">
            Partners have full autonomy to adjust seasonal tariffs, hourly rates, and security deposits. In accordance with platform governance, all partner price revisions are immediately saved with provenance <strong>PARTNER_CLAIMED</strong> until re-verified by platform admin.
          </p>
        </div>
      </div>

      {/* Pricing Matrix Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Fleet & Listing Pricing Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">Manage daily rentals, deposits, and cancellation terms</p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {listings.length} Listings
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs">
            No listings created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Listing</th>
                  <th className="px-5 py-3.5">Rate / Day</th>
                  <th className="px-5 py-3.5">Rate / Hour</th>
                  <th className="px-5 py-3.5">Security Deposit</th>
                  <th className="px-5 py-3.5">Provenance</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((item) => {
                  const isEditing = editingId === item._id;
                  const priceDay = item.pricingDetails?.pricePerDay || item.pricing?.price || 0;
                  const priceHour = item.pricingDetails?.pricePerHour || 0;
                  const deposit = item.pricingDetails?.securityDeposit || 0;
                  const provenance = item.pricing?.provenance || 'PARTNER_CLAIMED';

                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Listing Info */}
                      <td className="px-5 py-4">
                        <div className="font-bold text-gray-900 text-xs md:text-sm">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-gray-400 capitalize">
                          {item.category} • {item.city || 'Uttarakhand'}
                        </div>
                        {successId === item._id && (
                          <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <Check size={12} /> Pricing updated (PARTNER_CLAIMED)
                          </div>
                        )}
                      </td>

                      {/* Daily Rate */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 font-semibold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={editForm.pricePerDay}
                              onChange={(e) => setEditForm({ ...editForm, pricePerDay: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 text-xs font-bold"
                            />
                          </div>
                        ) : (
                          <div className="font-extrabold text-gray-900 text-sm">
                            ₹{priceDay.toLocaleString('en-IN')}
                            <span className="text-[10px] text-gray-400 font-normal"> /day</span>
                          </div>
                        )}
                      </td>

                      {/* Hourly Rate */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 font-semibold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={editForm.pricePerHour}
                              onChange={(e) => setEditForm({ ...editForm, pricePerHour: e.target.value })}
                              className="w-20 px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            {priceHour > 0 ? `₹${priceHour}/hr` : <span className="text-gray-400">N/A</span>}
                          </div>
                        )}
                      </td>

                      {/* Security Deposit */}
                      <td className="px-5 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 font-semibold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={editForm.securityDeposit}
                              onChange={(e) => setEditForm({ ...editForm, securityDeposit: e.target.value })}
                              className="w-24 px-2 py-1.5 rounded-lg border border-gray-300 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="text-gray-700">
                            {deposit > 0 ? `₹${deposit.toLocaleString('en-IN')}` : <span className="text-gray-400">₹0</span>}
                          </div>
                        )}
                      </td>

                      {/* Provenance */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          provenance === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {provenance}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSave(item._id)}
                              disabled={isUpdating}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-forest-green hover:bg-forest-green/90 text-white font-semibold text-xs shadow-xs"
                            >
                              <Save size={12} />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold"
                          >
                            <Edit3 size={12} />
                            Adjust
                          </button>
                        )}
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

export default PricingTab;
