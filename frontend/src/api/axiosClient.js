import axios from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT auth token
axiosClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      const authVal = token.startsWith('Token ') || token.startsWith('Bearer ') ? token : `Token ${token}`;
      if (config.headers && typeof config.headers.set === 'function') {
        config.headers.set('Authorization', authVal);
      } else {
        config.headers = config.headers || {};
        config.headers.Authorization = authVal;
        config.headers['Authorization'] = authVal;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors (e.g. 401 Unauthorized)
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
      try {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      } catch (e) {}
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/admin-login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;

