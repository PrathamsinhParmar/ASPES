import api from './api';

export const groupService = {
  getGroups: async () => {
    const response = await api.get('groups/');
    return response.data;
  },

  getGroupDetails: async (id) => {
    const response = await api.get(`groups/${id}`);
    return response.data;
  },

  createGroup: async (data) => {
    const response = await api.post('groups/', data);
    return response.data;
  },

  updateGroup: async (id, data) => {
    const response = await api.put(`groups/${id}`, data);
    return response.data;
  },

  deleteGroup: async (id) => {
    const response = await api.delete(`groups/${id}`);
    return response.data;
  },

  addProjectToGroup: async (groupId, projectId) => {
    const response = await api.post(`groups/${groupId}/projects/${projectId}`);
    return response.data;
  },

  addProjectsToGroup: async (groupId, projectIds) => {
    const response = await api.post(`groups/${groupId}/projects/bulk`, { project_ids: projectIds });
    return response.data;
  },

  removeProjectFromGroup: async (groupId, projectId) => {
    const response = await api.delete(`groups/${groupId}/projects/${projectId}`);
    return response.data;
  }
};
