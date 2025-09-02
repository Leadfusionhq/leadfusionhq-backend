"use client";
import React, { createContext, useState, useEffect, useContext, ReactNode ,useRef} from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import axiosWrapper from "@/utils/api";
import { CHAT_API } from "@/utils/apiUrl";
import { useSocket } from './SocketContext';

interface Message {
  _id: string;
  chatId: string;
  senderId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
  content: {
    type: 'text' | 'image' | 'file' | 'audio' | 'video';
    data: string;
    metadata?: {
      fileName?: string;
      fileSize?: number;
      mimeType?: string;
      thumbnailUrl?: string;
    };
  };
  status: 'sent' | 'delivered' | 'read';
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  replyTo?: string;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Chat {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  adminId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lastMessage?: {
    messageId: string;
    content: string;
    sentAt: Date;
    senderId: string;
  };
  isActive: boolean;
  unreadCount: {
    user: number;
    admin: number;
  };
  subject?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  chatStatus: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TypingUser {
  userId: string;
  name: string;
  isTyping: boolean;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  unreadCount: number;
  typingUsers: TypingUser[];
  
  fetchChats: (filters?: any) => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createOrGetChat: (participantId: string, subject?: string) => Promise<Chat>;
  updateChatStatus: (chatId: string, status: string, tags?: string[]) => Promise<void>;
  archiveChat: (chatId: string, archive?: boolean) => Promise<void>;
  fetchMessages: (chatId: string, page?: number) => Promise<void>;
  sendMessage: (chatId: string, content: string, type?: string, metadata?: any, replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markMessagesAsRead: (chatId: string, messageIds?: string[]) => Promise<void>;
  uploadFile: (chatId: string, file: File) => Promise<void>;
  startTyping: (chatId: string) => Promise<void>;
  stopTyping: (chatId: string) => Promise<void>;
  searchMessages: (chatId: string, query: string, filters?: any) => Promise<any>;
  getUnreadCount: () => Promise<void>;
  clearCurrentChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const token = useSelector((state: RootState) => state.auth.token);

  const { socket, connected } = useSocket();

  // Check user role - adapt to your backend role values
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'Admin';
  const isUser = user?.role === 'USER' || user?.role === 'User';
  const processedMessageIds = useRef(new Set());

  // Add this to your ChatProvider component
  useEffect(() => {
    // Calculate total unread count from chats
    const totalUnread = chats.reduce((sum, chat) => {
      return sum + (chat.unreadCount?.[isAdmin ? 'admin' : 'user'] || 0);
    }, 0);
    
    setUnreadCount(totalUnread);
  }, [chats, isAdmin]);

  // Socket event listeners for real-time chat
  useEffect(() => {
    if (!socket || !connected || !user) {
      console.log('Socket not ready:', { socket: !!socket, connected, user: !!user });
      return;
    }

    console.log('Setting up chat socket listeners for user:', user._id);

    // Listen for new messages

    const handleNewMessage = (data: { chatId: string; message: Message }) => {
      console.log('📨 NEW MESSAGE RECEIVED:', data);
    
      // Prevent processing the same message multiple times
      if (processedMessageIds.current.has(data.message._id)) {
        return;
      }
      processedMessageIds.current.add(data.message._id);
    
      const isViewingThisChat = currentChat ? data.chatId === currentChat._id : false;
      const isMessageFromMe = data.message.senderId._id === user._id;
    
      // Add message to current chat if it's the active one
      if (isViewingThisChat) {
        setMessages(prev => {
          const exists = prev.find(msg => msg._id === data.message._id);
          if (exists) return prev;
          return [...prev, data.message];
        });
    
        // Auto-mark as read if viewing the chat and message is not from me
        if (!isMessageFromMe) {
          markMessagesAsRead(data.chatId, [data.message._id]);
        }
    
        // Auto-scroll to bottom
        setTimeout(() => {
          const element = document.getElementById('messagesContainer');
          if (element) {
            element.scrollTop = element.scrollHeight;
          }
        }, 100);
      }
    
      // Update chat list with new message preview & unread count
      setChats(prev =>
        prev.map(chat =>
          chat._id === data.chatId
            ? {
                ...chat,
                lastMessage: {
                  messageId: data.message._id,
                  content: data.message.content.data.substring(0, 100),
                  sentAt: new Date(data.message.createdAt),
                  senderId: data.message.senderId._id,
                },
                unreadCount: {
                  // Only increment unread count for recipient, not sender
                  user: isMessageFromMe ? chat.unreadCount?.user || 0 : 
                        (data.message.senderId._id === chat.adminId._id ? 
                         (chat.unreadCount?.user || 0) + 1 : chat.unreadCount?.user || 0),
                  
                  admin: isMessageFromMe ? chat.unreadCount?.admin || 0 : 
                         (data.message.senderId._id === chat.userId._id ? 
                          (chat.unreadCount?.admin || 0) + 1 : chat.unreadCount?.admin || 0)
                },
              }
            : chat
        )
      );
      
      // Update global unread count if not viewing this chat and message is not from me
      if (!isViewingThisChat && !isMessageFromMe) {
        setUnreadCount(prev => prev + 1);
      }
    };

    

    // Listen for chat created events
    const handleChatCreated = (data: { chat: Chat }) => {
      console.log('💬 NEW CHAT CREATED:', data);
      setChats(prev => {
        const exists = prev.find(c => c._id === data.chat._id);
        if (!exists) {
          return [data.chat, ...prev];
        }
        return prev;
      });
    };

    // Listen for typing indicators
    const handleUserTyping = (data: { chatId: string; userId: string; isTyping: boolean }) => {
      console.log('⌨️ TYPING INDICATOR:', data);
      
      if (currentChat && data.chatId === currentChat._id && data.userId !== user._id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userId !== data.userId);
          if (data.isTyping) {
            // Get user info from current chat
            const typingUser = data.userId === currentChat.userId._id 
              ? currentChat.userId 
              : currentChat.adminId;
            
            return [...filtered, { 
              userId: data.userId, 
              name: typingUser.name, 
              isTyping: true 
            }];
          }
          return filtered;
        });
      }
    };


    // Listen for message deletions
    const handleMessageDeleted = (data: { chatId: string; messageId: string }) => {
      console.log('🗑️ MESSAGE DELETED:', data);
      if (currentChat && data.chatId === currentChat._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === data.messageId 
            ? { ...msg, isDeleted: true }
            : msg
        ));
      }
    };

