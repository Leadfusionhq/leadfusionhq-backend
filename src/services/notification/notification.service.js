const Notification = require('../../models/notification.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { getIO } = require('../../config/socket');

const createNotification = async (senderId, recipientId, type, message, priority = 0, link = null) => {
  try {
    const notification = new Notification({
      senderId,
      recipientId,
      type,
      message,
      priority,
      link,
    });

    await notification.save();
    await notification.populate('senderId', 'name email');

    try {
      const io = getIO();
      console.log(`Emitting notification to user with ID ${recipientId}`);

      // Emit to specific user room only
      io.to(recipientId.toString()).emit('notification', notification);

      // Legacy support (optional, can be removed if frontend is updated)
      io.to(recipientId.toString()).emit(`new-notification-${recipientId}`, notification);

      console.log('Notification emitted successfully');
    } catch (socketError) {
      console.error('Socket.IO error:', socketError.message);
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new ErrorHandler(500, `Failed to create notification: ${error.message}`);
  }
};

const getNotifications = async (userId, page = 1, limit = 50, unreadOnly = false) => {
  const skip = (page - 1) * limit;

  const query = {
    recipientId: userId,
    isArchived: false
  };

  if (unreadOnly) {
    query.read = false;
  }

  const results = await Notification.find(query)
    .populate('senderId', 'name email')
    .skip(skip)
    .limit(limit)
    .sort({ priority: -1, createdAt: -1 });

  const totalCount = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    recipientId: userId,
    read: false,
    isArchived: false
  });

  return {
    data: results,
    page,
    limit,
    totalCount,
    unreadCount,
    totalPages: Math.ceil(totalCount / limit)
  };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    {
      read: true,
      seenAt: new Date(),
      updatedAt: new Date()
    },
    { new: true }
  );

  if (!notification) {
    throw new ErrorHandler(404, 'Notification not found');
  }

  return notification;
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipientId: userId, read: false },
    {
      read: true,
      seenAt: new Date(),
      updatedAt: new Date()
    }
  );

  return result;
};

const deleteNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientId: userId },
    { isArchived: true, updatedAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ErrorHandler(404, 'Notification not found');
  }

  return notification;
};

const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    recipientId: userId,
    read: false,
    isArchived: false
  });

  return count;
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount
};