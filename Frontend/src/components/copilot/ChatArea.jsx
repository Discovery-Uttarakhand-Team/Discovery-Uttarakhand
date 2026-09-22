import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Info, Loader2, ChevronLeft, Sparkles, Copy, Check } from 'lucide-react';
import useChatStore from '../../store/chatStore';
import { useMapStore } from '../../store/mapStore';
import StructuredTravelCards from './StructuredTravelCards';
import TripContextStrip from './TripContextStrip';

import { executeAgentAction } from '../../utils/agentActionExecutor';

export default function ChatArea({ activeChat, tripIdContext, onToggleSidebar, onToggleContext }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const { sendMessage, sending, error, agentStatus, agentStreaming, abortStream } = useChatStore();
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [openTraceIndex, setOpenTraceIndex] = useState(null);

  const toggleTrace = (idx) => {
    setOpenTraceIndex(prev => prev === idx ? null : idx);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAutoScroll) scrollToBottom();
  }, [activeChat?.messages, sending, error, agentStatus]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAutoScroll(isNearBottom);
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSend = async (contentStr) => {
    if (!contentStr.trim() || sending) return;
    setInput('');

    const pageContext = {
      currentRoute: window.location?.pathname || '/copilot',
      currentPage: 'COPILOT',
      pageType: 'COPILOT',
      tripId: activeChat?.tripId || tripIdContext,
      plannerForm: useMapStore.getState().plannerForm
    };
    
    try {
      await sendMessage(activeChat?._id, contentStr, activeChat?.tripId || tripIdContext, pageContext);
    } catch (err) {
      setInput(contentStr); // restore input on failure
      console.error("Chat error:", err);
    }
  };

  const handleActionClick = (act) => {
    if (act && typeof act === 'object' && act.type) {
      executeAgentAction(act, { navigate });
    }
    const messageToSend = typeof act === 'object' ? (act.message || act.label) : act;
    if (messageToSend) {
      handleSend(messageToSend);
    }
  };

  const onSubmitForm = (e) => {
    e.preventDefault();
    handleSend(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  // Adjust textarea height automatically
  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const suggestions = [
    "Plan a trip to Valley of Flowers",
    "Badrinath ka weather kaisa hai?",
    "Find peaceful stays in Mussoorie",
    "Delhi se Pithoragarh road route"
  ];

  // Derive latest tripContext from messages
  const latestTripContext = (activeChat?.messages || []).slice().reverse().find(m => m?.metadata?.tripContext)?.metadata?.tripContext || null;

  const messagesList = Array.isArray(activeChat?.messages) ? activeChat.messages : [];

  return (
    <div className="copilot-chat-area">
      <div className="chat-header flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-1 text-xs font-bold text-muted-text hover:text-forest-green transition-colors px-2 py-1 rounded-lg hover:bg-black/5"
            title="Go Back"
          >
            <ChevronLeft size={16} /> <span className="hidden sm:inline">Back</span>
          </button>
          <button className="mobile-toggle flex items-center gap-1.5" onClick={onToggleSidebar}>
            <MessageSquare size={14} /> <span>Chats</span>
          </button>
        </div>

        <div className="chat-title text-center">
          <div className="chat-title-main font-display font-bold text-text-dark flex items-center justify-center gap-1.5">
            <Sparkles size={16} className="text-emerald-700" />
            <span>AI Travel Copilot</span>
          </div>
          <div className="chat-title-sub text-xs text-muted-text">Himalayan Travel Companion · Verified Local Intelligence</div>
        </div>

        <button className="mobile-toggle flex items-center gap-1.5" onClick={onToggleContext}>
          <Info size={14} /> <span>Trip</span>
        </button>
      </div>

      {latestTripContext && <TripContextStrip tripContext={latestTripContext} />}

      <div className="chat-messages-container" onScroll={handleScroll}>
        {messagesList.length === 0 ? (
          <div className="chat-empty-state">
            <div className="empty-icon">🌿</div>
            <h2>Namaste 👋</h2>
            <p>Uttarakhand trip plan karna hai? Bas destination batao — main route, weather, stays aur budget organize kar dunga.</p>
            <div className="suggestion-btns">
              {suggestions.map((sug, i) => (
                <button key={i} className="suggestion-btn" onClick={() => handleSend(sug)}>
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-messages">
            {messagesList.map((msg, idx) => {
              if (!msg) return null;
              const isUser = msg.role === 'user';
              const meta = msg.metadata || {};
              const toolsUsed = meta.toolsUsed || msg.toolsUsed || [];
              const toolCount = meta.toolCount !== undefined ? meta.toolCount : toolsUsed.length;
              const citations = meta.citations || msg.evidenceRefs || [];
              const citationCount = meta.citationCount !== undefined ? meta.citationCount : citations.length;
              const suggestedActions = meta.suggestedActions || [];
              const structuredCards = meta.structuredCards || null;
              const provenance = msg.provenance || (meta.confidence === 'grounded' ? 'GROUNDED' : null);

              return (
                <div key={idx} className={`chat-bubble-wrapper ${isUser ? 'user' : 'assistant'}`}>
                  {!isUser && <div className="assistant-avatar">🌿</div>}
                  <div className={`chat-bubble ${msg.role}`}>
                    {provenance && !isUser && (
                      <div className="msg-provenance-bar flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`provenance-tag ${provenance.toLowerCase()}`}>
                            {provenance === 'GROUNDED' ? '✓ Verified Local Data' : provenance}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopy(msg.content, idx)}
                          className="copy-msg-btn text-muted-text hover:text-text-dark flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded hover:bg-black/5 transition-colors"
                          title="Copy response"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={12} className="text-emerald-700" />
                              <span className="text-emerald-700 font-semibold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <div 
                      className="bubble-content" 
                      style={{ color: msg.isError ? '#e53e3e' : undefined }}
                      dangerouslySetInnerHTML={{ 
                        __html: msg.content 
                          ? msg.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/^- (.*$)/gim, '<div class="list-bullet">• $1</div>')
                              .replace(/\n\n/g, '<div class="msg-para-break"></div>')
                              .replace(/\n/g, "<br/>") 
                          : "" 
                      }}
                    />

                    {structuredCards && <StructuredTravelCards cards={structuredCards} />}

                    {/* Grounded Agentic Reasoning & Citations (Collapsible) */}
                    {!isUser && (toolsUsed.length > 0 || citations.length > 0) && (
                      <div className="copilot-reasoning-wrap mt-2.5">
                        <button
                          type="button"
                          className="copilot-reasoning-toggle w-full flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-100/70 transition-colors text-xs text-left"
                          onClick={() => toggleTrace(idx)}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-emerald-700 font-bold">⚡</span>
                            <span className="font-semibold text-xs text-emerald-900 truncate">
                              Verified with {toolCount} Agent Tools &amp; {citationCount} Grounded Sources
                            </span>
                          </div>
                          <span className="text-[11px] text-muted-text font-bold flex-shrink-0 ml-2">
                            {openTraceIndex === idx ? "Hide details ▲" : "View grounding ▼"}
                          </span>
                        </button>

                        {openTraceIndex === idx && (
                          <div className="copilot-reasoning-panel mt-1.5 p-2.5 bg-slate-900 text-slate-200 rounded-lg text-xs space-y-2 font-mono shadow-inner">
                            {toolsUsed.length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">
                                  Deterministic Tools Executed ({toolCount})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {toolsUsed.map((tool, tIdx) => (
                                    <span key={tIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 text-[11px]">
                                      ⚡ {tool}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {citations.length > 0 && (
                              <div>
                                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">
                                  Verified Grounded Sources ({citationCount})
                                </div>
                                <div className="space-y-0.5 text-[11px] text-slate-300">
                                  {citations.map((c, cIdx) => {
                                    const sourceText = typeof c === 'string' ? c : (c.source || c.title || JSON.stringify(c));
                                    return (
                                      <div key={cIdx} className="truncate">
                                        • {sourceText}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Confidence: {meta.confidence || 'grounded'}</span>
                              <span>Provider: {meta.provider || 'omniroute'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contextual Recommendation Action Chips */}
                    {suggestedActions.length > 0 && !isUser && (
                      <div className="suggested-actions-container mt-3 flex flex-wrap gap-1.5">
                        {suggestedActions.map((act, aIdx) => {
                          const label = typeof act === 'string' ? act : (act.label || act.title || JSON.stringify(act));
                          return (
                            <button
                              key={aIdx}
                              className="suggested-action-btn px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                              onClick={() => handleActionClick(act)}
                              disabled={sending}
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
            })}
            {agentStreaming && agentStatus && (
              <div className="chat-bubble-wrapper assistant">
                <div className="assistant-avatar">🌿</div>
                <div className="chat-bubble assistant thinking-pill inline-flex items-center gap-2 py-2 px-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium shadow-sm animate-pulse">
                  <Loader2 size={14} className="animate-spin text-emerald-700" />
                  <span>{agentStatus}</span>
                </div>
              </div>
            )}
            {agentStreaming && (
              <div className="flex justify-center mt-2 mb-4">
                 <button onClick={abortStream} className="text-xs flex items-center gap-1.5 border border-gray-300 rounded px-3 py-1.5 hover:bg-gray-100 transition-colors shadow-sm bg-white text-gray-700">
                    <div className="w-2 h-2 bg-red-500 rounded-sm"></div> Stop generating
                 </button>
              </div>
            )}
            {error && (
              <div className="chat-error">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="chat-input-area">
        <form onSubmit={onSubmitForm} className="chat-input-form">
          <textarea 
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your Uttarakhand trip..."
            disabled={sending}
            rows={1}
          />
          <button type="submit" disabled={!input.trim() || sending} className="send-btn">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
