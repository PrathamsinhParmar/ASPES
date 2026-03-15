import api from './api';

export const evaluationService = {
  getPendingEvaluations: async (skip = 0, limit = 50) => {
    const response = await api.get(`/evaluations/pending?skip=${skip}&limit=${limit}`);
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
