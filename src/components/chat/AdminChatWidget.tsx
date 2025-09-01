import React, { useState, useEffect } from 'react';
import { MessageCircle, Clock, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

interface AdminChatWidgetProps {
  onOpenChat?: () => void;
  className?: string;
}

const AdminChatWidget: React.FC<AdminChatWidgetProps> = ({ onOpenChat, className = '' }) => {
  const { chats, unreadCount, fetchChats } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    urgent: 0,
    avgResponseTime: '5 mins'
  });

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (chats.length > 0) {
      const openChats = chats.filter(chat => chat.chatStatus === 'open').length;
      const inProgressChats = chats.filter(chat => chat.chatStatus === 'in_progress').length;
      const urgentChats = chats.filter(chat => chat.priority === 'urgent' || chat.priority === 'high').length;

      setStats({
        total: chats.length,
        open: openChats,
        inProgress: inProgressChats,
        urgent: urgentChats,
        avgResponseTime: '5 mins' // This would come from your analytics
      });
    }
  }, [chats]);

  if (user?.role !== 'Admin') {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Support Chat</h3>
            <p className="text-sm text-gray-600">Manage conversations</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
            {unreadCount} new
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-600">Total Chats</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.open}</div>
          <div className="text-xs text-gray-600">Open</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-600">In Progress</div>
        </div>
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          <div className="text-xs text-gray-600">Urgent</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3 mb-6">
        <h4 className="font-medium text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Activity
        </h4>
        
        {chats.slice(0, 3).map((chat) => {
          const participant = chat.userId;
          const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
          const getChatUnreadCount = () => chat.unreadCount?.admin || 0;
          
          return (
            <div key={chat._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {getInitials(participant.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm text-gray-900 truncate">
                    {participant.name}
                  </p>
                  <div className="flex items-center gap-2">
                    {getChatUnreadCount() > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[18px] text-center">
                        {getChatUnreadCount()}
                      </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${
                      chat.chatStatus === 'open' ? 'bg-green-500' :
                      chat.chatStatus === 'in_progress' ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 truncate">
                  {chat.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          );
        })}
        
        {chats.length === 0 && (
          <div className="text-center py-6 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No active conversations</p>
            <p className="text-xs text-gray-400">New chats will appear here</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <button
          onClick={onOpenChat}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Open Chat Interface
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            View Analytics
          </button>
          <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
            Settings
          </button>
        </div>
      </div>

      {/* Performance Indicator */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Avg. Response Time</span>
          </div>
          <span className="font-medium text-green-600">{stats.avgResponseTime}</span>
        </div>
      </div>

      {/* Alerts for urgent items */}
      {stats.urgent > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              {stats.urgent} urgent conversation{stats.urgent > 1 ? 's' : ''} need{stats.urgent === 1 ? 's' : ''} attention
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminChatWidget;