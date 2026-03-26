import api from './api';

export const evaluationService = {
  getPendingEvaluations: async (skip = 0, limit = 50, facultyId = null) => {
    const params = new URLSearchParams({ skip, limit });
    if (facultyId) {
      params.append('faculty_id', facultyId);
    }
    const response = await api.get(`/evaluations/pending?${params.toString()}`);
    return response.data;
  },

  getEvaluation: async (id) => {
    const response = await api.get(`/evaluations/${id}`);
    return response.data;
  },

  finalizeEvaluation: async (id, data) => {
    const response = await api.put(`/evaluations/${id}/finalize`, data);
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/evaluations/statistics');
    return response.data;
  },

  reprocessEvaluation: async (id) => {
    const response = await api.post(`/evaluations/${id}/reprocess`);
    return response.data;
  }
};
