const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  otp: { type: String, required: true },
  identifier: { type: String, required: true }, // email or phone
  type: { type: String, enum: ['email', 'sms'], default: 'email' },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
