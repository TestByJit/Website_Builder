import { useAuthStore } from './authStore';
import { useRouter } from 'next/navigation';

function getApiUrl() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('backend_url');
    if (stored) return stored;
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
}

let router: ReturnType<typeof useRouter>;

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${getApiUrl()}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    login: (email: string, password: string) =>
      fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    logout: () =>
      fetchWithAuth('/auth/logout', {
        method: 'POST',
      }),

    me: () => fetchWithAuth('/auth/me'),

    refresh: () =>
      fetchWithAuth('/auth/refresh', {
        method: 'POST',
      }),
  },

  templates: {
    list: () => fetchWithAuth('/templates'),
    get: (id: string) => fetchWithAuth(`/templates/${id}`),
  },

  sites: {
    list: () => fetchWithAuth('/sites'),
    get: (id: string) => fetchWithAuth(`/sites/${id}`),
    create: (templateId: string, siteName: string, details: Record<string, string>) =>
      fetchWithAuth('/sites', {
        method: 'POST',
        body: JSON.stringify({ templateId, siteName, details }),
      }),
    getBuildLogs: (id: string) => fetchWithAuth(`/sites/${id}/build-logs`),
    redeploy: (id: string) =>
      fetchWithAuth(`/sites/${id}/redeploy`, {
        method: 'POST',
      }),
  },
};

export async function checkAuth() {
  try {
    const data = await api.auth.me();
    useAuthStore.getState().setUser(data.user);
    return true;
  } catch (error) {
    useAuthStore.getState().logout();
    return false;
  }
}
