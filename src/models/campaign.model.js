const mongoose = require('mongoose');
const { LEAD_TYPE, STATUS, EXCLUSIVITY, DAYS_OF_WEEK,PAYMENT_TYPE,TIMEZONES } = require('../helper/constant-enums');


const campaignSchema = new mongoose.Schema({
  campaign_id: { 
    type: String, 
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { 
    type: String, 
    required: true,
    minlength: 2,
    maxlength: 50,
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
  payment_type: {
    type: String,
    enum: Object.values(PAYMENT_TYPE),
    required: true,
    default: PAYMENT_TYPE.PREPAID,
  },
  
  exclusivity: {
    type: String,
    enum: Object.values(EXCLUSIVITY),
    default: EXCLUSIVITY.NON_EXCLUSIVE,
  },
  bid_price: { 
    type: Number, 
    default: 0,
    min: 0,
  },
  language: { 
    type: String, 
    default: 'en',
    minlength: 2,
  },
  poc_phone: { 
    type: String, 
  },
  company_contact_phone: { 
    type: String, 
  },
  company_contact_email: { 
    type: String, 
  },
  geography: {
    state: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: false, // ✅ CHANGE: No longer globally required
      }
    ],
    coverage: {
      type: { type: String, enum: ['FULL_STATE', 'PARTIAL'], default: 'FULL_STATE' },
      full_state: { 
        type: Boolean, 
        default: false 
      },
      partial: {
        radius: { type: Number, min: 0 },
        zip_codes: [String], // Will be required for PARTIAL via validation
        counties: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'County',
          }
        ],
        countries: [String],
        zipcode: { type: String },
      },
    },
  },
  utilities: {
    mode: { type: String }, // you might want to restrict enum here if you have constants
    include_all: { 
      type: Boolean, 
      default: true,
    },
    include_some: [String],
    exclude_some: [String],
  },

  delivery: {
    method: {
      type: [String],
      enum: ['email', 'phone', 'crm'],
      required: true,
    },
    email: {
      addresses: { type: String },
      subject: { type: String },
    },
    phone: {
      numbers: { type: String },
    },
    crm: {
      instructions: { type: String },
    },
    schedule: {
      // ✅ NEW: Single time range + timezone
      start_time: { 
        type: String, 
        default: '09:00',
        validate: {
          validator: (v) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
          message: 'Invalid time format. Use HH:mm'
        }
      },
      end_time: { 
        type: String, 
        default: '17:00',
        validate: {
          validator: (v) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
          message: 'Invalid time format. Use HH:mm'
        }
      },
      timezone: {
        type: String,
        enum: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
        default: 'America/New_York'
      },
      days: [{
        day: {
          type: String,
          enum: DAYS_OF_WEEK,
          required: true,
        },
        active: { type: Boolean, default: false },
      }],
    },

    other: {
      homeowner: { type: Boolean, default: false },
      second_pro_call_request: { type: Boolean, default: false },
      homeowner_count: { type: Number, min: 0 },
    },
  },

  note: { type: String, maxlength: 500 },

   // Add Boberdoo integration fields
   boberdoo_filter_set_id: {
    type: String,
    sparse: true,
    index: true
  },
  boberdoo_sync_status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'NOT_SYNCED'],
    default: 'NOT_SYNCED'
  },
  boberdoo_last_sync_at: {
    type: Date,
    default: null
  },
  boberdoo_last_error: {
    type: String,
    default: null
  },

  createdAt: { 
    type: Date, 
    default: Date.now,
  },
  updatedAt: { 
    type: Date, 
    default: Date.now,
  },
});
campaignSchema.index({ user_id: 1 });
campaignSchema.index({ campaign_id: 1 }, { unique: true, sparse: true });
campaignSchema.index({ status: 1, lead_type: 1 });

// ✅ SINGLE pre-save hook
campaignSchema.pre('save', function (next) {
  // Validate state requirement for FULL_STATE
  if (this.geography.coverage.type === 'FULL_STATE') {
    if (!this.geography.state || this.geography.state.length === 0) {
      return next(new Error('State is required for FULL_STATE coverage'));
    }
  }
  
  // Validate ZIP codes requirement for PARTIAL
  if (this.geography.coverage.type === 'PARTIAL') {
    if (!this.geography.coverage.partial.zip_codes || 
        this.geography.coverage.partial.zip_codes.length === 0) {
      return next(new Error('ZIP codes are required for PARTIAL coverage'));
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
