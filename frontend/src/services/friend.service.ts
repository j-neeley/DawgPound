import apiClient from './api';
import { FriendRequest, Friendship, User } from '../types';

export const friendService = {
  // Friend Requests
  sendFriendRequest: async (userId: string): Promise<FriendRequest> => {
    const response = await apiClient.post('/friends/requests', { userId });
    return response.data;
  },

  listIncomingRequests: async (): Promise<FriendRequest[]> => {
    const response = await apiClient.get('/friends/requests/incoming');
    return response.data;
  },

  listOutgoingRequests: async (): Promise<FriendRequest[]> => {
    const response = await apiClient.get('/friends/requests/outgoing');
    return response.data;
  },

  acceptRequest: async (requestId: string): Promise<void> => {
    await apiClient.post(`/friends/requests/${requestId}/accept`);
  },

  declineRequest: async (requestId: string): Promise<void> => {
    await apiClient.post(`/friends/requests/${requestId}/decline`);
  },

  cancelRequest: async (requestId: string): Promise<void> => {
    await apiClient.delete(`/friends/requests/${requestId}`);
  },

  // Friends
  listFriends: async (): Promise<Friendship[]> => {
    const response = await apiClient.get('/friends');
    return response.data;
  },

  addFriend: async (friendId: string): Promise<void> => {
    await apiClient.post('/friends', { friendId });
  },

  removeFriend: async (friendId: string): Promise<void> => {
    await apiClient.delete(`/friends/${friendId}`);
  },

  // Blocking
  blockUser: async (userId: string): Promise<void> => {
    await apiClient.post('/friends/block', { userId });
  },

  listBlockedUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/friends/blocked');
    return response.data;
  },

  unblockUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/friends/block/${userId}`);
  },
};
