const { Chat } = require('../../models/chat.model');
const {  Message } = require('../../models/message.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { getIdStr } = require('../../utils/chat.utils');
const { getIO } = require('../../config/socket');
const CONSTANT_ENUM = require('../../helper/constant-enums');
const mongoose = require('mongoose');

// Get chats for user/admin
const getChats = async (userId, userRole, page = 1, limit = 20, status = 'all', archived = false, search = '') => {
  const skip = (page - 1) * limit;
  
  // Build query based on user role
  let query = { isActive: true, isArchived: archived };
  
  if (userRole === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    query.$or = [
      { adminId: userId },
      { assignedTo: userId }
    ];
  } else {
    query.userId = userId;
  }
  
  // Filter by chat status
  if (status !== 'all') {
    query.chatStatus = status;
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }
  
  const chats = await Chat.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ 'lastMessage.sentAt': -1, updatedAt: -1 });
  
  const totalCount = await Chat.countDocuments(query);
  
  return {
    data: chats,
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit)
  };
};

// Get specific chat by ID
const getChatById = async (chatId, userId, userRole) => {
  let query = { _id: chatId, isActive: true };
  
  // Ensure user has access to this chat
  if (userRole === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    query.$or = [
      { adminId: userId },
      { assignedTo: userId }
    ];
  } else {
    query.userId = userId;
  }
  
  const chat = await Chat.findOne(query);
  
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found or access denied');
  }
  
  return chat;
};

// Create new chat or get existing one
const createOrGetChat = async (userId, userRole, participantId, subject = null, priority = 'medium') => {
  let query = {};
  
  // Determine chat participants based on user role
  if (userRole === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    query = {
      userId: participantId,
      adminId: userId,
      isActive: true
    };
  } else {
    query = {
      userId: userId,
      adminId: participantId,
      isActive: true
    };
  }
  
  // Check if chat already exists
  let chat = await Chat.findOne(query);
  
  if (!chat) {
    // Create new chat
    const chatData = {
      ...query,
      subject,
      priority,
      chatStatus: 'open'
    };
    
    // For users initiating chat, assign to the specified admin or any available admin
    if (userRole === CONSTANT_ENUM.USER_ROLE.USER) {
      chatData.assignedTo = participantId;
    }
    
    chat = new Chat(chatData);
    await chat.save();
    await chat.populate('userId adminId assignedTo');
    
    // Emit chat created event
    try {
      const io = getIO();
      io.to(participantId.toString()).emit('chat-created', { chat });
    } catch (error) {
      console.error('Socket error:', error.message);
    }
  }
  
  return chat;
};

// Update chat status (admin only)
const updateChatStatus = async (chatId, adminId, status, tags = []) => {
  const chat = await Chat.findOneAndUpdate(
    { 
      _id: chatId, 
      $or: [{ adminId: adminId }, { assignedTo: adminId }],
      isActive: true 
    },
    { 
      chatStatus: status,
      tags: tags,
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found or access denied');
  }
  
  // Emit status update
  try {
    const io = getIO();
    io.to(chat.userId.toString()).emit('chat-updated', {
      chatId,
      chat: chat.toObject()
    });
  } catch (error) {
    console.error('Socket error:', error.message);
  }
  
  return chat;
};

// Archive/unarchive chat
const archiveChat = async (chatId, userId, userRole, archive = true) => {
  let query = { _id: chatId };
  
  if (userRole === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    query.$or = [
      { adminId: userId },
      { assignedTo: userId }
    ];
  } else {
    query.userId = userId;
  }
  
  const updateData = {
    isArchived: archive,
    updatedAt: new Date()
  };
  
  if (archive) {
    updateData.archivedAt = new Date();
    updateData.archivedBy = userId;
  } else {
    updateData.$unset = { archivedAt: 1, archivedBy: 1 };
  }
  
  const chat = await Chat.findOneAndUpdate(query, updateData, { new: true });
  
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found or access denied');
  }
  
  return chat;
};

// Assign chat to admin
const assignChat = async (chatId, adminId, assignToId) => {
  const chat = await Chat.findOneAndUpdate(
    { 
      _id: chatId, 
      $or: [{ adminId: adminId }, { assignedTo: adminId }],
      isActive: true 
    },
    { 
      assignedTo: assignToId,
      updatedAt: new Date()
    },
    { new: true }
  );
  
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found or access denied');
  }
  
  // Notify the assigned admin
  try {
    const io = getIO();
    io.to(assignToId.toString()).emit('chat-assigned', { chat });
  } catch (error) {
    console.error('Socket error:', error.message);
  }
  
  return chat;
};

