import apiClient from './api';
import type { AdminStats } from '../types';

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },
};
