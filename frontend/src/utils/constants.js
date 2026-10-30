export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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

