/**
 * JOSEPH AI - API Client Service
 * Handles all HTTP requests to the backend with authentication, token refresh, and error handling
 */

// ==========================================
// CONFIGURATION
// ==========================================
const API_CONFIG = {
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  endpoints: {
    // Auth
    auth: '/auth',
    // Economic Data
    economic: '/economic',
    // Interpretation
    interpret: '/interpret',
    // Finance
    finance: '/finance',
    // Dream
    dream: '/dream',
    // Transactions (to be implemented)
    transactions: '/transactions',
    // Ledgers (to be implemented)
    ledgers: '/ledgers',
    // Credit (to be implemented)
    credit: '/credit',
    // Settings (to be implemented)
    settings: '/settings',
    // User Preferences
    preferences: '/preferences',
    // Notification Settings
    notifications: '/notifications',
    // Strategy Recommendations
    recommendations: '/recommendations',
    // Variance Alerts
    alerts: '/alerts',
    // Learning
    learning: '/learning',
    // API Configuration
    apiConfig: '/api-config',
    // Customers
    customers: '/customers',
    // Pricing
    pricing: '/pricing',
    // Procurement
    procurement: '/procurement',
    // WhatsApp
    whatsapp: '/whatsapp'
  }
};

// ==========================================
// TOKEN STORAGE
// ==========================================
const ACCESS_TOKEN_STORAGE_KEY = 'joseph_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'joseph_refresh_token';
let accessTokenInMemory = null;

