import api from './api';

export const notificationService = {
  // Fetch user notifications with query filters
  getMyNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  // Fast count for header badge
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    return res.data?.unread_count ?? 0;
  },

  // Mark single notification read
  markAsRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  // Mark all unread notifications read
  markAllAsRead: async () => {
    const res = await api.put('/notifications/mark-all-read');
    return res.data;
  },

  // Archive a notification
  archiveNotification: async (id) => {
    const res = await api.put(`/notifications/${id}/archive`);
    return res.data;
  },

  // Restore archived notification
  unarchiveNotification: async (id) => {
    const res = await api.put(`/notifications/${id}/unarchive`);
    return res.data;
  },

  // Delete a notification
  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },

  // Admin: broadcast creation (supports FormData for attachments)
  sendAdminBroadcast: async (formData) => {
    const res = await api.post('/notifications/broadcast', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  // Admin: get broadcast delivery and read receipts
  getAdminBroadcasts: async () => {
    const res = await api.get('/notifications/admin/broadcasts');
    return res.data;
  },

  // Admin: get audit trail
  getAuditLogs: async (params = {}) => {
    const res = await api.get('/notifications/admin/audit-logs', { params });
    return res.data;
  },

  // Admin: get list of active recipients for individual targeting
  getRecipientsList: async () => {
    const res = await api.get('/notifications/recipients-list');
    return res.data;
  },
};

export default notificationService;
