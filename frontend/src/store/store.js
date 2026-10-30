import { create } from 'zustand';
import { STORAGE_KEYS } from '../utils/constants';

const storedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

export const useAppStore = create((set) => ({
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,

  setAuth: (user, token) => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updatedUser) => {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },
}));

export default useAppStore;

