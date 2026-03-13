import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Welcome to FaceAttend',
      message: 'Your account has been successfully created.',
      type: 'info',
      read: false,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: '2',
      title: 'Attendance Recorded',
      message: 'Your attendance for today has been marked.',
      type: 'success',
      read: false,
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

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
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
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
