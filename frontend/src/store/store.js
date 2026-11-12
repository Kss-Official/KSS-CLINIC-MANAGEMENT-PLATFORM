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
    try {
      // Purge any lingering patient cache from previous session
      sessionStorage.removeItem('kss_patient_phone');
      sessionStorage.removeItem('kss_patient_email');
      sessionStorage.removeItem('kss_patient_name');
      sessionStorage.removeItem('kss_patient_id');
      sessionStorage.removeItem('kss_last_appointment_id');
      localStorage.removeItem('kss_patient_phone');
      localStorage.removeItem('kss_patient_email');
      localStorage.removeItem('kss_patient_name');
      localStorage.removeItem('kss_patient_id');
      localStorage.removeItem('kss_last_appointment_id');
      localStorage.removeItem('kss_reschedule_appointment');
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (e) {}

    sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    try {
      sessionStorage.clear();
      localStorage.removeItem(STORAGE_KEYS.USER_DATA);
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem('kss_patient_phone');
      localStorage.removeItem('kss_patient_email');
      localStorage.removeItem('kss_patient_name');
      localStorage.removeItem('kss_patient_id');
      localStorage.removeItem('kss_last_appointment_id');
      localStorage.removeItem('kss_reschedule_appointment');
    } catch (e) {}
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updatedUser) => {
    if (!updatedUser) return;
    set((state) => {
      // Guard against cross-user updates: only block if both users have distinct, conflicting IDs
      if (state.user?.id && updatedUser.id && String(state.user.id) !== String(updatedUser.id)) {
        console.warn('Blocked attempt to overwrite auth user with different user ID');
        return state;
      }
      const mergedUser = { ...(state.user || {}), ...updatedUser };
      sessionStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mergedUser));
      return { user: mergedUser };
    });
  },
}));

export default useAppStore;

