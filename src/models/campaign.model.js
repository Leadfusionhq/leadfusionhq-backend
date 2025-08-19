const mongoose = require('mongoose');
const { LEAD_TYPE, STATUS, EXCLUSIVITY, DAYS_OF_WEEK } = require('../helper/constant-enums');

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
    state: { 
      type: String,
      required: true,
    },
    coverage: {
      type: { type: String, enum: ['FULL_STATE', 'PARTIAL'], default: 'FULL_STATE' },
      full_state: { 
        type: Boolean, 
        default: false 
      },
      partial: {
        radius: { type: Number, min: 0 },
        zip_codes: [String],
        counties: [String],
        countries: [String],
        zipcode: { type: String }, // optional string
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
      type: String,
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
      days: [{
        day: {
          type: String,
          enum: DAYS_OF_WEEK,
          required: true,
        },
        active: { type: Boolean, default: false },
        start_time: { type: String },
        end_time: { type: String },
        cap: { type: Number, min: 0, default: 0 },
      }],
    },
    other: {
      homeowner: { type: Boolean, default: false },
      second_pro_call_request: { type: Boolean, default: false },
      homeowner_count: { type: Number, min: 0 },
    },
  },

  note: { type: String, maxlength: 500 },

  createdAt: { 
    type: Date, 
    default: Date.now,
  },
  updatedAt: { 
    type: Date, 
    default: Date.now,
  },
});

campaignSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Campaign = mongoose.model('Campaign', campaignSchema);

module.exports = Campaign;