// Get messages for a chat
const getMessages = async (chatId, userId, userRole, page = 1, limit = 50, before = null, after = null) => {
  // Verify access to chat
  await getChatById(chatId, userId, userRole);

  // Verify access to chat and mark messages as read
  const chat = await getChatById(chatId, userId, userRole);
  
  const skip = (page - 1) * limit;
  let query = { 
    chatId: new mongoose.Types.ObjectId(chatId), 
    isDeleted: false 
  };
  
  // Cursor-based pagination
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }
  if (after) {
    query.createdAt = { $gt: new Date(after) };
  }
  
  const messages = await Message.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const totalCount = await Message.countDocuments({
    chatId: new mongoose.Types.ObjectId(chatId),
    isDeleted: false
  });
  
  return {
    data: messages.reverse(), // Reverse to show oldest first
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit)
  };
};

// Send new message
const sendMessage = async (chatId, senderId, content, type = 'text', metadata = {}, replyTo = null) => {
  // Verify access to chat
  const chat = await Chat.findById(chatId);
  if (!chat || !chat.isActive) {
    throw new ErrorHandler(404, 'Chat not found or inactive');
  }
  
  // Verify sender is part of the chat
  const senderIdStr = senderId.toString();
  const isParticipant = [
    getIdStr(chat.userId),
    getIdStr(chat.adminId),
    getIdStr(chat.assignedTo)
  ].includes(senderIdStr);

  if (!isParticipant) {
    throw new ErrorHandler(403, 'Access denied to this chat');
  }
  
  // Create message
  const message = new Message({
    chatId,
    senderId,
    content: {
      type,
      data: content,
      metadata
    },
    replyTo: replyTo || undefined
  });
  
  await message.save();
  await message.populate('senderId replyTo');
  
  const isSenderUser = senderIdStr === getIdStr(chat.userId);
  const recipientRole = isSenderUser ? 'admin' : 'user';

  await Chat.findByIdAndUpdate(chatId, {
    lastMessage: {
      messageId: message._id,
      content: content.substring(0, 100),
      sentAt: message.createdAt,
      senderId: senderId
    },
    // Only increment unread count for recipient, not sender
    $inc: {
      [`unreadCount.${recipientRole}`]: 1
    },
    updatedAt: new Date()
  });
  
  // Real-time emission
  try {
    const io = getIO();
    const recipients = [chat.userId, chat.adminId, chat.assignedTo]
    .map(getIdStr)
    .filter(idStr => idStr && idStr !== senderIdStr);

    console.log(`🚀 Emitting to recipients: ${recipients}`);
    recipients.forEach(recipientId => {
      io.to(recipientId.toString()).emit('new-message', {
        chatId,
        message: message.toObject()
      });
    });
    console.log('✅ Socket emission completed');
  } catch (error) {
    console.error('Socket error:', error.message);
  }
  
  return message;
};

// Edit message
const editMessage = async (messageId, userId, newContent) => {
  const message = await Message.findOneAndUpdate(
    { 
      _id: messageId, 
      senderId: userId,
      isDeleted: false
    },
    {
      'content.data': newContent,
      isEdited: true,
      editedAt: new Date()
    },
    { new: true }
  );
  
  if (!message) {
    throw new ErrorHandler(404, 'Message not found or access denied');
  }
  
  // Emit update
  try {
    const io = getIO();
    const chat = await Chat.findById(message.chatId);
    const recipients = [chat.userId, chat.adminId, chat.assignedTo]
      .filter(id => id && id.toString() !== userId.toString());
    
    recipients.forEach(recipientId => {
      io.to(recipientId.toString()).emit('message-edited', {
        chatId: message.chatId,
        messageId: message._id,
        newContent
      });
    });
  } catch (error) {
    console.error('Socket error:', error.message);
  }
  
  return message;
};

