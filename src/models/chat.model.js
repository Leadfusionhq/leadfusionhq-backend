const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');
// Chat Schema with improvements
const ChatSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    adminId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    lastMessage: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
      content: { type: String },
      sentAt: { type: Date },
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    isActive: { type: Boolean, default: true },
    // Track unread counts for both participants
    unreadCount: {
      user: { type: Number, default: 0 },
      admin: { type: Number, default: 0 }
    },
    // Chat metadata
    subject: { type: String }, // Optional chat subject/title
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    // Status for admin workflow
    chatStatus: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'],
      default: 'open'
    },
    // Assignment for multiple admins
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Tags for categorization
    tags: [{ type: String }],
    // Archive functionality
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    archivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true,
  }
);

// Indexes
ChatSchema.index({ userId: 1, adminId: 1 }, { unique: true });
ChatSchema.index({ userId: 1, isActive: 1, isArchived: 1 });
ChatSchema.index({ adminId: 1, isActive: 1, isArchived: 1 });
ChatSchema.index({ assignedTo: 1, isActive: 1 });
ChatSchema.index({ chatStatus: 1, isActive: 1 });

// Validation to ensure user and admin are different
ChatSchema.pre('save', function(next) {
  if (String(this.userId) === String(this.adminId)) {
    const error = new Error('User and admin cannot be the same');
    return next(error);
  }
  next();
});

ChatSchema.pre(['find', 'findOne'], function() {
  this.populate('userId', 'name email avatar')
      .populate('adminId', 'name email avatar')
      .populate('assignedTo', 'name email avatar')
      .populate('lastMessage.senderId', 'name email avatar');
});
const Chat = mongoose.model('Chat', ChatSchema);
module.exports = {  Chat };
