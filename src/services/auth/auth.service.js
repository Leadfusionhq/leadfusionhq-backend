const { User } = require('../../models/user.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { generateVerificationToken, getTokenExpiration } = require('../../utils/token.utils');
const UserServices = require('../user.service');

const registerUser = async (data) => {
  const {
    email,
    password,
    confirmPassword,
    name,
    phoneNumber,
    companyName,
    address
  } = data;

  const normalizedEmail = email.toLowerCase();

  const existingUser = await UserServices.getUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ErrorHandler(409, 'User with this email already exists');
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenExpires = getTokenExpiration(24);

  // Extract state from address (could be string or object from Google API)
  let stateValue = '';
  if (address && address.state) {
    if (typeof address.state === 'object' && address.state.abbreviation) {
      stateValue = address.state.abbreviation;
    } else if (typeof address.state === 'string') {
      stateValue = address.state;
    }
  }

  // Prepare address object
  const addressData = {
    full_address: address?.full_address || '',
    street: address?.street || '',
    city: address?.city || '',
    state: stateValue,
    zip_code: address?.zip_code || '',
    coordinates: address?.coordinates || { lat: null, lng: null },
    place_id: address?.place_id || ''
  };

  const newUser = await User.create({
    name,
    email: normalizedEmail,
    password,
    phoneNumber,
    companyName,
    address: addressData,
    role: 'USER',
    isEmailVerified: false,
    verificationToken,
    verificationTokenExpires,

    // Set country to "United States" for Boberdoo (US-only registration)
    country: 'United States',
    region: stateValue, // Store state abbreviation in region field
  });

  const userWithoutPassword = await UserServices.getUserByID(newUser._id);

  return { user: userWithoutPassword };
};

const verifyEmailService = async (token) => {
  if (!token) {
    throw new ErrorHandler(400, 'Verification token is required');
  }

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    throw new ErrorHandler(404, 'Invalid or expired verification token');
  }

  const now = new Date();
  if (user.verificationTokenExpires && user.verificationTokenExpires < now) {
    throw new ErrorHandler(400, 'Verification token has expired');
  }

  user.isEmailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;

  await user.save();

  return user;
};

const userSendVerificationEmail = async (email) => {
  if (!email) {
    throw new ErrorHandler(400, 'Email is required');
  }

  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ErrorHandler(404, 'User not found');
  }

  if (user.isEmailVerified) {
    throw new ErrorHandler(400, 'Email is already verified');
  }

  user.verificationToken = generateVerificationToken();
  user.verificationTokenExpires = getTokenExpiration(24);

  await user.save();

  return user;
};

module.exports = {
  registerUser,
  verifyEmailService,
  userSendVerificationEmail,
};