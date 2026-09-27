import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import notificationService from '../services/notificationService';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeEvaluationAlert, setActiveEvaluationAlert] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Derive WebSocket URL from API base URL or window.location
  const getWsUrl = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
    let wsBase = apiBase.replace(/^http/, 'ws');
    if (wsBase.endsWith('/api/v1')) {
      wsBase = wsBase + '/notifications/ws';
    } else {
      wsBase = wsBase.replace(/\/$/, '') + '/api/v1/notifications/ws';
    }
    return `${wsBase}?token=${encodeURIComponent(token)}`;
  }, []);

  // Fetch unread count & recent notifications
  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [count, notifs] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getMyNotifications({ limit: 30, is_archived: false }),
      ]);
      setUnreadCount(count);
      setNotifications(notifs);

      // Check if student has an unread faculty evaluation they haven't seen yet
      const role = (user.role || '').toLowerCase();
      if (role === 'student' && notifs.length > 0) {
        const latestEval = notifs.find(n => n.type === 'faculty_evaluation' && !n.is_read);
        if (latestEval && !sessionStorage.getItem(`seen_alert_${latestEval.id}`)) {
          setActiveEvaluationAlert(latestEval);
        }
      }
    } catch (err) {
      console.warn('Error refreshing notifications:', err);
    }
  }, [user]);

  // Connect WebSocket
  const connectWs = useCallback(() => {
    if (!user || wsRef.current) return;
    const url = getWsUrl();
    if (!url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // Send ping every 30s to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          } else {
            clearInterval(pingInterval);
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          const data = JSON.parse(event.data);
          
          if (data.event === 'new_notification' && data.notification) {
            const notif = data.notification;
            setUnreadCount(prev => prev + 1);
            setNotifications(prev => [notif, ...prev]);

            // Audio chime (subtle audio feedback)
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
              osc.start();
              osc.stop(audioCtx.currentTime + 0.35);
            } catch (_) {}

            // Immediate Popup for Student when Faculty Evaluates
            const role = (user.role || '').toLowerCase();
            if (role === 'student' && notif.type === 'faculty_evaluation') {
              setActiveEvaluationAlert(notif);
              toast.success(`🎉 Professor evaluated '${notif.title}'!`, { duration: 6000 });
            } else if (notif.priority === 'urgent') {
              toast.error(`⚠️ ${notif.title}`, { duration: 5000 });
            } else {
              toast(`🔔 ${notif.title}`, { duration: 4000, icon: '📬' });
            }
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        // Reconnect after 4s
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 4000);
      };

      ws.onerror = (err) => {
        console.warn('Notification WS Error, falling back to polling:', err);
        ws.close();
      };
    } catch (e) {
      console.warn('Failed to open WS:', e);
    }
  }, [user, getWsUrl]);

  // Lifecycle for WS and fallback polling
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    refreshNotifications();
    connectWs();

    // Polling fallback every 12 seconds in case WS disconnects or network drops
    pollIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        refreshNotifications();
      } else {
        // Just refresh unread count periodically
        notificationService.getUnreadCount().then(c => setUnreadCount(c)).catch(() => {});
      }
    }, 12000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [user, connectWs, refreshNotifications]);

  // Mark single as read
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Archive
  const archiveNotification = async (id) => {
    try {
      await notificationService.archiveNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification archived');
    } catch (err) {
      console.error('Failed to archive notification:', err);
    }
  };

  // Delete
  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const dismissEvaluationAlert = () => {
    if (activeEvaluationAlert) {
      sessionStorage.setItem(`seen_alert_${activeEvaluationAlert.id}`, 'true');
      markAsRead(activeEvaluationAlert.id);
    }
    setActiveEvaluationAlert(null);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        loading,
        activeEvaluationAlert,
        markAsRead,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
        refreshNotifications,
        dismissEvaluationAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
