import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { streamAgentMessage, sendAgentMessage } from "../../api/agentApi";
import { executeAgentAction, setActiveRequestId } from "../../utils/agentActionExecutor";
import CopilotMessage from "./CopilotMessage";
import TripContextStrip from "./TripContextStrip";
import { 
  Sparkles, 
  Plus, 
  X, 
  Send, 
  History, 
  Trash2, 
  Maximize2, 
  Loader2,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import "./AICopilotDrawer.css";

const SESSIONS_STORAGE_KEY = "du_copilot_sessions_v2";

const DEFAULT_WELCOME_MSG = {
  id: "welcome_init",
  role: "agent",
  type: "answer",
  text: "👋 **Uttarakhand ka trip plan karna hai?**\n\nBas destination batao — main live route, weather, verified stays, activities aur budget calculate karke plan bana dunga.",
  toolsUsed: [],
  citations: [],
  suggestedActions: [
    { label: "Plan a trip", action: "PLAN" },
    { label: "Check weather", action: "WEATHER" },
    { label: "Find stays", action: "STAYS" },
    { label: "Explore destinations", action: "EXPLORE" }
  ]
};

export default function AICopilotDrawer({ isOpen, onClose, tripId, pageContext }) {
  const navigate = useNavigate();

  // Sessions Store
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error("Failed to load copilot sessions:", e);
    }
    return [];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    return sessionStorage.getItem("du_active_session_id") || `sess_${Date.now()}`;
  });

  const [historyOpen, setHistoryOpen] = useState(false);

  // Active Session State
  const [messages, setMessages] = useState(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const current = parsed.find(s => s.id === activeSessionId);
        if (current && Array.isArray(current.messages) && current.messages.length > 0) {
          return current.messages;
        }
      }
    } catch (e) {}
    return [DEFAULT_WELCOME_MSG];
  });

  const [tripContext, setTripContext] = useState(() => {
    try {
      const savedSessions = localStorage.getItem(SESSIONS_STORAGE_KEY);
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        const current = parsed.find(s => s.id === activeSessionId);
        if (current?.tripContext) return current.tripContext;
      }
    } catch (e) {}
    return null;
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeStatus, setActiveStatus] = useState("Ready");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { 
    scrollToBottom(); 
  }, [messages, loading]);

  // Sync current active session to sessions store & localStorage
  useEffect(() => {
    if (!activeSessionId) return;

    sessionStorage.setItem("du_active_session_id", activeSessionId);

    setSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === activeSessionId);
      const firstUserMsg = messages.find(m => m.role === "user");
      const title = firstUserMsg ? firstUserMsg.text.slice(0, 36) : (tripContext?.destination ? `${tripContext.destination} Trip` : "New Trip Conversation");

      const sessionObj = {
        id: activeSessionId,
        title,
        destination: tripContext?.destination || "Uttarakhand",
        updatedAt: new Date().toISOString(),
        messages: messages.filter(m => m.role !== "loading"),
        tripContext
      };

      let updated;
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = sessionObj;
      } else {
        updated = [sessionObj, ...prev];
      }

      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
      } catch (e) {}
      return updated;
    });
  }, [messages, tripContext, activeSessionId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Switch to a past session
  const handleSelectSession = (sess) => {
    setActiveSessionId(sess.id);
    setMessages(sess.messages && sess.messages.length > 0 ? sess.messages : [DEFAULT_WELCOME_MSG]);
    setTripContext(sess.tripContext || null);
    setHistoryOpen(false);
  };

  // Delete an individual past session
  const handleDeleteSession = (sessId, e) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessId);
      try {
        localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(filtered));
      } catch (err) {}
      return filtered;
    });

    if (activeSessionId === sessId) {
      handleNewChat();
    }
  };

  // Clear all past sessions
  const handleClearAllHistory = () => {
    if (window.confirm("Are you sure you want to clear all conversation history?")) {
      localStorage.removeItem(SESSIONS_STORAGE_KEY);
      setSessions([]);
      handleNewChat();
    }
  };

  // Start fresh chat / trip plan
  const handleNewChat = () => {
    const newId = `sess_${Date.now()}`;
    setActiveSessionId(newId);
    sessionStorage.setItem("du_active_session_id", newId);
    setTripContext(null);
    setMessages([DEFAULT_WELCOME_MSG]);
    setHistoryOpen(false);
    setTimeout(() => inputRef.current?.focus(), 150);
  };

  // Send message to Agent with resilient streaming + fallback
  const sendMessage = useCallback(async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;
    setInput("");

    const reqId = "req_" + Date.now();
    setActiveRequestId(reqId);

    const userMsg = { id: Date.now(), role: "user", text: msgText };
    const loadingMsg = { id: Date.now() + 1, role: "loading", statusText: "Planning with AI Agent...", toolsInProgress: [] };
    setMessages(prev => [...prev, userMsg, loadingMsg]);
    setLoading(true);
    setActiveStatus("Planning your trip...");

    let streamedAnswer = "";
    let streamSucceeded = false;

    try {
      await streamAgentMessage({
        message: msgText,
        tripId,
        sessionId: activeSessionId,
        pageContext,
        onUpdate: (event) => {
          if (event.type === 'status' || event.type === 'tool_status') {
            const statusMsg = event.message || event.label || "Planning...";
            setActiveStatus(statusMsg);
            setMessages(prev => prev.map(m => m.role === 'loading' ? { ...m, statusText: statusMsg } : m));
          } else if (event.type === 'ui_action' && event.action) {
            executeAgentAction(event.action, { requestId: event.requestId || reqId });
          } else if (event.type === 'chunk') {
            streamSucceeded = true;
            streamedAnswer += event.text || "";
            setMessages(prev => {
              const withoutLoading = prev.filter(m => m.role !== 'loading');
              const last = withoutLoading[withoutLoading.length - 1];
              if (last && last.role === 'agent' && last.isStreaming) {
                return [...withoutLoading.slice(0, -1), { ...last, text: streamedAnswer }];
              } else {
                return [...withoutLoading, {
                  id: Date.now() + 2,
                  role: 'agent',
                  type: 'answer',
                  text: streamedAnswer,
                  isStreaming: true,
                  toolsUsed: [],
                  citations: []
                }];
              }
            });
          } else if (event.type === 'done') {
            streamSucceeded = true;
            setActiveStatus("Ready");
            if (event.response?.uiActions && Array.isArray(event.response.uiActions)) {
              for (const act of event.response.uiActions) {
                executeAgentAction(act, { requestId: event.requestId || reqId });
              }
            }
            const resp = event.response || {};
            if (resp.tripContext) {
              setTripContext(prev => ({ ...(prev || {}), ...resp.tripContext }));
            }

            setMessages(prev => {
              const filtered = prev.filter(m => m.role !== 'loading');
              const last = filtered[filtered.length - 1];
              const finalText = streamedAnswer || resp.message || "I am ready to help with your trip planning.";
              if (last && last.role === 'agent' && last.isStreaming) {
                return [...filtered.slice(0, -1), {
                  ...last,
                  text: finalText,
                  isStreaming: false,
                  type: resp.type || 'answer',
                  toolsUsed: resp.toolsUsed || [],
                  citations: resp.citations || [],
                  suggestedActions: resp.suggestedActions || [],
                  structuredCards: resp.structuredCards || null,
                  confirmationPayload: resp.confirmationPayload || null
                }];
              } else {
                return [...filtered, {
                  id: Date.now() + 3,
                  role: 'agent',
                  type: resp.type || 'answer',
                  text: finalText,
                  toolsUsed: resp.toolsUsed || [],
                  citations: resp.citations || [],
                  suggestedActions: resp.suggestedActions || [],
                  structuredCards: resp.structuredCards || null,
                  confirmationPayload: resp.confirmationPayload || null
                }];
              }
            });
          }
        }
      });
    } catch (streamErr) {
      console.warn("[CopilotDrawer] Stream error, attempting standard POST fallback...", streamErr.message);
    }

    // Fallback if streaming failed to yield any answer
    if (!streamSucceeded && !streamedAnswer) {
      try {
        const directRes = await sendAgentMessage({
          message: msgText,
          tripId,
          sessionId: activeSessionId,
          pageContext
        });

        if (directRes.success && directRes.response) {
          const resp = directRes.response;
          if (resp.tripContext) {
            setTripContext(prev => ({ ...(prev || {}), ...resp.tripContext }));
          }
          if (resp.uiActions && Array.isArray(resp.uiActions)) {
            for (const act of resp.uiActions) {
              executeAgentAction(act, { requestId: reqId });
            }
          }

          setMessages(prev => [...prev.filter(m => m.role !== 'loading'), {
            id: Date.now() + 3,
            role: 'agent',
            type: resp.type || 'answer',
            text: resp.message || "I am ready to help with your trip planning.",
            toolsUsed: resp.toolsUsed || [],
            citations: resp.citations || [],
            suggestedActions: resp.suggestedActions || [],
            structuredCards: resp.structuredCards || null,
            confirmationPayload: resp.confirmationPayload || null
          }]);
        } else {
          setMessages(prev => [...prev.filter(m => m.role !== 'loading'), {
            id: Date.now() + 4,
            role: 'agent',
            type: 'error',
            text: directRes.message || "Unable to reach Copilot. Please try again.",
            toolsUsed: [],
            citations: []
          }]);
        }
      } catch (directErr) {
        setMessages(prev => [...prev.filter(m => m.role !== 'loading'), {
          id: Date.now() + 4,
          role: 'agent',
          type: 'error',
          text: "Network error — could not reach AI Copilot. Please check connection and try again.",
          toolsUsed: [],
          citations: []
        }]);
      }
    }

    setLoading(false);
    setActiveStatus("Ready");
  }, [input, loading, tripId, activeSessionId, pageContext]);

  const handleConfirm = useCallback(() => sendMessage("yes"), [sendMessage]);
  const handleCancel = useCallback(() => sendMessage("cancel"), [sendMessage]);
  const handleSelectQuickAction = useCallback((text) => sendMessage(text), [sendMessage]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleExpandWorkspace = () => {
    navigate(`/copilot${tripId ? `?tripId=${tripId}` : ''}`);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`copilot-backdrop ${isOpen ? "copilot-backdrop--open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={`copilot-drawer ${isOpen ? "copilot-drawer--open" : ""}`} role="complementary" aria-label="AI Travel Copilot">
        {/* Header */}
        <div className="copilot-header">
          <div className="copilot-header__left">
            <div className="copilot-header__icon">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="copilot-header__title">AI Travel Copilot</p>
              <p className="copilot-header__sub">Agentic Himalayan Travel Workspace</p>
            </div>
          </div>
          <div className="copilot-header__right">
            {/* History Toggle */}
            <button
              className={`copilot-header__btn ${historyOpen ? "text-forest-green bg-emerald-50" : ""}`}
              onClick={() => setHistoryOpen(!historyOpen)}
              title="View Previous Conversations / Trips"
              aria-label="History"
            >
              <History size={17} />
            </button>

            {/* New Chat */}
            <button
              className="copilot-header__btn"
              onClick={handleNewChat}
              title="Start New Plan / Chat"
              aria-label="New Chat"
            >
              <Plus size={18} />
            </button>

            {/* Expand to Full Workspace Page */}
            <button
              className="copilot-header__btn"
              onClick={handleExpandWorkspace}
              title="Expand to Full Copilot Workspace"
              aria-label="Full Workspace"
            >
              <Maximize2 size={16} />
            </button>

            {/* Close */}
            <button
              className="copilot-header__btn"
              onClick={onClose}
              title="Close Copilot"
              aria-label="Close Copilot"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status indicator bar */}
        <div className="copilot-status">
          <span className={`copilot-status__dot ${loading ? 'active' : ''}`} />
          <span className="copilot-status__text">
            {loading ? activeStatus : "● Agent Ready · Live Data Connected"}
          </span>
        </div>

        {/* Dynamic Trip Context Strip */}
        <TripContextStrip tripContext={tripContext} />

        {/* History Overlay Panel (Slide down from header) */}
        {historyOpen && (
          <div className="copilot-history-drawer">
            <div className="copilot-history-header">
              <div className="flex items-center gap-2">
                <History size={16} className="text-forest-green" />
                <span className="text-xs font-bold text-text-dark">Past Conversations ({sessions.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="text-[11px] font-semibold text-forest-green hover:underline flex items-center gap-1"
                  onClick={handleNewChat}
                >
                  <Plus size={13} />
                  <span>New Chat</span>
                </button>
                {sessions.length > 0 && (
                  <button
                    className="text-[11px] font-semibold text-rose-600 hover:underline ml-2"
                    onClick={handleClearAllHistory}
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="copilot-history-list">
              {sessions.length === 0 ? (
                <div className="copilot-history-empty">
                  No past conversations yet. Start a new trip plan below!
                </div>
              ) : (
                sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className={`copilot-history-card ${activeSessionId === sess.id ? "copilot-history-card--active" : ""}`}
                    onClick={() => handleSelectSession(sess)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <MessageSquare size={15} className="text-forest-green flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="copilot-history-title">{sess.title || "Untitled Trip"}</p>
                        <p className="copilot-history-meta">
                          <span>{sess.destination || "Uttarakhand"}</span>
                          <span>•</span>
                          <span>{new Date(sess.updatedAt || Date.now()).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      className="copilot-history-delete-btn"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      title="Delete conversation"
                      aria-label="Delete conversation"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="copilot-messages" role="log" aria-live="polite" aria-label="Conversation">
          {messages.map((msg, index) => (
            <CopilotMessage
              key={msg.id || index}
              msg={msg}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onSelectAction={handleSelectQuickAction}
              isLatest={index === messages.length - 1}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="copilot-input-area">
          <div className="copilot-input-wrap">
            <textarea
              ref={inputRef}
              className="copilot-input"
              placeholder="Ask about your Uttarakhand trip..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={2000}
              disabled={loading}
              aria-label="Ask about your trip"
            />
            <button
              className="copilot-send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              {loading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <span className="send-arrow">➤</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}