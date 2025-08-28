const CONSTANT_ENUM = require('../helper/constant-enums');

const MessageSchema = new mongoose.Schema(
  {
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
      type: { 
            type: String,
            // enum: ['text', 'image', 'file'],
            enum: Object.values(CONSTANT_ENUM.CONTENT_TYPE),
            default: CONSTANT_ENUM.CONTENT_TYPE.TEXT, 
        },
      data: { type: String, required: true },
      metadata: {
        fileName: { type: String }, 
        fileSize: { type: Number },
        mimeType: { type: String },
      },
    },
    status: {
      type: String,
      enum: Object.values(CONSTANT_ENUM.CHAT_STATUS),
    //   enum: ['sent', 'delivered', 'read'],
      default: CONSTANT_ENUM.CHAT_STATUS.SENT,
    },
  },
  {
    timestamps: true,
    indexes: [
      { key: { chatId: 1, createdAt: -1 } }, 
      { key: { senderId: 1 } }, 
    ],
  }
);
