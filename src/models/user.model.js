const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const CONSTANT_ENUM = require('../helper/constant-enums');

const SALT_ROUNDS = 10;

const options = {
  discriminatorKey: 'role',
  timestamps: true,
};

// Base user schema
const baseUserSchema = new mongoose.Schema({
  n8nUserId: {
    type: String,
    trim: true,
    unique: true, 
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+@.+\..+/, 'Please fill a valid email address'],
  },
  role: {
    type: String,
    enum: Object.values(CONSTANT_ENUM.USER_ROLE),
    required: true,
    default: CONSTANT_ENUM.USER_ROLE.USER,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  lastVisit: {
    type: Date,
    default: null,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  verificationToken: {
    type: String,
    default: '',
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: Date,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  dob: {
    type: Date,
  },
  address: {
    type: String,
    trim: true,
  },
}, options);

// Password hashing middleware
baseUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
baseUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', baseUserSchema);

// Regular User specific schema
const regularUserSchema = new mongoose.Schema({
  companyName: {
    type: String,
    trim: true,
  },
  region: {
    type: String,
    trim: true,
  },
  country: {
    type: String,
    trim: true,
  },
  zipCode: {
    type: String,
    trim: true,
  },

  // Add other fields specific to regular users here 
// In regularUserSchema, replace customerVaultId with:
paymentMethods: [{
  customerVaultId: {
    type: String,
    required: true
  },
  cardLastFour: {
    type: String,
    required: true
  },
  brand: {
    type: String,
    enum: ['Visa', 'Mastercard', 'Amex', 'Discover', 'Unknown'],
    default: 'Unknown'
  },
  expiryMonth: String,
  expiryYear: String,
  isDefault: {
    type: Boolean,
    default: false
  },
  cvv: {
    type: String,
    required: false,
    default: null  
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}],
defaultPaymentMethod: {
  type: String, // stores customerVaultId of default card
  default: null
},
hasStoredCard: {
  type: Boolean,
  default: false
},
balance: {
  type: Number,
  default: 0,
},
// In regularUserSchema
// In your user model where autoTopUp is defined
// In the user schema, update the autoTopUp object:
autoTopUp: {
  enabled: { type: Boolean, default: false },
  threshold: { type: Number, default: 10 },        // Keep for backward compatibility
  topUpAmount: { type: Number, default: 50 },      // Keep for backward compatibility
  paymentMode: { 
    type: String, 
    enum: ['prepaid', 'payAsYouGo'], 
    default: 'prepaid' 
  },
  updatedAt: { type: Date, default: Date.now }
},
  lastChargedAt: {
    type: Date,
    default: null,
  },

  // 📄 Contract Acceptance
  contractAcceptance: {
    version: { type: String, default: null },
    acceptedAt: { type: Date, default: null },
    ipAddress: { type: String, default: null },
  }


});

const RegularUser = User.discriminator(CONSTANT_ENUM.USER_ROLE.USER, regularUserSchema);

const adminUserSchema = new mongoose.Schema({});
const AdminUser = User.discriminator(CONSTANT_ENUM.USER_ROLE.ADMIN, adminUserSchema);

module.exports = {
  User,
  RegularUser,
  AdminUser,
};
