const { Joi, Segments } = require('celebrate');
const { LEAD_TYPE, STATUS, EXCLUSIVITY, DAYS_OF_WEEK } = require('../helper/constant-enums');

const createCampaign = {
  [Segments.BODY]: Joi.object({
    user_id: Joi.string().hex().length(24).required(),

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

    // Geography validation
    geography: Joi.object({
      state: Joi.string().required(),
      coverage: Joi.object({
        full_state: Joi.boolean().optional(),
        partial: Joi.object({
          radius: Joi.number().min(0).optional(),
          zip_codes: Joi.array().items(Joi.string()).optional(),
          countries: Joi.array().items(Joi.string()).optional(),
        }).optional(),
      }).optional(),
    }).required(),

    // Utilities validation
    utilities: Joi.object({
      include_all: Joi.boolean().optional(),
      include_some: Joi.array().items(Joi.string()).optional(),
      exclude_some: Joi.array().items(Joi.string()).optional(),
    }).optional(),

    // Delivery validation - FIXED structure
    delivery: Joi.object({
      method: Joi.string().valid('email', 'phone', 'crm_post').required(),

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
      }).optional(),
    }).required(),

    note: Joi.string().max(500).optional(),
  })
};

module.exports = {
  createCampaign,
};