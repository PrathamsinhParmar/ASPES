import api from './api';

export const projectService = {
  getMyProjects: async () => {
    const response = await api.get('/projects/my');
    return response.data;
  },

  getAssignedProjects: async (skip = 0, limit = 50, facultyId = null) => {
    const url = facultyId 
      ? `/projects/assigned?skip=${skip}&limit=${limit}&faculty_id=${facultyId}`
      : `/projects/assigned?skip=${skip}&limit=${limit}`;
    const response = await api.get(url);
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
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  },
  
  updateProjectMetadata: async (id, data) => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data;
  },

  evaluateProject: async (id, formData) => {
    const response = await api.put(`/projects/${id}/evaluate`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
