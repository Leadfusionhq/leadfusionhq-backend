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
    index: true,
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
    index: true,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: Date,
    default: null,
    index: true,
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

baseUserSchema.index({ role: 1, createdAt: -1 });
baseUserSchema.index({ isActive: 1 });
baseUserSchema.index({ isActive: 1, isEmailVerified: 1, role: 1 });
baseUserSchema.index({ 'integrations.boberdoo.sync_status': 1 });
baseUserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

baseUserSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (update.password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }

  next();
});

baseUserSchema.pre('findByIdAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (update.password) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    update.password = await bcrypt.hash(update.password, salt);
    this.setUpdate(update);
  }

  next();
});

baseUserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

baseUserSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    if (!user) return next();

    console.log(`🧹 Deleting all chats and messages for user: ${user._id}`);

    const Chat = mongoose.model('Chat');
    const Message = mongoose.model('Message');

    const chats = await Chat.find({ participants: user._id });
    const chatIds = chats.map(chat => chat._id);

    if (chatIds.length > 0) {
      await Message.deleteMany({ chatId: { $in: chatIds } });
    }
    await Chat.deleteMany({ participants: user._id });

    console.log(`✅ Successfully deleted ${chats.length} chats and related messages for user ${user._id}`);
    next();
  } catch (error) {
    console.error('❌ Error while deleting user chats:', error);
    next(error);
  }
});

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
    },
    // ✅ NEW OPTIONAL FIELDS
    cardHolderName: {
      type: String,
      required: false,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true
    },
    mobile: {
      type: String,
      required: false,
      trim: true
    },
    billingAddress: {
      type: String,
      required: false,
      trim: true
    },
    billingZip: {
      type: String,
      required: false,
      trim: true
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
  },
  // ✅ ADD THESE NEW FIELDS
  pending_payment: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    count: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  stopped_campaigns: [{
    campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    campaign_name: { type: String },
    filter_set_id: { type: String },
    stopped_at: { type: Date, default: Date.now },
    reason: { type: String, enum: ['low_balance', 'card_declined', 'manual'], default: 'low_balance' }
  }],
  payment_error: {
    type: Boolean,
    default: false
  },
  last_payment_error_message: {
    type: String,
    default: null
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