const mongoose = require('mongoose');
const CONSTANT_ENUM = require('../helper/constant-enums');

// Message Schema
const MessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: {
        type: String,
        enum: Object.values(CONSTANT_ENUM.CONTENT_TYPE),
        default: CONSTANT_ENUM.CONTENT_TYPE.TEXT,
        required: true
      },
      data: {
        type: String,
        required: true,
        maxlength: 10000 // Prevent extremely long messages
      },
      metadata: {
        fileName: { type: String },
        fileSize: { type: Number },
        mimeType: { type: String },
        // Additional metadata for different content types
        thumbnailUrl: { type: String }, // for images
        duration: { type: Number }, // for audio/video files
        originalUrl: { type: String } // for links
      },
    },
    status: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.CHAT_STATUS),
      default: CONSTANT_ENUM.CHAT_STATUS.SENT,
    },
    // Track who has read this message
    readBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }],
    // For message replies/threading
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    // For message editing history
    editedAt: { type: Date },
    isEdited: { type: Boolean, default: false },
    // Soft delete
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ chatId: 1, isDeleted: 1, createdAt: -1 });


// Populate fields by default
MessageSchema.pre(['find', 'findOne'], function () {
  this.populate('senderId', 'name email avatar role')
    .populate('replyTo', 'content senderId createdAt');
});



const Message = mongoose.model('Message', MessageSchema);

module.exports = { Message };