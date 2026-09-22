import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  QrCode, 
  ChevronLeft, 
  CheckCircle2, 
  ExternalLink,
  Printer,
  Car,
  Building,
  Lock,
  Layers
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VerificationProofPage() {
  const { id, vehicleNumber } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isVehicle = Boolean(vehicleNumber);
  const targetIdentifier = vehicleNumber || id;

  useEffect(() => {
    const fetchProof = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = isVehicle 
          ? `${API_BASE}/verification/inspect/vehicle/${vehicleNumber}`
          : `${API_BASE}/verification/inspect/listing/${id}`;

        const res = await axios.get(endpoint);
        if (res.data?.success) {
          setData(res.data.data);
        } else {
          setError(res.data?.message || 'Verification proof could not be retrieved.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to connect to verification service.');
      } finally {
        setLoading(false);
      }
    };

    if (targetIdentifier) {
      fetchProof();
    }
  }, [id, vehicleNumber, isVehicle, targetIdentifier]);

  const handlePrint = () => {
    window.print();
  };

  const verdict = data?.verificationVerdict || 'UNKNOWN';
  const details = data?.verdictDetails || {};

  const isVerified = verdict === 'BLOCKCHAIN_VERIFIED' || verdict === 'PERMIT_VALID';
  const isTampered = verdict === 'TAMPER_DETECTED';
  const isSuspended = verdict === 'SUSPENDED';
  const isRevoked = verdict === 'REVOKED';
  const isExpired = verdict === 'EXPIRED';

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 pt-28 pb-16 px-4 md:px-8 max-w-4xl mx-auto w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link 
            to="/" 
            className="text-xs font-bold text-muted-text hover:text-forest-green flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Portal
          </Link>

          {isVerified && (
            <button
              onClick={handlePrint}
              className="text-xs font-bold text-forest-green hover:bg-forest-green/10 px-3 py-1.5 rounded-xl border border-forest-green/20 flex items-center gap-1.5 transition-all print:hidden"
            >
              <Printer size={13} /> Print Proof
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-12 border border-border-light shadow-sm text-center">
            <div className="w-12 h-12 border-4 border-forest-green border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="font-bold text-text-dark text-lg">Inspecting Blockchain Integrity Record...</h2>
            <p className="text-xs text-muted-text mt-1">Querying smart contract verification state & block headers.</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center">
            <XCircle size={40} className="text-red-600 mx-auto mb-3" />
            <h2 className="font-bold text-text-dark text-lg">Verification Record Not Found</h2>
            <p className="text-xs text-muted-text mt-1 max-w-md mx-auto">{error}</p>
          </div>
        )}

        {/* Proof Document Body */}
        {!loading && !error && data && (
          <div className="bg-white rounded-3xl border border-border-light shadow-sm overflow-hidden">
            {/* Header Banner */}
            <div className={`p-6 sm:p-8 border-b ${
              isVerified ? 'bg-forest-green/5 border-forest-green/20' :
              isTampered || isRevoked ? 'bg-red-50 border-red-200' :
              isSuspended || isExpired ? 'bg-amber-50 border-amber-200' :
              'bg-beige/40 border-border-light'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-forest-green bg-forest-green/10 px-2.5 py-0.5 rounded-full">
                      Blockchain Integrity Proof
                    </span>
                    <span className="text-[11px] font-semibold text-muted-text">
                      Discovery Uttarakhand Verified Listing
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-text-dark font-display leading-tight">
                    {data.title || data.vehicleNumber}
                  </h1>
                  <p className="text-xs text-muted-text mt-1">
                    {data.district ? `${data.district} District` : ''} 
                    {data.category ? ` • ${data.category}` : ''}
                    {data.permitType ? ` • ${data.permitType.replace(/_/g, ' ')}` : ''}
                  </p>
                </div>

                {/* Verdict Pill */}
                <div className={`px-4 py-2.5 rounded-2xl flex items-center gap-2 self-start sm:self-center font-bold text-xs ${
                  isVerified ? 'bg-forest-green text-white shadow-sm' :
                  isTampered ? 'bg-red-600 text-white' :
                  isRevoked ? 'bg-red-700 text-white' :
                  isSuspended ? 'bg-amber-600 text-white' :
                  isExpired ? 'bg-amber-700 text-white' :
                  'bg-gray-200 text-text-dark'
                }`}>
                  {isVerified ? <CheckCircle2 size={16} /> :
                   isTampered || isRevoked ? <XCircle size={16} /> :
                   <AlertTriangle size={16} />}
                  <span>
                    {isVerified ? 'VERIFIED ON-CHAIN' :
                     isTampered ? 'TAMPER DETECTED' :
                     isRevoked ? 'CERTIFICATE REVOKED' :
                     isSuspended ? 'TEMPORARILY SUSPENDED' :
                     isExpired ? 'PERMIT EXPIRED' :
                     verdict.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 sm:p-8 space-y-8">
              {/* Verdict Explanation Message */}
              {details.message && (
                <div className={`p-4 rounded-2xl text-xs flex items-start gap-2.5 ${
                  isVerified ? 'bg-forest-green/5 text-forest-green border border-forest-green/20' :
                  'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <ShieldCheck size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="leading-relaxed font-medium">{details.message}</p>
                </div>
              )}

              {/* Grid: Verification Properties */}
              <div>
                <h3 className="text-xs font-black text-text-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers size={14} className="text-forest-green" /> Verified Entity Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-border-light/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text block">Category</span>
                    <span className="font-bold text-xs text-text-dark mt-0.5 block">{data.category || data.listingType || 'Transport'}</span>
                  </div>

                  {data.pricing && (
                    <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-border-light/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text block">Verified Tariff</span>
                      <span className="font-bold text-xs text-forest-green mt-0.5 block">
                        ₹{data.pricing.amount} / {data.pricing.unit}
                      </span>
                    </div>
                  )}

                  {data.capacity && data.capacity.maxGuests && (
                    <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-border-light/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text block">Authorized Capacity</span>
                      <span className="font-bold text-xs text-text-dark mt-0.5 block">
                        {data.capacity.maxGuests} Guests ({data.capacity.bedrooms || 1} Bed, {data.capacity.bathrooms || 1} Bath)
                      </span>
                    </div>
                  )}

                  {data.partner && (
                    <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-border-light/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text block">Operating Entity</span>
                      <span className="font-bold text-xs text-text-dark mt-0.5 block">{data.partner.businessName}</span>
                    </div>
                  )}

                  {data.validUntil && (
                    <div className="bg-[#faf9f6] p-3.5 rounded-2xl border border-border-light/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-text block">Permit Valid Until</span>
                      <span className={`font-bold text-xs mt-0.5 block ${isExpired ? 'text-red-600' : 'text-text-dark'}`}>
                        {new Date(data.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Grid: On-Chain Cryptographic Anchor */}
              <div className="pt-4 border-t border-border-light">
                <h3 className="text-xs font-black text-text-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Lock size={14} className="text-forest-green" /> Cryptographic Blockchain Anchor
                </h3>

                <div className="bg-[#faf9f6] p-4 rounded-2xl border border-border-light/80 space-y-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-muted-text text-[11px] uppercase font-sans font-bold">On-Chain Status:</span>
                    <span className={`font-bold ${isVerified ? 'text-forest-green' : 'text-red-600'}`}>
                      {details.onChainStatus || 'NONE'}
                    </span>
                  </div>

                  {details.attestedVersion && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text text-[11px] uppercase font-sans font-bold">Attested Version:</span>
                      <span className="text-text-dark font-bold">v{details.attestedVersion} (Contract-Incremented)</span>
                    </div>
                  )}

                  {details.blockNumber && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text text-[11px] uppercase font-sans font-bold">Block Number:</span>
                      <span className="text-text-dark font-bold">#{details.blockNumber}</span>
                    </div>
                  )}

                  {details.verifiedAt && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text text-[11px] uppercase font-sans font-bold">Block Timestamp (verifiedAt):</span>
                      <span className="text-text-dark font-bold">{details.verifiedAt}</span>
                    </div>
                  )}

                  {details.contractAddress && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text text-[11px] uppercase font-sans font-bold">Smart Contract:</span>
                      <span className="text-text-dark truncate max-w-xs">{details.contractAddress}</span>
                    </div>
                  )}

                  {details.verifierAddress && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text text-[11px] uppercase font-sans font-bold">Platform Verifier:</span>
                      <span className="text-text-dark truncate max-w-xs">{details.verifierAddress}</span>
                    </div>
                  )}

                  {details.txHash && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="text-muted-text text-[11px] uppercase font-sans font-bold">Transaction Hash:</span>
                      <span className="text-forest-green truncate max-w-xs font-bold">{details.txHash}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic QR Section for Property Display */}
              {!isVehicle && data.listingId && (
                <div className="pt-4 border-t border-border-light flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xs font-black text-text-dark uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <QrCode size={14} className="text-forest-green" /> Tourist Verification QR
                    </h3>
                    <p className="text-xs text-muted-text max-w-md leading-relaxed">
                      Scan this QR code with any smartphone camera to independently verify this listing on the Discovery Uttarakhand blockchain registry. Zero cryptocurrency wallet required.
                    </p>
                  </div>

                  <div className="w-28 h-28 bg-[#faf9f6] rounded-2xl border border-border-light p-2 flex items-center justify-center flex-shrink-0">
                    <img 
                      src={`${API_BASE}/verification/qr/listing/${data.listingId}`}
                      alt="Verification QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
