import api from './api';

export const authService = {
  login: async (username, password) => {
    // OAuth2 requires form encoded
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    
    const response = await api.post('/auth/login', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword
    });
    return response.data;
  }
};
