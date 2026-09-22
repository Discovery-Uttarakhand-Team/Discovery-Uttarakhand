import React, { useState } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export default function BudgetBreakdownCard({ budgetData, budgetPreference = 'Balanced' }) {
  const [showAssumptions, setShowAssumptions] = useState(false);

  if (!budgetData || !budgetData.summary) return null;

  const { summary, breakdown = {}, assumptions = [], provenanceNotice } = budgetData;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'UNDER_BUDGET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
            <CheckCircle2 size={13} /> Under Budget
          </span>
        );
      case 'OVER_BUDGET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
            <AlertCircle size={13} /> Over Budget
          </span>
        );
      case 'INSUFFICIENT_DATA':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
            <HelpCircle size={13} /> Approximation
          </span>
        );
      case 'NEAR_BUDGET':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-forest-green/10 text-forest-green">
            <CheckCircle2 size={13} /> Near Budget
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-border-light shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-light pb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-forest-green/10 flex items-center justify-center text-forest-green flex-shrink-0">
            <Wallet size={18} />
          </div>
          <div>
            <h3 className="font-bold text-text-dark text-base font-display">
              TRIP BUDGET
            </h3>
            <p className="text-xs text-muted-text">
              Based on available verified tariffs and planning assumptions
            </p>
          </div>
        </div>
        {getStatusBadge(summary.budgetStatus)}
      </div>

      {/* Main Numbers Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#faf9f6] border border-border-light text-xs">
        <div>
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-0.5">
            Estimated Total
          </span>
          <span className="text-xl font-black text-forest-green font-display">
            ₹{summary.minCost?.toLocaleString()} – ₹{summary.maxCost?.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-text block mt-0.5">
            {summary.days} Days • {summary.travelers} {summary.travelers === 1 ? 'Traveler' : 'Travelers'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-0.5">
            Known Verified Tariffs
          </span>
          <span className="text-xl font-black text-text-dark font-display flex items-center gap-1">
            ₹{summary.totalKnownCost?.toLocaleString()}
            <ShieldCheck size={14} className="text-forest-green" title="Verified KMVN/IRCTC Rates" />
          </span>
          <span className="text-[10px] text-forest-green font-semibold block mt-0.5">
            Official tariff records
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-muted-text uppercase tracking-wider block mb-0.5">
            Budget Benchmark ({budgetPreference})
          </span>
          <span className="text-xl font-black text-earth-brown font-display">
            ₹{summary.targetBudgetCap?.toLocaleString()}
          </span>
          <span className="text-[10px] text-muted-text block mt-0.5">
            Allocated expectation
          </span>
        </div>
      </div>

      {/* Status Explanation */}
      {summary.explanation && (
        <div className="p-3 rounded-xl bg-forest-green/5 border border-forest-green/15 text-xs text-text-dark flex items-start gap-2">
          <Info size={14} className="text-forest-green flex-shrink-0 mt-0.5" />
          <span>{summary.explanation}</span>
        </div>
      )}

      {/* Category Breakdown Table */}
      <div className="space-y-2 pt-1">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-text">
          Cost Breakdown by Category
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Stays */}
          {breakdown.stay && (
            <div className="p-3.5 rounded-xl border border-border-light bg-[#faf9f6] flex justify-between items-center">
              <div>
                <span className="font-bold text-text-dark block">🏨 Accommodation</span>
                <span className="text-[11px] text-muted-text">
                  {breakdown.stay.details?.length > 0 
                    ? `${breakdown.stay.details.length} night(s) scheduled`
                    : 'Overnight stays'}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-text-dark block">
                  ₹{breakdown.stay.minCost?.toLocaleString()} – ₹{breakdown.stay.maxCost?.toLocaleString()}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  breakdown.stay.provenance === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  {breakdown.stay.provenance}
                </span>
              </div>
            </div>
          )}

          {/* Transport */}
          {breakdown.transport && (
            <div className="p-3.5 rounded-xl border border-border-light bg-[#faf9f6] flex justify-between items-center">
              <div>
                <span className="font-bold text-text-dark block">🚗 Transport & Transfers</span>
                <span className="text-[11px] text-muted-text">
                  {breakdown.transport.details?.length > 0 
                    ? `${breakdown.transport.details.length} transit leg(s)` 
                    : 'Mountain road transit'}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-text-dark block">
                  ₹{breakdown.transport.minCost?.toLocaleString()} – ₹{breakdown.transport.maxCost?.toLocaleString()}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  breakdown.transport.provenance === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  {breakdown.transport.provenance}
                </span>
              </div>
            </div>
          )}

          {/* Food & Meals */}
          {breakdown.food && (
            <div className="p-3.5 rounded-xl border border-border-light bg-[#faf9f6] flex justify-between items-center">
              <div>
                <span className="font-bold text-text-dark block">🍲 Food & Daily Dining</span>
                <span className="text-[11px] text-muted-text">
                  Estimated at {breakdown.food.ratePerPersonPerDay}/person/day
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-text-dark block">
                  ₹{breakdown.food.minCost?.toLocaleString()} – ₹{breakdown.food.maxCost?.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 uppercase tracking-wider">
                  ESTIMATED
                </span>
              </div>
            </div>
          )}

          {/* Emergency Buffer */}
          {breakdown.emergencyBuffer && (
            <div className="p-3.5 rounded-xl border border-border-light bg-[#faf9f6] flex justify-between items-center">
              <div>
                <span className="font-bold text-text-dark block">🛡️ Safety Buffer</span>
                <span className="text-[11px] text-muted-text">
                  Weather hold & detour contingency
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-text-dark block">
                  ₹{breakdown.emergencyBuffer.minCost?.toLocaleString()} – ₹{breakdown.emergencyBuffer.maxCost?.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 uppercase tracking-wider">
                  ESTIMATED
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Assumptions */}
      {assumptions.length > 0 && (
        <div className="pt-2 border-t border-border-light text-xs">
          <button
            onClick={() => setShowAssumptions(!showAssumptions)}
            className="flex items-center justify-between w-full font-bold text-forest-green hover:underline py-1"
          >
            <span>View Calculation Assumptions ({assumptions.length})</span>
            {showAssumptions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAssumptions && (
            <ul className="mt-2 space-y-1.5 p-3 rounded-xl bg-[#faf9f6] border border-border-light/70 text-xs text-muted-text">
              {assumptions.map((item, aIdx) => (
                <li key={aIdx} className="flex items-start gap-1.5 leading-relaxed">
                  <span className="text-forest-green font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Provenance Notice */}
      {provenanceNotice && (
        <p className="text-[11px] text-muted-text italic text-center pt-1 border-t border-border-light/50">
          ℹ️ {provenanceNotice}
        </p>
      )}
    </div>
  );
}
