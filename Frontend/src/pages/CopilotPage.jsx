import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useChatStore from '../store/chatStore';
import ChatHistorySidebar from '../components/copilot/ChatHistorySidebar';
import ChatArea from '../components/copilot/ChatArea';
import TripContextPanel from '../components/copilot/TripContextPanel';
import Navbar from '../components/Navbar';
import './CopilotPage.css';

export default function CopilotPage() {
  const [searchParams] = useSearchParams();
  const tripIdParam = searchParams.get('tripId');

  const {
    chats,
    activeChat,
    fetchChats,
    fetchChatById,
    createChat,
    clearActiveChat,
    deleteChat
  } = useChatStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);

  useEffect(() => {
    fetchChats();
    // We do NOT automatically create a new chat on load if there isn't one.
    // The user will see a "New Chat" screen in the center.
    return () => clearActiveChat();
  }, [fetchChats, clearActiveChat]);

  const handleSelectChat = async (chatId) => {
    await fetchChatById(chatId);
    setSidebarOpen(false); // close mobile sidebar
  };

  const handleNewChat = () => {
    try {
      sessionStorage.removeItem('agentSessionId');
    } catch {}
    useChatStore.setState({ agentSessionId: null });
    clearActiveChat();
    setSidebarOpen(false);
  };

  return (
    <div className="copilot-page-wrapper">
      <Navbar />
      <div className="copilot-layout">
        
        {/* Left Column: History */}
        <div className={`copilot-col-left ${sidebarOpen ? 'open' : ''}`}>
          <ChatHistorySidebar 
            chats={chats}
            activeChatId={activeChat?._id}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            onDeleteChat={deleteChat}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Center Column: Chat Area */}
        <div className="copilot-col-center">
          <ChatArea 
            activeChat={activeChat} 
            tripIdContext={tripIdParam}
            onToggleSidebar={() => setSidebarOpen(true)}
            onToggleContext={() => setContextOpen(true)}
          />
        </div>

        {/* Right Column: Trip Context */}
        <div className={`copilot-col-right ${contextOpen ? 'open' : ''}`}>
          <TripContextPanel 
            tripId={activeChat?.tripId || tripIdParam} 
            isOpen={contextOpen}
            onClose={() => setContextOpen(false)}
          />
        </div>

      </div>
    </div>
  );
}
