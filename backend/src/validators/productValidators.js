const Joi = require('joi');

// Product creation validation
const createProductSchema = Joi.object({
  title: Joi.string().min(5).max(100).required().messages({
    'string.min': 'Product title must be at least 5 characters long',
    'string.max': 'Product title must not exceed 100 characters',
    'any.required': 'Product title is required',
  }),
  description: Joi.string().min(20).max(2000).required().messages({
    'string.min': 'Product description must be at least 20 characters long',
    'string.max': 'Product description must not exceed 2000 characters',
    'any.required': 'Product description is required',
  }),
  categoryId: Joi.string().min(1).required().messages({
    'string.min': 'Category ID must not be empty',
    'any.required': 'Category is required',
  }),
  price: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Price must be a positive number',
    'number.precision': 'Price must have at most 2 decimal places',
    'any.required': 'Price is required',
  }),
  quantity: Joi.number().positive().required().messages({
    'number.positive': 'Quantity must be positive',
    'any.required': 'Quantity is required',
  }),
  unit: Joi.string()
    .valid('KG', 'TONS', 'METERS', 'YARDS', 'PIECES', 'ROLLS', 'BALES')
    .required()
    .messages({
      'any.only':
        'Unit must be one of: KG, TONS, METERS, YARDS, PIECES, ROLLS, BALES',
      'any.required': 'Unit is required',
    }),
  listingType: Joi.string()
    .valid('FIXED_PRICE', 'AUCTION', 'NEGOTIABLE')
    .required()
    .messages({
      'any.only':
        'Listing type must be one of: FIXED_PRICE, AUCTION, NEGOTIABLE',
      'any.required': 'Listing type is required',
    }),
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters long',
    'string.max': 'Location must not exceed 100 characters',
    'any.required': 'Location is required',
  }),
  country: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country must not exceed 50 characters',
    'any.required': 'Country is required',
  }),
  minOrderQuantity: Joi.number().positive().precision(2).required().messages({
    'number.positive': 'Minimum order quantity must be positive',
    'number.precision': 'Minimum order quantity must have at most 2 decimal places',
    'any.required': 'Minimum order quantity is required',
  }),
  tags: Joi.array()
    .items(Joi.string().min(2).max(20))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.min': 'Each tag must be at least 2 characters long',
      'string.max': 'Each tag must not exceed 20 characters',
    }),
  specifications: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional()
    .messages({
      'object.base': 'Specifications must be an object',
    }),
  // Auction-specific fields
  auctionStartTime: Joi.when('listingType', {
    is: 'AUCTION',
    then: Joi.date().required().messages({
      'date.base': 'Auction start time must be a valid date',
      'any.required': 'Auction start time is required for auction listings',
    }),
    otherwise: Joi.forbidden(),
  }),
  auctionEndTime: Joi.when('listingType', {
    is: 'AUCTION',
    then: Joi.date().greater(Joi.ref('auctionStartTime')).required().messages({
      'date.greater': 'Auction end time must be after start time',
      'any.required': 'Auction end time is required for auction listings',
    }),
    otherwise: Joi.forbidden(),
  }),
  minimumBid: Joi.when('listingType', {
    is: 'AUCTION',
    then: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Minimum bid must be positive',
      'number.precision': 'Minimum bid must have at most 2 decimal places',
    }),
    otherwise: Joi.forbidden(),
  }),
  reservePrice: Joi.when('listingType', {
    is: 'AUCTION',
    then: Joi.number().positive().precision(2).optional().messages({
      'number.positive': 'Reserve price must be positive',
      'number.precision': 'Reserve price must have at most 2 decimal places',
    }),
    otherwise: Joi.forbidden(),
  }),
});

