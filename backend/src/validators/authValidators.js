const Joi = require('joi');

// User registration validation
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'Password is required',
    }),
  role: Joi.string().valid('BUYER', 'SELLER').required().messages({
    'any.only': 'Role must be either BUYER or SELLER',
    'any.required': 'Role is required',
  }),
  companyName: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Company name must be at least 2 characters long',
    'string.max': 'Company name must not exceed 100 characters',
    'any.required': 'Company name is required',
  }),
  contactPerson: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Contact person name must be at least 2 characters long',
    'string.max': 'Contact person name must not exceed 50 characters',
    'any.required': 'Contact person name is required',
  }),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Phone number is required',
    }),
  country: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country must not exceed 50 characters',
    'any.required': 'Country is required',
  }),
  businessLicense: Joi.string().min(5).max(50).optional().allow('').messages({
    'string.min': 'Business license must be at least 5 characters long',
    'string.max': 'Business license must not exceed 50 characters',
  }),
  taxId: Joi.string().min(5).max(50).optional().allow('').messages({
    'string.min': 'Tax ID must be at least 5 characters long',
    'string.max': 'Tax ID must not exceed 50 characters',
  }),
  address: Joi.string().min(10).max(200).optional().allow('').messages({
    'string.min': 'Address must be at least 10 characters long',
    'string.max': 'Address must not exceed 200 characters',
  }),
});

// User login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

// Password reset request validation
const requestPasswordResetSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

// Password reset validation
const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
});

// Profile update validation
const updateProfileSchema = Joi.object({
  companyName: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Company name must be at least 2 characters long',
    'string.max': 'Company name must not exceed 100 characters',
  }),
  contactPerson: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Contact person name must be at least 2 characters long',
    'string.max': 'Contact person name must not exceed 50 characters',
  }),
  phone: Joi.string()
    .pattern(/^[+]?[1-9][\d]{0,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
    }),
  country: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country must not exceed 50 characters',
  }),
  businessLicense: Joi.string().min(5).max(50).optional().allow('').messages({
    'string.min': 'Business license must be at least 5 characters long',
    'string.max': 'Business license must not exceed 50 characters',
  }),
  taxId: Joi.string().min(5).max(50).optional().allow('').messages({
    'string.min': 'Tax ID must be at least 5 characters long',
    'string.max': 'Tax ID must not exceed 50 characters',
  }),
  address: Joi.string().min(10).max(200).optional().allow('').messages({
    'string.min': 'Address must be at least 10 characters long',
    'string.max': 'Address must not exceed 200 characters',
  }),
});

// Change password validation
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'
      )
    )
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
      'any.required': 'New password is required',
    }),
});

// Refresh token validation
const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().optional().messages({
    'string.base': 'Refresh token must be a string',
  }),
});

// Logout validation
const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional().messages({
    'string.base': 'Refresh token must be a string',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
  refreshTokenSchema,
  logoutSchema,
};
