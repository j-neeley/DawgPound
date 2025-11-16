import apiClient from './api';
import type { Chat, Message } from '../types';

export const messagingService = {
  // Chats
  listChats: async (): Promise<Chat[]> => {
    const response = await apiClient.get('/chats');
    return response.data;
  },

  getChat: async (chatId: string): Promise<Chat> => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data;
  },

  createChat: async (data: {
    name: string;
    avatar?: string;
    participantIds: string[];
  }): Promise<Chat> => {
    const response = await apiClient.post('/chats', data);
    return response.data;
  },

  updateChat: async (
    chatId: string,
    data: { name?: string; avatar?: string }
  ): Promise<Chat> => {
    const response = await apiClient.patch(`/chats/${chatId}`, data);
    return response.data;
  },

  addParticipant: async (chatId: string, userId: string): Promise<void> => {
    await apiClient.post(`/chats/${chatId}/participants`, { userId });
  },

  removeParticipant: async (chatId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/chats/${chatId}/participants/${userId}`);
  },

  muteChat: async (chatId: string, mute: boolean): Promise<void> => {
    await apiClient.post(`/chats/${chatId}/mute`, { mute });
  },

  // Messages
  listMessages: async (
    chatId: string,
    limit: number = 100
  ): Promise<Message[]> => {
    const response = await apiClient.get(`/chats/${chatId}/messages`, {
      params: { limit },
    });
    return response.data;
  },

  sendMessage: async (chatId: string, content: string): Promise<Message> => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, {
      content,
    });
    return response.data;
  },
};
