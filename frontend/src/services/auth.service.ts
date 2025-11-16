import apiClient from './api';
import {
  SignupRequest,
  SignupResponse,
  VerifyRequest,
  User,
  OnboardingData,
} from '../types';

export const authService = {
  signup: async (data: SignupRequest): Promise<SignupResponse> => {
    const response = await apiClient.post<SignupResponse>('/auth/signup', data);
    return response.data;
  },

  verify: async (data: VerifyRequest): Promise<{ userId: string }> => {
    const response = await apiClient.post('/auth/verify', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User | null> => {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;
    
    try {
      const response = await apiClient.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  completeOnboarding: async (data: OnboardingData): Promise<void> => {
    await apiClient.post('/onboarding', data);
  },

  updateOnboarding: async (data: Partial<OnboardingData>): Promise<void> => {
    await apiClient.patch('/onboarding', data);
  },

  logout: (): void => {
    localStorage.removeItem('userId');
    localStorage.removeItem('adminToken');
  },
};
