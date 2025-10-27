const { Joi, Segments } = require('celebrate');
const CONSTANT_ENUM = require('../helper/constant-enums.js');

const createUserByAdmin = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),

    name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),

    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),

    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Confirm password does not match password',
      'any.required': 'Confirm password is required',
    }),

    companyName: Joi.string().required().messages({
      'any.required': 'Company name is required',
    }),

    phoneNumber: Joi.string().required().messages({
      'any.required': 'Phone number is required',
    }),

    // Address object validation
    address: Joi.object({
      full_address: Joi.string().required().messages({
        'any.required': 'Full address is required',
      }),
      street: Joi.string().required().messages({
        'any.required': 'Street address is required',
      }),
      city: Joi.string().required().messages({
        'any.required': 'City is required',
      }),
      state: Joi.string().length(2).uppercase().required().messages({
        'string.length': 'State must be a 2-letter code',
        'any.required': 'State is required',
      }),
      zip_code: Joi.string()
        .pattern(/^\d{5}(-\d{4})?$/)
        .required()
        .messages({
          'string.pattern.base': 'ZIP code must be in format 12345 or 12345-6789',
          'any.required': 'ZIP code is required',
        }),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional(),
      }).optional(),
      place_id: Joi.string().optional(),
    })
      .required()
      .messages({
        'any.required': 'Address information is required',
      }),

    role: Joi.string()
      .valid(CONSTANT_ENUM.USER_ROLE.USER)
      .default(CONSTANT_ENUM.USER_ROLE.USER)
      .messages({
        'any.only': 'Role must be USER',
      }),
  }),
};

const getUserById = {
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'USER id is required',
    }),
  }),
};

const updateUser = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),

    name: Joi.string().min(2).max(50).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'any.required': 'Name is required',
    }),

    password: Joi.string().min(6).optional().empty('').messages({
      'string.min': 'Password must be at least 6 characters',
    }),

    confirmPassword: Joi.when('password', {
      is: Joi.exist(),
      then: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only': 'Confirm password does not match password',
        'any.required': 'Confirm password is required when updating password',
      }),
      otherwise: Joi.string().optional().empty(''),
    }),

    companyName: Joi.string().required().messages({
      'any.required': 'Company name is required',
    }),

    phoneNumber: Joi.string().required().messages({
      'any.required': 'Phone number is required',
    }),

    // Address object validation (optional for updates)
    address: Joi.object({
      full_address: Joi.string().optional(),
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().length(2).uppercase().optional().messages({
        'string.length': 'State must be a 2-letter code',
      }),
      zip_code: Joi.string()
        .pattern(/^\d{5}(-\d{4})?$/)
        .optional()
        .messages({
          'string.pattern.base': 'ZIP code must be in format 12345 or 12345-6789',
        }),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional(),
      }).optional(),
      place_id: Joi.string().optional(),
    }).optional(),

    role: Joi.string()
      .valid(CONSTANT_ENUM.USER_ROLE.USER)
      .default(CONSTANT_ENUM.USER_ROLE.USER)
      .messages({
        'any.only': 'Role must be USER',
      }),

    avatar: Joi.string().optional(),
  }),
};

const acceptContract = {
  [Segments.BODY]: Joi.object().keys({
    version: Joi.string().optional().messages({
      'any.required': 'Contract version is required',
    }),
    ipAddress: Joi.string().ip().optional().messages({
      'string.ip': 'IP address must be a valid IP',
    }),
  }),
  [Segments.PARAMS]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required',
    }),
  }),
};

const checkContract = {
  [Segments.BODY]: Joi.object().keys({
    version: Joi.string().required().messages({
      'any.required': 'Contract version is required',
    }),
  }),
  [Segments.PARAMS]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required',
    }),
  }),
};

const getContractStatus = {
  [Segments.PARAMS]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required',
    }),
  }),
  [Segments.QUERY]: Joi.object().keys({
    version: Joi.string().optional(),
  }),
};

module.exports = {
  createUserByAdmin,
  getUserById,
  updateUser,
  acceptContract,
  checkContract,
  getContractStatus,
};
