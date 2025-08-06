const { User } = require('../models/user.model');
const { ErrorHandler } = require('../utils/error-handler');
const OTP = require('../models/otp.model');
const CONSTANT_ENUM = require('../helper/constant-enums');
const { generateVerificationToken , getTokenExpiration } = require('../utils/token.utils');



const getUserByEmail = async (email, includePassword = false) => {
  const projection = includePassword ? {} : { password: 0 };
  return User.findOne({ email }, projection).exec();
};

const getAllAdminsService = async (filter = {}, options = {}) => {
  const { limit = 10, skip = 0 } = options;

  const query = {
    ...filter,
    isActive: true,
    isEmailVerified: true,
    role:CONSTANT_ENUM.USER_ROLE.ADMIN,
  };

  return User.find(query);
};

const getAdminByID = async (userId, includePassword = false) => {
  console.log('userId',userId)
  const projection = includePassword ? {} : { password: 0 };
  const user = await User.findById(userId, projection).exec();
  console.log(user);
  if (!user) throw new ErrorHandler(404, 'User not found');
  return user;
};

const addAdminService = async (data) => {
  const { email, password, name, phoneNumber } = data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ErrorHandler(409, 'User with this email already exists');
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenExpires = getTokenExpiration(24);

  const newUser = await User.create({
    name,
    email: normalizedEmail,
    password,
    role: CONSTANT_ENUM.USER_ROLE.ADMIN,
    isEmailVerified: false,
    verificationToken,
    verificationTokenExpires,
    phoneNumber,
  });

  const userWithoutPassword = await User.findById(newUser._id).select('-password');

  return { user: userWithoutPassword };
};

const updateAdmin = async (userId, updateData) => {
  return User.findByIdAndUpdate(userId, updateData, { new: true }).exec();
};
const softDeleteAdmin = async (userId) => {
  return User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true }).exec();
};

const hardDeleteAdmin = async (userId) => {
  return User.findByIdAndDelete(userId).exec();
};

module.exports = {
  getAllAdminsService,
  addAdminService,
  getUserByEmail,
  getAdminByID,
  updateAdmin,
  hardDeleteAdmin,
  softDeleteAdmin,
};
