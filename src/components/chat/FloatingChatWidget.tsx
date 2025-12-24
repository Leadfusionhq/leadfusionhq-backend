import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import AdminSelectionModal from './AdminSelectionModal';
import {
  MessageCircle,
  X,
  Send,
  Paperclip,
  Minimize2,
  Maximize2,
  Users,
  Search,
  ArrowLeft,
  Trash2,
  Reply
} from 'lucide-react';

const FloatingChatWidget: React.FC = () => {
  const {
    chats,
    currentChat,
    messages,
    loading,
    messagesLoading,
    unreadCount,
    typingUsers,
    fetchChats,
    selectChat,
    createOrGetChat,
    sendMessage,
    deleteMessage,
    clearCurrentChat
  } = useChat();

  const { user } = useSelector((state: RootState) => state.auth);

  // Widget states
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');
  const [messageInput, setMessageInput] = useState('');
  const [showAdminSelection, setShowAdminSelection] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check localStorage for dismissed state on mount
  useEffect(() => {
    const dismissed = localStorage.getItem('chatWidgetDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('chatWidgetDismissed', 'true');
  };

  // Handle show chat button again
  const handleShowChat = () => {
    setIsDismissed(false);
    localStorage.removeItem('chatWidgetDismissed');
  };
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!currentChat || !messageInput.trim()) return;

    try {
      await sendMessage(currentChat._id, messageInput.trim(), 'text', {});
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle chat selection
  const handleChatSelect = async (chatId: string) => {
    await selectChat(chatId);
    setCurrentView('chat');
  };

  // Handle back to list
  const handleBackToList = () => {
    setCurrentView('list');
    clearCurrentChat();
  };

  // Handle admin selection for new chat
  const handleAdminSelection = async (adminId: string) => {
    try {
      const chat = await createOrGetChat(adminId, 'Need Help');
      await selectChat(chat._id);
      setCurrentView('chat');
      setShowAdminSelection(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get chat participant
  const getChatParticipant = (chat: any) => {
    return user?.role === 'ADMIN' ? chat.userId : chat.adminId;
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };
  const filteredChats = chats.filter(chat => {
    const otherUser = user?.role === 'ADMIN' ? chat.userId : chat.adminId;
    return otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.subject?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // If user not logged in, don't show widget
  if (!user) return null;

  return (
    <>
      {/* Note: When dismissed, chat button is completely hidden. 
          User can restore it by clearing localStorage or from settings */}

      {/* Floating Chat Button with Dismiss */}
      {!isOpen && !isDismissed && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Main Chat Button */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-[#000] text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
            {unreadCount > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-semibold animate-bounce">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </button>

          {/* Dismiss Button - Always visible */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            className="absolute -top-1 -left-1 w-6 h-6 bg-white text-gray-400 rounded-full shadow-md hover:bg-red-50 hover:text-red-500 transition-all duration-200 flex items-center justify-center border border-gray-200"
            title="Hide chat button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat Widget Popup */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 transition-all duration-300 ${isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
            }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#000] text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              {currentView === 'chat' && currentChat && !isMinimized && (
                <button
                  onClick={handleBackToList}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                <span className="font-semibold">
                  {currentView === 'chat' && currentChat ?
                    getChatParticipant(currentChat).name :
                    'Messages'
                  }
                </span>
              </div>

              {unreadCount > 0 && (
                <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                  setCurrentView('list');
                  clearCurrentChat();
                }}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="h-[calc(100%-80px)] flex flex-col">
              {currentView === 'list' ? (
                // Chat List View
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  {/* Chat List */}
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : filteredChats.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-sm mb-4">No conversations yet</p>
                        {user?.role === 'USER' && (
                          <button
                            onClick={() => setShowAdminSelection(true)}
                            className="bg-[#000] text-white px-4 py-2 rounded-lg text-sm hover:shadow-lg transition-all"
                          >
                            Start Chat
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {filteredChats.map((chat) => {
                          const participant = getChatParticipant(chat);
                          const unreadCount = user?.role === 'ADMIN' ? chat.unreadCount?.admin : chat.unreadCount?.user;

                          return (
                            <div
                              key={chat._id}
                              onClick={() => handleChatSelect(chat._id)}
                              className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="w-10 h-10 bg-[#000] rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {getInitials(participant.name)}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-sm text-gray-900 truncate">
                                      {participant.name}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      {chat.lastMessage?.sentAt && formatTime(chat.lastMessage.sentAt.toString())}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-600 truncate">
                                      {chat.lastMessage?.content || 'No messages yet'}
                                    </p>
                                    {unreadCount > 0 && (
                                      <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[18px] text-center">
                                        {unreadCount}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* New Chat Button */}
                  {user?.role === 'USER' && chats.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                      <button
                        onClick={() => setShowAdminSelection(true)}
                        className="w-full bg-[#000] text-white py-2 px-4 rounded-lg text-sm hover:shadow-lg transition-all"
                      >
                        New Conversation
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Chat View
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">👋</div>
                        <p className="text-sm">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.senderId._id === user?._id;

                        return (
                          <div
                            key={message._id}
                            className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${message.isDeleted ? 'opacity-50' : ''
                              }`}
                          >
                            {!isOwnMessage && (
                              <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-1">
                                {getInitials(message.senderId.name)}
                              </div>
                            )}

                            <div className={`max-w-[75%] ${isOwnMessage ? 'order-first' : ''}`}>
                              <div
                                className={`relative group rounded-xl px-3 py-2 text-sm ${isOwnMessage
                                  ? 'bg-[#000] text-white'
                                  : 'bg-gray-100 text-gray-900'
                                  }`}
                              >
                                {message.isDeleted ? (
                                  <p className="italic text-gray-500 text-xs">Message deleted</p>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">
                                    {message.content.data}
                                  </p>
                                )}

                                {/* Message actions */}
                                {!message.isDeleted && (
                                  <div className="absolute top-0 right-0 -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-1 bg-white border shadow-lg rounded-lg p-1">
                                      {isOwnMessage && (
                                        <button
                                          onClick={() => deleteMessage(message._id)}
                                          className="p-1 hover:bg-gray-100 rounded"
                                          title="Delete"
                                        >
                                          <Trash2 className="w-3 h-3 text-red-600" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'
                                }`}>
                                <span>{formatTime(message.createdAt)}</span>
                                {message.isEdited && <span className="ml-1">(edited)</span>}
                                {isOwnMessage && (
                                  <span className="ml-1">
                                    {message.readBy.length > 1 ? '✓✓' : '✓'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isOwnMessage && (
                              <div className="w-6 h-6 bg-[#000] rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-1">
                                {getInitials(message.senderId.name)}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                      <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span>{typingUsers[0].name} is typing...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-3 border-t border-gray-100">
                    <div className="flex items-end gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,application/pdf,.doc,.docx"
                      />

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Paperclip className="w-4 h-4 text-gray-600" />
                      </button>

                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type a message..."
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className={`p-2 rounded-lg transition-all ${messageInput.trim()
                          ? 'bg-[#000] text-white hover:shadow-lg'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Selection Modal */}
      <AdminSelectionModal
        isOpen={showAdminSelection}
        onClose={() => setShowAdminSelection(false)}
        onSelectAdmin={handleAdminSelection}
      />
    </>
  );
};

export default FloatingChatWidget;