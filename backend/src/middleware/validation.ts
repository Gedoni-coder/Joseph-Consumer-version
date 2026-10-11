/**
 * Validation Middleware
 * Input validation using Joi
 */

import Joi from 'joi';
import { HTTP_STATUS, ERROR_MESSAGES, REGEX, TRANSACTION_TYPES, LEDGER_TYPES, TRANSACTION_CATEGORIES, CREDIT_STATUS } from '../config/constants';

// ==========================================
// JOI VALIDATION SCHEMAS
// ==========================================

// Auth schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  name: Joi.string().min(2).max(100).trim().required().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  phone: Joi.string().pattern(REGEX.PHONE).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number'
  })
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required'
  })
});

// Transaction schemas
const createTransactionSchema = Joi.object({
  type: Joi.string().valid(...Object.values(TRANSACTION_TYPES)).required(),
  amount: Joi.number().positive().precision(2).required(),
  currency: Joi.string().valid('NGN', 'USD', 'GBP', 'EUR').optional(),
  narration: Joi.string().max(500).optional(),
  description: Joi.string().max(1000).optional(),
  timestamp: Joi.date().iso().optional(),
  accountId: Joi.string().optional(),
  accountName: Joi.string().optional(),
  merchant: Joi.string().optional(),
  ledger: Joi.string().valid(...Object.values(LEDGER_TYPES)).required(),
  category: Joi.string().valid(...Object.values(TRANSACTION_CATEGORIES), null).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(1000).optional(),
  externalId: Joi.string().optional()
});

const updateTransactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).optional(),
  narration: Joi.string().max(500).optional(),
  description: Joi.string().max(1000).optional(),
  ledger: Joi.string().valid(...Object.values(LEDGER_TYPES)).optional(),
  category: Joi.string().valid(...Object.values(TRANSACTION_CATEGORIES), null).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  notes: Joi.string().max(1000).optional()
}).min(1);

const confirmCategorySchema = Joi.object({
  category: Joi.string().valid(...Object.values(TRANSACTION_CATEGORIES)).required()
});

// Ledger schemas
const updateLedgerSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  monthlyBudget: Joi.number().min(0).optional(),
  budgetAllocation: Joi.object({
    needs: Joi.number().min(0).max(1).optional(),
    wants: Joi.number().min(0).max(1).optional(),
    savings: Joi.number().min(0).max(1).optional()
  }).optional(),
  reinvestmentRatio: Joi.number().min(0).max(1).optional(),
  workingCapitalTarget: Joi.number().min(0).optional()
}).min(1);

// Credit schemas
const createCreditSchema = Joi.object({
  transactionId: Joi.string().optional(),
  customerName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(REGEX.PHONE).optional(),
  email: Joi.string().email().optional(),
  totalCredit: Joi.number().positive().precision(2).required(),
  dueDate: Joi.date().iso().required(),
  creditPeriod: Joi.number().min(1).optional(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().optional(),
    unitPrice: Joi.number().min(0).optional()
  })).optional(),
  notes: Joi.string().max(1000).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional()
});

const addPaymentSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  method: Joi.string().valid('cash', 'transfer', 'pos', 'other').required(),
  reference: Joi.string().optional(),
  notes: Joi.string().optional()
});

const updateCreditSchema = Joi.object({
  customerName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(REGEX.PHONE).optional(),
  email: Joi.string().email().optional(),
  dueDate: Joi.date().iso().optional(),
  status: Joi.string().valid(...Object.values(CREDIT_STATUS)).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  notes: Joi.string().max(1000).optional()
}).min(1);

// Settings schemas
const updateSettingsSchema = Joi.object({
  preferences: Joi.object({
    currency: Joi.string().valid('NGN', 'USD', 'GBP', 'EUR').optional(),
    language: Joi.string().optional(),
    notifications: Joi.object({
      email: Joi.boolean().optional(),
      alerts: Joi.boolean().optional(),
      marketing: Joi.boolean().optional()
    }).optional(),
    budget: Joi.object({
      enabled: Joi.boolean().optional(),
      monthlyAmount: Joi.number().min(0).optional(),
      allocation: Joi.object({
        needs: Joi.number().min(0).max(1).optional(),
        wants: Joi.number().min(0).max(1).optional(),
        savings: Joi.number().min(0).max(1).optional()
      }).optional()
    }).optional()
  }).optional(),
  businessSettings: Joi.object({
    reinvestmentRatio: Joi.number().min(0).max(1).optional(),
    workingCapitalTarget: Joi.number().min(0).optional()
  }).optional()
}).min(1);

