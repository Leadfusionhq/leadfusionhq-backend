const express = require('express');
const authRouter = express.Router();
const authController = require('../../controllers/auth/auth.controller');
const AuthSchema = require('../../request-schemas/auth.schema');
const { celebrate } = require('celebrate');

const API = {
    REGISTER_USER: '/register',
    LOGIN_USER: '/login',
    LOGOUT_USER: '/logout',

    SEND_VERIFICATION_EMAIL: '/send-verification-link',
    VERIFY_EMAIL: '/verify-email',

    SEND_OTP_ON_EMAIL: '/forgot-password',
    VERIFY_OTP: '/verify-otp',
    RESET_PASSWORD: '/reset-password',

    // SEND_VERIFICATION_EMAIL: '/resend-verification-link',

    
};

authRouter.post(
    API.REGISTER_USER,
    celebrate(AuthSchema.registerUser),
    authController.registerUser
);

authRouter.post(
    API.LOGIN_USER,
    celebrate(AuthSchema.loginWithEmail),
    authController.loginWithEmail
);

authRouter.get(
    API.VERIFY_EMAIL,
    // celebrate(AuthSchema.verifyEmailLink),
    authController.verifyEmail
);

authRouter.put(
    API.SEND_OTP_ON_EMAIL, 
    celebrate(AuthSchema.sendOTPonEmail), 
    authController.sendOtpOnEmail
);


authRouter.put(
    API.VERIFY_OTP, 
    celebrate(AuthSchema.verifyOTP), 
    authController.verifyOTP
);

authRouter.put(
    API.RESET_PASSWORD, 
    celebrate(AuthSchema.resetPassword), 
    authController.resetPassword
);

authRouter.put(
    API.SEND_VERIFICATION_EMAIL, 
    celebrate(AuthSchema.sendVerificationEmail), 
    authController.sendVerificationEmail
);

module.exports = authRouter;
