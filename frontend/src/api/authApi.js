import axiosClient from './axiosClient';

export const authApi = {
  login: async (credentials) => {
    const portal = credentials?.portal;
    const url = portal === 'admin' ? '/auth/admin/login/' : portal === 'patient' ? '/auth/patient/login/' : '/auth/login/';
    const response = await axiosClient.post(url, credentials);
    return response.data;
  },

  adminLogin: async (credentials) => {
    const payload = { ...credentials, portal: 'admin' };
    const response = await axiosClient.post('/auth/admin/login/', payload);
    return response.data;
  },

  patientLogin: async (credentials) => {
    const payload = { ...credentials, portal: 'patient' };
    const response = await axiosClient.post('/auth/patient/login/', payload);
    return response.data;
  },

  register: async (userData) => {
    const response = await axiosClient.post('/auth/register/', userData);
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post('/auth/logout/');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosClient.get('/auth/me/');
    return response.data;
  },

  forgotPassword: async (identifier, portal = '') => {
    const payload = { identifier };
    if (portal) payload.portal = portal;
    const response = await axiosClient.post('/auth/forgot-password/', payload);
    return response.data;
  },

  resetPassword: async ({ identifier, code, newPassword, portal = '' }) => {
    const payload = {
      identifier,
      code,
      new_password: newPassword,
    };
    if (portal) payload.portal = portal;
    const response = await axiosClient.post('/auth/reset-password/', payload);
    return response.data;
  },
};

export default authApi;
