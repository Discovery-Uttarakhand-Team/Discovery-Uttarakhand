import Chat from '../models/Chat.js';
import { ChatService } from '../services/chatService.js';

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user._id })
      .select('-messages') // Don't load full messages for the sidebar
      .sort({ updatedAt: -1 })
      .limit(50);
    
    res.status(200).json({ success: true, data: chats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chats' });
  }
};

export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, userId: req.user._id });
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch chat' });
  }
};

export const createChat = async (req, res) => {
  try {
    const { tripId, title } = req.body;
    const chat = await Chat.create({
      userId: req.user._id,
      tripId: tripId || null,
      title: title || 'New Conversation'
    });
    res.status(201).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create chat' });
  }
};

export const updateChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title },
      { new: true, runValidators: true }
    );
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.status(200).json({ success: true, data: chat });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update chat' });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete chat' });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, tripId } = req.body;
    const chatId = req.params.id === 'new' ? null : req.params.id;
    
    if (!content) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const updatedChat = await ChatService.sendMessage(chatId, req.user._id, content, tripId);
    
    res.status(200).json({ success: true, data: updatedChat });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send message' });
  }
};
