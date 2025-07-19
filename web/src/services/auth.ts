/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data.data;
  }

  async register(email: string, password: string, name: string) {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data.data;
  }

  async logout(refreshToken: string) {
    await this.api.post('/auth/logout', { refreshToken });
  }

  async refreshToken(refreshToken: string) {
    const response = await this.api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  }

  async getProfile() {
    const response = await this.api.get('/auth/profile');
    return response.data.data;
  }

  async updateProfile(data: { name?: string }) {
    const response = await this.api.put('/auth/profile', data);
    return response.data.data;
  }

  // Setup interceptor for automatic token refresh
  setupInterceptor(onRefresh: () => Promise<void>) {
    const interceptor = this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await onRefresh();
            const token = localStorage.getItem('accessToken');
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return interceptor;
  }

  removeInterceptor(interceptor: number) {
    this.api.interceptors.response.eject(interceptor);
  }
}

export const authService = new AuthService();