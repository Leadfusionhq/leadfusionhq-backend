const { Joi, Segments } = require('celebrate');

const registerUser = {
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().min(2).max(100).required().messages({
      'string.base': 'Name must be a string',
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters',
      'any.required': 'Name is required',
    }),

    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),

    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
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

    // Address object with all components
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

    terms: Joi.boolean().valid(true).required().messages({
      'any.only': 'You must accept the terms and conditions',
      'any.required': 'You must accept the terms and conditions',
    }),
  }),
};

const loginWithEmail = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
    role: Joi.string().optional(),
    rememberMe: Joi.boolean().optional(),
  }),
};

const verifyEmailLink = {
  [Segments.QUERY]: Joi.object().keys({
    token: Joi.string().required().messages({
      'any.required': 'Verification token is required',
    }),
  }),
};

const sendOTPonEmail = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
  }),
};

const verifyOTP = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    otp: Joi.string().length(5).required().messages({
      'string.length': 'OTP must be 5 digits',
      'any.required': 'OTP is required',
    }),
  }),
};

const resetPassword = {
  [Segments.BODY]: Joi.object().keys({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required',
    }),
    password: Joi.string().min(8).required().messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required',
    }),
  }),
};

const sendVerificationEmail = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
  }),
};

module.exports = {
  registerUser,
  loginWithEmail,
  verifyEmailLink,
  sendOTPonEmail,
  verifyOTP,
  resetPassword,
  sendVerificationEmail,
};
