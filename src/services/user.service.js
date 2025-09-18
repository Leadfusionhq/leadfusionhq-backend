const { User } = require('../models/user.model');
const { ErrorHandler } = require('../utils/error-handler');
const OTP = require('../models/otp.model');
const CONSTANT_ENUM = require('../helper/constant-enums');
const { generateVerificationToken , getTokenExpiration } = require('../utils/token.utils');

const getUserByEmail = async (email, includePassword = false) => {
  const projection = includePassword ? {} : { password: 0 };
  return User.findOne({ email }, projection).exec();
};

const getUserByID = async (userId, includePassword = false) => {
  // console.log('userId',userId)
  const projection = includePassword ? {} : { password: 0 };
  const user = await User.findById(userId, projection).exec();
  // console.log(user);
  if (!user) throw new ErrorHandler(404, 'User not found');
  return user;
};

const updateUser = async (userId, updateData) => {
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


// For uesr::
const getAllUsersService = async (filter = {}, options = {}) => {
  const { limit = 10, skip = 0 } = options;

  const query = {
    ...filter,
    isActive: true,
    isEmailVerified: true,
    role:[CONSTANT_ENUM.USER_ROLE.USER],
  };

  return User.find(query);
};

const getAllAdminsService = async (filter = {}, options = {}) => {
  const { limit = 10, skip = 0 } = options;

  const query = {
    ...filter,
    isActive: true,
    isEmailVerified: true,
    role:[CONSTANT_ENUM.USER_ROLE.ADMIN],
  };

  return User.find(query);
};
const addUserService = async (data) => {
  const { email, password, name, phoneNumber, companyName, region, country,
   
     } = data;
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
    phoneNumber,
    companyName,
    region,
    country,

    role: 'USER',
    isEmailVerified: false,
    verificationToken,
    verificationTokenExpires,
  });


  const userWithoutPassword = await getUserByID(newUser._id);

  return { user: userWithoutPassword };
};


// Add these methods to your existing user.service.js
const updateContractAcceptance = async (userId, contractData) => {
  console.log('=== UPDATE CONTRACT START ===');
  console.log('User ID:', userId);
  console.log('Contract Data:', contractData);
  
  try {
    const user = await User.findById(userId);
    console.log('Found user:', user ? user._id : 'NOT FOUND');
    
    if (!user) {
      throw new ErrorHandler(404, 'User not found');
    }

    console.log('Current contractAcceptance:', user.contractAcceptance);
    
    user.contractAcceptance = {
      version: contractData.version,
      acceptedAt: new Date(),
      ipAddress: contractData.ipAddress
    };

    console.log('New contractAcceptance to set:', user.contractAcceptance);
    
    const updatedUser = await user.save();
    console.log('Saved user contractAcceptance:', updatedUser.contractAcceptance);
    
    return updatedUser;
  } catch (error) {
    console.log('Error in updateContractAcceptance:', error);
    throw error;
  }
};

const getContractAcceptance = async (userId) => {
  const user = await User.findById(userId, { 
    'contractAcceptance': 1 
  }).exec();
  
  if (!user) throw new ErrorHandler(404, 'User not found');
  return user.contractAcceptance;
};

const hasAcceptedContract = async (userId, version = null) => {
  const user = await User.findById(userId, { 
    'contractAcceptance': 1 
  }).exec();
  
  if (!user) return false;
  
  if (version) {
    return user.contractAcceptance && 
           user.contractAcceptance.version === version && 
           user.contractAcceptance.acceptedAt !== null;
  }
  
  return user.contractAcceptance && user.contractAcceptance.acceptedAt !== null;
};


module.exports = {
  getUserByEmail,
  getUserByID,
  updateUser,
  softDeleteUser,
  hardDeleteUser,
  listUsers,
  checkEmailVerification,
  getOTPByEmail,
  getAllUsersService,
  getAllAdminsService,
  addUserService,
  updateContractAcceptance,
  getContractAcceptance,
  hasAcceptedContract,
};