    // Listen for messages read receipts
// In your socket useEffect, update the handleMessagesRead function:
const handleMessagesRead = (data: { chatId: string; readBy: string; messageIds: string[] | 'all' }) => {
  console.log('👁️ MESSAGES READ:', data);
  
  // Update messages in current chat
  if (currentChat && data.chatId === currentChat._id) {
    setMessages(prev => prev.map(msg => {
      // If specific message IDs provided, only update those
      if (data.messageIds !== 'all' && Array.isArray(data.messageIds)) {
        if (!data.messageIds.includes(msg._id)) return msg;
      }
      
      const newReadBy = [...(msg.readBy || [])];
      const alreadyRead = newReadBy.find(r => r.userId === data.readBy);
      
      if (!alreadyRead) {
        newReadBy.push({ userId: data.readBy, readAt: new Date() });
      }
      
      return { ...msg, readBy: newReadBy, status: 'read' };
    }));
  }
  
  // Update unread counts in chat list
  setChats(prev => prev.map(chat => 
    chat._id === data.chatId 
      ? {
          ...chat,
          unreadCount: {
            ...chat.unreadCount,
            [isAdmin ? 'admin' : 'user']: 0
          }
        }
      : chat
  ));
};

    

    // Register all socket listeners
    socket.on('new-message', handleNewMessage);
    socket.on('chat-created', handleChatCreated);
    socket.on('user-typing', handleUserTyping);
    // socket.on('message-edited', handleMessageEdited);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('messages-read', handleMessagesRead);

