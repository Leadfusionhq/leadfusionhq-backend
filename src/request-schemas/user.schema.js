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
    // address: Joi.object({
    //   full_address: Joi.string().required().messages({
    //     'any.required': 'Full address is required',
    //   }),
    //   street: Joi.string().required().messages({
    //     'any.required': 'Street address is required',
    //   }),
    //   city: Joi.string().required().messages({
    //     'any.required': 'City is required',
    //   }),
    //   state: Joi.string().length(2).uppercase().required().messages({
    //     'string.length': 'State must be a 2-letter code',
    //     'any.required': 'State is required',
    //   }),
    //   zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required().messages({
    //     'string.pattern.base': 'ZIP code must be in format 12345 or 12345-6789',
    //     'any.required': 'ZIP code is required',
    //   }),
    //   coordinates: Joi.object({
    //     lat: Joi.number().min(-90).max(90).optional(),
    //     lng: Joi.number().min(-180).max(180).optional(),
    //   }).optional(),
    //   place_id: Joi.string().optional(),
    // }).required().messages({
    //   'any.required': 'Address information is required',
    // }),
    address: Joi.object({
      full_address: Joi.string().optional(),
      street: Joi.string().optional(),
      city: Joi.string().optional(),
      state: Joi.string().length(2).uppercase().optional().messages({
        'string.length': 'State must be a 2-letter code',
      }),
      zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).optional().messages({
        'string.pattern.base': 'ZIP code must be in format 12345 or 12345-6789',
      }),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional(),
      }).optional(),
      place_id: Joi.string().optional(),
    })
      .optional()
      .allow(null)
      .messages({
        'object.base': 'Address must be an object',
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
      'any.required': 'USER id is required'
    })
  }),
};
// ============================================
// USER SELF-SERVICE SCHEMAS
// ============================================

const updateMyProfile = {
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().min(2).max(50).optional().messages({
      'string.base': 'Name must be a string',
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name must not exceed 50 characters',
    }),

    email: Joi.string().email().optional().messages({
      'string.email': 'Email must be a valid email address',
    }),

    phoneNumber: Joi.string().optional().messages({
      'string.base': 'Phone number must be a string',
    }),

    companyName: Joi.string().optional().messages({
      'string.base': 'Company name must be a string',
    }),

    // Address object validation - accepts both string and object for state
    address: Joi.object({
      full_address: Joi.string().optional(),
      street: Joi.string().optional(),
      city: Joi.string().optional(),

      // State can be either a string (abbreviation) or an object from select component
      state: Joi.alternatives().try(
        Joi.string().length(2).uppercase().messages({
          'string.length': 'State abbreviation must be 2 letters',
        }),
        Joi.object({
          value: Joi.string(),
          label: Joi.string(),
          name: Joi.string(),
          abbreviation: Joi.string().length(2).uppercase(),
        })
      ).optional(),

      zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).optional().messages({
        'string.pattern.base': 'ZIP code must be in format 12345 or 12345-6789',
      }),

      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).optional(),
        lng: Joi.number().min(-180).max(180).optional(),
      }).optional(),

      place_id: Joi.string().optional(),
    }).optional(),

    avatar: Joi.string().uri().optional().messages({
      'string.uri': 'Avatar must be a valid URL',
    }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update',
  }),
};

const changePassword = {
  [Segments.BODY]: Joi.object().keys({
    currentPassword: Joi.string().min(6).required().messages({
      'string.min': 'Current password must be at least 6 characters',
      'any.required': 'Current password is required',
    }),

    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
        'any.required': 'New password is required',
      }),

    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Please confirm your new password',
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
      zip_code: Joi.string().pattern(/^\d{5}(-\d{4})?$/).optional().messages({
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
      'any.required': 'Contract version is required'
    }),
    ipAddress: Joi.string().ip().optional().messages({
      'string.ip': 'IP address must be a valid IP'
    })
  }),
  [Segments.PARAMS]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required'
    })
  })
};

const checkContract = {
  [Segments.BODY]: Joi.object().keys({
    version: Joi.string().required().messages({
      'any.required': 'Contract version is required'
    })
  }),
  [Segments.PARAMS]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required'
    })
  })
};

const getContractStatus = {
  [Segments.PARAMS]: Joi.object().keys({
    userId: Joi.string().required().messages({
      'any.required': 'User ID is required'
    })
  }),
  [Segments.QUERY]: Joi.object().keys({
    version: Joi.string().optional()
  })
};

module.exports = {
  createUserByAdmin,
  getUserById,
  updateMyProfile,
  changePassword,
  updateUser,
  acceptContract,
  checkContract,
  getContractStatus
};