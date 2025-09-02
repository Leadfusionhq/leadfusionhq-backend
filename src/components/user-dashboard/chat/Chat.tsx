"use client";
import React from 'react';
import { ChatProvider } from '@/context/ChatContext';
import ChatInterface from '@/components/chat/ChatInterface';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const ChatPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <ChatProvider>
      <div className="overflow-hidden">
      {/* <div className="h-screen overflow-hidden"> */}
        <ChatInterface />
      </div>
    </ChatProvider>
  );
};

export default ChatPage;