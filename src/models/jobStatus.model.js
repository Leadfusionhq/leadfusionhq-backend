const mongoose = require('mongoose');

const jobStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jobType: {
    type: String,
    enum: ['csv_processing', 'data_export', 'bulk_operation'],
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'queued',
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  message: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  error: {
    type: String,
    default: null,
  },
  startedAt: {
    type: Date,
    default: null,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

jobStatusSchema.index({ userId: 1, status: 1 });
jobStatusSchema.index({ createdAt: -1 });
jobStatusSchema.index({ status: 1 });

jobStatusSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  if (this.status === 'processing' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  if ((this.status === 'completed' || this.status === 'failed') && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Auto-cleanup old job records (older than 30 days)
jobStatusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const JobStatus = mongoose.model('JobStatus', jobStatusSchema);

module.exports = JobStatus;