const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  lead_id: { 
    type: String,
    unique: true,
    sparse: true
  },
  user_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    index: true
  },
  campaign_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },
  
  // Personal Information
  first_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
    trim: true
  },
  middle_name: {
    type: String,
    maxlength: 50,
    trim: true
  },
  last_name: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 50,
    trim: true
  },
  suffix: {
    type: String,
    maxlength: 10,
    trim: true
  },
  
  // Contact Information
  email: {
    type: String,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  phone_number: {
    type: String,
    required: true,
    trim: true,
    index: true  // Index for duplicate checking
  },
  
  // Demographics
  homeowner_desc: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['M', 'F', 'Male', 'Female', 'Other', null],
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  
  // Property Information
  dwelltype: {
    type: String,
    trim: true
  },
  house: {
    type: String,
    trim: true
  },
  
  // Address Components
  predir: {
    type: String,
    trim: true,
    maxlength: 10
  },
  strtype: {
    type: String,
    trim: true,
    maxlength: 20
  },
  postdir: {
    type: String,
    trim: true,
    maxlength: 10
  },
  apttype: {
    type: String,
    trim: true,
    maxlength: 20
  },
  aptnbr: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  // Main Address Object
  address: {
    street: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 200,
      trim: true
    },
    full_address: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 500,
      trim: true
    },
    city: {
      type: String,
      required: false,
      minlength: 1,
      maxlength: 100,
      trim: true,
      index: true
    },
    state: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'State',
      required: true,
      index: true
    },
    zip_code: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 10,
      trim: true,
      index: true
    },
    zip: {
      type: String,
      required: false,
      minlength: 5,
      maxlength: 10,
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    },
    place_id: {
      type: String,
      required: false,
    },
  },
  
  // Additional Information
  note: {
    type: String,
    maxlength: 1000,
    trim: true
  },
  
  // Status and Metadata
  status: {
    type: String,
    enum: ['active', 'inactive', 'contacted', 'converted', 'invalid'],
    default: 'active',
    index: true
  },
  
  // Processing Information
  source: {
    type: String,
    enum: ['manual', 'csv_upload', 'api', 'import'],
    default: 'manual'
  },

  return_status: {
    type: String,
    enum: ['Not Returned', 'Pending', 'Approved', 'Rejected'],
    default: 'Not Returned',
    index: true
  },
  return_attempts: {
    type: Number,
    default: 0
  },
    // ✅ ONLY ADD THESE TWO SIMPLE FIELDS
    return_reason: {
      type: String,
      trim: true,
      default: null
    },
    return_comments: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: null
    },
    
  max_return_attempts: {
    type: Number,
    default: 2
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Last contact attempt
  lastContactedAt: {
    type: Date,
    index: true
  }
});

// Compound indexes for efficient querying
// leadSchema.index({ campaign_id: 1, phone_number: 1 }, { unique: true });
leadSchema.index({ campaign_id: 1, email: 1 }, { 
  unique: true, 
  sparse: true,
  partialFilterExpression: { email: { $exists: true, $ne: null, $ne: "" } }
});
leadSchema.index({ user_id: 1, createdAt: -1 });
leadSchema.index({ campaign_id: 1, status: 1, createdAt: -1 });
leadSchema.index({ 'address.state': 1, 'address.city': 1 });
leadSchema.index({ 'address.zip_code': 1 });

// Text search index for name and address fields
leadSchema.index({
  first_name: 'text',
  last_name: 'text',
  'address.full_address': 'text',
  'address.city': 'text'
});

// Pre-save middleware
leadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Ensure phone and phone_number are consistent
  if (this.phone_number && !this.phone) {
    this.phone = this.phone_number;
  }
  
  // Ensure both zip fields are populated
  if (this.address && this.address.zip_code && !this.address.zip) {
    this.address.zip = this.address.zip_code;
  }
  
  next();
});

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  const parts = [this.first_name];
  if (this.middle_name) parts.push(this.middle_name);
  parts.push(this.last_name);
  if (this.suffix) parts.push(this.suffix);
  return parts.join(' ');
});

// Virtual for display address
leadSchema.virtual('displayAddress').get(function() {
  if (!this.address) return '';
  const parts = [this.address.full_address, this.address.city];
  return parts.filter(Boolean).join(', ');
});

// Ensure virtuals are included in JSON output
leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

// Static method to find duplicates
leadSchema.statics.findDuplicates = function(campaignId, phone, email) {
  const query = { campaign_id: campaignId };
  const conditions = [];
  
  if (phone) {
    conditions.push({ phone_number: phone });
  }
  
  if (email) {
    conditions.push({ email: email });
  }
  
  if (conditions.length === 0) {
    return this.find({ _id: null }); // Return empty result
  }
  
  query.$or = conditions;
  return this.find(query);
};

// Static method for bulk operations with better error handling
leadSchema.statics.insertManyWithErrorHandling = async function(leads, options = {}) {
  try {
    const result = await this.insertMany(leads, { 
      ordered: false, 
      ...options 
    });
    return {
      success: true,
      inserted: result.length,
      errors: []
    };
  } catch (error) {
    if (error.name === 'BulkWriteError') {
      const inserted = error.result.insertedCount || 0;
      const errors = error.writeErrors || [];
      
      return {
        success: inserted > 0,
        inserted,
        errors: errors.map(err => ({
          index: err.index,
          message: err.errmsg || err.message,
          code: err.code
        }))
      };
    }
    throw error;
  }
};

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;