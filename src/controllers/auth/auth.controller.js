const { wrapAsync } = require('../../utils/wrap-async');
const { sendResponse } = require('../../utils/response');
const AuthService = require('../../services/auth/auth.service');
const UserServices = require('../../services/auth/user.service');
const MAIL_HANDLER = require('../../mail/mails');
const TOKEN_GEN = require('../../helper/generate-token');
const { ErrorHandler } = require('../../utils/error-handler');
const { randomNumberGenerate, isEmpty } = require('../../utils/utils');
const OTP = require('../../models/otp.model');

const registerUser = wrapAsync(async (req, res) => {
    const userPayload = req.body;

    const { user } = await AuthService.registerUser(userPayload);

    MAIL_HANDLER.sendVerificationEmail({
        to: user?.email,
        name: user?.name,
        token: user?.verificationToken,
    });


    sendResponse(res, { user }, 'Success! Please verify your email to activate your account.', 201);
});

const loginWithEmail = wrapAsync(async (req, res) => {
    const { email: rawEmail, password } = req.body;
    const email = rawEmail.toLowerCase();

    const user = await UserServices.getUserByEmail(email, true);
    if (!user) throw new ErrorHandler(404, 'User account not found');
    
    if (!user.isActive) throw new ErrorHandler(403, 'Your account has been deactivated. Please contact support.');
    
    UserServices.checkEmailVerification(user);


    if (!(await user.comparePassword(password))) throw new ErrorHandler(400, 'Incorrect email or password');

    const token = TOKEN_GEN.generateToken(user._id, user.role, '72h');
    const safeUser = await UserServices.getUserByID(user._id);
    // const filteredUser = {
    //     id: safeUser._id,
    //     name: safeUser.name,
    //     email: safeUser.email,
    //     role: safeUser.role,
    // };

    sendResponse(res, { user: safeUser, token }, 'Login successful');
    
});



const verifyEmail = wrapAsync(async (req, res) => {
    const { token } = req.query;
    if (!token) {
        throw new ErrorHandler(400, 'Verification token is required');
    }
    
    const user = await AuthService.verifyEmailService(token);

    sendResponse(res, {}, 'Email successfully verified');

});


const sendOtpOnEmail = wrapAsync(async (req, res) => {
    const { email } = req.body;
    const otp = randomNumberGenerate(5);

    const user = await UserServices.getUserByEmail(email, true);

    if (isEmpty(user)) throw new ErrorHandler(404, 'User account not found');

    await OTP.deleteMany({ email });
    await OTP.create({ otp, email });

    MAIL_HANDLER.sendEmailToUserWithOTP(user, otp);

    sendResponse(res, {otp}, 'OTP has been sent to your email');
});


const verifyOTP = wrapAsync(async (req, res) => {
    const { email, otp } = req.body;

    const otpValid = await UserServices.getOTPByEmail(email, otp);
    if (!otpValid) throw new ErrorHandler(401, 'OTP could not be verified, please try again');

    const user = await UserServices.getUserByEmail(email, true);

    
    try {
        await OTP.deleteOne({ _id: otpValid._id });
    } catch (err) {
        console.error('Failed to delete OTP:', err);
        throw new ErrorHandler(500, 'Internal server error. Please try again.');
    }

    const resetToken = TOKEN_GEN.generateResetToken(user._id);

    const safeUser = {
        _id: user._id,
        email: user.email,
        name: user.name,
    };

    sendResponse(res, { user: safeUser, resetToken }, 'OTP matched! You can now reset your password.');
});

const resetPassword = wrapAsync(async (req, res) => {
    const { token, password } = req.body;

    const userId = TOKEN_GEN.verifyResetToken(token);
    if (!userId) throw new ErrorHandler(401, 'Invalid or expired reset token');

    const user = await UserServices.getUserByID(userId, true);
    if (!user) throw new ErrorHandler(404, 'User not found');

    user.password = password;
    await user.save();

    sendResponse(res, {}, 'Password reset successful. You can now log in.');
});

const sendVerificationEmail = wrapAsync(async (req, res) => {
    const { email } = req.body;

    const user = await AuthService.userSendVerificationEmail(email);
    
    await MAIL_HANDLER.sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: user.verificationToken,
    });
    
    sendResponse(res, {  }, 'Verification link has been sent to you email account', 201);

});

module.exports = {
    registerUser,
    loginWithEmail,
    verifyEmail,
    sendOtpOnEmail,
    verifyOTP,
    resetPassword,
    sendVerificationEmail,
};
