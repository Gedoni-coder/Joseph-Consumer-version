/**
 * WhatsApp Bot Routes
 * Endpoints specifically for the WhatsApp bot integration
 * Migrated to Prisma
 */

import express from 'express';
import crypto from 'crypto';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

const router = express.Router();

// ==========================================
// WHATSAPP AUTHENTICATION ENDPOINTS
// These endpoints allow the WhatsApp bot to authenticate users
// via phone number without traditional email/password,
// or via unique LINK tokens.
// ==========================================

/**
 * @route   POST /api/whatsapp/link/generate
 * @desc    Generate a unique WhatsApp linking token for the authenticated user
 * @access  Private
 */
router.post('/link/generate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate a secure random token
    const token = 'LINK_' + crypto.randomBytes(8).toString('hex').toUpperCase();
    
    // Token expires in 15 minutes
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Save token to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        whatsappLinkToken: token,
        whatsappLinkTokenExpiry: expiry
      }
    });

    res.json({
      success: true,
      data: {
        token,
        expiresAt: expiry
      }
    });

  } catch (error) {
    console.error('WhatsApp link generate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate link token',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/whatsapp/auth/verify-link-token
 * @desc    Verify a WhatsApp link token and return user data
 * @access  Public (used by WhatsApp bot)
 * @body    { phone: string, token: string }
 */
router.post('/auth/verify-link-token', async (req, res) => {
  try {
    const { phone, token } = req.body;

    if (!phone || !token) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and token are required'
      });
    }

    const { generateAccessToken, generateRefreshToken } = await import('../config/jwt.js');

    // Normalize phone number (bot might send varying formats)
    const normalizedPhone = phone.replace(/\D/g, '');
    let finalPhone = normalizedPhone;
    if (normalizedPhone.length === 11 && normalizedPhone.startsWith('0')) {
        finalPhone = '234' + normalizedPhone.substring(1);
    } else if (normalizedPhone.length === 10) {
        finalPhone = '234' + normalizedPhone;
    }

    // Find user by token
    const user = await prisma.user.findUnique({
      where: { whatsappLinkToken: token },
      include: { preferences: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid linking token'
      });
    }

    // Check expiry
    if (!user.whatsappLinkTokenExpiry || user.whatsappLinkTokenExpiry < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Linking token has expired'
      });
    }

    // Update user's phone number if it's different/empty, and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: '+' + finalPhone, // Store in E.164 format
        whatsappLinkToken: null,
        whatsappLinkTokenExpiry: null
      }
    });

    // Generate tokens (bot might not need these for its own session, but good to have)
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Add refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({
      success: true,
      message: 'Token verified successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: '+' + finalPhone,
        preferences: user.preferences,
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes
      }
    });

  } catch (error) {
    console.error('WhatsApp verify-link-token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/whatsapp/auth/verify-phone
 * @desc    Check if a phone number is registered with a user account
 * @access  Public (used by WhatsApp bot)
 * @body    { phone: string } - Phone number in E.164 format
 */
router.post('/auth/verify-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\D/g, '');

    // Find user by phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: `+${normalizedPhone}` }
        ]
      },
      include: {
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number',
        exists: false
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive',
        exists: true
      });
    }

    res.json({
      success: true,
      message: 'Phone number found',
      exists: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('WhatsApp verify-phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone number',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/whatsapp/auth/send-otp
 * @desc    Send OTP code via WhatsApp (or SMS fallback)
 * @access  Public (used by WhatsApp bot)
 * @body    { phone: string, channel: string }
 */
router.post('/auth/send-otp', async (req, res) => {
  try {
    const { phone, channel = 'whatsapp' } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    // Find user by phone
    const normalizedPhone = phone.replace(/\D/g, '');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: `+${normalizedPhone}` }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number'
      });
    }

    // Generate OTP (6-digit code)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (5 minutes)
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to user document
    await prisma.user.update({
      where: { id: user.id },
      data: {
        whatsappOTP: otp,
        whatsappOTPExpiry: otpExpiry
      }
    });

    // In production, send actual OTP via WhatsApp Business API or SMS
    // For now, we'll log it (development only!)
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                 DEVELOPMENT MODE - OTP LOG               ║');
    console.log('╠════════════════════════════════════════════════════════════╣');
    console.log(`║  Phone: ${phone.padEnd(52)}║`);
    console.log(`║  OTP: ${otp.padEnd(54)}║`);
    console.log(`║  Expires: ${otpExpiry.toISOString().padEnd(47)}║`);
    console.log('╚════════════════════════════════════════════════════════════╝');

    if (channel === 'whatsapp') {
      // TODO: Implement WhatsApp Business API call
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: 300 // 5 minutes
    });

  } catch (error) {
    console.error('WhatsApp send-otp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/whatsapp/auth/verify-otp
 * @desc    Verify OTP code and return user data with auth token
 * @access  Public (used by WhatsApp bot)
 * @body    { phone: string, code: string }
 */
router.post('/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP code are required'
      });
    }

    const { generateAccessToken, generateRefreshToken } = await import('../config/jwt.js');

    // Find user by phone
    const normalizedPhone = phone.replace(/\D/g, '');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: `+${normalizedPhone}` }
        ]
      },
      include: {
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number'
      });
    }

    // Check OTP
    if (!user.whatsappOTP || user.whatsappOTP !== code) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP code'
      });
    }

    // Check OTP expiry
    if (user.whatsappOTPExpiry < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'OTP code has expired'
      });
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: {
        whatsappOTP: null,
        whatsappOTPExpiry: null
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Add refresh token to user's tokens using Prisma RefreshToken model
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences,
        accessToken,
        refreshToken,
        expiresIn: 900 // 15 minutes
      }
    });

  } catch (error) {
    console.error('WhatsApp verify-otp error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
});

// ==========================================
// WHATSAPP USER ENDPOINTS
// Endpoints for WhatsApp bot to fetch user data
// ==========================================

/**
 * @route   GET /api/whatsapp/user/phone
 * @desc    Get user by phone number (internal use by bot)
 * @access  Public (used by WhatsApp bot with API key)
 * @query   phone - Phone number to lookup
 */
router.get('/user/phone', async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required'
      });
    }

    const normalizedPhone = phone.replace(/\D/g, '');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          { phone: `+${normalizedPhone}` }
        ]
      },
      include: {
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        preferences: user.preferences,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('WhatsApp get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// ==========================================
// WHATSAPP HEALTH CHECK
// ==========================================

/**
 * @route   GET /api/whatsapp/health
 * @desc    Check WhatsApp bot integration health
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'JOSEPH AI WhatsApp Integration (Prisma)',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      verifyPhone: 'POST /auth/verify-phone',
      sendOTP: 'POST /auth/send-otp',
      verifyOTP: 'POST /auth/verify-otp',
      verifyLinkToken: 'POST /auth/verify-link-token',
      generateLink: 'POST /link/generate',
      getUser: 'GET /user/phone'
    }
  });
});

export default router;

// SR
