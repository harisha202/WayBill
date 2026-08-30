import axiosInstance from '../axiosInstance';

export const adminApi = {
  getUsers: async () => {
    const response = await axiosInstance.get('/admin/users');
    return response;
  },

  createUser: async (userData) => {
    const response = await axiosInstance.post('/admin/users', userData);
    return response;
  },

  updateUser: async (userId, userData) => {
    const response = await axiosInstance.put(`/admin/users/${userId}`, userData);
    return response;
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/status`, {
      is_active: isActive ? 1 : 0
    });
    return response;
  },

  sendPasswordResetOtp: async (userId) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/reset-password/send-otp`);
    return response;
  },

  resetUserPassword: async (userId, otp, newPassword) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/reset-password`, {
      otp: otp,
      new_password: newPassword
    });
    return response;
  },

  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response;
  }
};
