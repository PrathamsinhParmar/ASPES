import api from './api';

export const reportService = {
  /**
   * Fetch comprehensive JSON report data for a project.
   * Only works when evaluation status = 'completed'.
   */
  getReportData: async (projectId) => {
    const response = await api.get(`/projects/${projectId}/report`);
    return response.data;
  },

  /**
   * Trigger a PDF download of the AI analysis report.
   * Returns a Blob URL string.
   */
  downloadReportPdf: async (projectId, fileName) => {
    const response = await api.get(`/projects/${projectId}/report/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);

    // Programmatic download
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'ASPES_Report.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Return the blob URL so it can be used for preview as well
    return url;
  },
};