    // Cleanup listeners
    return () => {
      console.log('🧹 Cleaning up chat socket listeners');
      socket.off('new-message', handleNewMessage);
      socket.off('chat-created', handleChatCreated);
      socket.off('user-typing', handleUserTyping);
    //   socket.off('message-edited', handleMessageEdited);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, connected, user, currentChat, isAdmin]);

  const fetchChats = async (filters: any = {}) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
      
      const url = `${CHAT_API.GET_CHATS}?${queryParams.toString()}`;
      const response = await axiosWrapper("get", url, {}, token ?? undefined) as any;
      
      console.log('FETCH CHATS RESPONSE:', response);
      
      // Handle different response structures
      const chatsData = response.data?.data || response.data || response || [];
      setChats(Array.isArray(chatsData) ? chatsData : []);
      
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const selectChat = async (chatId: string) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.GET_CHAT_BY_ID.replace(':chatId', chatId);
      const response = await axiosWrapper("get", url, {}, token ?? undefined) as any;
      
      console.log('SELECT CHAT RESPONSE:', response);
      
      // Handle different response structures
      const chatData = response.data?.chat || response.chat || response.data || response;
      setCurrentChat(chatData);
      
      await fetchMessages(chatId);
      await markMessagesAsRead(chatId);
      
    } catch (error) {
      console.error('Failed to select chat:', error);
    }
  };

  const createOrGetChat = async (participantId: string, subject?: string): Promise<Chat> => {
    try {
      const response = await axiosWrapper("post", CHAT_API.CREATE_OR_GET_CHAT, {
        participantId,
        subject: subject || 'Need Help',
        priority: 'medium'
      }, token ?? undefined) as any;
      
      console.log('CREATE/GET CHAT RESPONSE:', response);
      
      // Handle different response structures
      const chatData = response.data?.chat || response.chat || response.data || response;
      
      // Add to chats list if not exists
      setChats(prev => {
        const exists = prev.find(c => c._id === chatData._id);
        if (!exists) {
          return [chatData, ...prev];
        }
        return prev;
      });
      
      return chatData;
    } catch (error) {
      console.error('Failed to create/get chat:', error);
      throw error;
    }
  };

  const fetchMessages = async (chatId: string, page: number = 1) => {
    if (!user) return;
    
    setMessagesLoading(true);
    try {
      const url = CHAT_API.GET_MESSAGES.replace(':chatId', chatId);
      const response = await axiosWrapper("get", `${url}?page=${page}&limit=50`, {}, token ?? undefined) as any;
      
      console.log('FETCH MESSAGES RESPONSE:', response);
      
      // Handle different response structures
      const messagesData = response.data?.data || response.data || response || [];
      
      if (page === 1) {
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      } else {
        setMessages(prev => [...(Array.isArray(messagesData) ? messagesData : []), ...prev]);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };



  const sendMessage = async (chatId: string, content: string, type: string = 'text', metadata: any = {}, replyTo?: string) => {
    if (!user || !content.trim()) return;
    
    try {
      const url = CHAT_API.SEND_MESSAGE.replace(':chatId', chatId);
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        _id: 'temp_' + Date.now(),
        chatId,
        senderId: {
          _id: user._id,
          name: user.name || 'You',
          email: user.email || '',
          role: user.role
        },
        content: {
          type: type as any,
          data: content.trim(),
          metadata
        },
        status: 'sent',
        readBy: [{ userId: user._id, readAt: new Date() }],
        replyTo,
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Don't update unread counts for sender's own messages
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { 
              ...chat, 
              lastMessage: {
                messageId: 'temp_' + Date.now(),
                content: content.trim().substring(0, 100),
                sentAt: new Date(),
                senderId: user._id
              }
              // Remove unreadCount update here - let backend handle it
            }
          : chat
      ));
      
      // Send the actual message
      const response = await axiosWrapper("post", url, {
        content: content.trim(),
        type,
        metadata,
        replyTo
      }, token ?? undefined) as any;
      
      console.log('SEND MESSAGE RESPONSE:', response);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  };


  const editMessage = async (messageId: string, content: string) => {
    if (!user || !content.trim()) return;
    
    try {
      const url = CHAT_API.EDIT_MESSAGE.replace(':chatId', currentChat?._id || '').replace(':messageId', messageId);
      await axiosWrapper("patch", url, { content: content.trim() }, token ?? undefined);
    } catch (error) {
      console.error('Failed to edit message:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.DELETE_MESSAGE.replace(':chatId', currentChat?._id || '').replace(':messageId', messageId);
      await axiosWrapper("delete", url, {}, token ?? undefined);
    } catch (error) {
      console.error('Failed to delete message:', error);
      throw error;
    }
  };


  const markMessagesAsRead = async (chatId: string, messageIds?: string[]) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.MARK_MESSAGES_READ.replace(':chatId', chatId);
      await axiosWrapper("patch", url, { messageIds: messageIds || [] }, token ?? undefined);
      
      // Update local state to reset unread count for current user
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { 
              ...chat, 
              unreadCount: { 
                ...chat.unreadCount, 
                [isAdmin ? 'admin' : 'user']: 0 
              } 
            }
          : chat
      ));
      
      // Update messages read status in current chat
      if (currentChat && currentChat._id === chatId) {
        setMessages(prev => prev.map(msg => {
          if (messageIds && messageIds.length > 0 && !messageIds.includes(msg._id)) {
            return msg;
          }
          
          const alreadyRead = msg.readBy.find(r => r.userId === user._id);
          if (!alreadyRead) {
            return {
              ...msg,
              readBy: [...msg.readBy, { userId: user._id, readAt: new Date() }],
              status: 'read'
            };
          }
          return msg;
        }));
      }
      
      // Recalculate global unread count
      const totalUnread = chats.reduce((total, chat) => {
        return total + (isAdmin ? chat.unreadCount.admin : chat.unreadCount.user);
      }, 0);
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };


  const uploadFile = async (chatId: string, file: File) => {
    if (!user) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const url = CHAT_API.UPLOAD_FILE.replace(':chatId', chatId);
      const response = await axiosWrapper("post", url, formData, token ?? undefined) as any;
      
      console.log('FILE UPLOAD RESPONSE:', response);
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    }
  };

  const startTyping = async (chatId: string) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.TYPING_START.replace(':chatId', chatId);
      await axiosWrapper("post", url, {}, token ?? undefined);
    } catch (error) {
      console.error('Failed to start typing:', error);
    }
  };

  const stopTyping = async (chatId: string) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.TYPING_STOP.replace(':chatId', chatId);
      await axiosWrapper("post", url, {}, token ?? undefined);
    } catch (error) {
      console.error('Failed to stop typing:', error);
    }
  };

  const updateChatStatus = async (chatId: string, status: string, tags: string[] = []) => {
    if (!user || !isAdmin) return;
    
    try {
      const url = CHAT_API.UPDATE_CHAT_STATUS.replace(':chatId', chatId);
      await axiosWrapper("patch", url, { status, tags }, token ?? undefined);
    } catch (error) {
      console.error('Failed to update chat status:', error);
      throw error;
    }
  };

  const archiveChat = async (chatId: string, archive: boolean = true) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.ARCHIVE_CHAT.replace(':chatId', chatId);
      await axiosWrapper("patch", url, { archive }, token ?? undefined);
      
      // Update local state
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, isArchived: archive } : chat
      ));
    } catch (error) {
      console.error('Failed to archive chat:', error);
      throw error;
    }
  };

  const searchMessages = async (chatId: string, query: string, filters: any = {}) => {
    if (!user) return;
    
    try {
      const queryParams = new URLSearchParams({ query, ...filters });
      const url = CHAT_API.SEARCH_MESSAGES.replace(':chatId', chatId);
      const response = await axiosWrapper("get", `${url}?${queryParams.toString()}`, {}, token ?? undefined);
      
      return response;
    } catch (error) {
      console.error('Failed to search messages:', error);
      throw error;
    }
  };

  const getUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await axiosWrapper("get", CHAT_API.GET_UNREAD_COUNT, {}, token ?? undefined) as any;
      console.log('UNREAD COUNT RESPONSE:', response);
      
      const count = response.data?.unreadCount || response.unreadCount || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to get unread count:', error);
    }
  };

  const clearCurrentChat = () => {
    setCurrentChat(null);
    setMessages([]);
    setTypingUsers([]);
  };

  // Fetch initial data when user changes
