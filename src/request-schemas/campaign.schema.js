const { Joi, Segments } = require('celebrate');
const { LEAD_TYPE, STATUS, EXCLUSIVITY, DAYS_OF_WEEK ,PAYMENT_TYPE} = require('../helper/constant-enums');

const createCampaign = {
  [Segments.BODY]: Joi.object({
    // user_id: Joi.string().hex().length(24).required(),

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

    // Geography validation
    geography: Joi.object({
      state: Joi.string().required(),
      coverage: Joi.object({
        type: Joi.string().optional(),
        full_state: Joi.boolean().optional(),
        partial: Joi.object({
          radius: Joi.number().min(0).optional(),
          zip_codes: Joi.array().items(Joi.string()).optional(),
          counties: Joi.array().items(Joi.string()).optional(),
          countries: Joi.array().items(Joi.string()).optional(),  // allow both
          zipcode: Joi.string().allow('', null).optional(),
        }).optional(),

      }).optional(),
    }).required(),

    // Utilities validation
    utilities: Joi.object({
      mode: Joi.string().optional(),
      include_all: Joi.boolean().optional(),
      include_some: Joi.array().items(Joi.string()).optional(),
      exclude_some: Joi.array().items(Joi.string()).optional(),
    }).optional(),

    // Delivery validation - FIXED structure

    delivery: Joi.object({
      method: Joi.array().items(Joi.string().valid('email','phone','crm')).min(1).required(), // ✅ changed
      email: Joi.when('method', { // ✅ reference 'method'
        is: Joi.array().has('email'),
        then: Joi.object({ addresses: Joi.string().required(), subject: Joi.string().required() }).required(),
        otherwise: Joi.optional()
      }),
      phone: Joi.when('method', {
        is: Joi.array().has('phone'),
        then: Joi.object({ numbers: Joi.string().required() }).required(),
        otherwise: Joi.optional()
      }),
      crm: Joi.when('method', {
        is: Joi.array().has('crm'),
        then: Joi.object({ instructions: Joi.string().required() }).required(),
        otherwise: Joi.optional()
      }),
      schedule: Joi.object({
        days: Joi.array().items(
          Joi.object({
            day: Joi.string().valid(...DAYS_OF_WEEK).required(),
            active: Joi.boolean().optional(),
            start_time: Joi.string().optional(),
            end_time: Joi.string().optional(),
            cap: Joi.number().min(0).optional()
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
const updateCampaign = {
  [Segments.PARAMS]: Joi.object({
    campaignId: Joi.string().hex().length(24).required().messages({
      'any.required': 'Campaign ID is required in URL',
    }),
  }),
  [Segments.BODY]: Joi.object({
    // user_id: Joi.string().hex().length(24).required(),
    name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),

    status: Joi.string().valid(...Object.values(STATUS)).optional(),

    lead_type: Joi.string().valid(...Object.values(LEAD_TYPE)).required(),

    exclusivity: Joi.string().valid(...Object.values(EXCLUSIVITY)).optional(),

    bid_price: Joi.number().min(0).optional(),

    language: Joi.string().min(2).optional(),
    payment_type: Joi.string()
    .valid(...Object.values(PAYMENT_TYPE))
    .required()
    .messages({
      'any.required': 'Payment type is required',
      'any.only': 'Payment type must be either prepaid or payasyougo',
    }),
    
    poc_phone: Joi.string().allow('').optional(),
    company_contact_phone: Joi.string().allow('').optional(),
    company_contact_email: Joi.string().allow('').optional(),
    
    // Geography validation
    geography: Joi.object({
      state: Joi.string().required(),
      coverage: Joi.object({
        type: Joi.string().optional(),
        full_state: Joi.boolean().optional(),
        partial: Joi.object({
          radius: Joi.number().min(0).optional(),
          zip_codes: Joi.array().items(Joi.string()).optional(),
          counties: Joi.array().items(Joi.string()).optional(),
          countries: Joi.array().items(Joi.string()).optional(),  // allow both
          zipcode: Joi.string().allow('', null).optional(),
        }).optional(),

      }).optional(),
    }).required(),

    // Utilities validation
    utilities: Joi.object({
      mode: Joi.string().optional(),
      include_all: Joi.boolean().optional(),
      include_some: Joi.array().items(Joi.string()).optional(),
      exclude_some: Joi.array().items(Joi.string()).optional(),
    }).optional(),

    // Delivery validation - FIXED structure
    delivery: Joi.object({
      method: Joi.array()
        .items(Joi.string().valid('email', 'phone', 'crm'))
        .min(1)
        .required(),
    
      email: Joi.when('method', {
        is: Joi.array().has('email'),
        then: Joi.object({
          addresses: Joi.string().required(),
          subject: Joi.string().required(),
        }).required(),
        otherwise: Joi.optional(),
      }),
    
      phone: Joi.when('method', {
        is: Joi.array().has('phone'),
        then: Joi.object({
          numbers: Joi.string().required(),
        }).required(),
        otherwise: Joi.optional(),
      }),
    
      crm: Joi.when('method', {
        is: Joi.array().has('crm'),
        then: Joi.object({
          instructions: Joi.string().required(),
        }).required(),
        otherwise: Joi.optional(),
      }),
    
      schedule: Joi.object({
        days: Joi.array()
          .items(
            Joi.object({
              day: Joi.string().valid(...DAYS_OF_WEEK).required(),
              active: Joi.boolean().optional(),
              start_time: Joi.string().optional(),
              end_time: Joi.string().optional(),
              cap: Joi.number().min(0).optional()
            })
          )
          .required()
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
};