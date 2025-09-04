"use client";
import React, { createContext, useState, useEffect, useContext, ReactNode, useRef, useCallback } from 'react';
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

interface ChatFilters {
  [key: string]: unknown;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  unreadCount: number;
  typingUsers: TypingUser[];
  
  fetchChats: (filters?: ChatFilters) => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  createOrGetChat: (participantId: string, subject?: string) => Promise<Chat>;
  updateChatStatus: (chatId: string, status: string, tags?: string[]) => Promise<void>;
  archiveChat: (chatId: string, archive?: boolean) => Promise<void>;
  fetchMessages: (chatId: string, page?: number) => Promise<void>;
  sendMessage: (chatId: string, content: string, type?: string, metadata?: Record<string, unknown>, replyTo?: string) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  markMessagesAsRead: (chatId: string, messageIds?: string[]) => Promise<void>;
  uploadFile: (chatId: string, file: File) => Promise<void>;
  startTyping: (chatId: string) => Promise<void>;
  stopTyping: (chatId: string) => Promise<void>;
  searchMessages: (chatId: string, query: string, filters?: ChatFilters) => Promise<unknown>;
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
  const processedMessageIds = useRef(new Set<string>());
  
  // Stable references for socket handlers
  const currentChatRef = useRef<Chat | null>(null);
  const messagesRef = useRef<Message[]>([]);
  const chatsRef = useRef<Chat[]>([]);

  // Update refs when state changes
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  // Calculate total unread count from chats
  useEffect(() => {
    const totalUnread = chats.reduce((sum, chat) => {
      return sum + (chat.unreadCount?.[isAdmin ? 'admin' : 'user'] || 0);
    }, 0);
    
    setUnreadCount(totalUnread);
  }, [chats, isAdmin]);

  // Stable socket event handlers
  const handleNewMessage = useCallback((data: { chatId: string; message: Message }) => {
    console.log('📨 NEW MESSAGE RECEIVED:', data);
  
    // Prevent processing the same message multiple times
    if (processedMessageIds.current.has(data.message._id)) {
      return;
    }
    processedMessageIds.current.add(data.message._id);
  
    const isViewingThisChat = currentChatRef.current ? data.chatId === currentChatRef.current._id : false;
    const isMessageFromMe = data.message.senderId._id === user?._id;
  
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
  }, [user]);

  const handleChatCreated = useCallback((data: { chat: Chat }) => {
    console.log('💬 NEW CHAT CREATED:', data);
    setChats(prev => {
      const exists = prev.find(c => c._id === data.chat._id);
      if (!exists) {
        return [data.chat, ...prev];
      }
      return prev;
    });
  }, []);

  const handleUserTyping = useCallback((data: { chatId: string; userId: string; isTyping: boolean }) => {
    console.log('⌨️ TYPING INDICATOR:', data);
    
    if (currentChatRef.current && data.chatId === currentChatRef.current._id && data.userId !== user?._id) {
      setTypingUsers(prev => {
        // Filter out the user if they stop typing or update their status
        const filtered = prev.filter(u => u.userId !== data.userId);
        
        if (data.isTyping) {
          const typingUser = data.userId === currentChatRef.current!.userId._id 
            ? currentChatRef.current!.userId 
            : currentChatRef.current!.adminId;
          
          // Only add if typingUser has valid data
          if (typingUser && typingUser.name) {
            return [...filtered, { 
              userId: data.userId, 
              name: typingUser.name, 
              isTyping: true 
            }];
          }
        }
        return filtered;
      });
    }
  }, [user]);

  // FIXED: Message deletion handler with proper state management
  const handleMessageDeleted = useCallback((data: { chatId: string; messageId: string; isLastMessage: boolean }) => {
    console.log('🗑️ MESSAGE DELETED:', data);
    
    // Update messages - mark as deleted
    setMessages(prev => {
      return prev.map(msg => 
        msg._id === data.messageId 
          ? { ...msg, isDeleted: true, content: { ...msg.content, data: 'This message was deleted' } }
          : msg
      );
    });
    
    // Update chat list if this was the last message
    if (data.isLastMessage) {
      setChats(prev => prev.map(chat => {
        if (chat._id === data.chatId) {
          // Find new last non-deleted message from current messages
          const currentMessages = messagesRef.current.filter(msg => 
            !msg.isDeleted && msg._id !== data.messageId
          );
          const newLastMessage = currentMessages[currentMessages.length - 1];
          
          return {
            ...chat,
            lastMessage: newLastMessage ? {
              messageId: newLastMessage._id,
              content: newLastMessage.content.data.substring(0, 100),
              sentAt: new Date(newLastMessage.createdAt),
              senderId: newLastMessage.senderId._id
            } : undefined
          };
        }
        return chat;
      }));

      // Update current chat
      if (currentChatRef.current && currentChatRef.current._id === data.chatId) {
        const currentMessages = messagesRef.current.filter(msg => 
          !msg.isDeleted && msg._id !== data.messageId
        );
        const newLastMessage = currentMessages[currentMessages.length - 1];
        
        setCurrentChat(prev => prev ? {
          ...prev,
          lastMessage: newLastMessage ? {
            messageId: newLastMessage._id,
            content: newLastMessage.content.data.substring(0, 100),
            sentAt: new Date(newLastMessage.createdAt),
            senderId: newLastMessage.senderId._id
          } : undefined
        } : null);
      }
    }
  }, []);

