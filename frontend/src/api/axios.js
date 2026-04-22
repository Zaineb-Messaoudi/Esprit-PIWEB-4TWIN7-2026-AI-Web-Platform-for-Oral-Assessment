import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auth endpoints that must NOT trigger a redirect on 401
const AUTH_URLS = ['/token/verify/', '/token/refresh/'];

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const url = error.config?.url ?? '';
    const is401 = error.response?.status === 401;
    const isAuthCall = AUTH_URLS.some((u) => url.includes(u));

    // Only redirect if it's a real API call that got rejected, not verify/refresh itself
    if (is401 && !isAuthCall) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('classId');
      window.location.href = '/auth';
    }

    return Promise.reject(error);
  },
);

export default api;