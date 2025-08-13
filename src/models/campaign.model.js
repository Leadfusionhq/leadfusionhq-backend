const mongoose = require('mongoose');
const { LEAD_TYPE, STATUS, EXCLUSIVITY, DAYS_OF_WEEK } = require('../helper/constant-enums');

const campaignSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId, // Fixed: was Schema.Types.ObjectId
    ref: 'User',
    required: true,
  },
  name: { 
    type: String, 
    required: true 
  },
  status: {
    type: String,
    enum: Object.values(STATUS),
    default: STATUS.PENDING,
  },
  lead_type: {
    type: String,
    enum: Object.values(LEAD_TYPE),
    required: true,
  },
  exclusivity: {
    type: String,
    enum: Object.values(EXCLUSIVITY),
    default: EXCLUSIVITY.NON_EXCLUSIVE,
  },
  bid_price: { 
    type: Number, 
    default: 0 
  },
  language: { 
    type: String, 
    default: 'en' 
  },

  // Geography structure
  geography: {
    state: { 
      type: String,
      required: true // Made required to match validation
    },
    coverage: {
      full_state: { 
        type: Boolean, 
        default: false 
      },
      partial: {
        radius: { type: Number },
        zip_codes: [String],
        countries: [String],
      },
    },
  },

  // Utilities structure
  utilities: {
    include_all: { 
      type: Boolean, 
      default: true 
    },
    include_some: [String],
    exclude_some: [String],
  },

  // Delivery structure - FIXED: Removed Joi from Mongoose schema
  delivery: {
    method: {
      type: String,
      enum: ['email', 'phone', 'crm_post'],
      required: true,
    },
    schedule: {
      days: [{
        day: {
          type: String,
          enum: DAYS_OF_WEEK,
          required: true
        },
        active: { 
          type: Boolean, 
          default: false 
        },
        start_time: { type: String },
        end_time: { type: String },
        cap: { 
          type: Number, 
          default: 0 
        }
      }]
    },
    other: {
      homeowner: { 
        type: Boolean, 
        default: false 
      },
      second_pro_call_request: { 
        type: Boolean, 
        default: false 
      },
    },
  },

  note: { type: String },

  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
});

campaignSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;