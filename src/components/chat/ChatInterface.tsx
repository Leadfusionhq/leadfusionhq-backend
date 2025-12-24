import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import AdminSelectionModal from './AdminSelectionModal';
import {
  Search,
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Archive,
  Trash2,
  Reply,
  Download,
  X,
  Users,
  Settings,
  MessageCircle,
  Check,
  CheckCheck,
  ArrowLeft,
  Menu
} from 'lucide-react';

interface ChatInterfaceProps {
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onClose }) => {
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
    editMessage,
    deleteMessage,
    markMessagesAsRead,
    uploadFile,
    startTyping,
    stopTyping,
    archiveChat,
    updateChatStatus,
    clearCurrentChat
  } = useChat();

  const { user } = useSelector((state: RootState) => state.auth);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [showAdminSelection, setShowAdminSelection] = useState(false);
  const [quickTopic, setQuickTopic] = useState<string>('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Switch to chat view on mobile when chat is selected
  useEffect(() => {
    if (currentChat) {
      setMobileView('chat');
    }
  }, [currentChat]);

  // Filter chats based on search
  const filteredChats = chats.filter(chat => {
    const otherUser = user?.role === 'ADMIN' ? chat.userId : chat.adminId;
    return otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.subject?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Handle typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (currentChat) {
      startTyping(currentChat._id);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentChat._id);
      }, 2000);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!currentChat || !messageInput.trim()) return;

    const messageContent = messageInput.trim();
    setMessageInput('');
    setReplyToMessage(null);

    try {
      await sendMessage(
        currentChat._id,
        messageContent,
        'text',
        {},
        replyToMessage?._id
      );

      stopTyping(currentChat._id);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(messageContent);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!currentChat) return;

    try {
      await uploadFile(currentChat._id, file);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get chat participant info
  const getChatParticipant = (chat: any) => {
    return user?.role === 'ADMIN' ? chat.userId : chat.adminId;
  };

  // Get unread count for specific chat
  const getChatUnreadCount = (chat: any) => {
    return user?.role === 'ADMIN' ? chat.unreadCount.admin : chat.unreadCount.user;
  };

  // Handle admin selection and chat creation
  const handleAdminSelection = async (adminId: string, adminName: string) => {
    try {
      const subject = quickTopic || 'Need Help';
      const chat = await createOrGetChat(adminId, subject);
      selectChat(chat._id);
      setQuickTopic('');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  // Handle message deletion
  const handleDeleteMessage = async (messageId: string) => {
    if (!messageId || messageId.startsWith('temp_')) return;

    try {
      await deleteMessage(messageId);
    } catch (error: any) {
      console.error('Error deleting message:', error);
    }
  };

  // Get read receipt status
  const getReadReceiptStatus = (message: any) => {
    if (!message || message.senderId._id !== user?._id) return null;

    const otherParticipants = currentChat ? [
      currentChat.userId._id,
      currentChat.adminId._id,
      currentChat.assignedTo?._id
    ].filter(id => id && id !== user?._id) : [];

    const readByOthers = message.readBy?.filter(
      (read: any) => read.userId !== user?._id && otherParticipants.includes(read.userId)
    ) || [];

    if (readByOthers.length > 0) {
      return { status: 'read', count: readByOthers.length };
    }

    return { status: 'sent', count: 0 };
  };

  // Back to list on mobile
  const handleBackToList = () => {
    setMobileView('list');
    clearCurrentChat();
  };

  return (
    <div className="flex h-[calc(100vh-120px)] sm:h-[80vh] bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-sm border border-gray-200">

      {/* Sidebar - Chat List */}
      <div className={`
        ${mobileView === 'list' ? 'flex' : 'hidden'} 
        md:flex 
        w-full md:w-80 lg:w-96 
        bg-white border-r border-gray-200 flex-col
      `}>
        {/* Header */}
        <div className="p-4 bg-black text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Messages
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </h2>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/70" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/20 backdrop-blur rounded-xl text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm mb-4">No conversations yet</p>
              {user?.role === 'USER' && (
                <button
                  onClick={() => setShowAdminSelection(true)}
                  className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Start Chat
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredChats.map((chat) => {
                const participant = getChatParticipant(chat);
                const chatUnreadCount = getChatUnreadCount(chat);

                return (
                  <button
                    key={chat._id}
                    onClick={() => selectChat(chat._id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${currentChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(participant.name)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 truncate text-sm">
                            {participant.name}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {chat.lastMessage?.sentAt ? formatTime(chat.lastMessage.sentAt.toString()) : ''}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage?.content || 'No messages yet'}
                          </p>
                          {chatUnreadCount > 0 && (
                            <div className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0 ml-2">
                              {chatUnreadCount > 99 ? '99+' : chatUnreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
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
              className="w-full bg-black text-white py-3 px-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              New Conversation
            </button>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`
        ${mobileView === 'chat' ? 'flex' : 'hidden'} 
        md:flex 
        flex-1 flex-col min-w-0
      `}>
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Back button - mobile only */}
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>

                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(getChatParticipant(currentChat).name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {getChatParticipant(currentChat).name}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                      {typingUsers.length > 0 && (
                        <span className="text-blue-600 animate-pulse">
                          • typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowChatDetails(!showChatDetails)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50"
            >
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">👋</div>
                  <p className="text-gray-900 font-medium">Start a conversation!</p>
                  <p className="text-sm text-gray-500">Send a message to get started</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId._id === user?._id;
                  const readStatus = getReadReceiptStatus(message);

                  return (
                    <div
                      key={message._id}
                      className={`flex gap-2 sm:gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${message.isDeleted ? 'opacity-50' : ''
                        }`}
                    >
                      {!isOwnMessage && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {getInitials(message.senderId.name)}
                        </div>
                      )}

                      <div className={`max-w-[80%] sm:max-w-[70%] lg:max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className="text-xs text-gray-500 mb-1 pl-3 border-l-2 border-gray-300">
                            Replying to previous message
                          </div>
                        )}

                        <div
                          className={`relative group rounded-2xl px-3 sm:px-4 py-2 ${isOwnMessage
                              ? 'bg-black text-white'
                              : 'bg-white border shadow-sm text-gray-900'
                            }`}
                        >
                          {message.isDeleted ? (
                            <p className="italic text-gray-500 text-sm">This message was deleted</p>
                          ) : (
                            <>
                              {message.content.type === 'text' ? (
                                <p className="whitespace-pre-wrap break-words text-sm">
                                  {message.content.data}
                                </p>
                              ) : message.content.type === 'image' ? (
                                <div className="space-y-2">
                                  <img
                                    src={message.content.data}
                                    alt="Shared image"
                                    className="max-w-full rounded-lg"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-sm">
                                    {message.content.metadata?.fileName || 'File'}
                                  </span>
                                  <button className="p-1 hover:bg-black/10 rounded">
                                    <Download className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </>
                          )}

                          {/* Message actions - desktop only */}
                          {!message.isDeleted && !message._id.startsWith('temp_') && (
                            <div className={`hidden sm:block absolute top-0 ${isOwnMessage ? 'left-0' : 'right-0'} -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity`}>
                              <div className="flex items-center gap-1 bg-white border shadow-lg rounded-lg p-1">
                                <button
                                  onClick={() => setReplyToMessage(message)}
                                  className="p-1.5 hover:bg-gray-100 rounded"
                                  title="Reply"
                                >
                                  <Reply className="w-4 h-4 text-gray-600" />
                                </button>
                                {isOwnMessage && (
                                  <button
                                    onClick={() => handleDeleteMessage(message._id)}
                                    className="p-1.5 hover:bg-gray-100 rounded"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {message.isEdited && <span>(edited)</span>}

                          {isOwnMessage && !message._id.startsWith('temp_') && (
                            <div className="flex items-center">
                              {readStatus?.status === 'read' ? (
                                <CheckCheck className={`w-4 h-4 ${readStatus.count > 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                              ) : (
                                <Check className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isOwnMessage && (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {getInitials(message.senderId.name)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start gap-2 mb-4">
                  <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {getInitials(typingUsers[0].name)}
                  </div>
                  <div className="bg-white rounded-2xl px-4 py-2 shadow-sm">
                    <div className="flex space-x-1 animate-pulse">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="px-3 sm:px-4 py-2 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Replying to {replyToMessage.senderId.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 truncate mt-1">
                  {replyToMessage.content.data}
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-3 sm:p-4">
              <div className="flex items-end gap-2 sm:gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                >
                  <Paperclip className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 text-sm"
                    style={{ maxHeight: '100px' }}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <Smile className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`p-3 rounded-xl transition-all flex-shrink-0 ${messageInput.trim()
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
            <div className="text-center max-w-sm">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filteredChats.length === 0 ? 'No Conversations Yet' : 'Select a Chat'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {filteredChats.length === 0
                  ? user?.role === 'USER'
                    ? 'Start your first conversation with our support team'
                    : 'Waiting for users to reach out for support'
                  : 'Choose a conversation from the list'
                }
              </p>

              {filteredChats.length === 0 && user?.role === 'USER' && (
                <button
                  onClick={() => setShowAdminSelection(true)}
                  className="bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Get Support
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Details Sidebar - Desktop Only */}
      {showChatDetails && currentChat && (
        <div className="hidden lg:block w-80 bg-white border-l border-gray-200 p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Chat Details</h3>
            <button
              onClick={() => setShowChatDetails(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Participant Info */}
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
                {getInitials(getChatParticipant(currentChat).name)}
              </div>
              <h4 className="font-semibold text-gray-900">
                {getChatParticipant(currentChat).name}
              </h4>
              <p className="text-sm text-gray-600">
                {getChatParticipant(currentChat).email}
              </p>
            </div>

            {/* Chat Status (Admin only) */}
            {user?.role === 'ADMIN' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Status
                </label>
                <select
                  value={currentChat.chatStatus}
                  onChange={(e) => updateChatStatus(currentChat._id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="waiting_for_user">Waiting for User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => archiveChat(currentChat._id, !currentChat.isArchived)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-sm"
              >
                <Archive className="w-5 h-5 text-gray-600" />
                <span>{currentChat.isArchived ? 'Unarchive' : 'Archive'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ChatInterface;