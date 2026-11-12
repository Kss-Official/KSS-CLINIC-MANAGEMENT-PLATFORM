const getApiBaseUrl = () => {
  const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : null;
  const isBrowser = typeof window !== 'undefined';
  const isRemote = isBrowser && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (envUrl && (!isRemote || !/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(envUrl))) {
    return envUrl;
  }
  if (isRemote) {
    return 'https://clinic-ms-kss-backend.vercel.app/api';
  }
  return envUrl || 'http://localhost:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  RECEPTIONIST: 'RECEPTIONIST',
  PATIENT: 'PATIENT',
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'kss_access_token',
  REFRESH_TOKEN: 'kss_refresh_token',
  USER_DATA: 'kss_user_data',
};

