import React, { useState } from 'react';
import { MessageCircle, HelpCircle, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import AdminSelectionModal from './AdminSelectionModal';

interface UserChatWidgetProps {
  onOpenChat?: () => void;
  className?: string;
}

const UserChatWidget: React.FC<UserChatWidgetProps> = ({ onOpenChat, className = '' }) => {
  const { chats, unreadCount, createOrGetChat, selectChat } = useChat();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showAdminSelection, setShowAdminSelection] = useState(false);
  const [quickTopic, setQuickTopic] = useState('');

  const quickHelpTopics = [
    { id: 'account', label: 'Account Help', icon: '👤', color: 'blue' },
    { id: 'billing', label: 'Billing', icon: '💳', color: 'green' },
    { id: 'technical', label: 'Technical Issue', icon: '🔧', color: 'red' },
    { id: 'general', label: 'General Question', icon: '💬', color: 'purple' }
  ];

  const getLatestChat = () => {
    return chats.length > 0 ? chats[0] : null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <MessageCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleQuickStart = (topic: string) => {
    setQuickTopic(topic);
    setShowAdminSelection(true);
  };

  const handleAdminSelection = async (adminId: string, adminName: string) => {
    try {
      const subject = quickTopic || 'Need Help';
      const chat = await createOrGetChat(adminId, subject);
      selectChat(chat._id);
      setQuickTopic('');
      if (onOpenChat) {
        onOpenChat();
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (user?.role !== 'USER') {
    return null;
  }

  const latestChat = getLatestChat();

  return (
    <>
      <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Support Chat</h3>
              <p className="text-sm text-gray-600">Get help from our team</p>
            </div>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              {unreadCount} new message{unreadCount > 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Latest Conversation Status */}
        {latestChat ? (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Latest Conversation</h4>
              <div className="flex items-center gap-2">
                {getStatusIcon(latestChat.chatStatus)}
                <span className="text-sm text-gray-600 capitalize">
                  {latestChat.chatStatus.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                {latestChat.adminId?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900">
                  {latestChat.adminId?.name || 'Support Agent'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {latestChat.lastMessage?.content || 'Conversation started'}
                </p>
              </div>
              {latestChat.unreadCount?.user > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {latestChat.unreadCount.user}
                </div>
              )}
            </div>
            
            <button
              onClick={onOpenChat}
              className="mt-3 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Continue Conversation
            </button>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Need Help?</h4>
              <p className="text-sm text-gray-600 mb-4">
                Start a conversation with our support team
              </p>
              <button
                onClick={() => setShowAdminSelection(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all transform hover:scale-105 text-sm"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}

        {/* Quick Help Topics */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Quick Help
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {quickHelpTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleQuickStart(topic.label)}
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all text-left"
              >
                <span className="text-lg">{topic.icon}</span>
                <span className="text-sm font-medium text-gray-700">{topic.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">Support Available</span>
          </div>
          <p className="text-xs text-green-700">
            Monday - Friday: 9:00 AM - 6:00 PM EST
          </p>
          <p className="text-xs text-green-600 mt-1">
            Average response time: 5 minutes
          </p>
        </div>

        {/* FAQ Link */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="w-full text-left text-sm text-gray-600 hover:text-gray-800 transition-colors">
            📚 Browse FAQ & Help Articles →
          </button>
        </div>
      </div>

      {/* Admin Selection Modal */}
      <AdminSelectionModal 
        isOpen={showAdminSelection}
        onClose={() => {
          setShowAdminSelection(false);
          setQuickTopic('');
        }}
        onSelectAdmin={handleAdminSelection}
        initialSubject={quickTopic}
      />
    </>
  );
};

export default UserChatWidget;