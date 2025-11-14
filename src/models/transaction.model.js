const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    enum: ['ADD_FUNDS', 'WITHDRAWAL', 'TRANSFER', 'REFUND', 'MANUAL', 'AUTO', 'DEDUCTION','TEST_DEDUCTION','ADMIN_ADD_FUNDS','LEAD_ASSIGNMENT'],
    required: true,
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'PENDING', 'FAILED', 'SUCCESS'],
    default: 'PENDING',
  },
  description: {
    type: String,
    trim: true,
  },
  paymentMethod: {
    type: String,
    enum: ['CARD', 'BANK_TRANSFER', 'PAYPAL', 'OTHER', 'BALANCE'],
  },
  transactionId: {
    type: String,
  },
  balanceAfter: {
    type: Number,
  },
  paymentMethodDetails: {
    lastFour: String,
    brand: String,
    customerVaultId: String
  },
  note: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Correct export statement
module.exports = mongoose.model('Transaction', transactionSchema);