// FIXED: Delete message with comprehensive real-time updates
const deleteMessage = async (messageId, userId) => {
  console.log(`🗑️ Attempting to delete message: ${messageId} by user: ${userId}`);
  
  const message = await Message.findOneAndUpdate(
    { 
      _id: messageId, 
      senderId: userId,
      isDeleted: false
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    },
    { new: true }
  );
  
  if (!message) {
    throw new ErrorHandler(404, 'Message not found or access denied');
  }

  // Get the chat to check if this was the last message
  const chat = await Chat.findById(message.chatId);
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found');
  }

  // Check if the deleted message was the last message in the chat
  const isLastMessage = chat.lastMessage?.messageId?.toString() === messageId.toString();
  
  let updatedChat = chat;
  
  if (isLastMessage) {
    console.log(`🔄 Deleted message was last message, finding new last message...`);
    
    // Find the new last message (most recent non-deleted message)
    const newLastMessage = await Message.findOne({
      chatId: message.chatId,
      isDeleted: false,
      _id: { $ne: messageId } // Exclude the deleted message
    })
    .sort({ createdAt: -1 })
    .populate('senderId');

    // Update chat with new last message or clear it if no messages left
    const updateData = newLastMessage ? {
      lastMessage: {
        messageId: newLastMessage._id,
        content: newLastMessage.content.data.substring(0, 100),
        sentAt: newLastMessage.createdAt,
        senderId: newLastMessage.senderId._id
      },
      updatedAt: new Date()
    } : {
      $unset: { lastMessage: 1 },
      updatedAt: new Date()
    };

    updatedChat = await Chat.findByIdAndUpdate(
      message.chatId,
      updateData,
      { new: true }
    ).populate('userId adminId assignedTo');
    
    console.log(`✅ Updated chat with new last message:`, newLastMessage ? newLastMessage._id : 'none');
  }
  
  // FIXED: Real-time emission with comprehensive updates
  try {
    const io = getIO();
    const recipients = [chat.userId, chat.adminId, chat.assignedTo]
      .map(getIdStr)
      .filter(idStr => idStr && idStr !== userId.toString());

    console.log(`🚀 Emitting message deletion to recipients: ${recipients}`);
    
    recipients.forEach(recipientId => {
      // Emit message deletion event
      io.to(recipientId.toString()).emit('message-deleted', {
        chatId: message.chatId,
        messageId: messageId,
        isLastMessage: isLastMessage
      });

      // If this was the last message, also emit chat update
      if (isLastMessage) {
        io.to(recipientId.toString()).emit('chat-updated', {
          chatId: message.chatId,
          chat: updatedChat.toObject()
        });
      }
    });
    
    console.log('✅ Socket emission completed for message deletion');
  } catch (error) {
    console.error('❌ Socket error during message deletion:', error.message);
  }
  
  return { 
    message, 
    chat: updatedChat,
    wasLastMessage: isLastMessage 
  };
};

// FIXED: Mark messages as read with proper real-time updates
const markMessagesAsRead = async (chatId, userId, userRole, messageIds = []) => {
  console.log(`👁️ Marking messages as read in chat ${chatId} by user ${userId}`);
  
  // Verify access to chat
  const chat = await getChatById(chatId, userId, userRole);
  
  let query = { 
    chatId: new mongoose.Types.ObjectId(chatId), 
    senderId: { $ne: userId }, // Only mark others' messages as read
    isDeleted: false
  };
  
  // If specific message IDs provided
  if (messageIds.length > 0) {
    query._id = { $in: messageIds.map(id => new mongoose.Types.ObjectId(id)) };
  }
  
  // Find messages to update (ones not already read by this user)
  const messagesToUpdate = await Message.find({
    ...query,
    'readBy.userId': { $ne: userId } // Only get messages not already read by this user
  });
  
  console.log(`📚 Found ${messagesToUpdate.length} messages to mark as read`);
  
  if (messagesToUpdate.length === 0) {
    console.log('✅ No messages to update');
    return { modifiedCount: 0 };
  }
  
  // Update messages with read status
  const result = await Message.updateMany(
    {
      _id: { $in: messagesToUpdate.map(msg => msg._id) }
    },
    {
      $addToSet: {
        readBy: {
          userId: userId,
          readAt: new Date()
        }
      },
      status: 'read'
    }
  );
  
  console.log(`📝 Updated ${result.modifiedCount} messages with read status`);
  
  // Reset unread count for this user
  const unreadField = userRole === CONSTANT_ENUM.USER_ROLE.ADMIN ? 'unreadCount.admin' : 'unreadCount.user';
  await Chat.findByIdAndUpdate(chatId, {
    [unreadField]: 0
  });
  
  console.log(`🔄 Reset unread count for ${userRole} in chat ${chatId}`);
  
  // FIXED: Emit read receipts with proper data structure
  try {
    const io = getIO();
    const recipients = [chat.userId, chat.adminId, chat.assignedTo]
      .map(getIdStr)
      .filter(idStr => idStr && idStr !== userId.toString());
    
    console.log(`🚀 Emitting read receipts to recipients: ${recipients}`);
    
    // Emit comprehensive read update
    recipients.forEach(recipientId => {
      io.to(recipientId.toString()).emit('messages-read', {
        chatId,
        readBy: userId,
        messageIds: messagesToUpdate.map(msg => msg._id.toString()),
        readAt: new Date().toISOString()
      });
    });
    
    console.log('✅ Read receipt emission completed');
    
  } catch (error) {
    console.error('❌ Socket error during read receipt emission:', error.message);
  }
  
  return { modifiedCount: result.modifiedCount };
};

