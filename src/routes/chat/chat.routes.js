const express = require('express');
const chatRouter = express.Router();
const chatController = require('../../controllers/chat/chat.controller');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');
// const upload = require('../../middleware/file-upload');

const API = {
  // Chat management
  GET_CHATS: '/',
  GET_CHAT_BY_ID: '/:chatId',
  CREATE_OR_GET_CHAT: '/create-or-get',
  UPDATE_CHAT_STATUS: '/:chatId/status',
  ARCHIVE_CHAT: '/:chatId/archive',
  ASSIGN_CHAT: '/:chatId/assign',
  
  // Messages
  GET_MESSAGES: '/:chatId/messages',
  SEND_MESSAGE: '/:chatId/messages',
  EDIT_MESSAGE: '/:chatId/messages/:messageId',
  DELETE_MESSAGE: '/:chatId/messages/:messageId',
  MARK_MESSAGES_READ: '/:chatId/mark-read',
  
  // File uploads
  UPLOAD_FILE: '/:chatId/upload',
  
  // Typing indicators
  TYPING_START: '/:chatId/typing/start',
  TYPING_STOP: '/:chatId/typing/stop',
  
  // Search and filters
  SEARCH_MESSAGES: '/:chatId/search',
  GET_UNREAD_COUNT: '/unread-count'
};

// Apply authentication to all routes
chatRouter.use(checkAuth);

// Chat management routes
chatRouter.get(API.GET_CHATS, chatController.getChats);
chatRouter.get(API.GET_CHAT_BY_ID, chatController.getChatById);
chatRouter.post(API.CREATE_OR_GET_CHAT, chatController.createOrGetChat);
chatRouter.patch(API.UPDATE_CHAT_STATUS, 
  authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]), 
  chatController.updateChatStatus
);
chatRouter.patch(API.ARCHIVE_CHAT, chatController.archiveChat);
chatRouter.patch(API.ASSIGN_CHAT, 
  authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]), 
  chatController.assignChat
);

// Message routes
chatRouter.get(API.GET_MESSAGES, chatController.getMessages);
chatRouter.post(API.SEND_MESSAGE, chatController.sendMessage);
chatRouter.patch(API.EDIT_MESSAGE, chatController.editMessage);
chatRouter.delete(API.DELETE_MESSAGE, chatController.deleteMessage);
chatRouter.patch(API.MARK_MESSAGES_READ, chatController.markMessagesAsRead);

// File upload
chatRouter.post(API.UPLOAD_FILE, 
//   upload.single('file'), // or upload.array('files', 5) for multiple files
  chatController.uploadFile
);

// Typing indicators
chatRouter.post(API.TYPING_START, chatController.startTyping);
chatRouter.post(API.TYPING_STOP, chatController.stopTyping);

// Search and utilities
chatRouter.get(API.SEARCH_MESSAGES, chatController.searchMessages);
chatRouter.get(API.GET_UNREAD_COUNT, chatController.getUnreadCount);

module.exports = chatRouter;