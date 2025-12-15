const { User } = require('../models/user.model');
const { ErrorHandler } = require('../utils/error-handler');
const OTP = require('../models/otp.model');
const CONSTANT_ENUM = require('../helper/constant-enums');
const { generateVerificationToken, getTokenExpiration } = require('../utils/token.utils');
const { updatePartnerInBoberdoo } = require('../services/boberdoo/boberdoo.service');
const redisClient = require('../config/redis');

// Helper to invalidate user cache safely
const invalidateUserCache = async (userId) => {
  try {
    if (redisClient.isOpen) {
      await redisClient.del(`auth:user:${userId}`);
      console.log(`Redis Cache Invalidated for User: ${userId}`);
    }
  } catch (err) {
    console.error('Redis Invalidation Error:', err);
  }
};
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
  const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).exec();

  await invalidateUserCache(userId);

  if (user?.integrations?.boberdoo?.external_id) {
    console.log("Admin updated user – syncing with Boberdoo...");
    const result = await updatePartnerInBoberdoo(user);
    console.log("Boberdoo sync result:", result);
  } else {
    console.log("User has no Boberdoo Partner ID – skipping sync.");
  }

  return user;
};


const updateUserProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).select('-password -verificationToken -resetPasswordToken');

  if (user) await invalidateUserCache(userId);

  if (!user) throw new ErrorHandler(404, 'User not found');

  // 🔄 Sync with Boberdoo if partner exists
  if (user.integrations?.boberdoo?.external_id) {
    console.log("🔁 Syncing updated user profile with Boberdoo...");
    const result = await updatePartnerInBoberdoo(user);
    console.log("Boberdoo sync result:", result);
  } else {
    console.log("⚠️ Skipping Boberdoo sync (no external_id).");
  }

  return user;
};



const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ErrorHandler(401, 'Current password is incorrect');
  }

  // Check if new password is same as current    
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new ErrorHandler(400, 'New password must be different from current password');
  }

  // Update password
  user.password = newPassword;
  await user.save();
  await invalidateUserCache(userId);

  return user;
};

const softDeleteUser = async (userId) => {
  await invalidateUserCache(userId);
  return User.findByIdAndUpdate(userId, { isDeleted: true }, { new: true }).exec();
};

const hardDeleteUser = async (userId) => {
  await invalidateUserCache(userId);
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
const getAllUsersService = async (page, limit, filter = {}, search = "") => {
  const query = {
    ...filter,
    role: CONSTANT_ENUM.USER_ROLE.USER,
  };

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { name: regex },
      { email: regex },
      { company: regex }
    ];
  }

  const skip = (page - 1) * limit;

  const data = await User.find(query)
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await User.countDocuments(query);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};


// const getAllUsersService = async (filter = {}, options = {}) => {
//   const { limit = 10, skip = 0 } = options;

//   const query = {
//     ...filter,
//         role:[CONSTANT_ENUM.USER_ROLE.USER],
//     // isActive: true,
//     // isEmailVerified: true,

//   };

//   return User.find(query);
// };

// const getAllAdminsService = async (filter = {}, options = {}) => {
//   const { limit = 10, skip = 0 } = options;

//   const query = {
//     ...filter,
//     role: [CONSTANT_ENUM.USER_ROLE.ADMIN],
//     // isActive: true,
//     // isEmailVerified: true,

//   };

//   return User.find(query);
// };

const getAllAdminsService = async (page, limit, filter = {}, search = "") => {
  const query = {
    ...filter,
    role: CONSTANT_ENUM.USER_ROLE.ADMIN,
  };

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { name: regex },
      { email: regex },
      { company: regex }
    ];
  }

  const skip = (page - 1) * limit;

  const data = await User.find(query)
    .limit(limit)
    .skip(skip)
    .lean();

  const total = await User.countDocuments(query);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
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
  updateUserProfile,
  changeUserPassword,
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