function clearLegacyTokenStorage() {
  // Refresh tokens now live only in the HttpOnly cookie set by the backend.
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

clearLegacyTokenStorage();

const TokenStorage = {
  getAccessToken() {
    return accessTokenInMemory;
  },
  setAccessToken(token) {
    // Keep the access JWT in memory so a script cannot recover it after a reload.
    accessTokenInMemory = token || null;
    clearLegacyTokenStorage();
  },
  clearTokens() {
    accessTokenInMemory = null;
    clearLegacyTokenStorage();
  },
  hasTokens() {
    return !!this.getAccessToken();
  }
};

// ==========================================
// HTTP CLIENT CLASS
// ==========================================
class APIClient {
  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    // Shared in-flight refresh so simultaneous 401s do not rotate the cookie multiple times.
    this.refreshPromise = null;
  }

  /**
   * Build full URL for endpoint
   */
  buildURL(endpoint, params = {}) {
    let url = `${this.baseURL}${endpoint}`;
    if (Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      url += `?${queryString}`;
    }
    return url;
  }

  /**
   * Get authorization headers
   */
  getHeaders(includeAuth = true, contentType = 'application/json') {
    const headers = {
      'Content-Type': contentType
    };

    if (includeAuth && TokenStorage.hasTokens()) {
      headers['Authorization'] = `Bearer ${TokenStorage.getAccessToken()}`;
    }

    return headers;
  }

  /**
   * Handle response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');

    if (!response.ok) {
      const error = contentType?.includes('application/json')
        ? await response.json()
        : { message: response.statusText || 'Request failed' };

      throw new APIError(response.status, error.message || 'Request failed', error);
    }

    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  async readErrorPayload(response) {
    const contentType = response.headers.get('content-type');

    if (!contentType?.includes('application/json')) {
      return { message: response.statusText || 'Request failed' };
    }

    try {
      return await response.json();
    } catch (_error) {
      return { message: response.statusText || 'Request failed' };
    }
  }

  shouldRefreshAuth(response, errorPayload, includeAuth, skipAuthRefresh, isRefreshRequest) {
    return (
      response.status === 401 &&
      includeAuth &&
      !skipAuthRefresh &&
      !isRefreshRequest &&
      errorPayload?.code === 'TOKEN_EXPIRED'
    );
  }

  /**
   * Make HTTP request
   */
  async request(method, endpoint, options = {}) {
    const {
      params = {},
      data = null,
      includeAuth = true,
      headers = {},
      skipAuthRefresh = false
    } = options;

    const url = this.buildURL(endpoint, params);
    const isRefreshRequest = endpoint === `${API_CONFIG.endpoints.auth}/refresh`;

    if (includeAuth && !skipAuthRefresh && !isRefreshRequest && !TokenStorage.hasTokens()) {
      // After a page reload the access token is gone, but the browser may still have the refresh cookie.
      await this.refreshAccessToken({ redirectOnFailure: false });
    }

    const config = {
      method,
      headers: { ...this.getHeaders(includeAuth), ...headers },
      credentials: 'include'
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      let response = await fetch(url, config);
      let errorPayload = null;

      if (!response.ok) {
        errorPayload = await this.readErrorPayload(response.clone());
      }

      // Only TOKEN_EXPIRED gets a refresh-and-retry; invalid credentials should fail normally.
      if (this.shouldRefreshAuth(response, errorPayload, includeAuth, skipAuthRefresh, isRefreshRequest)) {
        const newToken = await this.refreshAccessToken();

        if (newToken) {
          // Retry once with the newly issued 15-minute access JWT.
          config.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, config);
        }
      }

      return await this.handleResponse(response);

    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError(0, error.message || 'Network error', { originalError: error });
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(options = {}) {
    // Share the same refresh request across all callers until it settles.
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefreshAccessToken(options);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  async performRefreshAccessToken({ redirectOnFailure = true } = {}) {
    try {
      const response = await fetch(`${this.baseURL}${API_CONFIG.endpoints.auth}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (!data.accessToken) {
        throw new Error('Token refresh response missing access token');
      }

      TokenStorage.setAccessToken(data.accessToken);

      return data.accessToken;
    } catch (error) {
      console.warn('Session refresh failed; login is required.');
      TokenStorage.clearTokens();

      if (redirectOnFailure) {
        this.clearAuthAndRedirect();
      }

      return null;
    }
  }

  /**
   * Clear auth and redirect to login
   */
  clearAuthAndRedirect() {
    TokenStorage.clearTokens();
    localStorage.removeItem('joseph_user');

    // Dispatch logout event
    window.dispatchEvent(new CustomEvent('auth:logout'));

    // Redirect to login if not already there
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = 'login.html';
    }
  }

  // ==========================================
  // HTTP METHOD SHORTCUTS
  // ==========================================

  get(endpoint, options = {}) {
    return this.request('GET', endpoint, options);
  }

  post(endpoint, options = {}) {
    return this.request('POST', endpoint, options);
  }

  put(endpoint, options = {}) {
    return this.request('PUT', endpoint, options);
  }

  patch(endpoint, options = {}) {
    return this.request('PATCH', endpoint, options);
  }

  delete(endpoint, options = {}) {
    return this.request('DELETE', endpoint, options);
  }
}

// ==========================================
// API ERROR CLASS
// ==========================================
class APIError extends Error {
  constructor(status, message, details = {}) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.details = details;
  }

  isAuthError() {
    return this.status === 401;
  }

  isValidationError() {
    return this.status === 400;
  }

  isNotFound() {
    return this.status === 404;
  }

  isServerError() {
    return this.status >= 500;
  }
}

// ==========================================
// API SERVICE INSTANCE
// ==========================================
const api = new APIClient();

// ==========================================
// AUTH API
// ==========================================
const AuthAPI = {
  extractUser(response) {
    return response?.user || response?.data?.user || response || null;
  },

  /**
   * Register new user
   */
  async register(email, password, name, phone) {
    const response = await api.post(API_CONFIG.endpoints.auth + '/register', {
      data: { email, password, name, phone },
      includeAuth: false
    });

    // Store the access token. The refresh token is stored by the backend
    // in an HttpOnly cookie and is never available to JavaScript.
    if (response.accessToken) {
      TokenStorage.setAccessToken(response.accessToken);
    }

    // Store user data for pages that check for joseph_user
    if (response.user) {
      AuthAPI.storeUser(response.user);
    }

    return response;
  },

  /**
   * Login
   */
  async login(email, password) {
    const response = await api.post(API_CONFIG.endpoints.auth + '/login', {
      data: { email, password },
      includeAuth: false
    });

    // Store the access token. The refresh token is stored by the backend
    // in an HttpOnly cookie and is never available to JavaScript.
    if (response.accessToken) {
      TokenStorage.setAccessToken(response.accessToken);
    }

    // Store user data for pages that check for joseph_user
    if (response.user) {
      AuthAPI.storeUser(response.user);
    }

    // Dispatch login event
    window.dispatchEvent(new CustomEvent('auth:login', { detail: response.user }));

    return response;
  },

  /**
   * Logout
   */
  async logout(logoutAll = false) {
    try {
      await api.post(API_CONFIG.endpoints.auth + '/logout', {
        data: { logoutAll },
        includeAuth: false,
        skipAuthRefresh: true
      });
    } catch (_error) {
      console.warn('Logout request failed; clearing local auth state.');
    } finally {
      TokenStorage.clearTokens();
      localStorage.removeItem('joseph_user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
  },

  /**
   * Restore a page-load session from the HttpOnly refresh cookie.
   */
  async restoreSession(options = {}) {
    const accessToken = await api.refreshAccessToken({
      redirectOnFailure: options.redirectOnFailure === true
    });

    if (!accessToken) {
      return null;
    }

    try {
      const user = await AuthAPI.getCurrentUser();
      if (user) {
        AuthAPI.storeUser(user);
      }
      return user;
    } catch (_error) {
      TokenStorage.clearTokens();
      localStorage.removeItem('joseph_user');
      return null;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    const response = await api.get(API_CONFIG.endpoints.auth + '/me');
    return AuthAPI.extractUser(response);
  },

  /**
   * Check if authenticated
   */
  isAuthenticated() {
    return TokenStorage.hasTokens();
  },

  /**
   * Get stored user (from localStorage)
   */
  getStoredUser() {
    const userJson = localStorage.getItem('joseph_user');
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * Store user data
   */
  storeUser(user) {
    localStorage.setItem('joseph_user', JSON.stringify(user));
  },

  /**
   * Clear user data
   */
  clearUser() {
    localStorage.removeItem('joseph_user');
  }
};

// ==========================================
// ECONOMIC DATA API
// ==========================================
const EconomicAPI = {
  /**
   * Get inflation data
   */
  async getInflation(forceRefresh = false) {
    return await api.get(API_CONFIG.endpoints.economic + '/inflation', {
      params: { refresh: forceRefresh },
      includeAuth: false
    });
  },

  /**
   * Get FX rates
   */
  async getFXRates(forceRefresh = false) {
    return await api.get(API_CONFIG.endpoints.economic + '/fx', {
      params: { refresh: forceRefresh },
      includeAuth: false
    });
  },

  /**
   * Get commodity prices
   */
  async getCommodities(forceRefresh = false) {
    return await api.get(API_CONFIG.endpoints.economic + '/commodities', {
      params: { refresh: forceRefresh },
      includeAuth: false
    });
  },

  /**
   * Get fuel prices
   */
  async getFuelPrices(forceRefresh = false) {
    return await api.get(API_CONFIG.endpoints.economic + '/fuel', {
      params: { refresh: forceRefresh },
      includeAuth: false
    });
  },

  /**
   * Get economic news
   */
  async getNews(forceRefresh = false) {
    return await api.get(API_CONFIG.endpoints.economic + '/news', {
      params: { refresh: forceRefresh },
      includeAuth: false
    });
  },

  /**
   * Get all economic data
   */
  async getAll(forceRefresh = false) {
    return await api.get(API_CONFIG.endpoints.economic + '/all', {
      params: { refresh: forceRefresh },
      includeAuth: false
    });
  },

  /**
   * Refresh all data (requires auth)
   */
  async refreshAll() {
    return await api.post(API_CONFIG.endpoints.economic + '/refresh');
  },

  /**
   * Get cache health (requires auth)
   */
  async getHealth() {
    return await api.get(API_CONFIG.endpoints.economic + '/health');
  }
};

// ==========================================
// DREAM API
// ==========================================
const DreamAPI = {
  /**
   * Get Dream module overview
   */
  async getOverview() {
    return await api.get(API_CONFIG.endpoints.dream + '/overview', {
      includeAuth: false
    });
  },

  /**
   * Get economic indicators ticker
   */
  async getTicker() {
    return await api.get(API_CONFIG.endpoints.dream + '/ticker', {
      includeAuth: false
    });
  },

  /**
   * Get quick stats
   */
  async getStats() {
    return await api.get(API_CONFIG.endpoints.dream + '/stats', {
      includeAuth: false
    });
  },

  /**
   * Get economic stress test
   */
  async getStressTest() {
    return await api.get(API_CONFIG.endpoints.dream + '/stress-test', {
      includeAuth: false
    });
  },

  /**
   * Get economic news feed
   */
  async getFeed() {
    return await api.get(API_CONFIG.endpoints.dream + '/feed', {
      includeAuth: false
    });
  },

  /**
   * Get all indicators
   */
  async getIndicators(params = {}) {
    return await api.get(API_CONFIG.endpoints.dream + '/indicators', {
      params,
      includeAuth: false
    });
  },

  /**
   * Get indicators by category
   */
  async getIndicatorsByCategory(category) {
    return await api.get(API_CONFIG.endpoints.dream + '/indicators/category/' + category, {
      includeAuth: false
    });
  },

  /**
   * Get single indicator by code
   */
  async getIndicatorByCode(code) {
    return await api.get(API_CONFIG.endpoints.dream + '/indicators/' + code, {
      includeAuth: false
    });
  },

  /**
   * Get upcoming events
   */
  async getEvents() {
    return await api.get(API_CONFIG.endpoints.dream + '/events', {
      includeAuth: false
    });
  },

  /**
   * Get single event by code
   */
  async getEventByCode(code) {
    return await api.get(API_CONFIG.endpoints.dream + '/events/' + code, {
      includeAuth: false
    });
  },

  /**
   * Get economic health score
   */
  async getHealth() {
    return await api.get(API_CONFIG.endpoints.dream + '/health', {
      includeAuth: false
    });
  }
};

// ==========================================
// INTERPRETATION API
// ==========================================
const InterpretationAPI = {
  /**
   * Get Micro Economic Interpretation (Finance data)
   */
  async getMicro() {
    return await api.get(API_CONFIG.endpoints.interpret + '/micro', {
      includeAuth: true
    });
  },

  /**
   * Get Macro Economic Interpretation (Dream data)
   */
  async getMacro() {
    return await api.get(API_CONFIG.endpoints.interpret + '/macro', {
      includeAuth: true
    });
  },

  /**
   * Get all insights
   */
  async getInsights(params = {}) {
    return await api.get(API_CONFIG.endpoints.interpret + '/insights', {
      params,
      includeAuth: true
    });
  },

  /**
   * Generate new insights
   */
  async generateInsights() {
    return await api.post(API_CONFIG.endpoints.interpret + '/generate', {});
  },

  /**
   * Get actionable insights
   */
  async getActionableInsights(params = {}) {
    return await api.get(API_CONFIG.endpoints.interpret + '/insights/actionable', {
      params,
      includeAuth: true
    });
  }
};

// ==========================================
// FINANCE API
// ==========================================
const FinanceAPI = {
  /**
   * Get Finance overview
   */
  async getOverview() {
    return await api.get(API_CONFIG.endpoints.finance + '/overview', {
      includeAuth: true
    });
  },

  /**
   * Get all ledgers
   */
  async getLedgers() {
    return await api.get(API_CONFIG.endpoints.finance + '/ledgers', {
      includeAuth: true
    });
  },

  /**
   * Get ledger by type (life or business)
   */
  async getLedgerByType(type) {
    return await api.get(API_CONFIG.endpoints.finance + '/ledgers/' + type, {
      includeAuth: true
    });
  },

  /**
   * Get budget breakdown
   */
  async getBudget(period = 'month') {
    return await api.get(API_CONFIG.endpoints.finance + '/budget', {
      params: { period },
      includeAuth: true
    });
  },

  /**
   * Set budget allocation
   */
  async setBudgetAllocation(data) {
    return await api.put(API_CONFIG.endpoints.finance + '/budget', data);
  },

  /**
   * Get runway analysis
   */
  async getRunway() {
    return await api.get(API_CONFIG.endpoints.finance + '/runway', {
      includeAuth: true
    });
  },

  /**
   * Get capital position
   */
  async getCapital() {
    return await api.get(API_CONFIG.endpoints.finance + '/capital', {
      includeAuth: true
    });
  },

  /**
   * Set capital targets
   */
  async setCapitalTargets(data) {
    return await api.put(API_CONFIG.endpoints.finance + '/capital/targets', data);
  },

  /**
   * Get credit overview
   */
  async getCreditOverview() {
    return await api.get(API_CONFIG.endpoints.finance + '/credits', {
      includeAuth: true
    });
  },

  /**
   * Get overdue credits
   */
  async getOverdueCredits() {
    return await api.get(API_CONFIG.endpoints.finance + '/credits/overdue', {
      includeAuth: true
    });
  },

  /**
   * Get upcoming credits
   */
  async getUpcomingCredits(days = 7) {
    return await api.get(API_CONFIG.endpoints.finance + '/credits/upcoming', {
      params: { days },
      includeAuth: true
    });
  },

  /**
   * Add credit payment
   */
  async addCreditPayment(creditId, payment) {
    return await api.post(API_CONFIG.endpoints.finance + '/credits/' + creditId + '/payment', payment);
  },

  /**
   * Get transactions for a ledger
   */
  async getTransactions(params = {}) {
    return await api.get(API_CONFIG.endpoints.finance + '/transactions', {
      params,
      includeAuth: true
    });
  },

  /**
   * Get financial goals for a user
   */
  async getGoals(params = {}) {
    return await api.get(API_CONFIG.endpoints.finance + '/goals', {
      params,
      includeAuth: true
    });
  }
};

// ==========================================
// STRATEGY API
// ==========================================
const StrategyAPI = {
  /**
   * Get Strategy dashboard
   */
  async getDashboard() {
    return await api.get(API_CONFIG.endpoints.strategy + '/dashboard', {
      includeAuth: true
    });
  },

  /**
   * Get pricing overview
   */
  async getPricingOverview() {
    return await api.get(API_CONFIG.endpoints.strategy + '/pricing', {
      includeAuth: true
    });
  },

  /**
   * Get product pricing details
   */
  async getProductPricing(productId) {
    return await api.get(API_CONFIG.endpoints.strategy + '/pricing/' + productId, {
      includeAuth: true
    });
  },

  /**
   * Update product price
   */
  async updateProductPrice(productId, data) {
    return await api.put(API_CONFIG.endpoints.strategy + '/pricing/' + productId, data);
  },

  /**
   * Add new product
   */
  async addProduct(data) {
    return await api.post(API_CONFIG.endpoints.strategy + '/products', data);
  },

  /**
   * Get procurement overview
   */
  async getProcurement() {
    return await api.get(API_CONFIG.endpoints.strategy + '/procurement', {
      includeAuth: true
    });
  },

  /**
   * Get supplier details
   */
  async getSupplierDetails(supplierId) {
    return await api.get(API_CONFIG.endpoints.strategy + '/suppliers/' + supplierId, {
      includeAuth: true
    });
  },

  /**
   * Add new supplier
   */
  async addSupplier(data) {
    return await api.post(API_CONFIG.endpoints.strategy + '/suppliers', data);
  },

  /**
   * Update material stock
   */
  async updateMaterialStock(materialId, data) {
    return await api.put(API_CONFIG.endpoints.strategy + '/materials/' + materialId, data);
  },

  /**
   * Get goals overview
   */
  async getGoals() {
    return await api.get(API_CONFIG.endpoints.strategy + '/goals', {
      includeAuth: true
    });
  },

  /**
   * Get goal details
   */
  async getGoalDetails(goalId) {
    return await api.get(API_CONFIG.endpoints.strategy + '/goals/' + goalId, {
      includeAuth: true
    });
  },

  /**
   * Create new goal
   */
  async createGoal(data) {
    return await api.post(API_CONFIG.endpoints.strategy + '/goals', data);
  },

  /**
   * Update goal
   */
  async updateGoal(goalId, data) {
    return await api.put(API_CONFIG.endpoints.strategy + '/goals/' + goalId, data);
  },

  /**
   * Delete goal
   */
  async deleteGoal(goalId) {
    return await api.delete(API_CONFIG.endpoints.strategy + '/goals/' + goalId);
  },

  /**
   * Add action item to goal
   */
  async addAction(goalId, data) {
    return await api.post(API_CONFIG.endpoints.strategy + '/goals/' + goalId + '/actions', data);
  },

  /**
   * Update action item
   */
  async updateAction(goalId, actionId, data) {
    return await api.put(API_CONFIG.endpoints.strategy + '/goals/' + goalId + '/actions/' + actionId, data);
  },

  /**
   * Add milestone to goal
   */
  async addMilestone(goalId, data) {
    return await api.post(API_CONFIG.endpoints.strategy + '/goals/' + goalId + '/milestones', data);
  },

  /**
   * Complete milestone
   */
  async completeMilestone(goalId, milestoneId, data) {
    return await api.put(API_CONFIG.endpoints.strategy + '/goals/' + goalId + '/milestones/' + milestoneId, data);
  }
};

// ==========================================
// USER PREFERENCES API
// ==========================================
const UserPreferencesAPI = {
  /**
   * Get user preferences
   */
  async getPreferences() {
    return await api.get(API_CONFIG.endpoints.preferences, { includeAuth: true });
  },

  /**
   * Update user preferences
   */
  async updatePreferences(data) {
    return await api.put(API_CONFIG.endpoints.preferences, { data });
  },

  /**
   * Reset preferences to defaults
   */
  async resetPreferences() {
    return await api.post(API_CONFIG.endpoints.preferences + '/reset');
  },

  /**
   * Update dark mode
   */
  async setDarkMode(enabled) {
    return await api.put(API_CONFIG.endpoints.preferences + '/dark-mode', { data: { enabled } });
  },

  /**
   * Update accent color
   */
  async setAccentColor(color) {
    return await api.put(API_CONFIG.endpoints.preferences + '/accent-color', { data: { color } });
  },

  /**
   * Update font size
   */
  async setFontSize(size) {
    return await api.put(API_CONFIG.endpoints.preferences + '/font-size', { data: { size } });
  }
};

// ==========================================
// NOTIFICATION SETTINGS API
// ==========================================
const NotificationSettingsAPI = {
  /**
   * Get notification settings
   */
  async getSettings() {
    return await api.get(API_CONFIG.endpoints.notifications, { includeAuth: true });
  },

  /**
   * Update notification settings
   */
  async updateSettings(data) {
    return await api.put(API_CONFIG.endpoints.notifications, { data });
  },

  /**
   * Toggle all notifications
   */
  async toggleAll(enabled) {
    return await api.put(API_CONFIG.endpoints.notifications + '/toggle-all', { data: { enabled } });
  },

  /**
   * Update low balance threshold
   */
  async setLowBalanceThreshold(threshold) {
    return await api.put(API_CONFIG.endpoints.notifications + '/threshold', { data: { threshold } });
  }
};

// ==========================================
// RECOMMENDATIONS API
// ==========================================
const RecommendationsAPI = {
  /**
   * Get user recommendations
   */
  async getRecommendations(filters = {}) {
    return await api.get(API_CONFIG.endpoints.recommendations, {
      params: filters,
      includeAuth: true
    });
  },

  /**
   * Get unread recommendations
   */
  async getUnread() {
    return await api.get(API_CONFIG.endpoints.recommendations + '/unread', { includeAuth: true });
  },

  /**
   * Mark recommendation as viewed
   */
  async markViewed(recommendationId) {
    return await api.put(API_CONFIG.endpoints.recommendations + '/' + recommendationId + '/view');
  },

  /**
   * Update recommendation status
   */
  async updateStatus(recommendationId, status) {
    return await api.put(API_CONFIG.endpoints.recommendations + '/' + recommendationId, { data: { status } });
  },

  /**
   * Delete recommendation
   */
  async deleteRecommendation(recommendationId) {
    return await api.delete(API_CONFIG.endpoints.recommendations + '/' + recommendationId);
  },

  /**
   * Bulk mark as viewed
   */
  async bulkMarkViewed(recommendationIds) {
    return await api.post(API_CONFIG.endpoints.recommendations + '/bulk-view', { data: { ids: recommendationIds } });
  }
};

// ==========================================
// VARIANCE ALERTS API
// ==========================================
const VarianceAlertsAPI = {
  /**
   * Get variance alerts
   */
  async getAlerts(filters = {}) {
    return await api.get(API_CONFIG.endpoints.alerts, {
      params: filters,
      includeAuth: true
    });
  },

  /**
   * Get unresolved alerts
   */
  async getUnresolved() {
    return await api.get(API_CONFIG.endpoints.alerts + '/unresolved', { includeAuth: true });
  },

  /**
   * Resolve alert
   */
  async resolveAlert(alertId) {
    return await api.put(API_CONFIG.endpoints.alerts + '/' + alertId + '/resolve');
  },

  /**
   * Bulk resolve alerts
   */
  async bulkResolve(alertIds) {
    return await api.post(API_CONFIG.endpoints.alerts + '/bulk-resolve', { data: { ids: alertIds } });
  },

  /**
   * Delete alert
   */
  async deleteAlert(alertId) {
    return await api.delete(API_CONFIG.endpoints.alerts + '/' + alertId);
  }
};

// ==========================================
// LEARNING API
// ==========================================
const LearningAPI = {
  /**
   * Get learned patterns
   */
  async getPatterns() {
    return await api.get(API_CONFIG.endpoints.learning + '/patterns', { includeAuth: true });
  },

  /**
   * Learn category pattern
   */
  async learnPattern(pattern, category) {
    return await api.post(API_CONFIG.endpoints.learning + '/patterns', {
      data: { pattern, category }
    });
  },

  /**
   * Get account classifications
   */
  async getClassifications() {
    return await api.get(API_CONFIG.endpoints.learning + '/classifications', { includeAuth: true });
  },

  /**
   * Learn account classification
   */
  async learnClassification(accountId, accountName, ledgerType) {
    return await api.post(API_CONFIG.endpoints.learning + '/classifications', {
      data: { accountId, accountName, ledgerType }
    });
  },

  /**
   * Delete pattern
   */
  async deletePattern(patternId) {
    return await api.delete(API_CONFIG.endpoints.learning + '/patterns/' + patternId);
  },

  /**
   * Reset all patterns
   */
  async resetPatterns() {
    return await api.post(API_CONFIG.endpoints.learning + '/reset');
  }
};

// ==========================================
// API CONFIGURATION API
// ==========================================
const ApiConfigAPI = {
  /**
   * Get API configuration
   */
  async getConfig() {
    return await api.get(API_CONFIG.endpoints.apiConfig, { includeAuth: true });
  },

  /**
   * Update API configuration
   */
  async updateConfig(data) {
    return await api.put(API_CONFIG.endpoints.apiConfig, { data });
  },

  /**
   * Update specific API key
   */
  async updateApiKey(keyType, apiKey) {
    return await api.put(API_CONFIG.endpoints.apiConfig + '/keys/' + keyType, { data: { apiKey } });
  },

  /**
   * Delete API key
   */
  async deleteApiKey(keyType) {
    return await api.delete(API_CONFIG.endpoints.apiConfig + '/keys/' + keyType);
  },

  /**
   * Toggle data source
   */
  async toggleDataSource(source) {
    return await api.put(API_CONFIG.endpoints.apiConfig + '/source', { data: { source } });
  }
};

// ==========================================
// CUSTOMERS API
// ==========================================
const CustomersAPI = {
  /**
   * Get all customers
   */
  async getCustomers(filters = {}) {
    return await api.get(API_CONFIG.endpoints.customers, {
      params: filters,
      includeAuth: true
    });
  },

  /**
   * Get customer by ID
   */
  async getCustomer(customerId) {
    return await api.get(API_CONFIG.endpoints.customers + '/' + customerId, { includeAuth: true });
  },

  /**
   * Create customer
   */
  async createCustomer(data) {
    return await api.post(API_CONFIG.endpoints.customers, { data });
  },

  /**
   * Update customer
   */
  async updateCustomer(customerId, data) {
    return await api.put(API_CONFIG.endpoints.customers + '/' + customerId, { data });
  },

  /**
   * Delete customer
   */
  async deleteCustomer(customerId) {
    return await api.delete(API_CONFIG.endpoints.customers + '/' + customerId);
  },

  /**
   * Search customers
   */
  async search(query) {
    return await api.get(API_CONFIG.endpoints.customers + '/search', {
      params: { q: query },
      includeAuth: true
    });
  },

  /**
   * Get customer interactions
   */
  async getInteractions(customerId) {
    return await api.get(API_CONFIG.endpoints.customers + '/' + customerId + '/interactions', { includeAuth: true });
  },

  /**
   * Create customer interaction
   */
  async createInteraction(customerId, data) {
    return await api.post(API_CONFIG.endpoints.customers + '/' + customerId + '/interactions', { data });
  },

  /**
   * Update customer stats
   */
  async updateStats(customerId, data) {
    return await api.put(API_CONFIG.endpoints.customers + '/' + customerId + '/stats', { data });
  }
};

// ==========================================
// PRICING API
// ==========================================
const PricingAPI = {
  /**
   * Get product price history
   */
  async getPriceHistory(productId) {
    return await api.get(API_CONFIG.endpoints.pricing + '/products/' + productId + '/history', { includeAuth: true });
  },

  /**
   * Record price change
   */
  async recordPriceChange(productId, data) {
    return await api.post(API_CONFIG.endpoints.pricing + '/products/' + productId + '/history', { data });
  },

  /**
   * Get competitor prices
   */
  async getCompetitorPrices(productId) {
    return await api.get(API_CONFIG.endpoints.pricing + '/products/' + productId + '/competitors', { includeAuth: true });
  },

  /**
   * Record competitor price
   */
  async recordCompetitorPrice(productId, data) {
    return await api.post(API_CONFIG.endpoints.pricing + '/products/' + productId + '/competitors', { data });
  },

  /**
   * Get price comparison
   */
  async getPriceComparison(productId) {
    return await api.get(API_CONFIG.endpoints.pricing + '/products/' + productId + '/comparison', { includeAuth: true });
  }
};

// ==========================================
// PROCUREMENT API
// ==========================================
const ProcurementAPI = {
  /**
   * Get procurement options for supplier
   */
  async getSupplierOptions(supplierId) {
    return await api.get(API_CONFIG.endpoints.procurement + '/suppliers/' + supplierId + '/options', { includeAuth: true });
  },

  /**
   * Create procurement option
   */
  async createOption(supplierId, data) {
    return await api.post(API_CONFIG.endpoints.procurement + '/suppliers/' + supplierId + '/options', { data });
  },

  /**
   * Update procurement option
   */
  async updateOption(optionId, data) {
    return await api.put(API_CONFIG.endpoints.procurement + '/options/' + optionId, { data });
  },

  /**
   * Compare procurement options
   */
  async compareOptions(materialName) {
    return await api.get(API_CONFIG.endpoints.procurement + '/compare', {
      params: { material: materialName },
      includeAuth: true
    });
  },

  /**
   * Get inventory transactions
   */
  async getInventoryTransactions(materialId) {
    return await api.get(API_CONFIG.endpoints.procurement + '/inventory/' + materialId + '/transactions', { includeAuth: true });
  },

  /**
   * Record inventory transaction
   */
  async recordInventoryTransaction(materialId, data) {
    return await api.post(API_CONFIG.endpoints.procurement + '/inventory/' + materialId + '/transactions', { data });
  },

  /**
   * Get material usage summary
   */
  async getUsageSummary(materialId, startDate, endDate) {
    return await api.get(API_CONFIG.endpoints.procurement + '/inventory/' + materialId + '/summary', {
      params: { start: startDate, end: endDate },
      includeAuth: true
    });
  }
};

// ==========================================
// WHATSAPP API
// ==========================================
const WhatsAppAPI = {
  /**
   * Generate a linking token for the authenticated user
   */
  async generateLinkToken() {
    return await api.request('POST', API_CONFIG.endpoints.whatsapp + '/link/generate', {
      includeAuth: true
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================
// For use in existing scripts
window.JosephAPI = {
  config: API_CONFIG,
  auth: AuthAPI,
  economic: EconomicAPI,
  dream: DreamAPI,
  interpret: InterpretationAPI,
  finance: FinanceAPI,
  strategy: StrategyAPI,
  preferences: UserPreferencesAPI,
  notifications: NotificationSettingsAPI,
  recommendations: RecommendationsAPI,
  alerts: VarianceAlertsAPI,
  learning: LearningAPI,
  apiConfig: ApiConfigAPI,
  customers: CustomersAPI,
  pricing: PricingAPI,
  procurement: ProcurementAPI,
  whatsapp: WhatsAppAPI,
  api,
  APIError,
  TokenStorage
};

// For ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_CONFIG,
    api,
    AuthAPI,
    EconomicAPI,
    DreamAPI,
    InterpretationAPI,
    FinanceAPI,
    StrategyAPI,
    UserPreferencesAPI,
    NotificationSettingsAPI,
    RecommendationsAPI,
    VarianceAlertsAPI,
    LearningAPI,
    ApiConfigAPI,
    CustomersAPI,
    PricingAPI,
    ProcurementAPI,
    WhatsAppAPI,
    APIError,
    TokenStorage
  };
}

// Global WhatsApp redirect handler
window.openWhatsAppBot = async function() {
  try {
    const response = await window.JosephAPI.whatsapp.generateLinkToken();
    if (response && response.success) {
      const token = response.data.token;
      const botPhone = '2347073735341'; // JOSEPH AI bot number
      const waUrl = `https://wa.me/${botPhone}?text=${token}`;
      window.open(waUrl, '_blank');
    } else {
      // Fallback to settings page if token generation fails (e.g. unauthenticated)
      window.location.href = 'settings.html#whatsapp';
    }
  } catch (error) {
    console.error('Failed to generate WhatsApp link:', error);
    window.location.href = 'settings.html#whatsapp';
  }
};

console.log('✅ Joseph API Client loaded');