// Add this useEffect to sync unread counts on mount and user change
useEffect(() => {
  if (user) {
    fetchChats();
    getUnreadCount();
    
    const interval = setInterval(getUnreadCount, 10000);
    return () => clearInterval(interval);
  }
}, [user]); // Remove chats from dependencies

// Add a separate useEffect to sync unread counts when chats change
useEffect(() => {
  if (chats.length > 0) {
    const totalUnread = chats.reduce((total, chat) => {
      return total + (isAdmin ? chat.unreadCount.admin : chat.unreadCount.user);
    }, 0);
    
    setUnreadCount(totalUnread);
  }
}, [chats, isAdmin]); // This is safe because isAdmin is a boolean


  // Debug socket connection
  useEffect(() => {
    console.log('CHAT CONTEXT DEBUG:', {
      socketConnected: connected,
      userExists: !!user,
      userId: user?._id,
      userRole: user?.role,
      chatsCount: chats.length,
      currentChatId: currentChat?._id
    });
  }, [socket, connected, user, chats.length, currentChat]);

  return (
    <ChatContext.Provider value={{
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
      updateChatStatus,
      archiveChat,
      fetchMessages,
      sendMessage,
      editMessage,
      deleteMessage,
      markMessagesAsRead,
      uploadFile,
      startTyping,
      stopTyping,
      searchMessages,
      getUnreadCount,
      clearCurrentChat
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};