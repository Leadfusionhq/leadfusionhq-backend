const mongoose = require('mongoose');
const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Index for better query performance
feedbackSchema.index({ user_id: 1 });
feedbackSchema.index({ createdAt: -1 });
feedbackSchema.index({ title: 'text', description: 'text' });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = { Feedback };