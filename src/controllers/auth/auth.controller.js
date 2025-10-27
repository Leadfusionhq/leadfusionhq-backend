const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const { ErrorHandler } = require('../../utils/error-handler');
const authService = require('../../services/auth/auth.service');
const authConfig = require('../../config/auth.config');

const register = wrapAsync(async (req, res) => {
  const result = await authService.register(req.body);
  sendResponse(res, result.data, result.message, 201);
});

const login = wrapAsync(async (req, res) => {
  const { email, password, rememberMe } = req.body;
  const result = await authService.login(email, password, rememberMe);
  sendResponse(res, result.data, result.message);
});

const verifyEmail = wrapAsync(async (req, res) => {
  if (!authConfig.features.emailVerification) {
    throw new ErrorHandler(404, 'Feature not enabled');
  }

  const { token } = req.query;
  if (!token) throw new ErrorHandler(400, 'Token required');

  await authService.verifyEmail(token);
  sendResponse(res, {}, 'Email verified successfully');
});

const resendVerification = wrapAsync(async (req, res) => {
  if (!authConfig.features.resendVerification) {
    throw new ErrorHandler(404, 'Feature not enabled');
  }

  const { email } = req.body;
  await authService.resendVerification(email);
  sendResponse(res, {}, 'Verification link sent');
});

// ============ FORGOT PASSWORD (OTP) ============
const sendOTP = wrapAsync(async (req, res) => {
  if (!authConfig.features.forgotPassword) {
    throw new ErrorHandler(404, 'Feature not enabled');
  }

  const { email } = req.body;
  await authService.sendOTP(email);
  sendResponse(res, {}, 'OTP sent to your email');
});

const verifyOTP = wrapAsync(async (req, res) => {
  if (!authConfig.features.forgotPassword) {
    throw new ErrorHandler(404, 'Feature not enabled');
  }

  const { email, otp } = req.body;
  const result = await authService.verifyOTP(email, otp);
  sendResponse(res, result, 'OTP verified');
});

const resetPassword = wrapAsync(async (req, res) => {
  if (!authConfig.features.forgotPassword) {
    throw new ErrorHandler(404, 'Feature not enabled');
  }

  const { token, password } = req.body;
  await authService.resetPassword(token, password);
  sendResponse(res, {}, 'Password reset successful');
});

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  sendOTP,
  verifyOTP,
  resetPassword,
};
