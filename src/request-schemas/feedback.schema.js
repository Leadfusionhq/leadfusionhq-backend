const { Joi, Segments } = require('celebrate');

const createFeedback = {
    [Segments.BODY]: Joi.object().keys({
      title: Joi.string()
        .trim()
        .min(5)
        .max(100)
        .required()
        .messages({
          'string.base': 'Title must be a string',
          'string.empty': 'Title is required',
          'string.min': 'Title must be at least 5 characters',
          'string.max': 'Title cannot exceed 100 characters',
          'any.required': 'Title is required',
        }),
  
      description: Joi.string()
        .trim()
        .min(10)
        .max(1000)
        .required()
        .messages({
          'string.base': 'Description must be a string',
          'string.empty': 'Description is required',
          'string.min': 'Description must be at least 10 characters',
          'string.max': 'Description cannot exceed 1000 characters',
          'any.required': 'Description is required',
        }),
  
        // userId: Joi.alternatives()
        // .try(
        //   Joi.string()
        //     .pattern(/^[0-9a-fA-F]{24}$/) // ✅ better than regex()
        //     .messages({
        //       'string.pattern.base': 'Invalid User ID format',
        //     }),
        //   Joi.string()
        //     .valid('anonymous')
        //     .messages({
        //       'any.only': 'User ID must be "anonymous"',
        //     })
        // )
        // .required()
        // .messages({
        //   'any.required': 'User ID is required',
        //   'alternatives.match': 'Invalid User ID format',
        // }),
      
    }),
  };

// The rest of your schemas remain the same
const updateFeedback = {
  [Segments.PARAMS]: Joi.object().keys({
    feedbackId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Feedback ID format',
        'any.required': 'Feedback ID is required',
      }),
  }),
  [Segments.BODY]: Joi.object().keys({
    title: Joi.string()
      .trim()
      .min(5)
      .max(100)
      .optional()
      .messages({
        'string.base': 'Title must be a string',
        'string.empty': 'Title cannot be empty',
        'string.min': 'Title must be at least 5 characters',
        'string.max': 'Title cannot exceed 100 characters',
      }),

    description: Joi.string()
      .trim()
      .min(10)
      .max(1000)
      .optional()
      .messages({
        'string.base': 'Description must be a string',
        'string.empty': 'Description cannot be empty',
        'string.min': 'Description must be at least 10 characters',
        'string.max': 'Description cannot exceed 1000 characters',
      }),
  }).min(1).messages({
    'object.min': 'At least one field (title or description) is required for update',
  }),
};

const getFeedbackById = {
  [Segments.PARAMS]: Joi.object().keys({
    feedbackId: Joi.string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid Feedback ID format',
        'any.required': 'Feedback ID is required',
      }),
  }),
};

const getAllFeedbacks = {
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
  }),
};

module.exports = {
  createFeedback,
  updateFeedback,
  getFeedbackById,
  getAllFeedbacks,
};