  const handleChatUpdated = useCallback((data: { chatId: string; chat: Chat }) => {
    console.log('🔄 CHAT UPDATED:', data);
    
    setChats(prev => prev.map(chat => 
      chat._id === data.chatId 
        ? { ...chat, ...data.chat }
        : chat
    ));
    
    // Update current chat if it's the same
    if (currentChatRef.current && currentChatRef.current._id === data.chatId) {
      setCurrentChat(prev => prev ? { ...prev, ...data.chat } : null);
    }
  }, []);

  // FIXED: Messages read handler with proper real-time updates
  const handleMessagesRead = useCallback((data: { 
    chatId: string; 
    readBy: string; 
    messageIds: string[] | 'all';
    readAt?: string;
  }) => {
    console.log('👁️ MESSAGES READ:', data);
    
    // Update messages with read receipts in real-time
    setMessages(prev => {
      return prev.map(msg => {
        const shouldUpdate = data.messageIds === 'all' || 
                           (Array.isArray(data.messageIds) && data.messageIds.includes(msg._id));
        
        if (!shouldUpdate) return msg;
        
        // Check if user already marked as read
        const alreadyRead = msg.readBy?.find(r => r.userId === data.readBy);
        if (alreadyRead) return msg;
        
        // Add read status with real-time update
        return {
          ...msg,
          readBy: [...(msg.readBy || []), { 
            userId: data.readBy, 
            readAt: new Date(data.readAt || new Date()) 
          }],
          status: 'read' as const
        };
      });
    });
    
    // Update unread counts in chat list
    setChats(prev => prev.map(chat => 
      chat._id === data.chatId 
        ? {
            ...chat,
            unreadCount: {
              ...chat.unreadCount,
              // Reset unread count for the user who read the messages
              [data.readBy === chat.userId._id ? 'user' : 'admin']: 0
            }
          }
        : chat
    ));
  }, []);

  // Socket event listeners setup
  useEffect(() => {
    if (!socket || !connected || !user) {
      console.log('Socket not ready:', { socket: !!socket, connected, user: !!user });
      return;
    }

    console.log('Setting up chat socket listeners for user:', user._id);

    // Register all socket listeners with stable references
    socket.on('new-message', handleNewMessage);
    socket.on('chat-created', handleChatCreated);
    socket.on('user-typing', handleUserTyping);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('chat-updated', handleChatUpdated);
    socket.on('messages-read', handleMessagesRead);

    // Cleanup listeners
    return () => {
      console.log('🧹 Cleaning up chat socket listeners');
      socket.off('new-message', handleNewMessage);
      socket.off('chat-created', handleChatCreated);
      socket.off('user-typing', handleUserTyping);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('chat-updated', handleChatUpdated);
      socket.off('messages-read', handleMessagesRead);
    };
  }, [socket, connected, user, handleNewMessage, handleChatCreated, handleUserTyping, handleMessageDeleted, handleChatUpdated, handleMessagesRead]);

