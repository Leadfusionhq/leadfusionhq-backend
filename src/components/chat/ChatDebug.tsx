"use client";
import React, { useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const ChatDebugComponent: React.FC = () => {
  const { socket, connected, userId } = useSocket();
  const { chats, currentChat, messages } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);
  const [socketEvents, setSocketEvents] = useState<string[]>([]);

  // Listen to all socket events for debugging
  useEffect(() => {
    if (!socket) return;

    const eventLogger = (eventName: string) => (data: any) => {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = `[${timestamp}] ${eventName}: ${JSON.stringify(data)}`;
      console.log(logEntry);
      setSocketEvents(prev => [logEntry, ...prev.slice(0, 19)]); // Keep last 20 events
    };

    // Log all important events
    const events = [
      'connect',
      'disconnect',
      'new-message',
      'chat-created',
      'user-typing',
      'message-edited', 
      'message-deleted',
      'messages-read',
      'chat-status-updated'
    ];

    events.forEach(event => {
      socket.on(event, eventLogger(event));
    });

    return () => {
      events.forEach(event => {
        socket.off(event);
      });
    };
  }, [socket]);

  const testMessage = () => {
    if (socket && connected) {
      socket.emit('test-message', { 
        message: 'Test from client', 
        userId: user?._id,
        timestamp: new Date().toISOString()
      });
    }
  };

  return (
    <div className="fixed bottom-4 ml-[5rem] left-4 bg-black text-white p-4 rounded-lg max-w-lg max-h-196 overflow-y-auto z-50 text-xs">
      <div className="mb-4">
        <h4 className="font-bold mb-2">Chat Debug Panel</h4>
        <div className="space-y-1">
          <div>Socket: {connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
          <div>User ID: {userId || 'None'}</div>
          <div>User Role: {user?.role || 'None'}</div>
          <div>Chats Count: {chats.length}</div>
          <div>Current Chat: {currentChat?._id || 'None'}</div>
          <div>Messages Count: {messages.length}</div>
        </div>
        
        <button 
          onClick={testMessage}
          className="mt-2 bg-blue-600 px-3 py-1 rounded text-white"
        >
          Test Socket
        </button>
      </div>

      <div>
        <h5 className="font-semibold mb-2">Socket Events:</h5>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {socketEvents.length === 0 ? (
            <div>No events yet...</div>
          ) : (
            socketEvents.map((event, index) => (
              <div key={index} className="text-xs text-green-400 font-mono">
                {event}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDebugComponent;