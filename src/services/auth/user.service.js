const { User } = require('../../models/user.model');
const { ErrorHandler } = require('../../utils/error-handler');
const OTP = require('../../models/otp.model');

const getUserByEmail = async (email, includePassword = false) => {
  const projection = includePassword ? {} : { password: 0 };
  return User.findOne({ email }, projection).exec();
};

const getUserByID = async (userId, includePassword = false) => {
  const projection = includePassword ? {} : { password: 0 };
  const user = await User.findById(userId, projection).exec();
  if (!user) throw new ErrorHandler(404, 'User not found');
  return user;
};

const updateUser = async (userId, updateData) => {
  // For security, you might whitelist allowed fields before update
  return User.findByIdAndUpdate(userId, updateData, { new: true }).exec();
};

const softDeleteUser = async (userId) => {
  return User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true }).exec();
};

const hardDeleteUser = async (userId) => {
  return User.findByIdAndDelete(userId).exec();
};

// List users with pagination + filtering (optional)
const listUsers = async (filter = {}, options = {}) => {
  const { limit = 10, skip = 0 } = options;
  return User.find(filter).limit(limit).skip(skip).exec();
};
const checkEmailVerification = (user) => {
  if (!user.isEmailVerified) {
    const now = new Date();
    const isTokenExpired = !user.verificationTokenExpires || user.verificationTokenExpires < now;

    if (isTokenExpired) {
      throw new ErrorHandler(403, 'Email not verified and verification link expired');
    } else {
      throw new ErrorHandler(403, 'Please verify your email first');
    }
  }
};
const getOTPByEmail = async (email, otp) => await OTP.findOne({ email, otp });

module.exports = {
  getUserByEmail,
  getUserByID,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
  listUsers,
  checkEmailVerification,
  getOTPByEmail,
};
