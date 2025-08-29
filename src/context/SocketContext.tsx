"use client";
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import io, { Socket } from 'socket.io-client';
import { useNotifications } from './NotificationContext';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinRoom: (userId: string) => void;
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
  
  // Get user from Redux state
  const { user } = useSelector((state: RootState) => state.auth);
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Connect to your backend server
    const socketInstance = io(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}`, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 10000,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      setConnected(true);
      console.log('✅ Socket connected with ID:', socketInstance.id);
      
      // Auto-join room if userId is available
      if (userId || user?._id) {
        const roomId = userId || user?._id;
        socketInstance.emit('join-room', roomId);
        console.log(`🏠 Auto-joined room: ${roomId}`);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      setConnected(false);
      console.log('🔌 Socket disconnected:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    // Listen for welcome messages
    socketInstance.on('message', (msg) => {
      console.log('💬 Message from server:', msg);
    });

    // Listen for general notifications
    socketInstance.on('notification', (notificationData: any) => {
      console.log('📢 Received general notification:', notificationData);
    });

    // Cleanup on unmount
    return () => {
      console.log('🛑 Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [userId, user, addNotification]);

  // Set userId from Redux user when available
  useEffect(() => {
    if (user?._id && !userId) {
      setUserId(user._id);
    }
  }, [user, userId]);

  // Handle user-specific notifications
  useEffect(() => {
    if (socket && connected && (userId || user?._id)) {
      const currentUserId = userId || user?._id;
      const eventName = `new-notification-${currentUserId}`;
      
      const handleUserNotification = (notificationData: any) => {
        console.log(`🔔 Received notification for user ${currentUserId}:`, notificationData);
        
        addNotification({
          id: notificationData._id || Date.now(),
          title: 'New Lead Assignment',
          message: notificationData.message,
          time: new Date().toLocaleTimeString(),
          type: notificationData.type || 'info',
        });
      };

      socket.on(eventName, handleUserNotification);

      // Cleanup listener when userId changes or component unmounts
      return () => {
        socket.off(eventName, handleUserNotification);
      };
    }
  }, [socket, connected, userId, user, addNotification]);

  const joinRoom = (newUserId: string) => {
    if (socket && connected) {
      socket.emit('join-room', newUserId);
      console.log(`🏠 Manually joined room: ${newUserId}`);
    }
    setUserId(newUserId);
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      connected, 
      joinRoom, 
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