const saveApiKeySchema = Joi.object({
  service: Joi.string().valid('newsAPI', 'tradingEconomics', 'fmdq').required(),
  apiKey: Joi.string().required()
});

// Pagination and filtering
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').default('desc')
});

const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional()
});

// ==========================================
// VALIDATION FACTORY
// Creates middleware from schema
// ==========================================
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors, not just first
      stripUnknown: true, // Remove unknown properties
      convert: true // Convert types
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Request validation failed',
        details: errors
      });
    }

    // Replace request property with sanitized value
    req[property] = value;
    next();
  };
};

// ==========================================
// COMMON VALIDATION MIDDLEWARE
// ==========================================

// Auth validation
export const validateRegister = validate(registerSchema);
export const validateLogin = validate(loginSchema);
export const validateRefreshToken = validate(refreshTokenSchema);
export const validateLogout = validate(Joi.object({
  logoutAll: Joi.boolean().default(false),
  refreshToken: Joi.when('logoutAll', {
    is: true, then: Joi.string().optional(), otherwise: Joi.string().required()
  })
}));
export const validateChangePassword = validate(Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: registerSchema.extract('password')
}));
export const validateResetPassword = validate(Joi.object({
  token: Joi.string().hex().length(64).required(),
  newPassword: registerSchema.extract('password')
}));
export const validateResetRequest = validate(Joi.object({
  email: Joi.string().email().required()
}));

// Transaction validation
export const validateCreateTransaction = validate(createTransactionSchema);
export const validateUpdateTransaction = validate(updateTransactionSchema);
export const validateConfirmCategory = validate(confirmCategorySchema);

// Ledger validation
export const validateUpdateLedger = validate(updateLedgerSchema);

// Credit validation
export const validateCreateCredit = validate(createCreditSchema);
export const validateAddPayment = validate(addPaymentSchema);
export const validateUpdateCredit = validate(updateCreditSchema);

// Settings validation
export const validateUpdateSettings = validate(updateSettingsSchema);
export const validateSaveApiKey = validate(saveApiKeySchema);

// Pagination and filtering
export const validatePagination = (req, res, next) => {
  const { error, value } = paginationSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Pagination parameters invalid',
      details: error.details.map(d => d.message)
    });
  }

  req.pagination = {
    page: value.page,
    limit: value.limit,
    skip: (value.page - 1) * value.limit,
    sort: value.sort || 'createdAt',
    order: value.order
  };

  next();
};

export const validateDateRange = (req, res, next) => {
  const { error, value } = dateRangeSchema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: ERROR_MESSAGES.VALIDATION_ERROR,
      message: 'Date range parameters invalid',
      details: error.details.map(d => d.message)
    });
  }

  req.dateRange = {
    startDate: value.startDate ? new Date(value.startDate) : null,
    endDate: value.endDate ? new Date(value.endDate) : null
  };

  next();
};

// ==========================================
// CUSTOM VALIDATORS
// ==========================================

// Validate ObjectId
export const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// ObjectId validation middleware
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!isValidObjectId(id)) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: ERROR_MESSAGES.INVALID_INPUT,
        message: `Invalid ${paramName} format`
      });
    }
    next();
  };
};

// ==========================================
// EXPORTS
// ==========================================
export default {
  validate,
  validateRegister,
  validateLogin,
  validateRefreshToken,
  validateCreateTransaction,
  validateUpdateTransaction,
  validateConfirmCategory,
  validateUpdateLedger,
  validateCreateCredit,
  validateAddPayment,
  validateUpdateCredit,
  validateUpdateSettings,
  validateSaveApiKey,
  validatePagination,
  validateDateRange,
  validateObjectId,
  isValidObjectId
};
