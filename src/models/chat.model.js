
const CONSTANT_ENUM = require('../helper/constant-enums');

const ChatSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    indexes: [
      { key: { userId: 1, adminId: 1 }, unique: true },
      { key: { lastMessageId: 1 } },
    ],
    validate: {
      validator: function (v) {
        return String(v.userId) !== String(v.adminId);
      },
      message: 'User and admin cannot be the same',
    },
  }
);
