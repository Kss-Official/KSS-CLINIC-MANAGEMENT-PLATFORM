import { create } from 'zustand';
import { STORAGE_KEYS } from '../utils/constants';

// Clear legacy persistent auth items from localStorage to prevent lingering sessions
try {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem('kss_patient_phone');
  localStorage.removeItem('kss_patient_email');
  localStorage.removeItem('kss_patient_name');
  localStorage.removeItem('kss_patient_id');
  localStorage.removeItem('kss_last_appointment_id');
} catch (e) {}

let storedUser = null;
try {
  const raw = sessionStorage.getItem(STORAGE_KEYS.USER_DATA);
  storedUser = raw && raw !== 'undefined' && raw !== 'null' ? JSON.parse(raw) : null;
} catch (e) {
  storedUser = null;
}
const storedToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

export const useAppStore = create((set) => ({
  user: storedUser,
  token: storedToken || null,
  isAuthenticated: !!storedToken,

  setAuth: (user, token) => {
    sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem('kss_patient_phone');
      localStorage.removeItem('kss_patient_email');
      localStorage.removeItem('kss_patient_name');
      localStorage.removeItem('kss_patient_id');
      localStorage.removeItem('kss_last_appointment_id');
    } catch (e) {}
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    sessionStorage.removeItem(STORAGE_KEYS.USER_DATA);
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem('kss_patient_phone');
    sessionStorage.removeItem('kss_patient_email');
    sessionStorage.removeItem('kss_patient_name');
    sessionStorage.removeItem('kss_patient_id');
    sessionStorage.removeItem('kss_last_appointment_id');
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem('kss_patient_phone');
      localStorage.removeItem('kss_patient_email');
      localStorage.removeItem('kss_patient_name');
      localStorage.removeItem('kss_patient_id');
      localStorage.removeItem('kss_last_appointment_id');
    } catch (e) {}
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updatedUser) => {
    sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

export default useAppStore;

