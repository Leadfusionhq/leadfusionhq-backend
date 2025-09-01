const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const NotificationServices = require('../../services/notification/notification.service');

const getNotifications = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const data = await NotificationServices.getNotifications(
    userId, 
    parseInt(page), 
    parseInt(limit),
    unreadOnly === 'true'
  );

  sendResponse(res, data, "Notifications fetched successfully", 200);
});

const markAsRead = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const notification = await NotificationServices.markAsRead(notificationId, userId);
  sendResponse(res, { notification }, "Notification marked as read", 200);
});

const markAllAsRead = wrapAsync(async (req, res) => {
  const userId = req.user._id;

  const result = await NotificationServices.markAllAsRead(userId);
  sendResponse(res, { modifiedCount: result.modifiedCount }, "All notifications marked as read", 200);
});

const deleteNotification = wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const { notificationId } = req.params;

  const notification = await NotificationServices.deleteNotification(notificationId, userId);
  sendResponse(res, { notification }, "Notification deleted successfully", 200);
});

const getUnreadCount = wrapAsync(async (req, res) => {
  const userId = req.user._id;

  const count = await NotificationServices.getUnreadCount(userId);
  sendResponse(res, { unreadCount: count }, "Unread count fetched successfully", 200);
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};