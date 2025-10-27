const express = require('express');
const authRouter = express.Router();
const authController = require('../../controllers/auth/auth.controller');
const AuthSchema = require('../../request-schemas/auth.schema');
const { celebrate } = require('celebrate');
const authConfig = require('../../config/auth.config');

const API = {
  REGISTER_USER: '/register',
  LOGIN_USER: '/login',
  LOGOUT_USER: '/logout',

  SEND_VERIFICATION_EMAIL: '/send-verification-link',
  RESEND_VERIFICATION_EMAIL: '/resend-verification',
  VERIFY_EMAIL: '/verify-email',

  SEND_OTP_ON_EMAIL: '/forgot-password',
  VERIFY_OTP: '/verify-otp',
  RESET_PASSWORD: '/reset-password',
};

authRouter.post(API.REGISTER_USER, celebrate(AuthSchema.registerUser), authController.register);

authRouter.post(API.LOGIN_USER, celebrate(AuthSchema.loginWithEmail), authController.login);

if (authConfig.features.emailVerification) {
  authRouter.get(API.VERIFY_EMAIL, authController.verifyEmail);

  if (authConfig.features.resendVerification) {
    authRouter.put(
      API.SEND_VERIFICATION_EMAIL,
      celebrate(AuthSchema.sendVerificationEmail),
      authController.resendVerification
    );
    // router.post('/resend-verification', celebrate(authSchema.resendVerification), authController.resendVerification);
  }
}

if (authConfig.features.forgotPassword) {
  authRouter.put(
    API.SEND_OTP_ON_EMAIL,
    celebrate(AuthSchema.sendOTPonEmail),
    authController.sendOTP
  );

  authRouter.put(API.VERIFY_OTP, celebrate(AuthSchema.verifyOTP), authController.verifyOTP);

  authRouter.put(
    API.RESET_PASSWORD,
    celebrate(AuthSchema.resetPassword),
    authController.resetPassword
  );
}

module.exports = authRouter;
