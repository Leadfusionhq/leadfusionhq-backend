const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const ChatServices = require('../../services/chat/chat.service');
const { celebrate, Joi, Segments } = require('celebrate');

// Get all chats for current user
const getChats = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { 
    page = 1, 
    limit = 20, 
    status = 'all',
    archived = false,
    search = ''
  } = req.query;

  const data = await ChatServices.getChats(
    userId,
    userRole,
    parseInt(page),
    parseInt(limit),
    status,
    archived === 'true',
    search
  );

  sendResponse(res, data, "Chats fetched successfully", 200);
});

// Get specific chat by ID
const getChatById = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { chatId } = req.params;

  const chat = await ChatServices.getChatById(chatId, userId, userRole);
  sendResponse(res, { chat }, "Chat fetched successfully", 200);
});

// Create new chat or get existing one
const createOrGetChat = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { participantId, subject, priority = 'medium' } = req.body;

  const chat = await ChatServices.createOrGetChat(
    userId, 
    userRole, 
    participantId, 
    subject, 
    priority
  );

  sendResponse(res, { chat }, "Chat created/retrieved successfully", 201);
});

// Update chat status (admin only)
const updateChatStatus = wrapAsync(async (req, res) => {
  const adminId = req.user._id;
  const { chatId } = req.params;
  const { status, tags } = req.body;

  const chat = await ChatServices.updateChatStatus(chatId, adminId, status, tags);
  sendResponse(res, { chat }, "Chat status updated successfully", 200);
});

// Archive/unarchive chat
const archiveChat = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { chatId } = req.params;
  const { archive = true } = req.body;

  const chat = await ChatServices.archiveChat(chatId, userId, userRole, archive);
  sendResponse(res, { chat }, `Chat ${archive ? 'archived' : 'unarchived'} successfully`, 200);
});

// Assign chat to admin
const assignChat = wrapAsync(async (req, res) => {
  const adminId = req.user._id;
  const { chatId } = req.params;
  const { assignToId } = req.body;

  const chat = await ChatServices.assignChat(chatId, adminId, assignToId);
  sendResponse(res, { chat }, "Chat assigned successfully", 200);
});

// Get messages for a chat
const getMessages = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { chatId } = req.params;
  const { 
    page = 1, 
    limit = 50, 
    before = null, // For cursor-based pagination
    after = null 
  } = req.query;

  const data = await ChatServices.getMessages(
    chatId,
    userId,
    userRole,
    parseInt(page),
    parseInt(limit),
    before,
    after
  );

  sendResponse(res, data, "Messages fetched successfully", 200);
});

// Send new message
const sendMessage = wrapAsync(async (req, res) => {
  const senderId = req.user._id;
  const { chatId } = req.params;
  const { 
    content, 
    type = 'text', 
    metadata = {},
    replyTo = null 
  } = req.body;

  const message = await ChatServices.sendMessage(
    chatId,
    senderId,
    content,
    type,
    metadata,
    replyTo
  );

  sendResponse(res, { message }, "Message sent successfully", 201);
});

// Edit message
const editMessage = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;
  const { content } = req.body;

  const message = await ChatServices.editMessage(messageId, userId, content);
  sendResponse(res, { message }, "Message edited successfully", 200);
});

// Delete message
const deleteMessage = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { chatId, messageId } = req.params;

  const message = await ChatServices.deleteMessage(messageId, userId);
  sendResponse(res, { message }, "Message deleted successfully", 200);
});

// Mark messages as read
const markMessagesAsRead = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { chatId } = req.params;
  const { messageIds = [] } = req.body;

  const result = await ChatServices.markMessagesAsRead(
    chatId, 
    userId, 
    userRole, 
    messageIds
  );

  sendResponse(res, result, "Messages marked as read successfully", 200);
});

// Upload file
const uploadFile = wrapAsync(async (req, res) => {
  const senderId = req.user._id;
  const { chatId } = req.params;
  
  if (!req.file) {
    return sendResponse(res, null, "No file uploaded", 400);
  }

  const message = await ChatServices.uploadFile(chatId, senderId, req.file);
  sendResponse(res, { message }, "File uploaded successfully", 201);
});

// Start typing indicator
const startTyping = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  await ChatServices.startTyping(chatId, userId);
  sendResponse(res, null, "Typing indicator started", 200);
});

// Stop typing indicator
const stopTyping = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { chatId } = req.params;

  await ChatServices.stopTyping(chatId, userId);
  sendResponse(res, null, "Typing indicator stopped", 200);
});

// Search messages
const searchMessages = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const { chatId } = req.params;
  const { 
    query, 
    type = 'all', 
    dateFrom = null, 
    dateTo = null,
    page = 1,
    limit = 20
  } = req.query;

  const data = await ChatServices.searchMessages(
    chatId,
    userId,
    userRole,
    query,
    type,
    dateFrom,
    dateTo,
    parseInt(page),
    parseInt(limit)
  );

  sendResponse(res, data, "Messages searched successfully", 200);
});

// Get unread count
// const getUnreadCount = wrapAsync(async (req, res) => {
//   const userId = req.user._id;
//   const userRole = req.user.role;

//   const count = await ChatServices.getUnreadCount(userId, userRole);
//   sendResponse(res, { unreadCount: count }, "Unread count fetched successfully", 200);
// });
const getUnreadCount = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  
  try {
    const count = await ChatServices.getUnreadCount(userId, userRole);
    sendResponse(res, { unreadCount: count }, "Success", 200);
  } catch (error) {
    console.error('Error:', error);
    sendResponse(res, null, "Failed", 500);
  }
});
// Validation middleware
const validateCreateChat = celebrate({
  [Segments.BODY]: Joi.object().keys({
    participantId: Joi.string().required(),
    subject: Joi.string().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional()
  })
});

const validateSendMessage = celebrate({
  [Segments.BODY]: Joi.object().keys({
    content: Joi.string().required().max(10000),
    type: Joi.string().valid('text', 'image', 'file', 'audio', 'video').optional(),
    metadata: Joi.object().optional(),
    replyTo: Joi.string().optional()
  })
});

const validateEditMessage = celebrate({
  [Segments.BODY]: Joi.object().keys({
    content: Joi.string().required().max(10000)
  })
});

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
  
  // Validation middleware exports
  validateCreateChat,
  validateSendMessage,
  validateEditMessage
};