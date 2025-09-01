const express = require('express');
const notificationRouter = express.Router();
const notificationController = require('../../controllers/notification/notification.controller');
const checkAuth = require('../../middleware/check-auth');
const authorizedRoles = require('../../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../../helper/constant-enums.js');


const API = {
  GET_NOTIFICATIONS: '/',
  GET_UNREAD_COUNT: '/unread-count',
  MARK_AS_READ: '/:notificationId/read',
  MARK_ALL_AS_READ: '/mark-all-read',
  DELETE_NOTIFICATION: '/:notificationId',
};

notificationRouter.use(
    checkAuth,
    // authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN], [CONSTANT_ENUM.USER_ROLE.USER])
);


notificationRouter.get(API.GET_NOTIFICATIONS, notificationController.getNotifications);

notificationRouter.get(API.GET_UNREAD_COUNT, notificationController.getUnreadCount);

notificationRouter.patch(API.MARK_AS_READ, notificationController.markAsRead);

notificationRouter.patch(API.MARK_ALL_AS_READ, notificationController.markAllAsRead);

notificationRouter.delete(API.DELETE_NOTIFICATION, notificationController.deleteNotification);

module.exports = notificationRouter;
