const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_id: { 
    type: String, 
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
  },
  first_name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  last_name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    match: /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/,
  },
  phone: {
    type: String,
    required: false, 
  },

  address: {
    street: {
      type: String,
      required: true,
      minlength: 3,
      maxlength: 100,
    },
    city: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 100,
    },
    // state: {
    //   type: String,
    //   required: true,
    //   minlength: 2,
    //   maxlength: 50,
    // },
    state: { 
      type: mongoose.Schema.Types.ObjectId,
      // type: String,
      ref: 'State',
      required: true,
    },
    zip_code: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 10,
    },
  },
  note: {
    type: String,
    maxlength: 500,
    required: false,
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

leadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;
