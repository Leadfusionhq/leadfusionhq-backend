// services/auth.service.js
const { User } = require('../../models/user.model');
const { OTP } = require('../../models/otp.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { generateVerificationToken, getTokenExpiration } = require('../../utils/token.utils');

const TOKEN_GEN = require('../../helper/generate-token');

const mailService = require('../../mail/mails');
const authConfig = require('../../config/auth.config');

const register = async ({ name, email, password }) => {
  const normalized = email.toLowerCase();

  const exists = await User.findOne({ email: normalized });
  if (exists) throw new ErrorHandler(409, 'Email already registered');

  const user = await User.create({ name, email: normalized, password });

  // Email Verification (if enabled)
  if (authConfig.features.emailVerification) {
    user.verificationToken = generateVerificationToken();
    user.verificationTokenExpires = Date.now() + authConfig.tokens.verificationToken.expiry;
    await user.save();

    mailService
      .sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: user.verificationToken,
      })
      .catch((err) => console.error('Email send failed:', err));

    return {
      data: { user: user.toSafeObject() },
      message: 'Registration successful. Please verify your email.',
    };
  }

  // Auto-verify if feature disabled
  user.isEmailVerified = true;
  await user.save();

  return {
    data: { user: user.toSafeObject() },
    message: 'Registration successful',
  };
};

const login = async (email, password, rememberMe = false) => {
  const normalized = email.toLowerCase();

  const user = await User.findOne({ email: normalized }).select('+password');
  if (!user) throw new ErrorHandler(404, 'Invalid credentials');

  if (!user.isActive) throw new ErrorHandler(403, 'Account deactivated');

  // Check email verification (if enabled)
  if (authConfig.features.emailVerification && !user.isEmailVerified) {
    throw new ErrorHandler(403, 'Please verify your email first');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new ErrorHandler(404, 'Invalid credentials');

  // Generate token
  const expiry =
    authConfig.features.rememberMe && rememberMe
      ? authConfig.tokens.accessToken.long
      : authConfig.tokens.accessToken.short;

  const token = tokenHelper.generateToken({ id: user._id, role: user.role }, expiry);

  return {
    data: {
      user: user.toSafeObject(),
      token,
      expiresIn: expiry,
    },
    message: 'Login successful',
  };
};

// ============ EMAIL VERIFICATION ============
const verifyEmail = async (token) => {
  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: Date.now() },
  });

  if (!user) throw new ErrorHandler(400, 'Invalid or expired token');

  user.isEmailVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;
  await user.save();

  return true;
};

const resendVerification = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ErrorHandler(404, 'User not found');

  if (user.isEmailVerified) throw new ErrorHandler(400, 'Email already verified');

  user.verificationToken = tokenHelper.generateRandomToken(32);
  user.verificationTokenExpires = Date.now() + authConfig.tokens.verificationToken.expiry;
  await user.save();

  await mailService.sendVerificationEmail({
    to: user.email,
    name: user.name,
    token: user.verificationToken,
  });

  return true;
};

// ============ FORGOT PASSWORD (OTP) ============
const sendOTP = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ErrorHandler(404, 'User not found');

  const otp = tokenHelper.generateOTP(authConfig.otp.length);

  await OTP.deleteMany({ email: user.email });
  await OTP.create({
    email: user.email,
    otp,
    expiresAt: Date.now() + authConfig.otp.expiryMinutes * 60 * 1000,
  });

  await mailService.sendOTPEmail({
    to: user.email,
    name: user.name,
    otp,
  });

  return true;
};

const verifyOTP = async (email, otp) => {
  const record = await OTP.findOne({
    email: email.toLowerCase(),
    otp,
    expiresAt: { $gt: Date.now() },
  });

  if (!record) throw new ErrorHandler(400, 'Invalid or expired OTP');

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new ErrorHandler(404, 'User not found');

  await OTP.deleteOne({ _id: record._id });

  const resetToken = tokenHelper.generateResetToken({ id: user._id });

  return {
    resetToken,
    user: user.toSafeObject(),
  };
};

const resetPassword = async (token, newPassword) => {
  const decoded = tokenHelper.verifyResetToken(token);
  if (!decoded) throw new ErrorHandler(400, 'Invalid or expired token');

  const user = await User.findById(decoded.id);
  if (!user) throw new ErrorHandler(404, 'User not found');

  user.password = newPassword;
  await user.save();

  return true;
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  sendOTP,
  verifyOTP,
  resetPassword,
};
