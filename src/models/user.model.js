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
  rememberMe: {
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
  
  // Updated address field to be an object with detailed components
  address: {
    full_address: {
      type: String,
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    zip_code: {
      type: String,
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    },
    place_id: {
      type: String,
      trim: true,
    }
  },
  
  companyName: { type: String, trim: true },

  integrations: {
    boberdoo: {
      external_id: { type: String, index: true, sparse: true, default: null },
      sync_status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
      last_sync_at: { type: Date, default: null },
      last_error: { type: String, default: null }
    }
  }

  
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
baseUserSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();

  if (update.password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }

  next();
});


baseUserSchema.pre('findByIdAndUpdate', async function(next) {
  const update = this.getUpdate();

  if (update.password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }

  next();
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
  
  // Deprecated: keeping for backward compatibility but using address.zip_code instead
  zipCode: {
    type: String,
    trim: true,
  },

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
    type: String,
    default: null
  },
  hasStoredCard: {
    type: Boolean,
    default: false,
  },
  balance: {
    type: Number,
    default: 0,
  },
  refundMoney: {
    type: Number,
    default: 0,
    min: 0,
  },
  autoTopUp: {
    enabled: { type: Boolean, default: false },
    threshold: { type: Number, default: 10 },
    topUpAmount: { type: Number, default: 50 },
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