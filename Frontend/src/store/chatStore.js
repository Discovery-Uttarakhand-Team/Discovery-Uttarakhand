import { create } from 'zustand';
import * as chatApi from '../api/chatApi';
import { streamAgentMessage } from '../api/agentApi';
import { executeAgentAction, setActiveRequestId } from '../utils/agentActionExecutor';

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  loading: false,
  error: null,
  sending: false,
  agentSessionId: sessionStorage.getItem('agentSessionId') || null,
  agentStatus: null,
  agentStreaming: false,
  streamAbortController: null,

  fetchChats: async () => {
    set({ loading: true, error: null });
    try {
      const res = await chatApi.getChats();
      const chatList = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      set({ chats: chatList, loading: false });
    } catch (error) {
      set({ chats: [], error: error.message || 'Failed to fetch chats', loading: false });
    }
  },

  fetchChatById: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await chatApi.getChatById(id);
      const chatObj = res?.data || res || null;
      set({ activeChat: chatObj, loading: false });
    } catch (error) {
      set({ error: error.message || 'Failed to fetch chat', loading: false });
    }
  },

  setActiveChat: (chat) => {
    set({ activeChat: chat });
  },

  clearActiveChat: () => {
    set({ activeChat: null });
  },

  createChat: async (tripId, title) => {
    set({ loading: true, error: null });
    try {
      const { data } = await chatApi.createChat(tripId, title);
      set((state) => ({ chats: [data, ...state.chats], activeChat: data, loading: false }));
      return data;
    } catch (error) {
      set({ error: error.message || 'Failed to create chat', loading: false });
    }
  },

  updateChatTitle: async (id, title) => {
    try {
      const { data } = await chatApi.updateChat(id, title);
      set((state) => ({
        chats: state.chats.map(c => c._id === id ? data : c),
        activeChat: state.activeChat?._id === id ? { ...state.activeChat, title: data.title } : state.activeChat
      }));
    } catch (error) {
      set({ error: error.message || 'Failed to update chat title' });
    }
  },

  deleteChat: async (id) => {
    try {
      await chatApi.deleteChat(id);
      set((state) => ({
        chats: state.chats.filter(c => c._id !== id),
        activeChat: state.activeChat?._id === id ? null : state.activeChat
      }));
    } catch (error) {
      set({ error: error.message || 'Failed to delete chat' });
    }
  },

  sendMessage: async (chatId, content, tripId, pageContext) => {
    set({ sending: true, error: null, agentStatus: 'Thinking...', agentStreaming: true });

    const reqId = "req_" + Date.now();
    setActiveRequestId(reqId);

    const currentChatId = (chatId && chatId !== 'temp' && chatId !== 'new') ? chatId : null;
    const tempUserMsg = {
      _id: Date.now().toString(),
      role: 'user',
      content,
      provenance: 'USER',
      createdAt: new Date().toISOString()
    };
    
    const tempAssistantMsgId = (Date.now() + 1).toString();
    const initialAssistantMsg = {
      _id: tempAssistantMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString()
    };

    if (currentChatId && get().activeChat && get().activeChat._id === currentChatId) {
      set((state) => ({
        activeChat: { ...state.activeChat, messages: [...(state.activeChat.messages || []), tempUserMsg, initialAssistantMsg] }
      }));
    } else {
      set({ activeChat: { _id: currentChatId || 'temp', title: content.slice(0, 30), messages: [tempUserMsg, initialAssistantMsg] } });
    }

    const controller = new AbortController();
    set({ streamAbortController: controller });

    try {
      await streamAgentMessage({
        message: content,
        tripId,
        sessionId: get().agentSessionId,
        chatId: currentChatId,
        pageContext,
        signal: controller.signal,
        onUpdate: (event) => {
          if (event.type === 'status' || event.type === 'tool_status') {
            set({ agentStatus: event.message || event.status });
          } else if (event.type === 'ui_action' && event.action) {
            executeAgentAction(event.action, { requestId: event.requestId || reqId });
          } else if (event.type === 'chunk') {
            set({ agentStatus: null });
            set((state) => {
              const msgs = [...(state.activeChat?.messages || [])];
              const last = msgs[msgs.length - 1];
              if (last && last.role === 'assistant') {
                msgs[msgs.length - 1] = { ...last, content: last.content + event.text };
              }
              return { activeChat: { ...state.activeChat, messages: msgs } };
            });
          } else if (event.type === 'done') {
            const res = event;
            if (res.sessionId) {
              sessionStorage.setItem('agentSessionId', res.sessionId);
              set({ agentSessionId: res.sessionId });
            }
            if (res.response?.uiActions && Array.isArray(res.response.uiActions)) {
              for (const act of res.response.uiActions) {
                executeAgentAction(act, { requestId: res.requestId || reqId });
              }
            }
            if (res.chat) {
              set((state) => {
                let newChats = [...state.chats];
                const existingIdx = newChats.findIndex(c => c._id === res.chat._id);
                if (existingIdx >= 0) newChats.splice(existingIdx, 1);
                newChats.unshift(res.chat);
                return { activeChat: res.chat, chats: newChats, sending: false, agentStatus: null, agentStreaming: false, streamAbortController: null };
              });
            } else {
              set((state) => {
                const msgs = [...(state.activeChat?.messages || [])];
                const last = msgs[msgs.length - 1];
                if (last && last.role === 'assistant') {
                  // Prefer already-streamed content; only fall back to response.message
                  // if no streaming content was received (e.g. non-streaming fallback path)
                  const finalContent = last.content || res.response?.message || 'I could not generate a response.';
                  msgs[msgs.length - 1] = {
                    ...last,
                    content: finalContent,
                    provenance: res.response?.confidence === 'grounded' ? 'GROUNDED' : 'FALLBACK',
                    evidenceRefs: (res.response?.citations || []).map(c => typeof c === 'string' ? c : (c.title || c.source || JSON.stringify(c))),
                    metadata: {
                      type: res.response?.type,
                      toolsUsed: res.response?.toolsUsed || [],
                      citations: res.response?.citations || [],
                      suggestedActions: res.response?.suggestedActions || [],
                      structuredCards: res.response?.structuredCards || null,
                      tripContext: res.response?.tripContext || null,
                      confidence: res.response?.confidence,
                      meta: res.response?.meta
                    }
                  };
                }
                return { activeChat: { ...state.activeChat, messages: msgs }, sending: false, agentStatus: null, agentStreaming: false, streamAbortController: null };
              });
            }
          } else if (event.type === 'error') {
            set((state) => {
              const msgs = [...(state.activeChat?.messages || [])];
              const last = msgs[msgs.length - 1];
              if (last && last.role === 'assistant') {
                msgs[msgs.length - 1] = {
                  ...last,
                  content: event.message || 'Sorry, something went wrong. Please try again.',
                  isError: true
                };
              }
              return { activeChat: { ...state.activeChat, messages: msgs }, sending: false, agentStatus: null, agentStreaming: false, streamAbortController: null };
            });
          } else if (event.type === 'aborted') {
            set({ sending: false, agentStatus: null, agentStreaming: false, streamAbortController: null });
          }
        }
      });
    } catch (error) {
      if (error.name === 'AbortError') return;
      set({ error: error.message || 'Failed to send message', sending: false, agentStatus: null, agentStreaming: false, streamAbortController: null });
    }
  },

  abortStream: () => {
    const { streamAbortController } = get();
    if (streamAbortController) {
      streamAbortController.abort();
    }
  }
}));

export default useChatStore;
