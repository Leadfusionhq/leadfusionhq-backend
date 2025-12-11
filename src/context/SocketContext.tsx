"use client";
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import io, { Socket } from 'socket.io-client';
import { useNotifications } from './NotificationContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  userId: string | null;
  setUserId: (userId: string) => void;
}

interface SocketProviderProps {
  children: React.ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  const { user, token } = useSelector((state: RootState) => state.auth);
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!token) return;

    const socketInstance = io(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}`, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      auth: {
        token: token,
      },
      timeout: 10000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket connected securely with ID:', socketInstance.id);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err.message);
    });

    socketInstance.on('disconnect', (reason) => {
      setConnected(false);
      console.log('🔌 Socket disconnected:', reason);
    });

    socketInstance.on('notification', (notificationData: any) => {
      console.log('🔔 Received notification:', notificationData);

      addNotification({
        id: notificationData._id || Date.now(),
        title: 'New Notification',
        message: notificationData.message,
        time: new Date().toLocaleTimeString(),
        type: notificationData.type || 'info',
      });
    });

    if (user?._id) {
      socketInstance.on(`new-notification-${user._id}`, (data) => {
        console.log('🔔 Received legacy notification:', data);
      });
    }

    return () => {
      console.log('🛑 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [token, user?._id, addNotification]);


  useEffect(() => {
    if (user?._id && !userId) {
      setUserId(user._id);
    }
  }, [user, userId]);

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      userId: userId || user?._id || null,
      setUserId
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};