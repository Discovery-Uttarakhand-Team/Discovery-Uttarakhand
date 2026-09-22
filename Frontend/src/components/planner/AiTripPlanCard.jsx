import React, { useState } from 'react';
import { 
  Sparkles, 
  Mountain, 
  Compass, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Info, 
  CheckCircle2, 
  ShieldCheck,
  Calendar
} from 'lucide-react';

export default function AiTripPlanCard({ 
  aiPlan, 
  meta, 
  loading, 
  error, 
  onRetry,
  maxDays = null
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDayIdx, setSelectedDayIdx] = useState(null);

  // 1. Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-forest-green/20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-forest-green/10 flex items-center justify-center animate-pulse">
            <Sparkles size={16} className="text-forest-green animate-spin" />
          </div>
          <div>
            <h3 className="font-bold text-text-dark text-xs uppercase tracking-wider flex items-center gap-2">
              Generating Trip Insights...
            </h3>
            <p className="text-xs text-muted-text mt-0.5">
              Evaluating mountain transit corridors, altitude acclimatization, and verified stays.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Error / Unavailable State
  if (error || !aiPlan) {
    return null; // Keep page clean if AI reasoning is unavailable
  }

  // Strictly bound days to trip duration
  const rawDays = Array.isArray(aiPlan.days) ? aiPlan.days : [];
  const boundedDays = maxDays ? rawDays.slice(0, maxDays) : rawDays;

  // Clean summary text if duration is mismatched
  let summaryText = aiPlan.summary || '';
  if (maxDays && summaryText) {
    summaryText = summaryText.replace(/\b\d+[- ]day\b/gi, `${maxDays}-day`);
  }

  return (
    <div className="bg-white rounded-2xl border border-border-light overflow-hidden shadow-2xs transition-all">
      {/* ── Top Header Banner ─────────────────────────────── */}
      <div className="p-4 bg-gradient-to-r from-forest-green/[0.04] via-transparent to-beige/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-forest-green/10 text-forest-green flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-text-dark text-sm font-display">
                Trip Insights
              </h3>
              <span className="text-[10px] font-bold text-forest-green bg-forest-green/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={11} />
                AI-assisted • Grounded in verified trip data
              </span>
            </div>
            <p className="text-xs text-muted-text mt-0.5">
              Why this plan fits your trip
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              title="Refresh Insights"
              className="p-1.5 text-muted-text hover:text-forest-green hover:bg-forest-green/10 rounded-lg transition-colors"
            >
              <RefreshCw size={13} />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 text-xs font-bold text-forest-green hover:bg-forest-green/5 rounded-lg flex items-center gap-1 transition-colors"
            aria-label="Toggle details"
          >
            <span>{isExpanded ? 'Hide Insights' : 'View Insights'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Summary & Reasoning Body ──────────────────────── */}
      {isExpanded && (
        <div className="p-5 pt-1 space-y-4 text-xs border-t border-border-light/60">
          {/* Executive Strategy Pitch */}
          {summaryText && (
            <div className="bg-forest-green/[0.03] p-3.5 rounded-xl border border-forest-green/15 text-text-dark leading-relaxed font-medium">
              "{summaryText}"
            </div>
          )}

          {/* Acclimatization & Elevation Box */}
          {aiPlan.pacingAndAcclimatization && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#faf9f6] border border-border-light">
                <div className="flex items-center gap-1.5 font-bold text-text-dark text-[11px] uppercase tracking-wider mb-1">
                  <Mountain size={13} className="text-forest-green" />
                  Altitude & Elevation Profile
                </div>
                <p className="text-muted-text text-xs leading-relaxed">
                  {aiPlan.pacingAndAcclimatization.elevationProfileAdvice}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#faf9f6] border border-border-light">
                <div className="flex items-center gap-1.5 font-bold text-text-dark text-[11px] uppercase tracking-wider mb-1">
                  <Compass size={13} className="text-forest-green" />
                  Pacing & Daylight Safety
                </div>
                <p className="text-muted-text text-xs leading-relaxed">
                  {aiPlan.pacingAndAcclimatization.paceAssessment}
                </p>
              </div>
            </div>
          )}

          {/* Day-by-day Strategic Rationale (strictly bounded) */}
          {boundedDays.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-dark uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Calendar size={13} className="text-forest-green" />
                  Day-by-Day Rationale ({boundedDays.length} Days):
                </span>
                <span className="text-[10px] text-muted-text">Click day to view details</span>
              </div>

              <div className="space-y-2">
                {boundedDays.map((d, dIdx) => {
                  const isOpen = selectedDayIdx === dIdx;
                  return (
                    <div 
                      key={`ai-day-reason-${dIdx}`}
                      className="border border-border-light rounded-xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setSelectedDayIdx(isOpen ? null : dIdx)}
                        className="w-full text-left p-2.5 bg-[#faf9f6] hover:bg-beige/40 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-forest-green text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {d.day || dIdx + 1}
                          </span>
                          <span className="font-bold text-text-dark">
                            Day {d.day || dIdx + 1}: {d.base || 'Itinerary Milestone'}
                          </span>
                        </div>
                        {isOpen ? <ChevronUp size={14} className="text-muted-text" /> : <ChevronDown size={14} className="text-muted-text" />}
                      </button>

                      {isOpen && (
                        <div className="p-3 bg-white border-t border-border-light space-y-2 text-xs">
                          {d.reasoning && d.reasoning.length > 0 && (
                            <div>
                              <span className="font-bold text-forest-green text-[11px] block mb-1">
                                Strategy:
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-muted-text">
                                {d.reasoning.map((r, rIdx) => (
                                  <li key={rIdx}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {d.recommendedStay && (
                            <div className="pt-2 border-t border-dashed border-border-light flex items-center justify-between text-xs">
                              <span className="text-muted-text">
                                🏨 <strong>Recommended Stay:</strong> {d.recommendedStay.name}
                              </span>
                              {d.recommendedStay.tariffQuote && (
                                <span className="font-bold text-forest-green font-mono">
                                  {d.recommendedStay.tariffQuote}
                                </span>
                              )}
                            </div>
                          )}

                          {d.nextDayPreview && (
                            <p className="text-[11px] text-muted-text italic pt-1">
                              Next milestone: {d.nextDayPreview}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transparent Grounding Disclaimer */}
          <div className="pt-2 border-t border-border-light flex items-center justify-between text-[11px] text-muted-text">
            <span className="flex items-center gap-1">
              <CheckCircle2 size={12} className="text-forest-green" />
              Verified with database records & mountain road topography.
            </span>
            <span className="italic">AI-assisted planning</span>
          </div>
        </div>
      )}
    </div>
  );
}
