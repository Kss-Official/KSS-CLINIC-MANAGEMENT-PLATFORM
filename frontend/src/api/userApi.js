import axiosClient from './axiosClient';

export const userApi = {
  getUsers: async (params = {}) => {
    const response = await axiosClient.get('/users/', { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await axiosClient.get(`/users/${id}/`);
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosClient.post('/users/', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await axiosClient.put(`/users/${id}/`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await axiosClient.delete(`/users/${id}/`);
    return response.data;
  },

  uploadProfileImage: async (formData) => {
    const response = await axiosClient.post('/users/me/profile-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  removeProfileImage: async () => {
    const response = await axiosClient.delete('/users/me/profile-image/');
    return response.data;
  },
};

export default userApi;