// Product update validation
const updateProductSchema = Joi.object({
  title: Joi.string().min(5).max(100).optional().messages({
    'string.min': 'Product title must be at least 5 characters long',
    'string.max': 'Product title must not exceed 100 characters',
  }),
  description: Joi.string().min(20).max(2000).optional().messages({
    'string.min': 'Product description must be at least 20 characters long',
    'string.max': 'Product description must not exceed 2000 characters',
  }),
  categoryId: Joi.string().min(1).optional().messages({
    'string.min': 'Category ID must not be empty',
  }),
  price: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Price must be a positive number',
    'number.precision': 'Price must have at most 2 decimal places',
  }),
  quantity: Joi.number().integer().positive().optional().messages({
    'number.integer': 'Quantity must be a whole number',
    'number.positive': 'Quantity must be positive',
  }),
  unit: Joi.string()
    .valid('KG', 'TONS', 'METERS', 'YARDS', 'PIECES', 'ROLLS', 'BALES')
    .optional()
    .messages({
      'any.only':
        'Unit must be one of: KG, TONS, METERS, YARDS, PIECES, ROLLS, BALES',
    }),
  listingType: Joi.string()
    .valid('FIXED_PRICE', 'AUCTION', 'NEGOTIABLE')
    .optional()
    .messages({
      'any.only':
        'Listing type must be one of: FIXED_PRICE, AUCTION, NEGOTIABLE',
    }),
  tags: Joi.array()
    .items(Joi.string().min(2).max(20))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Maximum 10 tags allowed',
      'string.min': 'Each tag must be at least 2 characters long',
      'string.max': 'Each tag must not exceed 20 characters',
    }),
  specifications: Joi.object()
    .pattern(Joi.string(), Joi.string())
    .optional()
    .messages({
      'object.base': 'Specifications must be an object',
    }),
});

// Product query validation
const getProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),
  search: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Search term must be at least 2 characters long',
    'string.max': 'Search term must not exceed 100 characters',
  }),
  category: Joi.string().min(1).optional().messages({
    'string.min': 'Category ID must not be empty',
  }),
  minPrice: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Minimum price must be positive',
    'number.precision': 'Minimum price must have at most 2 decimal places',
  }),
  maxPrice: Joi.number().positive().precision(2).optional().messages({
    'number.positive': 'Maximum price must be positive',
    'number.precision': 'Maximum price must have at most 2 decimal places',
  }),
  currency: Joi.string()
    .valid('USD', 'INR', 'CNY', 'TRY')
    .optional()
    .messages({
      'any.only': 'Currency must be one of: USD, INR, CNY, TRY',
    }),
  listingType: Joi.string()
    .valid('FIXED_PRICE', 'AUCTION', 'NEGOTIABLE')
    .optional()
    .messages({
      'any.only':
        'Listing type must be one of: FIXED_PRICE, AUCTION, NEGOTIABLE',
    }),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'SOLD', 'EXPIRED')
    .optional()
    .messages({
      'any.only': 'Status must be one of: ACTIVE, INACTIVE, SOLD, EXPIRED',
    }),
  country: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Country must be at least 2 characters long',
    'string.max': 'Country must not exceed 50 characters',
  }),
  sortBy: Joi.string()
    .valid('createdAt', 'basePrice', 'title', 'updatedAt')
    .optional()
    .messages({
      'any.only': 'Sort by must be one of: createdAt, basePrice, title, updatedAt',
    }),
  sortOrder: Joi.string().valid('asc', 'desc').optional().messages({
    'any.only': 'Sort order must be either asc or desc',
  }),
});

// Watchlist validation
const addToWatchlistSchema = Joi.object({
  productId: Joi.string().min(1).required().messages({
    'string.min': 'Product ID must not be empty',
    'any.required': 'Product ID is required',
  }),
});

// User products query validation
const getUserProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),
  status: Joi.string()
    .valid('ACTIVE', 'INACTIVE', 'SOLD', 'EXPIRED')
    .optional()
    .messages({
      'any.only':
        'Status must be one of: ACTIVE, INACTIVE, SOLD, EXPIRED',
    }),
  listingType: Joi.string()
    .valid('FIXED_PRICE', 'AUCTION', 'NEGOTIABLE')
    .optional()
    .messages({
      'any.only':
        'Listing type must be one of: FIXED_PRICE, AUCTION, NEGOTIABLE',
    }),
});

// Watchlist query validation
const getWatchlistSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    'number.integer': 'Page must be an integer',
    'number.min': 'Page must be at least 1',
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    'number.integer': 'Limit must be an integer',
    'number.min': 'Limit must be at least 1',
    'number.max': 'Limit must not exceed 100',
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductsSchema,
  addToWatchlistSchema,
  getUserProductsSchema,
  getWatchlistSchema,
};
