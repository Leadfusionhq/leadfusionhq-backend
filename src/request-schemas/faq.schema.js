const { Joi, Segments } = require('celebrate');

const createFAQ = {
  [Segments.BODY]: Joi.object().keys({
    question: Joi.string()
      .trim()
      .min(5)
      .max(500)
      .required()
      .messages({
        'string.base': 'Question must be a string',
        'string.empty': 'Question is required',
        'string.min': 'Question must be at least 5 characters',
        'string.max': 'Question cannot exceed 500 characters',
        'any.required': 'Question is required',
      }),

    answer: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .required()
      .messages({
        'string.base': 'Answer must be a string',
        'string.empty': 'Answer is required',
        'string.min': 'Answer must be at least 10 characters',
        'string.max': 'Answer cannot exceed 2000 characters',
        'any.required': 'Answer is required',
      }),
  }),
};

const updateFAQ = {
  [Segments.PARAMS]: Joi.object().keys({
    faqId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid FAQ ID format',
        'any.required': 'FAQ ID is required',
      }),
  }),
  [Segments.BODY]: Joi.object().keys({
    question: Joi.string()
      .trim()
      .min(5)
      .max(500)
      .optional()
      .messages({
        'string.base': 'Question must be a string',
        'string.empty': 'Question cannot be empty',
        'string.min': 'Question must be at least 5 characters',
        'string.max': 'Question cannot exceed 500 characters',
      }),

    answer: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .optional()
      .messages({
        'string.base': 'Answer must be a string',
        'string.empty': 'Answer cannot be empty',
        'string.min': 'Answer must be at least 10 characters',
        'string.max': 'Answer cannot exceed 2000 characters',
      }),
  }).min(1).messages({
    'object.min': 'At least one field (question or answer) is required for update',
  }),
};

const getFAQById = {
  [Segments.PARAMS]: Joi.object().keys({
    faqId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid FAQ ID format',
        'any.required': 'FAQ ID is required',
      }),
  }),
};

const getAllFAQs = {
  [Segments.QUERY]: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1',
    }),
    
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100',
    }),
    
    search: Joi.string().trim().optional().messages({
      'string.base': 'Search must be a string',
    }),
    
    isActive: Joi.boolean().optional().messages({
      'boolean.base': 'isActive must be a boolean',
    }),
  }),
};

module.exports = {
  createFAQ,
  updateFAQ,
  getFAQById,
  getAllFAQs,
};