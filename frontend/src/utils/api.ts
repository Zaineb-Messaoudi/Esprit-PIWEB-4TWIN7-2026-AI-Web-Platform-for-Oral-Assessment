// Single axios instance — re-exported from api/axios.js
// Import from here OR from '../api/axios' — both give the same instance.
export { default as api } from '../api/axios';

/**
 * Verify the stored JWT; attempt a silent refresh if it has expired.
 * Returns true if the session is valid, false if the user must log in again.
 */
export const ensureValidToken = async (): Promise<boolean> => {
  const token   = localStorage.getItem('token');
  const refresh = localStorage.getItem('refreshToken');

  if (!token) return false;

  try {
    const { default: axiosInstance } = await import('../api/axios');
    await axiosInstance.post('/token/verify/', { token });
    return true;
  } catch {
    // Token invalid — try refresh before clearing anything
    if (!refresh) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      return false;
    }
    try {
      const { default: axiosInstance } = await import('../api/axios');
      const { data } = await axiosInstance.post('/token/refresh/', { refresh });
      localStorage.setItem('token', data.access);
      // If backend also rotates the refresh token:
      if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
      return true;
    } catch {
      // Refresh also failed — now it's safe to clear
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      return false;
    }
  }
};