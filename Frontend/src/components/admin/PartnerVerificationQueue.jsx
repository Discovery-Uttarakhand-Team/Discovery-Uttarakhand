import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MapPin, 
  Eye, 
  RefreshCw,
  FileText,
  Building,
  User,
  History
} from 'lucide-react';
import { 
  getPendingListingsAdmin, 
  getListingForAdmin, 
  verifyListingAdmin, 
  rejectListingAdmin,
  getVerificationLogsAdmin 
} from '../../api/partnerApi';

export default function PartnerVerificationQueue() {
  const [pendingListings, setPendingListings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'logs'
  const [selectedListing, setSelectedListing] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  
  // Rejection modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const [pendingRes, logsRes] = await Promise.allSettled([
        getPendingListingsAdmin(),
        getVerificationLogsAdmin()
      ]);

      if (pendingRes.status === 'fulfilled' && pendingRes.value.success) {
        setPendingListings(pendingRes.value.data || []);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.success) {
        setAuditLogs(logsRes.value.data || []);
      }
    } catch (err) {
      console.error('Failed to load verification queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInspect = async (id) => {
    try {
      const res = await getListingForAdmin(id);
      if (res.success) {
        setSelectedListing(res.data.listing);
        setInspectModalOpen(true);
      }
    } catch (err) {
      alert('Failed to load listing details');
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to verify and activate this listing for the public marketplace?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const res = await verifyListingAdmin(id, 'Verified and published by platform admin.');
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Listing verified and activated.' });
        setInspectModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Verification failed');
      }
    } catch (err) {
      alert('Error verifying listing');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (listing) => {
    setSelectedListing(listing);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      alert('A rejection reason is mandatory to guide the partner on necessary corrections.');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await rejectListingAdmin(selectedListing._id, rejectReason.trim());
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Listing rejected and returned to partner with feedback.' });
        setRejectModalOpen(false);
        setInspectModalOpen(false);
        loadData();
      } else {
        alert(res.message || 'Rejection failed');
      }
    } catch (err) {
      alert('Error rejecting listing');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-border-light shadow-sm">
      {/* ── Tab Switcher & Header ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-forest-green bg-forest-green/10 px-2.5 py-0.5 rounded-full">
              Administrative Governance
            </span>
          </div>
          <h2 className="text-xl font-black text-text-dark font-display flex items-center gap-2">
            <ShieldCheck size={20} className="text-forest-green" /> Partner Verification Queue
          </h2>
          <p className="text-xs text-muted-text mt-0.5">
            Audit partner-claimed homestays, licensed guides, and vehicle listings before marketplace activation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-forest-green text-white shadow-2xs'
                : 'bg-beige/60 text-text-dark hover:bg-beige'
            }`}
          >
            Pending Queue ({pendingListings.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-forest-green text-white shadow-2xs'
                : 'bg-beige/60 text-text-dark hover:bg-beige'
            }`}
          >
            <History size={13} /> Audit Logs ({auditLogs.length})
          </button>
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 text-muted-text hover:text-forest-green bg-beige/40 hover:bg-beige rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 p-3 rounded-xl text-xs font-bold bg-green-50 text-forest-green border border-green-200">
          ✓ {statusMessage.text}
        </div>
      )}

      {/* ── Tab 1: Pending Queue ──────────────────────────── */}
      {activeTab === 'queue' && (
        <div>
          {loading ? (
            <p className="text-xs text-muted-text py-8 text-center">Loading pending verifications...</p>
          ) : pendingListings.length === 0 ? (
            <div className="text-center py-12 bg-[#faf9f6] rounded-2xl border border-dashed border-border-light">
              <CheckCircle size={32} className="text-forest-green/50 mx-auto mb-2" />
              <h4 className="font-bold text-text-dark text-sm">Verification Queue Empty</h4>
              <p className="text-xs text-muted-text mt-0.5">All partner listings have been audited.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border-light text-muted-text uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Listing Title & Type</th>
                    <th className="pb-3 font-bold">Partner / Business</th>
                    <th className="pb-3 font-bold">Location</th>
                    <th className="pb-3 font-bold">Claimed Price</th>
                    <th className="pb-3 font-bold">Submitted</th>
                    <th className="pb-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingListings.map((listing) => (
                    <tr key={listing._id} className="hover:bg-[#faf9f6] transition-colors">
                      <td className="py-3.5">
                        <div className="font-bold text-text-dark text-xs">{listing.title}</div>
                        <span className="text-[10px] font-semibold text-forest-green bg-forest-green/10 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {listing.listingType}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="font-medium text-text-dark flex items-center gap-1">
                          <Building size={12} className="text-muted-text" />
                          {listing.partner?.businessName || 'Unknown Partner'}
                        </div>
                        <span className="text-[10px] text-muted-text">
                          {listing.partner?.credentialType || 'Self-Reported'}
                        </span>
                      </td>
                      <td className="py-3.5 text-muted-text">
                        <div className="flex items-center gap-1">
                          <MapPin size={11} className="text-muted-text" />
                          {listing.district}{listing.city ? `, ${listing.city}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="font-mono font-bold text-text-dark">
                          ₹{listing.pricing?.amount} / {listing.pricing?.unit}
                        </div>
                        <span className="text-[9px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          {listing.pricing?.provenance || 'PARTNER_CLAIMED'}
                        </span>
                      </td>
                      <td className="py-3.5 text-muted-text text-[11px]">
                        {listing.submittedAt ? new Date(listing.submittedAt).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleInspect(listing._id)}
                            className="px-2.5 py-1 text-xs font-bold text-forest-green bg-forest-green/10 hover:bg-forest-green/20 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <button
                            onClick={() => handleApprove(listing._id)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-forest-green hover:bg-forest-green/90 rounded-lg flex items-center gap-1 shadow-2xs transition-all"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleOpenReject(listing)}
                            disabled={isProcessing}
                            className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2: Audit Logs ─────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-muted-text py-8 text-center">No verification audit logs recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <div key={log._id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        log.action === 'APPROVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {log.action}
                      </span>
                      <span className="font-bold text-text-dark">
                        {log.previousStatus} ➔ {log.newStatus}
                      </span>
                      <span className="text-[10px] text-muted-text">
                        (v{log.verificationVersion || 1})
                      </span>
                    </div>
                    <p className="text-muted-text mt-1 text-[11px]">
                      Reason: "{log.reason || 'None stated'}"
                    </p>
                    <span className="text-[10px] text-muted-text/80 mt-0.5 block">
                      Admin: {log.admin?.name || log.admin?.email || 'Platform Admin'} • {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Inspect Modal ─────────────────────────────────── */}
      {inspectModalOpen && selectedListing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-border-light">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-forest-green bg-forest-green/10 px-2 py-0.5 rounded-full">
                  {selectedListing.listingType} Review
                </span>
                <h3 className="font-bold text-lg text-text-dark mt-1">{selectedListing.title}</h3>
              </div>
              <button
                onClick={() => setInspectModalOpen(false)}
                className="text-muted-text hover:text-text-dark p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#faf9f6] rounded-xl border border-border-light grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-text block text-[10px]">Partner Name</span>
                  <span className="font-bold text-text-dark">{selectedListing.partner?.businessName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-text block text-[10px]">Claimed Tariff</span>
                  <span className="font-bold text-forest-green font-mono">
                    ₹{selectedListing.pricing?.amount} / {selectedListing.pricing?.unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-text block text-[10px]">District & City</span>
                  <span className="font-bold text-text-dark">{selectedListing.district}, {selectedListing.city || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-text block text-[10px]">Registration Ref</span>
                  <span className="font-mono text-text-dark">{selectedListing.partner?.credentialReference || 'None Provided'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-text-dark mb-1 uppercase tracking-wider text-[10px]">Description</h4>
                <p className="text-muted-text leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                  {selectedListing.description || 'No description provided.'}
                </p>
              </div>

              {selectedListing.amenities?.length > 0 && (
                <div>
                  <h4 className="font-bold text-text-dark mb-1 uppercase tracking-wider text-[10px]">Amenities</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedListing.amenities.map((a, i) => (
                      <span key={i} className="bg-beige px-2 py-0.5 rounded-full text-[10px] text-text-dark">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
              <button
                onClick={() => handleOpenReject(selectedListing)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl"
              >
                Reject with Feedback
              </button>
              <button
                onClick={() => handleApprove(selectedListing._id)}
                disabled={isProcessing}
                className="btn-primary text-xs py-2 px-5 rounded-xl flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> Approve & Activate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rejection Reason Modal ────────────────────────── */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-red-200">
            <h3 className="font-black text-text-dark text-base mb-1 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-600" /> Mandatory Rejection Reason
            </h3>
            <p className="text-xs text-muted-text mb-3">
              Explain clearly to the partner what corrections are required (e.g. invalid tariff, missing license, poor photos) so they can reopen to DRAFT, fix, and resubmit.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Please provide valid local homestay registration number and clear photos of the rooms."
              rows={4}
              className="w-full text-xs p-3 rounded-xl border border-border-light focus:outline-forest-green bg-[#faf9f6]"
            />

            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModalOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-muted-text hover:text-text-dark"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing || !rejectReason.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-2xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
