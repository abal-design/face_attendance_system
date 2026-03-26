import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);

  const mapNotification = useCallback((notification) => ({
    id: String(notification.id),
    title: notification.title,
    message: notification.message,
    type: notification.type || 'info',
    read: Boolean(notification.isRead),
    timestamp: notification.createdAt || new Date().toISOString(),
  }), []);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setNotifications([]);
      return;
    }

    try {
      const response = await api.get('/notifications');
      const list = Array.isArray(response.data.notifications)
        ? response.data.notifications.map(mapNotification)
        : [];
      setNotifications(list);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [isAuthenticated, mapNotification, user?.id]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      type: 'info',
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    const targetId = String(id);

    setNotifications(prev =>
      prev.map(notif =>
        notif.id === targetId ? { ...notif, read: true } : notif
      )
    );

    api.patch(`/notifications/${targetId}/read`).catch(() => {
      // Keep optimistic UI; latest state sync can happen on next load.
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );

    api.patch('/notifications/read-all').catch(() => {
      // Keep optimistic UI; latest state sync can happen on next load.
    });
  }, []);

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    loadNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
