module.exports = {
  features: {
    emailVerification: true, // Enable/disable email verification
    forgotPassword: true, // Enable/disable forgot password (OTP)
    rememberMe: true, // Enable/disable remember me
    resendVerification: true, // Enable/disable resend verification link
  },

  tokens: {
    accessToken: {
      short: '24h', // Default token expiry
      long: '30d', // Remember me token expiry
    },
    verificationToken: {
      expiry: 24 * 60 * 60 * 1000, // 24 hours
    },
    resetToken: {
      expiry: '15m', // 15 minutes for password reset
    },
    otpExpiry: 10 * 60 * 1000, // 10 minutes for OTP
  },

  otp: {
    length: 6, // OTP length
    expiryMinutes: 10,
  },
};
