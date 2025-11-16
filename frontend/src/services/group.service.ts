import apiClient from './api';
import { Group, Thread, Reply } from '../types';

export const groupService = {
  // Groups
  listGroups: async (params?: {
    search?: string;
    category?: string;
    tag?: string;
  }): Promise<Group[]> => {
    const response = await apiClient.get('/groups', { params });
    return response.data;
  },

  getGroup: async (id: string): Promise<Group> => {
    const response = await apiClient.get(`/groups/${id}`);
    return response.data;
  },

  createGroup: async (data: {
    name: string;
    description: string;
    category: string;
    tags: string[];
  }): Promise<Group> => {
    const response = await apiClient.post('/groups', data);
    return response.data;
  },

  joinGroup: async (id: string): Promise<void> => {
    await apiClient.post(`/groups/${id}/join`);
  },

  leaveGroup: async (id: string): Promise<void> => {
    await apiClient.post(`/groups/${id}/leave`);
  },

  getMembers: async (id: string): Promise<any[]> => {
    const response = await apiClient.get(`/groups/${id}/members`);
    return response.data;
  },

  getRecommendations: async (): Promise<any[]> => {
    const response = await apiClient.get('/groups/recommendations');
    return response.data;
  },

  // Threads
  listThreads: async (groupId: string): Promise<Thread[]> => {
    const response = await apiClient.get(`/groups/${groupId}/threads`);
    return response.data;
  },

  getThread: async (groupId: string, threadId: string): Promise<Thread> => {
    const response = await apiClient.get(`/groups/${groupId}/threads/${threadId}`);
    return response.data;
  },

  createThread: async (
    groupId: string,
    data: {
      title: string;
      content: string;
      contentType?: string;
      attachments?: any[];
    }
  ): Promise<Thread> => {
    const response = await apiClient.post(`/groups/${groupId}/threads`, data);
    return response.data;
  },

  deleteThread: async (groupId: string, threadId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/threads/${threadId}`);
  },

  pinThread: async (
    groupId: string,
    threadId: string,
    pinned: boolean
  ): Promise<void> => {
    await apiClient.patch(`/groups/${groupId}/threads/${threadId}/pin`, { pinned });
  },

  lockThread: async (
    groupId: string,
    threadId: string,
    locked: boolean
  ): Promise<void> => {
    await apiClient.patch(`/groups/${groupId}/threads/${threadId}/lock`, { locked });
  },

  // Replies
  listReplies: async (groupId: string, threadId: string): Promise<Reply[]> => {
    const response = await apiClient.get(
      `/groups/${groupId}/threads/${threadId}/replies`
    );
    return response.data;
  },

  createReply: async (
    groupId: string,
    threadId: string,
    data: {
      content: string;
      contentType?: string;
      attachments?: any[];
    }
  ): Promise<Reply> => {
    const response = await apiClient.post(
      `/groups/${groupId}/threads/${threadId}/replies`,
      data
    );
    return response.data;
  },

  deleteReply: async (
    groupId: string,
    threadId: string,
    replyId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/groups/${groupId}/threads/${threadId}/replies/${replyId}`
    );
  },

  // Moderation
  addModerator: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.post(`/groups/${groupId}/moderators`, { userId });
  },

  removeModerator: async (groupId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/moderators/${userId}`);
  },
};