  const fetchChats = async (filters: ChatFilters = {}) => {
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
      
      // const chatData = response.data?.chat || response.chat || response.data || response;
      const chatData = response.data?.data?.chat || response.data?.chat || response.chat || response.data?.data || response.data || response;
      setCurrentChat(chatData);
      
      await fetchMessages(chatId);
      
      // Mark messages as read when selecting a chat
      setTimeout(() => {
        markMessagesAsRead(chatId);
      }, 500);
      
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
      
      // const chatData = response.data?.chat || response.chat || response.data || response;
      const chatData = response.data?.data?.chat || response.data?.chat || response.chat || response.data?.data || response.data || response;
      
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
      
      const messagesData = response.data?.data || response.data || response || [];
      
      if (page === 1) {
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        // Clear processed message IDs when fetching fresh messages
        processedMessageIds.current.clear();
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

  const sendMessage = async (chatId: string, content: string, type: string = 'text', metadata: Record<string, unknown> = {}, replyTo?: string) => {
    if (!user || !content.trim()) return;
    
    const tempId = 'temp_' + Date.now() + '_' + Math.random();
    
    try {
      const url = CHAT_API.SEND_MESSAGE.replace(':chatId', chatId);
      
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        _id: tempId,
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
      
      // Update chat list with optimistic message
      setChats(prev => prev.map(chat => 
        chat._id === chatId 
          ? { 
              ...chat, 
              lastMessage: {
                messageId: tempId,
                content: content.trim().substring(0, 100),
                sentAt: new Date(),
                senderId: user._id
              }
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
      
      // Replace optimistic message with real one when response comes back
      // const realMessage = response.data?.message || response.message || response.data || response;
      const realMessage = response.data?.data?.message || response.data?.message || response.message || response.data?.data || response.data || response;
      if (realMessage && realMessage._id) {
        setMessages(prev => prev.map(msg => 
          msg._id === tempId ? realMessage : msg
        ));
        
        // Add to processed set to prevent duplicate from socket
        processedMessageIds.current.add(realMessage._id);
      }
      
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
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

  // FIXED: Delete message with proper temp ID handling
  const deleteMessage = async (messageId: string) => {
    if (!user || !currentChat) return;
    
    // Skip deletion of temporary messages
    if (messageId.startsWith('temp_')) {
      console.log('Skipping deletion of temporary message:', messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      return;
    }
    
    // Find the message being deleted
    const messageToDelete = messages.find(msg => msg._id === messageId);
    if (!messageToDelete) {
      console.warn('Message not found for deletion:', messageId);
      return;
    }
    
    // Optimistically update UI immediately
    setMessages(prev => prev.map(msg => 
      msg._id === messageId 
        ? { ...msg, isDeleted: true, content: { ...msg.content, data: 'This message was deleted' } }
        : msg
    ));
    
    // Check if this is the last message
    const isLastMessage = currentChat.lastMessage?.messageId === messageId;
    
    // Handle last message update optimistically
    if (isLastMessage) {
      const remainingMessages = messages.filter(msg => 
        !msg.isDeleted && msg._id !== messageId
      );
      const newLastMessage = remainingMessages[remainingMessages.length - 1];
      
      const lastMessageUpdate = newLastMessage ? {
        messageId: newLastMessage._id,
        content: newLastMessage.content.data.substring(0, 100),
        sentAt: new Date(newLastMessage.createdAt),
        senderId: newLastMessage.senderId._id
      } : undefined;
      
      // Update current chat
      setCurrentChat(prev => prev ? {
        ...prev,
        lastMessage: lastMessageUpdate
      } : null);
      
      // Update chats list
      setChats(prev => prev.map(chat => 
        chat._id === currentChat._id
          ? { ...chat, lastMessage: lastMessageUpdate }
          : chat
      ));
    }
    
    try {
      const url = CHAT_API.DELETE_MESSAGE.replace(':chatId', currentChat._id).replace(':messageId', messageId);
      const response = await axiosWrapper("delete", url, {}, token ?? undefined) as any;
      console.log('✅ Message deleted successfully', response);
      
    } catch (error: any) {
      console.error('❌ Failed to delete message:', error);
      
      // Revert optimistic updates on error
      setMessages(prev => prev.map(msg => 
        msg._id === messageId 
          ? { ...msg, isDeleted: false, content: messageToDelete.content }
          : msg
      ));
      
      if (isLastMessage) {
        setCurrentChat(prev => prev ? {
          ...prev,
          lastMessage: currentChat.lastMessage
        } : null);
        
        setChats(prev => prev.map(chat => 
          chat._id === currentChat._id
            ? { ...chat, lastMessage: currentChat.lastMessage }
            : chat
        ));
      }
      
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete message');
    }
  };

  // FIXED: Mark messages as read with proper real-time updates
  const markMessagesAsRead = async (chatId: string, messageIds?: string[]) => {
    if (!user) return;
    
    try {
      const url = CHAT_API.MARK_MESSAGES_READ.replace(':chatId', chatId);
      await axiosWrapper("patch", url, { messageIds: messageIds || [] }, token ?? undefined);
      
      // Update local unread count immediately
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
      
      // Update messages read status in current chat with real-time feedback
      if (currentChat && currentChat._id === chatId) {
        setMessages(prev => prev.map(msg => {
          // Skip messages from current user or already read messages
          if (msg.senderId._id === user._id) return msg;
          
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
      
      setChats(prev => prev.map(chat => 
        chat._id === chatId ? { ...chat, isArchived: archive } : chat
      ));
    } catch (error) {
      console.error('Failed to archive chat:', error);
      throw error;
    }
  };

  const searchMessages = async (chatId: string, query: string, filters: ChatFilters = {}) => {
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
      
      // const count = response.data?.unreadCount || response.unreadCount || 0;
      const count = response.data?.data?.unreadCount || response.data?.unreadCount || response.unreadCount || 0;
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to get unread count:', error);
    }
  };

  const clearCurrentChat = () => {
    setCurrentChat(null);
    setMessages([]);
    setTypingUsers([]);
    processedMessageIds.current.clear();
  };

  // Fetch initial data when user changes
  useEffect(() => {
    if (user) {
      fetchChats();
      getUnreadCount();
      
      const interval = setInterval(getUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const contextValue: ChatContextType = {
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
  };

  return (
    <ChatContext.Provider value={contextValue}>
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