import apiClient from './api';
import { User, DiscoveryFeed } from '../types';

export const discoveryService = {
  getUserRecommendations: async (): Promise<any[]> => {
    const response = await apiClient.get('/users/recommendations');
    return response.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await apiClient.get('/users/search', {
      params: { q: query },
    });
    return response.data;
  },

  getDiscoveryFeed: async (): Promise<DiscoveryFeed> => {
    const response = await apiClient.get('/discovery/feed');
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },
};
