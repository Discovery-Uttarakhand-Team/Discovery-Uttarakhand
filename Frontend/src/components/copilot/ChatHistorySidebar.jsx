import React, { useState } from 'react';
import { Plus, X, Trash2, MessageSquare, Search, Edit2, Check } from 'lucide-react';
import useChatStore from '../../store/chatStore';

const isToday = (date) => {
  const today = new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();
};

const isThisWeek = (date) => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  return date > weekAgo && !isToday(date) && !isYesterday(date);
};

export default function ChatHistorySidebar({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const { updateChatTitle } = useChatStore();

  const handleStartRename = (chat, e) => {
    e.stopPropagation();
    setEditingChatId(chat._id);
    setEditTitle(chat.title || 'Untitled Trip');
  };

  const handleSaveRename = async (chatId, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await updateChatTitle(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const safeChats = Array.isArray(chats) ? chats : [];

  const filteredChats = safeChats.filter(c => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const titleMatch = (c?.title || '').toLowerCase().includes(term);
    const msgList = Array.isArray(c?.messages) ? c.messages : [];
    const contentMatch = msgList.some(m => (m?.content || m?.text || '').toLowerCase().includes(term));
    return titleMatch || contentMatch;
  });

  const groupedChats = filteredChats.reduce((acc, chat) => {
    if (!chat) return acc;
    const date = new Date(chat.updatedAt || chat.createdAt || Date.now());
    let group = 'Older';
    if (isToday(date)) group = 'Today';
    else if (isYesterday(date)) group = 'Yesterday';
    else if (isThisWeek(date)) group = 'Last 7 days';

    if (!acc[group]) acc[group] = [];
    acc[group].push(chat);
    return acc;
  }, {});

  const groupOrder = ['Today', 'Yesterday', 'Last 7 days', 'Older'];

  return (
    <div className={`copilot-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="copilot-sidebar-header flex flex-col gap-2 p-3 border-b border-border-light">
        <div className="flex items-center justify-between gap-2">
          <button className="new-chat-btn flex-1" onClick={onNewChat}>
            <Plus size={16} className="plus-icon" />
            <span>New Chat</span>
          </button>
          {onClose && (
            <button 
              className="lg:hidden p-2 rounded-xl text-muted-text hover:text-text-dark hover:bg-black/5 transition-colors flex items-center justify-center" 
              onClick={onClose} 
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Chat Search Box */}
        <div className="relative w-full">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-text" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/70 border border-border-light focus:outline-hidden focus:border-forest-green focus:bg-white text-text-dark placeholder:text-muted-text transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-text hover:text-text-dark"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="copilot-history-list">
        {filteredChats.length === 0 ? (
          <div className="empty-history text-xs text-muted-text text-center py-6">
            {searchTerm ? 'No matching conversations' : 'No past conversations'}
          </div>
        ) : (
          groupOrder.map((group) => {
            if (!groupedChats[group] || groupedChats[group].length === 0) return null;
            return (
              <div key={group} className="history-group">
                <h4 className="history-group-title">{group}</h4>
                {groupedChats[group].map((chat) => (
                  <div
                    key={chat._id}
                    className={`history-item group ${activeChatId === chat._id ? 'active' : ''}`}
                    onClick={() => onSelectChat(chat._id)}
                  >
                    <div className="history-item-icon">
                      <MessageSquare size={14} className="text-forest-green" />
                    </div>
                    <div className="history-item-content flex-1 min-w-0">
                      {editingChatId === chat._id ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(chat._id, e);
                              if (e.key === 'Escape') setEditingChatId(null);
                            }}
                            autoFocus
                            className="w-full text-xs px-1.5 py-0.5 border border-forest-green rounded bg-white"
                          />
                          <button
                            onClick={(e) => handleSaveRename(chat._id, e)}
                            className="p-1 text-emerald-700 hover:text-emerald-900"
                            title="Save"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="history-item-title truncate">{chat.title || 'Untitled Trip'}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingChatId !== chat._id && (
                        <button
                          className="p-1 text-muted-text hover:text-forest-green transition-colors"
                          onClick={(e) => handleStartRename(chat, e)}
                          title="Rename Chat"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {onDeleteChat && (
                        <button 
                          className="delete-chat-btn p-1 text-muted-text hover:text-red-600 transition-colors" 
                          onClick={(e) => { e.stopPropagation(); onDeleteChat(chat._id); }}
                          title="Delete Chat"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
