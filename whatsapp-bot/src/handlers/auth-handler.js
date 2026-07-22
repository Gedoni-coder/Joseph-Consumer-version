/**
 * Authentication Handler
 * Manages user authentication and session linking for WhatsApp
 */

import { apiClient } from '../utils/api-client.js';
import { logger } from '../utils/logger.js';

const authLogger = logger.forContext('Auth');

// ==========================================
// USER SESSION STORE
// ==========================================
const userSessions = new Map(); // phoneNumber -> { userId, name, email, verifiedAt }

// ==========================================
// AUTHENTICATION STATES
// ==========================================
const AuthStates = {
  UNAUTHENTICATED: 'unauthenticated',
  PHONE_VERIFIED: 'phone_verified',
  OTP_SENT: 'otp_sent',
  AUTHENTICATED: 'authenticated'
};

// ==========================================
// AUTHENTICATION FLOW
// ==========================================

/**
 * Handle incoming authentication request
 * @param {string} phoneNumber - User's phone number
 * @param {string} userName - User's name (optional)
 */
export async function handleAuthRequest(phoneNumber, userName = null) {
  authLogger.info('Auth request received', { phoneNumber, userName });

  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    // Check if user exists in backend
    const user = await apiClient.getUserByPhone(normalizedPhone);

    if (user && user.success) {
      // User exists, send OTP
      await sendOTP(normalizedPhone);

      return {
        success: true,
        state: AuthStates.OTP_SENT,
        message: `Welcome back, ${userName || user.data.name || 'User'}! 👋\n\n` +
                 `I found your JOSEPH AI account linked to ${normalizedPhone}.\n\n` +
                 `📱 *Sending you a verification code now...*`,
        user: user.data,
        nextStep: 'verify_otp'
      };
    } else {
      // New user - guide to signup
      return {
        success: false,
        state: AuthStates.UNAUTHENTICATED,
        message: `👋 Welcome to JOSEPH AI!\n\n` +
                 `I don't see an account linked to ${normalizedPhone}.\n\n` +
                 `To get started:\n` +
                 `1. Visit our app to create an account\n` +
                 `2. Link your phone number in settings\n` +
                 `3. Come back here!\n\n` +
                 `Or visit: https://josephai.com/signup`,
        nextStep: 'signup_required'
      };
    }
  } catch (error) {
    authLogger.error('Auth request failed', {
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      state: AuthStates.UNAUTHENTICATED,
      message: `❌ Sorry, I couldn't verify your account.\n\n` +
               `Please try again later or contact support.`,
      error: error.message
    };
  }
}

/**
 * Send OTP to user's phone
 * @param {string} phoneNumber - Normalized phone number
 */
async function sendOTP(phoneNumber) {
  try {
    const result = await apiClient.sendOTP(phoneNumber);

    if (result.success) {
      authLogger.info('OTP sent successfully', { phoneNumber });
      return { success: true, otpExpiry: result.expiresIn };
    } else {
      throw new Error(result.message || 'Failed to send OTP');
    }
  } catch (error) {
    authLogger.error('Send OTP failed', { phoneNumber, error: error.message });
    throw error;
  }
}

/**
 * Verify OTP code
 * @param {string} phoneNumber - User's phone number
 * @param {string} code - OTP code
 */
export async function verifyOTP(phoneNumber, code) {
  authLogger.info('OTP verification requested', { phoneNumber });

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const result = await apiClient.verifyOTP(normalizedPhone, code);

    if (result.success && result.data) {
      // Store user session
      const session = {
        userId: result.data.id,
        name: result.data.name,
        email: result.data.email,
        phone: normalizedPhone,
        verifiedAt: new Date().toISOString(),
        preferences: result.data.preferences || {}
      };

      userSessions.set(normalizedPhone, session);

      authLogger.info('User authenticated successfully', {
        phoneNumber: normalizedPhone,
        userId: session.userId
      });

      return {
        success: true,
        state: AuthStates.AUTHENTICATED,
        message: `✅ *Verified successfully!*\n\n` +
                 `Welcome back, ${session.name}! 🎉\n\n` +
                 `I'm now connected to your JOSEPH AI account.\n\n` +
                 `Here's what I can help you with:\n` +
                 `💰 Check your balance and budget\n` +
                 `📊 View business performance\n` +
                 `🎯 Track goal progress\n` +
                 `📰 Get economic updates\n` +
                 `💡 Receive personalized insights\n\n` +
                 `Type /help to see all commands.`,
        user: session,
        nextStep: 'ready'
      };
    } else {
      return {
        success: false,
        state: AuthStates.PHONE_VERIFIED,
        message: `❌ Invalid verification code.\n\n` +
                 `Please check and try again.`,
        nextStep: 'retry_otp'
      };
    }
  } catch (error) {
    authLogger.error('OTP verification failed', {
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      state: AuthStates.OTP_SENT,
      message: `❌ Verification failed.\n\n` +
               `${error.message}\n\n` +
               `Please try again.`,
      error: error.message
    };
  }
}

