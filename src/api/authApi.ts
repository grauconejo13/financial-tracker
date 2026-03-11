import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface User {
  id: string;
  email: string;
  role: 'student' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

const api = axios.create({
  baseURL: `${API_BASE}/auth`,
  headers: { 'Content-Type': 'application/json' }
});

export const register = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/register', { email, password });
  return data;
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const { data } = await api.post<AuthResponse>('/login', { email, password });
  return data;
};

export const logout = async (token: string): Promise<void> => {
  await api.post('/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
};

export const getCurrentUser = async (token: string): Promise<{ user: User }> => {
  const { data } = await api.get<{ user: User }>('/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};
