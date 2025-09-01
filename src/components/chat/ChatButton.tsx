"use client";
import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import ChatModal from './ChatModel';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface ChatButtonProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'custom';
}

const ChatButton: React.FC<ChatButtonProps> = ({ 
  className = '', 
  size = 'medium',
  position = 'bottom-right'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { unreadCount } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);

  if (!user) return null;

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-14 h-14',
    large: 'w-16 h-16'
  };

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
    'custom': ''
  };

  const iconSize = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-7 h-7'
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          ${positionClasses[position]}
          ${sizeClasses[size]}
          ${className}
          bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full
          shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95
          transition-all duration-200 flex items-center justify-center
          z-40 group relative overflow-hidden
        `}
      >
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Icon */}
        <MessageCircle className={`${iconSize[size]} relative z-10`} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}

        {/* Pulse animation for unread messages */}
        {unreadCount > 0 && (
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20"></div>
        )}
      </button>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ChatButton;