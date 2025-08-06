const { Joi, Segments } = require('celebrate');
const CONSTANT_ENUM = require('../helper/constant-enums.js');
const { id } = require('date-fns/locale');

const createAdminByAdmin = {
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

      phoneNumber: Joi.string().required().messages({
        'any.required': 'Phone number is required',
      }),
      
      role: Joi.string()
       .valid(CONSTANT_ENUM.USER_ROLE.ADMIN)
       .default(CONSTANT_ENUM.USER_ROLE.ADMIN)
       .messages({
         'any.only': 'Role must be ADMIN',
       }),
    }),
};

const getAdminById = {
  [Segments.BODY]: Joi.object().keys({
      userId: Joi.string().required().messages({
            'any.required': 'ADMIN id is required'
        })
    }),
};
const updateAdmin = {
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

    zipCode: Joi.string().required().messages({
      'any.required': 'Zip code is required',
    }),

    role: Joi.string()
      .valid(CONSTANT_ENUM.USER_ROLE.ADMIN)
      .default(CONSTANT_ENUM.USER_ROLE.ADMIN)
      .messages({
        'any.only': 'Role must be ADMIN',
      }),
  }),
};

module.exports = {
  createAdminByAdmin,
  getAdminById,
  updateAdmin,
};
