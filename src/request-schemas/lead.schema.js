const { Joi, Segments } = require('celebrate');
const { LEAD_STATUS, LEAD_TYPE, GENDER, LEAD_SOURCE } = require('../helper/constant-enums');

const createLead = {
  [Segments.BODY]: Joi.object({
    campaign_id: Joi.string().hex().length(24).required().messages({
      'any.required': 'Campaign ID is required',
    }),
    
    // Personal information
    first_name: Joi.string().min(1).max(50).required().messages({
      'string.base': 'First Name must be a string',
      'string.empty': 'First Name is required',
      'any.required': 'First Name is required',
    }),

    last_name: Joi.string().min(1).max(50).required().messages({
      'string.base': 'Last Name must be a string',
      'string.empty': 'Last Name is required',
      'any.required': 'Last Name is required',
    }),

    middle_name: Joi.string().max(50).allow('').optional(),
    suffix: Joi.string().max(10).allow('').optional(),
    gender: Joi.string().valid('M', 'F', 'Male', 'Female', 'Other', '').allow('').optional(),
    age: Joi.number().min(0).max(150).allow(null).optional(),

    // Contact information
    email: Joi.string().email().allow('').optional().messages({
      'string.base': 'Email must be a valid email address',
      'string.email': 'Please provide a valid email address',
    }),

    phone_number: Joi.string().required().messages({
      'string.base': 'Phone number must be a string',
      'any.required': 'Phone number is required',
    }),

    phone: Joi.string().allow('').optional(), // Legacy field

    // Property information
    homeowner_desc: Joi.string().allow('').optional(),
    dwelltype: Joi.string().allow('').optional(),
    house: Joi.string().allow('').optional(),

    // Address components
    predir: Joi.string().max(10).allow('').optional(),
    strtype: Joi.string().max(20).allow('').optional(),
    postdir: Joi.string().max(10).allow('').optional(),
    apttype: Joi.string().max(20).allow('').optional(),
    aptnbr: Joi.string().max(20).allow('').optional(),

    // Address object
    address: Joi.object({
      full_address: Joi.string().min(1).max(500).required().messages({
        'string.base': 'Full Address must be a string',
        'string.empty': 'Full Address is required',
        'any.required': 'Full Address is required',
      }),

      street: Joi.string().min(1).max(200).required().messages({
        'string.base': 'Street Address must be a string',
        'string.empty': 'Street Address is required',
        'any.required': 'Street Address is required',
      }),

      city: Joi.string().min(1).max(100).required().messages({
        'string.base': 'City must be a string',
        'string.empty': 'City is required',
        'any.required': 'City is required',
      }),

      state: Joi.string().hex().length(24).required().messages({
        'any.required': 'State is required',
        'string.hex': 'State must be a valid ObjectId',
        'string.length': 'State must be a valid ObjectId',
      }),

      zip_code: Joi.string().min(5).max(10).required().messages({
        'string.base': 'Zip Code must be a string',
        'string.empty': 'Zip Code is required',
        'any.required': 'Zip Code is required',
      }),

      zip: Joi.string().min(5).max(10).allow('').optional(),
    }).required(),

    // Additional information
    note: Joi.string().allow('').max(1000).optional(),
    source: Joi.string().valid('manual', 'csv_upload', 'api', 'import').default('manual'),
    status: Joi.string().valid('active', 'inactive', 'contacted', 'converted', 'invalid').default('active'),
  }),
};

const updateLead = {
  [Segments.PARAMS]: Joi.object({
    leadId: Joi.string().hex().length(24).required().messages({
      'any.required': 'Lead ID is required in URL',
    }),
  }),
  [Segments.BODY]: Joi.object({
    campaign_id: Joi.string().hex().length(24).optional().messages({
      'any.required': 'Campaign ID is required',
    }),
    
    // Personal information
    first_name: Joi.string().min(1).max(50).optional().messages({
      'string.base': 'First Name must be a string',
    }),

    last_name: Joi.string().min(1).max(50).optional().messages({
      'string.base': 'Last Name must be a string',
    }),

    middle_name: Joi.string().max(50).allow('').optional(),
    suffix: Joi.string().max(10).allow('').optional(),
    gender: Joi.string().valid('M', 'F', 'Male', 'Female', 'Other', '').allow('').optional(),
    age: Joi.number().min(0).max(150).allow(null).optional(),

    // Contact information
    email: Joi.string().email().allow('').optional().messages({
      'string.base': 'Email must be a valid email address',
      'string.email': 'Please provide a valid email address',
    }),

    phone_number: Joi.string().optional().messages({
      'string.base': 'Phone number must be a string',
    }),

    phone: Joi.string().allow('').optional(),

    // Property information
    homeowner_desc: Joi.string().allow('').optional(),
    dwelltype: Joi.string().allow('').optional(),
    house: Joi.string().allow('').optional(),

    // Address components
    predir: Joi.string().max(10).allow('').optional(),
    strtype: Joi.string().max(20).allow('').optional(),
    postdir: Joi.string().max(10).allow('').optional(),
    apttype: Joi.string().max(20).allow('').optional(),
    aptnbr: Joi.string().max(20).allow('').optional(),

    // Address object
    address: Joi.object({
      full_address: Joi.string().min(1).max(500).optional(),
      street: Joi.string().min(1).max(200).optional(),
      city: Joi.string().min(1).max(100).optional(),
      state: Joi.string().hex().length(24).optional(),
      zip_code: Joi.string().min(5).max(10).optional(),
      zip: Joi.string().min(5).max(10).allow('').optional(),
    }).optional(),

    // Additional information
    note: Joi.string().allow('').max(1000).optional(),
    source: Joi.string().valid('manual', 'csv_upload', 'api', 'import').optional(),
    status: Joi.string().valid('active', 'inactive', 'contacted', 'converted', 'invalid').optional(),
  }),
};

const getLead = {
  [Segments.PARAMS]: Joi.object({
    leadId: Joi.string().hex().length(24).required().messages({
      'any.required': 'Lead ID is required',
    }),
  }),
};

module.exports = {
  createLead,
  updateLead,
  getLead,
};