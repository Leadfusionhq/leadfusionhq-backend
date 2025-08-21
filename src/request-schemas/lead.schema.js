const { Joi, Segments } = require('celebrate');
const { LEAD_STATUS, LEAD_TYPE, GENDER, LEAD_SOURCE } = require('../helper/constant-enums');

const createLead = {
  [Segments.BODY]: Joi.object({
    campaign_id: Joi.string().hex().length(24).required().messages({
      'any.required': 'Campaign ID is required',
    }),
    first_name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'First Name must be a string',
      'string.empty': 'First Name is required',
      'any.required': 'First Name is required',
    }),

    last_name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'Last Name must be a string',
      'string.empty': 'Last Name is required',
      'any.required': 'Last Name is required',
    }),

    email: Joi.string().email().required().messages({
      'string.base': 'Email must be a valid email address',
      'string.empty': 'Email is required',
      'any.required': 'Email is required',
    }),

    phone: Joi.string().allow('').optional().messages({
      'string.base': 'Phone number must be a string',
    }),


    address: Joi.object({
      street: Joi.string().min(3).max(100).required().messages({
        'string.base': 'Street Address must be a string',
        'string.empty': 'Street Address is required',
        'any.required': 'Street Address is required',
      }),

      city: Joi.string().min(2).max(100).required().messages({
        'string.base': 'City must be a string',
        'string.empty': 'City is required',
        'any.required': 'City is required',
      }),

      state: Joi.string().min(2).max(50).required().messages({
        'string.base': 'State must be a string',
        'string.empty': 'State is required',
        'any.required': 'State is required',
      }),

      zip_code: Joi.string().min(5).max(10).required().messages({
        'string.base': 'Zip Code must be a string',
        'string.empty': 'Zip Code is required',
        'any.required': 'Zip Code is required',
      }),
    }).required(),

    note: Joi.string().allow('').max(500).optional(),
  }),
};

const updateLead = {
  [Segments.PARAMS]: Joi.object({
    leadId: Joi.string().hex().length(24).required().messages({
      'any.required': 'Lead ID is required in URL',
    }),
  }),
  [Segments.BODY]: Joi.object({
    first_name: Joi.string().min(2).max(50).optional().messages({
      'string.base': 'First Name must be a string',
    }),

    last_name: Joi.string().min(2).max(50).optional().messages({
      'string.base': 'Last Name must be a string',
    }),

    email: Joi.string().email().optional().messages({
      'string.base': 'Email must be a valid email address',
    }),

    phone: Joi.string().allow('').optional().messages({
      'string.base': 'Phone number must be a string',
    }),

    address: Joi.object({
      street: Joi.string().min(3).max(100).optional(),
      city: Joi.string().min(2).max(100).optional(),
      state: Joi.string().min(2).max(50).optional(),
      zip_code: Joi.string().min(5).max(10).optional(),
    }).optional(),

    note: Joi.string().allow('').max(500).optional(),

    updated_at: Joi.date().optional(),
  }),
};

const getLead = {
  [Segments.BODY]: Joi.object().keys({
    leadId: Joi.string().required().messages({
      'any.required': 'Lead ID is required',
    }),
  }),
};

module.exports = {
  createLead,
  updateLead,
  getLead,
};
