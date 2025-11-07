const { Joi, Segments } = require('celebrate');
const { LEAD_TYPE, STATUS, EXCLUSIVITY, DAYS_OF_WEEK, PAYMENT_TYPE,TIMEZONES } = require('../helper/constant-enums');

// ✅ Shared geography validation schema
const geographySchema = Joi.object({
  // State: required for FULL_STATE, optional for PARTIAL
  state: Joi.when('coverage.type', {
    is: 'FULL_STATE',
    then: Joi.array().items(Joi.string().hex().length(24)).min(1).required().messages({
      'array.base': 'State must be an array of IDs',
      'array.min': 'At least one state is required for Full State coverage',
      'any.required': 'State is required for Full State coverage',
    }),
    otherwise: Joi.array().items(Joi.string().hex().length(24)).optional()
  }),
  coverage: Joi.object({
    type: Joi.string().valid('FULL_STATE', 'PARTIAL').required(),
    full_state: Joi.boolean().optional(),
    partial: Joi.object({
      radius: Joi.number().min(0).optional(),
      // ZIP codes: required for PARTIAL, optional for FULL_STATE
      zip_codes: Joi.when('$coverage.type', {
        is: 'PARTIAL',
        then: Joi.array().items(Joi.string()).min(1).required().messages({
          'array.min': 'At least one ZIP code is required for Partial coverage',
          'any.required': 'ZIP codes are required for Partial coverage',
        }),
        otherwise: Joi.array().items(Joi.string()).optional()
      }),
      counties: Joi.array().items(Joi.string()).optional(),
      countries: Joi.array().items(Joi.string()).optional(),
      zipcode: Joi.string().allow('', null).optional(),
    }).optional(),
  }).optional(),
}).required();

const createCampaign = {
  [Segments.BODY]: Joi.object({
    name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),

    status: Joi.string().valid(...Object.values(STATUS)).optional(),
    lead_type: Joi.string().valid(...Object.values(LEAD_TYPE)).required(),
    exclusivity: Joi.string().valid(...Object.values(EXCLUSIVITY)).optional(),
    bid_price: Joi.number().min(0).optional(),

    payment_type: Joi.string()
      .valid(...Object.values(PAYMENT_TYPE))
      .required()
      .messages({
        'any.required': 'Payment type is required',
        'any.only': 'Payment type must be either prepaid or payasyougo',
      }),

    language: Joi.string().min(2).optional(),
    poc_phone: Joi.string().allow('').optional(),
    company_contact_phone: Joi.string().allow('').optional(),
    company_contact_email: Joi.string().allow('').optional(),

    // ✅ Use shared geography schema
    geography: geographySchema,

    // Utilities validation
    utilities: Joi.object({
      mode: Joi.string().optional(),
      include_all: Joi.boolean().optional(),
      include_some: Joi.array().items(Joi.string()).optional(),
      exclude_some: Joi.array().items(Joi.string()).optional(),
    }).optional(),

    // Delivery validation
    delivery: Joi.object({
      method: Joi.array().items(Joi.string().valid('email', 'phone', 'crm')).min(1).required(),
      email: Joi.when('method', {
        is: Joi.array().has('email'),
        then: Joi.object({ 
          addresses: Joi.string().required(), 
          subject: Joi.string().required() 
        }).required(),
        otherwise: Joi.optional()
      }),
      phone: Joi.when('method', {
        is: Joi.array().has('phone'),
        then: Joi.object({ 
          numbers: Joi.string().required() 
        }).required(),
        otherwise: Joi.optional()
      }),
      crm: Joi.when('method', {
        is: Joi.array().has('crm'),
        then: Joi.object({ 
          instructions: Joi.string().required() 
        }).required(),
        otherwise: Joi.optional()
      }),
      schedule: Joi.object({
        // ✅ NEW: Single time range
        start_time: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required()
          .messages({
            'string.pattern.base': 'Start time must be in HH:mm format'
          }),
        end_time: Joi.string()
          .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
          .required()
          .messages({
            'string.pattern.base': 'End time must be in HH:mm format'
          }),
        timezone: Joi.string()
          .valid(...Object.values(TIMEZONES))
          .required()
          .messages({
            'any.only': 'Invalid timezone'
          }),
        days: Joi.array().items(
          Joi.object({
            day: Joi.string().valid(...DAYS_OF_WEEK).required(),
            active: Joi.boolean().optional(),
          })
        ).required()
      }).required(),
      other: Joi.object({
        homeowner: Joi.boolean().optional(),
        second_pro_call_request: Joi.boolean().optional(),
        homeowner_count: Joi.number().min(0).optional(),
      }).optional(),
    }).required(),

    note: Joi.string().allow('').max(500).optional(),
  })
};

const createCampaignByAdmin = {
  [Segments.PARAMS]: Joi.object({
    userId: Joi.string().hex().length(24).required().messages({
      'any.required': 'User ID is required in URL',
    }),
  }),
  [Segments.BODY]: createCampaign[Segments.BODY]  // ✅ Reuse schema
};

const updateCampaign = {
  [Segments.PARAMS]: Joi.object({
    campaignId: Joi.string().hex().length(24).required().messages({
      'any.required': 'Campaign ID is required in URL',
    }),
  }),
  [Segments.BODY]: createCampaign[Segments.BODY]  // ✅ Reuse schema
};

const getCampaign = {
  [Segments.BODY]: Joi.object().keys({
    campaignId: Joi.string().required().messages({
      'any.required': 'campaign Id is required'
    })
  }),
};

module.exports = {
  createCampaign,
  getCampaign,
  updateCampaign,
  createCampaignByAdmin,
};