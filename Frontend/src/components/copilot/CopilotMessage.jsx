import React, { useState } from "react";
import StructuredTravelCards from "./StructuredTravelCards";
import { Sparkles, Check, ArrowRight, Shield } from "lucide-react";
import { executeAgentAction } from "../../utils/agentActionExecutor";

const TYPE_STYLES = {
  answer: "",
  clarification: "copilot-msg--clarify",
  confirmation_required: "copilot-msg--confirm",
  unavailable: "copilot-msg--unavail",
  fallback: "copilot-msg--fallback",
  error: "copilot-msg--error"
};

const BADGE = {
  LIVE: { label: "Live", color: "#16a34a" },
  VERIFIED: { label: "Verified", color: "#2563eb" },
  ESTIMATED: { label: "Estimated", color: "#d97706" },
  STALE: { label: "Stale", color: "#ea580c" },
  UNKNOWN: { label: "Unknown", color: "#64748b" },
  UNAVAILABLE: { label: "Unavailable", color: "#dc2626" }
};

const TOOL_LABELS = {
  getTripContext: "Checking your trip...",
  searchDestinations: "Searching destinations...",
  getRecommendations: "Getting recommendations...",
  calculateBudget: "Calculating budget...",
  planRoute: "Calculating road routing...",
  getItinerary: "Reading itinerary...",
  modifyItinerary: "Preparing change...",
  getWeather: "Checking live weather...",
  getRoadAdvisory: "Checking road safety...",
  getTransitStatus: "Checking transit...",
  findStays: "Finding verified stays...",
  findRentals: "Finding rentals...",
  findGuides: "Finding guides...",
  exploreDestination: "Finding activities..."
};

function ProvenanceBadge({ freshness }) {
  const b = BADGE[freshness] || BADGE.VERIFIED;
  return (
    <span className="copilot-badge" style={{ borderColor: b.color, color: b.color }}>
      <span className="copilot-badge__dot" style={{ background: b.color }} />
      {b.label}
    </span>
  );
}

function ConfirmCard({ payload, onConfirm, onCancel }) {
  return (
    <div className="copilot-confirm-card">
      <p className="copilot-confirm-card__title">Confirm Change</p>
      <p className="copilot-confirm-card__detail">
        {payload?.operation} - Day {payload?.day}
      </p>
      <div className="copilot-confirm-card__actions">
        <button className="copilot-btn copilot-btn--confirm" onClick={onConfirm}>
          Yes, proceed
        </button>
        <button className="copilot-btn copilot-btn--cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function ToolActivity({ tools }) {
  if (!tools || !tools.length) return null;
  return (
    <div className="copilot-tool-activity">
      {tools.map((t) => (
        <span key={t} className="copilot-tool-chip">
          <span className="copilot-tool-chip__dot" />
          {TOOL_LABELS[t] || t}
        </span>
      ))}
    </div>
  );
}

export default function CopilotMessage({ msg, onConfirm, onCancel, onSelectAction, isLatest }) {
  const isUser = msg.role === "user";
  const [showTrace, setShowTrace] = useState(false);

  const formatText = (text) => {
    if (!text) return "";
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/^- (.*$)/gim, '<div class="list-bullet">• $1</div>')
      .replace(/\n\n/g, '<div class="msg-para-break"></div>')
      .replace(/\n/g, "<br/>");
  };

  if (msg.role === "loading") {
    return (
      <div className="copilot-msg copilot-msg--loading">
        <div className="copilot-msg__avatar">
          <Sparkles size={14} />
        </div>
        <div className="copilot-msg__bubble">
          <div className="copilot-loading-row">
            <div className="copilot-typing">
              <span />
              <span />
              <span />
            </div>
            {msg.statusText && (
              <span className="copilot-loading-text">
                {msg.statusText}
              </span>
            )}
          </div>
          {msg.toolsInProgress && <ToolActivity tools={msg.toolsInProgress} />}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`copilot-msg ${isUser ? "copilot-msg--user" : "copilot-msg--agent"} ${
        TYPE_STYLES[msg.type] || ""
      }`}
    >
      {!isUser && (
        <div className="copilot-msg__avatar" title="AI Travel Copilot">
          <Sparkles size={14} />
        </div>
      )}

      <div className="copilot-msg__bubble">
        <div
          className="copilot-msg__text"
          dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
        />

        {/* Structured Travel Cards (Weather, Stays, Route, Budget) */}
        {msg.structuredCards && <StructuredTravelCards cards={msg.structuredCards} />}

        {/* Agentic Reasoning & Grounded Tools Drawer (Collapsible) */}
        {!isUser && ((msg.toolsUsed && msg.toolsUsed.length > 0) || (msg.citations && msg.citations.length > 0)) && (
          <div className="copilot-reasoning-wrap">
            <button
              type="button"
              className="copilot-reasoning-toggle"
              onClick={() => setShowTrace(!showTrace)}
            >
              <div className="flex items-center gap-1.5">
                <span className="copilot-reasoning-icon">⚡</span>
                <span className="font-semibold text-xs text-forest-green">
                  Verified with {msg.toolsUsed?.length || 0} Agent Tools & {msg.citations?.length || 0} Grounded Sources
                </span>
              </div>
              <span className="text-xs text-muted-text font-bold">
                {showTrace ? "Hide details ▲" : "View grounding ▼"}
              </span>
            </button>

            {showTrace && (
              <div className="copilot-reasoning-panel animate-fadeIn">
                {/* Tools executed */}
                {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                      Deterministic Tools Run
                    </div>
                    <ToolActivity tools={msg.toolsUsed} />
                  </div>
                )}

                {/* Verified Citations */}
                {msg.citations && msg.citations.length > 0 && (
                  <div>
                    <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                      Verified Data Citations
                    </div>
                    <div className="copilot-citations">
                      {msg.citations.map((c, i) => {
                        const src = typeof c === "string" ? c : c.source || c.title || JSON.stringify(c);
                        return (
                          <div key={i} className="copilot-citation">
                            <span className="copilot-citation__src">{src}</span>
                            {c.freshness && <ProvenanceBadge freshness={c.freshness} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Confirmation Required Box */}
        {msg.type === "confirmation_required" && (
          <ConfirmCard
            payload={msg.confirmationPayload}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        )}

        {/* Contextual Quick Reply Chips */}
        {msg.suggestedActions && msg.suggestedActions.length > 0 && !isUser && (
          <div className="copilot-quick-chips">
            {msg.suggestedActions.map((action, idx) => {
              const label = typeof action === "string" ? action : (action.label || action.title || JSON.stringify(action));
              return (
                <button
                  key={idx}
                  className="copilot-quick-chip"
                  onClick={() => {
                    if (typeof action === 'object' && action.type) {
                      executeAgentAction(action);
                    }
                    const textToSend = typeof action === 'object' ? (action.message || action.label) : action;
                    if (onSelectAction && textToSend) {
                      onSelectAction(textToSend);
                    }
                  }}
                >
                  <span>✨</span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}