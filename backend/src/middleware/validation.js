const { validationResult } = require('express-validator');
const { logger } = require('../utils/logger');

/**
 * Joi validation middleware
 */
const validateJoi = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      logger.warn('Joi validation errors:', error.details);

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value,
        })),
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Express-validator validation middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((error) => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value,
      })),
    });
  }

  next();
};

/**
 * Async validation middleware
 */
const asyncValidate = (validations) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      logger.warn('Async validation errors:', errors.array());

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array().map((error) => ({
          field: error.path || error.param,
          message: error.msg,
          value: error.value,
        })),
      });
    }

    next();
  };
};

module.exports = {
  validate,
  validateJoi,
  asyncValidate,
};
