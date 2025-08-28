const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], required: true }, // Type of notification
  message: { type: String, required: true }, // The message content of the notification
  link: { type: String, default: null }, // Optional link related to the notification (e.g., redirect to a page)
  read: { type: Boolean, default: false }, // Whether the notification has been read by the user
  createdAt: { type: Date, default: Date.now }, // Time when the notification was created
  updatedAt: { type: Date, default: Date.now }, // Time when the notification was updated (optional)
  priority: { type: Number, default: 0 }, // Priority of the notification, higher means more urgent
  seenAt: { type: Date, default: null }, // Optional, track when the user saw the notification (used for analytics or UI updates)
  isArchived: { type: Boolean, default: false } // Optional, allows users to archive old notifications
});

// Indexes for optimization
notificationSchema.index({ senderId: 1 }); // Index for user-based queries
notificationSchema.index({ recipientId: 1 }); // Index for user-based queries
notificationSchema.index({ read: 1, createdAt: -1 }); // Index for unread notifications sorted by creation time
notificationSchema.index({ priority: -1 }); // Index for priority-based sorting
notificationSchema.index({ isArchived: 1 }); // Index for archived vs active notifications
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // TTL index for expiring old notifications

module.exports = mongoose.model('Notification', notificationSchema);
