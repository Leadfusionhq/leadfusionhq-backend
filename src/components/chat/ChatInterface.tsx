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
  Phone, 
  Video, 
  MoreVertical,
  Archive,
  Edit,
  Trash2,
  Reply,
  Download,
  X,
  Users,
  Settings,
  MessageCircle
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
    updateChatStatus
  } = useChat();

  const { user } = useSelector((state: RootState) => state.auth);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<any>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showChatDetails, setShowChatDetails] = useState(false);
  const [showAdminSelection, setShowAdminSelection] = useState(false);
  const [quickTopic, setQuickTopic] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(currentChat._id);
      }, 2000);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!currentChat || !messageInput.trim()) return;
    
    try {
      await sendMessage(
        currentChat._id, 
        messageInput.trim(), 
        'text', 
        {}, 
        replyToMessage?._id
      );
      setMessageInput('');
      setReplyToMessage(null);
      stopTyping(currentChat._id);
    } catch (error) {
      console.error('Error sending message:', error);
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
      console.warn('chat',chat)
      selectChat(chat._id);
      setQuickTopic(''); // Reset quick topic
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  return (
    <div className="h-[88%] bg-[#000] flex">
      {/* Sidebar - Chat List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="p-4 bg-[#000] text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Messages
            </h2>
            {onClose && (
              <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
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
              className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur rounded-lg text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredChats.map((chat) => {
              const participant = getChatParticipant(chat);
              const unreadCount = getChatUnreadCount(chat);
              
              return (
                <div
                  key={chat._id}
                  onClick={() => selectChat(chat._id)}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    currentChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {getInitials(participant.name)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {participant.name}
                          {user?.role === 'ADMIN' && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              User
                            </span>
                          )}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {chat.lastMessage?.sentAt ? formatTime(chat.lastMessage.sentAt.toString()) : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {unreadCount > 0 && (
                          <div className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Status */}
                      {user?.role === 'ADMIN' && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`w-2 h-2 rounded-full ${
                            chat.chatStatus === 'open' ? 'bg-green-500' :
                            chat.chatStatus === 'in_progress' ? 'bg-yellow-500' :
                            chat.chatStatus === 'resolved' ? 'bg-blue-500' :
                            'bg-gray-400'
                          }`}></div>
                          <span className="text-xs text-gray-500 capitalize">
                            {chat.chatStatus.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {getInitials(getChatParticipant(currentChat).name)}
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getChatParticipant(currentChat).name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                      {typingUsers.length > 0 && (
                        <span className="text-blue-600 animate-pulse">
                          • Typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Phone className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Video className="w-5 h-5 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => setShowChatDetails(!showChatDetails)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-6xl mb-4">👋</div>
                  <p className="text-lg">Start a conversation!</p>
                  <p className="text-sm">Send a message to get started</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.senderId._id === user?._id;
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex gap-3 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${
                        message.isDeleted ? 'opacity-50' : ''
                      }`}
                    >
                      {!isOwnMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {getInitials(message.senderId.name)}
                        </div>
                      )}

                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-first' : ''}`}>
                        {/* Reply indicator */}
                        {message.replyTo && (
                          <div className="text-xs text-gray-500 mb-1 pl-3 border-l-2 border-gray-300">
                            Replying to previous message
                          </div>
                        )}

                        <div
                          className={`relative group rounded-2xl px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                              : 'bg-white border shadow-sm text-gray-900'
                          }`}
                        >
                          {message.isDeleted ? (
                            <p className="italic text-gray-500">This message was deleted</p>
                          ) : (
                            <>
                              {message.content.type === 'text' ? (
                                <p className="whitespace-pre-wrap break-words">
                                  {message.content.data}
                                </p>
                              ) : message.content.type === 'image' ? (
                                <div className="space-y-2">
                                  <img 
                                    src={message.content.data} 
                                    alt="Shared image"
                                    className="max-w-full rounded-lg"
                                  />
                                  {message.content.metadata?.fileName && (
                                    <p className="text-xs opacity-75">
                                      {message.content.metadata.fileName}
                                    </p>
                                  )}
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

                          {/* Message actions */}
                          {!message.isDeleted && (
                            <div className={`absolute top-0 ${isOwnMessage ? 'left-0' : 'right-0'} -translate-y-8 opacity-0 group-hover:opacity-100 transition-opacity`}>
                              <div className="flex items-center gap-1 bg-white border shadow-lg rounded-lg p-1">
                                <button
                                  onClick={() => setReplyToMessage(message)}
                                  className="p-1 hover:bg-gray-100 rounded"
                                  title="Reply"
                                >
                                  <Reply className="w-4 h-4 text-gray-600" />
                                </button>
                                {isOwnMessage && (
                                  <>
                                    <button
                                      onClick={() => setEditingMessage(message._id)}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      title="Edit"
                                    >
                                      <Edit className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => deleteMessage(message._id)}
                                      className="p-1 hover:bg-gray-100 rounded"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {message.isEdited && <span>(edited)</span>}
                          {isOwnMessage && (
                            <span className={
                              message.readBy.length > 1 ? 'text-blue-600' : 'text-gray-400'
                            }>
                              {message.readBy.length > 1 ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>

                      {isOwnMessage && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                          {getInitials(message.senderId.name)}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Reply className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Replying to {replyToMessage.senderId.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="text-blue-600 hover:text-blue-800"
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
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end gap-3">
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
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                    className="w-full resize-none rounded-full border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ maxHeight: '120px' }}
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <Smile className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  className={`p-3 rounded-full transition-all ${
                    messageInput.trim()
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
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
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filteredChats.length === 0 ? 'No Conversations Yet' : 'Welcome to Messages'}
              </h3>
              <p className="text-gray-600 mb-6">
                {filteredChats.length === 0 
                  ? user?.role === 'USER' 
                    ? 'Start your first conversation with our support team'
                    : 'Waiting for users to reach out for support'
                  : 'Select a conversation to start chatting'
                }
              </p>
              
              {/* Show different content based on user role and chat availability */}
              {filteredChats.length === 0 ? (
                user?.role === 'USER' ? (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowAdminSelection(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Get Support Now
                    </button>
                    
                    {/* Quick help topics */}
                    <div className="mt-8">
                      <p className="text-sm text-gray-500 mb-4">Common topics:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {['Account Help', 'Billing', 'Technical Issue', 'General Question'].map((topic) => (
                          <button
                            key={topic}
                            onClick={() => {
                              setQuickTopic(topic);
                              setShowAdminSelection(true);
                            }}
                            className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-2 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors"
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h4 className="font-semibold text-blue-900 mb-2">Ready to Help!</h4>
                    <p className="text-blue-700 text-sm">
                      You will see new conversations here as users reach out for support. 
                      You can also check for any pending assignments.
                    </p>
                  </div>
                )
              ) : (
                user?.role === 'USER' && (
                  <button
                    onClick={() => setShowAdminSelection(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
                  >
                    Start New Conversation
                  </button>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Chat Details Sidebar */}
      {showChatDetails && currentChat && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 shadow-lg">
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
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl mx-auto mb-3">
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
            {user?.role === 'Admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chat Status
                </label>
                <select
                  value={currentChat.chatStatus}
                  onChange={(e) => updateChatStatus(currentChat._id, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Archive className="w-5 h-5 text-gray-600" />
                <span>{currentChat.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
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