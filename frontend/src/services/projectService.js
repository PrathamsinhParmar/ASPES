import api from './api';

export const projectService = {
  getMyProjects: async () => {
    const response = await api.get('/projects/my');
    return response.data;
  },

  getAllProjects: async (skip = 0, limit = 50) => {
    const response = await api.get(`/projects/?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getProject: async (id) => {
    const response = await api.get(`/projects/${id}`);
    return response.data;
  },

  uploadProject: async (formData, config = {}) => {
    const response = await api.post('/projects/upload', formData, {
      ...config
    });
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};
