import api from './api';

export const getChats = async () => {
  const response = await api.get('/chats');
  return response.data;
};

export const getChatById = async (id) => {
  const response = await api.get(`/chats/${id}`);
  return response.data;
};

export const createChat = async (tripId, title) => {
  const response = await api.post('/chats', { tripId, title });
  return response.data;
};

export const updateChat = async (id, title) => {
  const response = await api.patch(`/chats/${id}`, { title });
  return response.data;
};

export const deleteChat = async (id) => {
  const response = await api.delete(`/chats/${id}`);
  return response.data;
};

export const sendMessage = async (chatId, content, tripId) => {
  const response = await api.post(`/chats/${chatId || 'new'}/messages`, { content, tripId });
  return response.data;
};
