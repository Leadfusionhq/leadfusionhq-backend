const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'DEBUG', 'SUCCESS'],
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  logType: {
    type: String,
    enum: ['billing', 'combined', 'error'],
    default: 'combined',
    index: true,
  },
  module: {
    type: String,
    default: 'GENERAL',
  },
  userId: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  rawLog: String,
});

// Auto-delete logs older than 30 days
logSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Log', logSchema);
