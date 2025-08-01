const { User } = require('../../models/user.model');
const { ErrorHandler } = require('../../utils/error-handler');
const { generateVerificationToken , getTokenExpiration } = require('../../utils/token.utils');
// const { generateToken } = require('../../utils/jwt');
const UserServices = require('./user.service');

const registerUser = async (data) => {
  const { email, password, name, phoneNumber, companyName, region, country, zipCode } = data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await UserServices.getUserByEmail(normalizedEmail);
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
    zipCode,
    role: 'USER',
    isEmailVerified: false,
    verificationToken,
    verificationTokenExpires,
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

module.exports = {
  registerUser,
  verifyEmailService,
};