// Upload file
const uploadFile = async (chatId, senderId, file) => {
  const { filename, originalname, mimetype, size, path } = file;
  
  // Determine content type based on mimetype
  let contentType = CONSTANT_ENUM.CONTENT_TYPE.FILE;
  if (mimetype.startsWith('image/')) {
    contentType = CONSTANT_ENUM.CONTENT_TYPE.IMAGE;
  } else if (mimetype.startsWith('audio/')) {
    contentType = CONSTANT_ENUM.CONTENT_TYPE.AUDIO;
  } else if (mimetype.startsWith('video/')) {
    contentType = CONSTANT_ENUM.CONTENT_TYPE.VIDEO;
  }
  
  const metadata = {
    fileName: originalname,
    fileSize: size,
    mimeType: mimetype,
    originalUrl: `/uploads/${filename}`
  };
  
  // Send as message
  const message = await sendMessage(
    chatId,
    senderId,
    `/uploads/${filename}`, // File URL as content
    contentType,
    metadata
  );
  
  return message;
};

// Start typing indicator
const startTyping = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found');
  }
  
  try {
    const io = getIO();
    const recipients = [chat.userId, chat.adminId, chat.assignedTo]
      .map(getIdStr)
      .filter(idStr => idStr && idStr !== userId.toString());
    
    recipients.forEach(recipientId => {
      io.to(recipientId.toString()).emit('user-typing', {
        chatId,
        userId,
        isTyping: true
      });
    });
  } catch (error) {
    console.error('Socket error:', error.message);
  }
};

// Stop typing indicator
const stopTyping = async (chatId, userId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ErrorHandler(404, 'Chat not found');
  }
  
  try {
    const io = getIO();
    const recipients = [chat.userId, chat.adminId, chat.assignedTo]
      .map(getIdStr)
      .filter(idStr => idStr && idStr !== userId.toString());
    
    recipients.forEach(recipientId => {
      io.to(recipientId.toString()).emit('user-typing', {
        chatId,
        userId,
        isTyping: false
      });
    });
  } catch (error) {
    console.error('Socket error:', error.message);
  }
};

// Search messages
const searchMessages = async (chatId, userId, userRole, searchQuery, type = 'all', dateFrom = null, dateTo = null, page = 1, limit = 20) => {
  // Verify access to chat
  await getChatById(chatId, userId, userRole);
  
  const skip = (page - 1) * limit;
  let query = {
    chatId: new mongoose.Types.ObjectId(chatId),
    isDeleted: false
  };
  
  // Text search
  if (searchQuery) {
    query['content.data'] = { $regex: searchQuery, $options: 'i' };
  }
  
  // Filter by content type
  if (type !== 'all') {
    query['content.type'] = type;
  }
  
  // Date range filter
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }
  
  const messages = await Message.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const totalCount = await Message.countDocuments(query);
  
  return {
    data: messages,
    page,
    limit,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    searchQuery,
    type,
    dateRange: { from: dateFrom, to: dateTo }
  };
};

// Get unread count
const getUnreadCount = async (userId, userRole) => {
  let query = { isActive: true, isArchived: false };
  let unreadField;
  
  if (userRole === CONSTANT_ENUM.USER_ROLE.ADMIN) {
    query.$or = [
      { adminId: userId },
      { assignedTo: userId }
    ];
    unreadField = 'unreadCount.admin';
  } else {
    query.userId = userId;
    unreadField = 'unreadCount.user';
  }
  
  const chats = await Chat.find(query).select(unreadField);
  const totalUnread = chats.reduce((sum, chat) => {
    const unreadCount = userRole === CONSTANT_ENUM.USER_ROLE.ADMIN 
      ? chat.unreadCount?.admin || 0
      : chat.unreadCount?.user || 0;
    return sum + unreadCount;
  }, 0);
  
  return totalUnread;
};

// Get chat statistics (for admin dashboard)
const getChatStatistics = async (adminId) => {
  const stats = await Chat.aggregate([
    {
      $match: {
        $or: [{ adminId: new mongoose.Types.ObjectId(adminId) }, { assignedTo: new mongoose.Types.ObjectId(adminId) }],
        isActive: true
      }
    },
    {
      $group: {
        _id: '$chatStatus',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalChats = await Chat.countDocuments({
    $or: [{ adminId: adminId }, { assignedTo: adminId }],
    isActive: true
  });
  
  const totalMessages = await Message.countDocuments({
    chatId: { 
      $in: await Chat.find({
        $or: [{ adminId: adminId }, { assignedTo: adminId }],
        isActive: true
      }).distinct('_id')
    },
    isDeleted: false
  });
  
  return {
    totalChats,
    totalMessages,
    statusBreakdown: stats,
    avgResponseTime: null // TODO: Calculate average response time
  };
};

module.exports = {
  getChats,
  getChatById,
  createOrGetChat,
  updateChatStatus,
  archiveChat,
  assignChat,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markMessagesAsRead,
  uploadFile,
  startTyping,
  stopTyping,
  searchMessages,
  getUnreadCount,
  getChatStatistics
};