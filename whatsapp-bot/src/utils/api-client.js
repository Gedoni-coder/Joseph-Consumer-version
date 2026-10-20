/**
 * Backend API Client
 * Handles communication with JOSEPH AI backend
 */

import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from './logger.js';

const apiLogger = logger.forContext('API');

// ==========================================
// API CLIENT CLASS
// ==========================================
class BackendAPIClient {
  constructor() {
    this.baseURL = config.backend.apiUrl;
    this.timeout = config.backend.timeout;
    this.apiKey = config.backend.apiKey;

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.apiKey) {
          config.headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        apiLogger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        apiLogger.error('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        apiLogger.debug(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;
        apiLogger.error('API Response Error', { status, message });
        return Promise.reject(error);
      }
    );
  }

  // ==========================================
  // AUTHENTICATION ENDPOINTS
  // ==========================================

  /**
   * Verify phone number and get user info
   */
  async verifyUser(phoneNumber) {
    try {
      const response = await this.client.post('/auth/verify-phone', {
        phoneNumber
      });
      return response.data;
    } catch (error) {
      apiLogger.error('User verification failed', {
        phoneNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send OTP for verification
   */
  async sendOTP(phoneNumber) {
    try {
      const response = await this.client.post('/auth/send-otp', {
        phoneNumber,
        channel: 'whatsapp'
      });
      return response.data;
    } catch (error) {
      apiLogger.error('OTP send failed', { phoneNumber, error: error.message });
      throw error;
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phoneNumber, code) {
    try {
      const response = await this.client.post('/auth/verify-otp', {
        phoneNumber,
        code
      });
      return response.data;
    } catch (error) {
      apiLogger.error('OTP verification failed', {
        phoneNumber,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Verify a link token
   */
  async verifyLinkToken(phoneNumber, token) {
    try {
      const response = await this.client.post('/auth/verify-link-token', {
        phone: phoneNumber,
        token
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Link token verification failed', {
        phoneNumber,
        token,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user by phone number (for already authenticated users)
   */
  async getUserByPhone(phoneNumber) {
    try {
      const response = await this.client.get('/auth/user/phone', {
        params: { phone: phoneNumber }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get user by phone failed', {
        phoneNumber,
        error: error.message
      });
      return null;
    }
  }

  // ==========================================
  // FINANCE ENDPOINTS
  // ==========================================

  /**
   * Get user's ledgers
   */
  async getLedgers(userId) {
    try {
      const response = await this.client.get('/finance/ledgers', {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get ledgers failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get budget breakdown
   */
  async getBudget(userId, period = 'month') {
    try {
      const response = await this.client.get('/finance/budget', {
        params: { period },
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get budget failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get runway analysis
   */
  async getRunway(userId) {
    try {
      const response = await this.client.get('/finance/runway', {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get runway failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get credit overview
   */
  async getCredits(userId) {
    try {
      const response = await this.client.get('/finance/credits', {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get credits failed', { userId, error: error.message });
      throw error;
    }
  }

  // ==========================================
  // STRATEGY ENDPOINTS
  // ==========================================

  /**
   * Get pricing overview
   */
  async getPricing(userId) {
    try {
      const response = await this.client.get('/strategy/pricing', {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get pricing failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get goals
   */
  async getGoals(userId) {
    try {
      const response = await this.client.get('/strategy/goals', {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get goals failed', { userId, error: error.message });
      throw error;
    }
  }

  // ==========================================
  // DREAM ENDPOINTS
  // ==========================================

  /**
   * Get economic indicators ticker
   */
  async getEconomicTicker() {
    try {
      const response = await this.client.get('/dream/ticker');
      return response.data;
    } catch (error) {
      apiLogger.error('Get economic ticker failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get quick stats
   */
  async getQuickStats() {
    try {
      const response = await this.client.get('/dream/stats');
      return response.data;
    } catch (error) {
      apiLogger.error('Get quick stats failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get economic news
   */
  async getEconomicNews(limit = 5) {
    try {
      const response = await this.client.get('/dream/feed', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get economic news failed', { error: error.message });
      throw error;
    }
  }

  // ==========================================
  // INTERPRETATION ENDPOINTS
  // ==========================================

  /**
   * Get user insights
   */
  async getInsights(userId, severity = null) {
    try {
      const params = {};
      if (severity) params.severity = severity;

      const response = await this.client.get('/interpret/insights', {
        params,
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get insights failed', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Get actionable insights
   */
  async getActionableInsights(userId) {
    try {
      const response = await this.client.get('/interpret/insights/actionable', {
        headers: { 'X-User-Id': userId }
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Get actionable insights failed', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  /**
   * Check backend health
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      apiLogger.error('Health check failed', { error: error.message });
      return null;
    }
  }
}

// Create and export singleton instance
export const apiClient = new BackendAPIClient();

export default apiClient;

// SR
