const { Joi, Segments } = require('celebrate');

const registerUser = {
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

    companyName: Joi.string().required().messages({
      'any.required': 'Company name is required',
    }),

    phoneNumber: Joi.string().required().messages({
      'any.required': 'Phone number is required',
    }),

    zipCode: Joi.string().required().messages({
      'any.required': 'Zip code is required',
    }),
  }),
};

const loginWithEmail = {
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
    
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters',
      'any.required': 'Password is required',
    }),
    role: Joi.string().valid('USER', 'ADMIN').required().messages({
      'any.only': 'Role must be either USER or ADMIN',
      'any.required': 'Role is required',
    }),


  }),
};
const verifyEmailLink = {
    [Segments.BODY]: Joi.object().keys({
        token: Joi.string().required().messages({
            'any.required': 'TOKEN is required'
        })
    })
};

const sendOTPonEmail = {
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address',
            'any.required': 'Email is required'
        })
    })
};

const verifyOTP = {
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address',
            'any.required': 'Email is required'
        }),
        otp: Joi.number().required().messages({
            'any.required': 'OTP is required'
        })
    })
};



const resetPassword = {
    [Segments.BODY]: Joi.object().keys({
        password: Joi.string().min(6).required().messages({
          'string.min': 'Password must be at least 6 characters',
          'any.required': 'Password is required',
        }),
        token: Joi.string().required().messages({
            'any.required': 'RESET TOKEN is required'
        })
    })
};

const sendVerificationEmail = {
    [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'string.email': 'Email must be a valid email address',
            'any.required': 'Email is required'
        }),
    })
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
