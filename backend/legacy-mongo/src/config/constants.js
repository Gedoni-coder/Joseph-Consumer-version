/**
 * Application Constants
 * Central place for all constant values used across the application
 */

// ==========================================
// APPLICATION INFO
// ==========================================
export const APP_NAME = 'JOSEPH AI';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Family Finance & Business Management';

// ==========================================
// TRANSACTION TYPES
// ==========================================
export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit'
};

// ==========================================
// LEDGER TYPES
// ==========================================
export const LEDGER_TYPES = {
  LIFE: 'life',
  BUSINESS: 'business'
};

// ==========================================
// TRANSACTION CATEGORIES (50:30:20 Rule)
// ==========================================
export const TRANSACTION_CATEGORIES = {
  NEEDS: 'needs',
  WANTS: 'wants',
  SAVINGS: 'savings'
};

// ==========================================
// CREDIT STATUS
// ==========================================
export const CREDIT_STATUS = {
  PENDING: 'pending',       // Not yet due
  PARTIAL: 'partial',       // Partially paid
  PAID: 'paid',            // Fully paid
  OVERDUE: 'overdue'        // Past due date
};

// ==========================================
// ECONOMIC DATA TYPES
// ==========================================
export const ECONOMIC_DATA_TYPES = {
  INFLATION: 'inflation',
  FX: 'fx',
  COMMODITIES: 'commodities',
  FUEL: 'fuel',
  NEWS: 'news'
};

// ==========================================
// USER ROLES (for future use)
// ==========================================
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  FAMILY_MEMBER: 'family_member'
};

// ==========================================
// ACCOUNT CLASSIFICATION
// ==========================================
export const ACCOUNT_TYPES = {
  BUSINESS: 'business',
  PERSONAL: 'personal'
};

// ==========================================
// VARIANCE ALERT TYPES
// ==========================================
export const ALERT_TYPES = {
  BUDGET_OVERNEEDS: 'budget_overneeds',
  BUDGET_OVERWANTS: 'budget_overwants',
  RUNWAY_CRITICAL: 'runway_critical',
  RUNWAY_WARNING: 'runway_warning',
  CREDIT_ALERT: 'credit_alert',
  VELOCITY_ANOMALY: 'velocity_anomaly'
};

// ==========================================
// ALERT PRIORITIES
// ==========================================
export const ALERT_PRIORITIES = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
};

// ==========================================
// WEBHOOK PROVIDERS
// ==========================================
export const WEBHOOK_PROVIDERS = {
  MONO: 'mono',
  OKRA: 'okra',
  STITCH: 'stitch',
  CUSTOM: 'custom'
};

// ==========================================
// VARIANCE THRESHOLDS (from transactionEngine.js)
// ==========================================
export const VARIANCE_THRESHOLDS = {
  BUDGET_OVERSPEND: 0.15,        // Alert at 15% over budget
  RUNWAY_CRITICAL: 14,           // Days
  RUNWAY_WARNING: 21,            // Days
  CREDIT_OVERDUE: 3,             // Days
  VELOCITY_ANOMALY: 0.3           // 30% change in transaction velocity
};

// ==========================================
// BUDGET ALLOCATION DEFAULTS (50:30:20)
// ==========================================
export const BUDGET_ALLOCATION = {
  NEEDS: 0.5,
  WANTS: 0.3,
  SAVINGS: 0.2
};

// ==========================================
// BUSINESS REINVESTMENT DEFAULT
// ==========================================
export const REINVESTMENT_RATIO = 0.4; // 40% of business income to working capital

// ==========================================
// CACHE DURATIONS (milliseconds)
// ==========================================
export const CACHE_DURATION = {
  ECONOMIC: 3600000,      // 1 hour for economic data
  FX: 1800000,            // 30 minutes for FX rates
  COMMODITIES: 3600000,   // 1 hour for commodity prices
  NEWS: 600000            // 10 minutes for news feeds
};

// ==========================================
// PAGINATION DEFAULTS
// ==========================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// ==========================================
// HTTP STATUS CODES
// ==========================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// ==========================================
// ERROR MESSAGES
// ==========================================
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',

  // Validation errors
  VALIDATION_ERROR: 'Validation failed',
  INVALID_INPUT: 'Invalid input data',

  // Resource errors
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  CONFLICT: 'Resource conflict',

  // Server errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  DATABASE_ERROR: 'Database error occurred',

  // Business logic errors
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  INVALID_TRANSACTION_TYPE: 'Invalid transaction type',
  INVALID_LEDGER_TYPE: 'Invalid ledger type'
};

// ==========================================
// SUCCESS MESSAGES
// ==========================================
export const SUCCESS_MESSAGES = {
  // Auth
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',

  // Resources
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',

  // Transactions
  TRANSACTION_PROCESSED: 'Transaction processed successfully',
  CATEGORIZATION_CONFIRMED: 'Categorization confirmed'
};

// ==========================================
// REGEX PATTERNS
// ==========================================
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-\+\(\)]+$/,
  NG_PHONE: /^(\+234|0)[789]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ // Strong password
};

// ==========================================
// CURRENCY SYMBOLS
// ==========================================
export const CURRENCIES = {
  NGN: { symbol: '₦', code: 'NGN', name: 'Nigerian Naira' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound' },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro' }
};

// ==========================================
// DEFAULT VALUES
// ==========================================
export const DEFAULTS = {
  CURRENCY: 'NGN',
  LANGUAGE: 'en',
  PAGE_SIZE: 20,
  MONTHLY_BUDGET: 0,
  INITIAL_BALANCE: 0
};

// ==========================================
// EXPORT ALL
// ==========================================
export default {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  TRANSACTION_TYPES,
  LEDGER_TYPES,
  TRANSACTION_CATEGORIES,
  CREDIT_STATUS,
  ECONOMIC_DATA_TYPES,
  USER_ROLES,
  ACCOUNT_TYPES,
  ALERT_TYPES,
  ALERT_PRIORITIES,
  WEBHOOK_PROVIDERS,
  VARIANCE_THRESHOLDS,
  BUDGET_ALLOCATION,
  REINVESTMENT_RATIO,
  CACHE_DURATION,
  PAGINATION,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX,
  CURRENCIES,
  DEFAULTS
};

// SR
