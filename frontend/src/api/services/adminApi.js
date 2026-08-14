import axiosInstance from '../axiosInstance';

export const adminApi = {
  getUsers: async () => {
    const response = await axiosInstance.get('/admin/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await axiosInstance.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/status`, {
      is_active: isActive ? 1 : 0
    });
    return response.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/reset-password`, {
      new_password: newPassword
    });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  }
};