/**
 * Handle a link token request
 * @param {string} phoneNumber - User's phone number
 * @param {string} token - The link token
 */
export async function handleLinkRequest(phoneNumber, token) {
  authLogger.info('Link token verification requested', { phoneNumber, token });

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const result = await apiClient.verifyLinkToken(normalizedPhone, token);

    if (result.success && result.data) {
      // Store user session
      const session = {
        userId: result.data.id,
        name: result.data.name,
        email: result.data.email,
        phone: normalizedPhone,
        verifiedAt: new Date().toISOString(),
        preferences: result.data.preferences || {}
      };

      userSessions.set(normalizedPhone, session);

      authLogger.info('User linked and authenticated successfully', {
        phoneNumber: normalizedPhone,
        userId: session.userId
      });

      return {
        success: true,
        state: AuthStates.AUTHENTICATED,
        message: `✅ *Account Linked Successfully!*\n\n` +
                 `Welcome, ${session.name || 'User'}! 🎉\n\n` +
                 `I'm your JOSEPH AI personal assistant, now connected to your account.\n\n` +
                 `Here's what I can help you with:\n` +
                 `💰 Check your balance and budget\n` +
                 `📊 View business performance\n` +
                 `🎯 Track goal progress\n` +
                 `📰 Get economic updates\n` +
                 `💡 Receive personalized insights\n\n` +
                 `Type /help to see all commands or just ask me a question!`,
        user: session,
        nextStep: 'ready'
      };
    } else {
      return {
        success: false,
        state: AuthStates.UNAUTHENTICATED,
        message: `❌ Invalid or expired linking token.\n\n` +
                 `Please generate a new link from your JOSEPH AI dashboard settings.`,
        nextStep: 'link_failed'
      };
    }
  } catch (error) {
    authLogger.error('Link token verification failed', {
      phoneNumber,
      error: error.message
    });

    return {
      success: false,
      state: AuthStates.UNAUTHENTICATED,
      message: `❌ Linking failed.\n\n` +
               `Please generate a new link from your dashboard and try again.`,
      error: error.message
    };
  }
}

/**
 * Get user session by phone number
 * @param {string} phoneNumber - User's phone number
 */
export function getUserSession(phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  return userSessions.get(normalizedPhone);
}

/**
 * Check if user is authenticated
 * @param {string} phoneNumber - User's phone number
 */
export function isAuthenticated(phoneNumber) {
  const session = getUserSession(phoneNumber);
  return session !== undefined;
}

/**
 * Invalidate user session (logout)
 * @param {string} phoneNumber - User's phone number
 */
export function invalidateSession(phoneNumber) {
  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  userSessions.delete(normalizedPhone);
  authLogger.info('Session invalidated', { phoneNumber: normalizedPhone });
}

/**
 * Get all active sessions
 */
export function getAllSessions() {
  return Array.from(userSessions.entries()).map(([phone, session]) => ({
    phone,
    userId: session.userId,
    name: session.name,
    verifiedAt: session.verifiedAt
  }));
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Normalize phone number to standard format
 * @param {string} phone - Phone number in any format
 */
function normalizePhoneNumber(phone) {
  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Add country code if missing (default to Nigeria +234)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = '234' + digits.substring(1);
  } else if (digits.length === 10) {
    digits = '234' + digits;
  }

  // Format as +XXX XXX XXX XXX
  return '+' + digits;
}

/**
 * Format phone number for display
 * @param {string} phone - Normalized phone number
 */
export function formatPhoneNumberDisplay(phone) {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('234') && digits.length === 13) {
    // Nigerian format: +234 XXX XXX XXXX
    return `+234 ${digits.substring(3, 6)} ${digits.substring(6, 9)} ${digits.substring(9)}`;
  }

  return phone;
}

// Export auth states
export { AuthStates };
