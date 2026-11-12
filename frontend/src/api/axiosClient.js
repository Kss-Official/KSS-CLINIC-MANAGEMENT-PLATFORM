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
    // Never attach auth token for public endpoints like contact form
    if (config.skipAuth || config.url?.includes('/contact')) {
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers['Authorization'];
      }
      return config;
    }

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
      // If user was intentionally logging out or calling logout API, do not redirect to /login
      const isLogoutRequest = error.config?.url?.includes('/auth/logout');
      const publicPaths = [
        '/',
        '/book-appointment',
        '/about',
        '/services',
        '/stories',
        '/contact',
        '/login',
        '/admin-login',
        '/register',
      ];
      const isPublicPath = typeof window !== 'undefined' && publicPaths.some(
        (p) => window.location.pathname === p || window.location.pathname.startsWith(p + '/')
      );
      if (
        !isLogoutRequest &&
        typeof window !== 'undefined' &&
        !isPublicPath
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// In-flight GET request deduplication to prevent duplicate parallel API requests
const originalGet = axiosClient.get.bind(axiosClient);
const inFlightGetRequests = new Map();

axiosClient.get = function (url, config = {}) {
  // Only deduplicate simple GET requests without custom signal/cancellation
  if (config?.cancelToken || config?.signal) {
    return originalGet(url, config);
  }

  const paramStr = config?.params ? JSON.stringify(config.params) : '';
  const key = `${url}?${paramStr}`;

  if (inFlightGetRequests.has(key)) {
    return inFlightGetRequests.get(key);
  }

  const requestPromise = originalGet(url, config).finally(() => {
    inFlightGetRequests.delete(key);
  });

  inFlightGetRequests.set(key, requestPromise);
  return requestPromise;
};

export default axiosClient;

