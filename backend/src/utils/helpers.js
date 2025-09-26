const crypto = require('crypto');
const { logger } = require('./logger');

/**
 * Generate a random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate a random number
 */
const generateRandomNumber = (min = 100000, max = 999999) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate a slug from text
 */
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
const formatDate = (date, locale = 'en-US', options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, {
    ...defaultOptions,
    ...options,
  }).format(new Date(date));
};

/**
 * Format relative time
 */
const formatRelativeTime = (date, locale = 'en-US') => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }

  return formatDate(date, locale);
};

/**
 * Calculate pagination
 */
const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const perPage = parseInt(limit) || 20;
  const totalPages = Math.ceil(total / perPage);
  const offset = (currentPage - 1) * perPage;

  return {
    page: currentPage,
    limit: perPage,
    total,
    pages: totalPages,
    offset,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

/**
 * Sanitize HTML
 */
const sanitizeHtml = (html) => {
  // Basic HTML sanitization
  // In production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi, '')
    .replace(/<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi, '');
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Generate hash
 */
const generateHash = (data, algorithm = 'sha256') => {
  return crypto.createHash(algorithm).update(data).digest('hex');
};

/**
 * Generate HMAC
 */
const generateHmac = (data, secret, algorithm = 'sha256') => {
  return crypto.createHmac(algorithm, secret).update(data).digest('hex');
};

/**
 * Compare strings securely
 */
const secureCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
};

/**
 * Generate UUID v4
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Sleep function
 */
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Retry function
 */
const retry = async (fn, maxAttempts = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      logger.warn(
        `Attempt ${attempt} failed, retrying in ${delay}ms:`,
        error.message
      );
      await sleep(delay);
    }
  }
};

/**
 * Debounce function
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep clone object
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map((item) => deepClone(item));
  }

  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Merge objects deeply
 */
const deepMerge = (target, source) => {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
};

/**
 * Get nested property value
 */
const getNestedProperty = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (
      result === null ||
      result === undefined ||
      !Object.prototype.hasOwnProperty.call(result, key)
    ) {
      return defaultValue;
    }
    result = result[key];
  }

  return result;
};

/**
 * Set nested property value
 */
const setNestedProperty = (obj, path, value) => {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = obj;

  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
};

/**
 * Remove undefined values from object
 */
const removeUndefined = (obj) => {
  const result = {};

  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== undefined
    ) {
      result[key] = obj[key];
    }
  }

  return result;
};

/**
 * Convert object to query string
 */
const objectToQueryString = (obj) => {
  const params = new URLSearchParams();

  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== undefined &&
      obj[key] !== null
    ) {
      params.append(key, obj[key]);
    }
  }

  return params.toString();
};

/**
 * Parse query string to object
 */
const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString);
  const result = {};

  for (const [key, value] of params) {
    result[key] = value;
  }

  return result;
};

module.exports = {
  generateRandomString,
  generateRandomNumber,
  generateSlug,
  formatCurrency,
  formatDate,
  formatRelativeTime,
  calculatePagination,
  sanitizeHtml,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  generateHash,
  generateHmac,
  secureCompare,
  generateUUID,
  sleep,
  retry,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  getNestedProperty,
  setNestedProperty,
  removeUndefined,
  objectToQueryString,
  parseQueryString,
};
