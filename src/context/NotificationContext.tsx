"use client";
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axiosWrapper from "@/utils/api";
import { NOTIFICATION_API} from "@/utils/apiUrl";

interface Notification {
  _id?: string;
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'error' | 'success' | 'info' | 'warning';
  read?: boolean;
  senderId?: {
    name: string;
    email: string;
  };
  createdAt?: string;
  priority?: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: number | string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useSelector((state: RootState) => state.auth);
  const token = useSelector((state: RootState) => state.auth.token);

  const fetchNotifications = async (unreadOnly: boolean = false) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = (await axiosWrapper("get", `${NOTIFICATION_API.GET_NOTIFICATIONS}?unreadOnly=${unreadOnly}`, {}, token ?? undefined)) as any;
      
      console.log('response : notifications', response);
      
      const formattedNotifications = response.data.map((notif: any) => ({
        _id: notif._id,
        id: notif._id,
        title: getNotificationTitle(notif.type),
        message: notif.message,
        time: new Date(notif.createdAt).toLocaleTimeString(),
        type: notif.type,
        read: notif.read,
        senderId: notif.senderId,
        createdAt: notif.createdAt,
        priority: notif.priority
      }));
      
      if (!unreadOnly) {
        const actualUnreadCount = formattedNotifications.filter(n => !n.read).length;
        setUnreadCount(actualUnreadCount);
        setNotifications(formattedNotifications);

      }
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = (await axiosWrapper("get", NOTIFICATION_API.GET_UNREAD_COUNT, {}, token ?? undefined)) as any;

      // FIXED: Based on your backend, it should return { unreadCount: number }
      setUnreadCount(response.unreadCount || 0);
      
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const url = NOTIFICATION_API.MARK_AS_READ.replace(':notificationId', notificationId);
      const response = (await axiosWrapper("patch", url, {}, token ?? undefined)) as any;

      console.log('response', response);

      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = (await axiosWrapper("patch", NOTIFICATION_API.MARK_ALL_AS_READ, {}, token ?? undefined)) as any;
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
      
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const removeNotification = async (id: number | string) => {
    const notification = notifications.find(n => n.id === id || n._id === id);

    try {
      const url = NOTIFICATION_API.DELETE_NOTIFICATION.replace(':notificationId', String(id));
      await axiosWrapper("delete", url, {}, token ?? undefined);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return; 
    }

    setNotifications(prev =>
      prev.filter(n => n.id !== id && n._id !== id)
    );

    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'info': return 'New Lead Assignment';
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Notification';
    }
  };

  // FIXED: Fetch both notifications and unread count on user login
  useEffect(() => {
    if (user) {
      fetchNotifications(false); // Fetch all notifications
      fetchUnreadCount(); // Fetch accurate unread count
    }
  }, [user]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      addNotification,
      removeNotification,
      markAsRead,
      markAllAsRead,
      fetchNotifications,
      fetchUnreadCount
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};