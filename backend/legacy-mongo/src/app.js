/**
 * Express Application Setup
 * Configures middleware, security, routes, and error handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import economicRoutes from './routes/economic.js';
import dreamRoutes from './routes/dream.js';
import interpretationRoutes from './routes/interpretation.js';
import financeRoutes from './routes/finance.js';
import strategyRoutes from './routes/strategy.js';
import adminRoutes from './routes/admin.js';
import whatsappRoutes from './routes/whatsapp.js';
import preferencesRoutes from './routes/preferences.js';
import notificationsRoutes from './routes/notifications.js';

// ==========================================
// CREATE EXPRESS APP
// ==========================================
const app = express();

// ==========================================
// TRUST PROXY (for reverse proxy)
// ==========================================
app.set('trust proxy', 1);

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'];
    const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : defaultOrigins;
    
    // Quick check for any localhost origin
    if (origin && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting to all routes
app.use('/api', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    error: 'Too many auth attempts, please try again later.',
    retryAfter: 900
  }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ==========================================
// BODY PARSING MIDDLEWARE
// ==========================================

// Parse JSON bodies
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    // Verify request body integrity
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON');
    }
  }
}));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==========================================
// REQUEST LOGGING
// ==========================================
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('  Body:', JSON.stringify(req.body).substring(0, 100));
    }
    next();
  });
}

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ==========================================
// API ROUTES
// (Will be imported when routes are created)
// ==========================================

// Auth routes
app.use('/api/auth', authRoutes);

// Transaction routes
// app.use('/api/transactions', transactionRoutes);

// Ledger routes
// app.use('/api/ledgers', ledgerRoutes);

// Credit routes
// app.use('/api/credit', creditRoutes);

// Economic data routes
app.use('/api/economic', economicRoutes);

// Dream module routes
app.use('/api/dream', dreamRoutes);

// Interpretation module routes
app.use('/api/interpret', interpretationRoutes);

// Finance module routes
app.use('/api/finance', financeRoutes);

// Strategy module routes
app.use('/api/strategy', strategyRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// WhatsApp bot routes
app.use('/api/whatsapp', whatsappRoutes);

// Preferences routes
app.use('/api/preferences', preferencesRoutes);

// Notifications routes
app.use('/api/notifications', notificationsRoutes);

// Settings routes
// app.use('/api/settings', settingsRoutes);

// Webhook routes (no rate limiting)
// app.use('/api/webhooks', webhookRoutes);

// ==========================================
// API ROOT
// ==========================================
app.get('/api', (req, res) => {
  res.json({
    name: 'JOSEPH AI API',
    version: '1.0.0',
    description: 'Family Finance & Business Management API',
    modules: {
      dream: {
        name: 'Dream Module',
        description: 'Economic intelligence with 85+ indicators, stress testing, and market news',
        endpoints: {
          overview: 'GET /api/dream/overview - Complete Dream module overview',
          ticker: 'GET /api/dream/ticker - Key economic indicators ticker',
          stats: 'GET /api/dream/stats - Quick stats (health, volatility, news count, next event)',
          stressTest: 'GET /api/dream/stress-test - Economic stress tester with projections',
          feed: 'GET /api/dream/feed - Economic news feed',
          indicators: 'GET /api/dream/indicators - All 85+ indicators grouped by category',
          indicatorsByCategory: 'GET /api/dream/indicators/category/:category - Indicators by category',
          indicatorByCode: 'GET /api/dream/indicators/:code - Single indicator details',
          events: 'GET /api/dream/events - Upcoming economic events',
          eventByCode: 'GET /api/dream/events/:code - Single event details',
          health: 'GET /api/dream/health - Economic health score'
        }
      },
      interpret: {
        name: 'Interpretation Module',
        description: 'Plain English insights and actionable alerts from economic data',
        endpoints: {
          overview: 'GET /api/interpret/overview - Complete Interpretation module overview',
          micro: 'GET /api/interpret/micro - Micro Economic Interpretation (Finance data)',
          macro: 'GET /api/interpret/macro - Macro Economic Interpretation (Dream data)',
          insights: 'GET /api/interpret/insights - All insights for user',
          insightsByCategory: 'GET /api/interpret/insights/category/:category - Insights by category',
          insightsBySeverity: 'GET /api/interpret/insights/severity/:severity - Insights by severity',
          actionableInsights: 'GET /api/interpret/insights/actionable - Insights requiring action',
          insightCounts: 'GET /api/interpret/insights/counts - Insight counts by status',
          insightById: 'GET /api/interpret/insights/:id - Single insight details',
          generate: 'POST /api/interpret/generate - Generate new insights from current data',
          updateAction: 'PUT /api/interpret/insights/:id/action - Update action status',
          togglePin: 'PUT /api/interpret/insights/:id/pin - Toggle pin status',
          rules: 'GET /api/interpret/rules - All interpretation rules'
        }
      },
      finance: {
        name: 'Finance Module',
        description: 'Budget tracking, capital management, runway calculations, and credit monitoring',
        endpoints: {
          overview: 'GET /api/finance/overview - Complete Finance module overview',
          ledgers: 'GET /api/finance/ledgers - All ledgers (Life & Business)',
          ledgerByType: 'GET /api/finance/ledgers/:type - Specific ledger (life/business)',
          budget: 'GET /api/finance/budget - Budget breakdown (50:30:20)',
          setBudget: 'PUT /api/finance/budget - Set budget allocation',
          runway: 'GET /api/finance/runway - Runway analysis',
          capital: 'GET /api/finance/capital - Capital position (Business)',
          setCapitalTargets: 'PUT /api/finance/capital/targets - Set capital targets',
          credits: 'GET /api/finance/credits - Credit overview',
          overdueCredits: 'GET /api/finance/credits/overdue - Overdue credits',
          upcomingCredits: 'GET /api/finance/credits/upcoming - Credits due soon',
          addPayment: 'POST /api/finance/credits/:id/payment - Record credit payment'
        }
      },
      strategy: {
        name: 'Strategy Module',
        description: 'Pricing strategy, procurement management, supplier optimization, and goal tracking',
        endpoints: {
          dashboard: 'GET /api/strategy/dashboard - Complete Strategy module dashboard',
          pricing: 'GET /api/strategy/pricing - Pricing overview with margin analysis',
          productPricing: 'GET /api/strategy/pricing/:id - Product pricing details and scenarios',
          updatePrice: 'PUT /api/strategy/pricing/:id - Update product price',
          addProduct: 'POST /api/strategy/products - Add new product',
          procurement: 'GET /api/strategy/procurement - Procurement overview with suppliers',
          supplierDetails: 'GET /api/strategy/suppliers/:id - Supplier details and discounts',
          addSupplier: 'POST /api/strategy/suppliers - Add new supplier',
          updateStock: 'PUT /api/strategy/materials/:id - Update material stock',
          goals: 'GET /api/strategy/goals - Goals overview with summary',
          goalDetails: 'GET /api/strategy/goals/:id - Goal details with milestones',
          createGoal: 'POST /api/strategy/goals - Create new goal',
          updateGoal: 'PUT /api/strategy/goals/:id - Update goal',
          deleteGoal: 'DELETE /api/strategy/goals/:id - Delete goal',
          addAction: 'POST /api/strategy/goals/:id/actions - Add action item',
          updateAction: 'PUT /api/strategy/goals/:id/actions/:actionId - Update action item',
          addMilestone: 'POST /api/strategy/goals/:id/milestones - Add milestone',
          completeMilestone: 'PUT /api/strategy/goals/:id/milestones/:milestoneId - Complete milestone'
        }
      },
      auth: '/api/auth',
      transactions: '/api/transactions',
      ledgers: '/api/ledgers',
      credit: '/api/credit',
      economic: '/api/economic',
      settings: '/api/settings',
      webhooks: '/api/webhooks'
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/api/dream',
      '/api/interpret',
      '/api/finance',
      '/api/strategy',
      '/api/auth',
      '/api/transactions',
      '/api/ledgers',
      '/api/credit',
      '/api/economic',
      '/api/settings'
    ]
  });
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'The provided token has expired'
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message,
      details: err.details || []
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body contains invalid JSON'
    });
  }

  // CORS error
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Cross-origin request not allowed'
    });
  }

  // Rate limit error
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Too many requests',
      message: err.message,
      retryAfter: err.retryAfter
    });
  }

  // Default error response
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  res.status(status).json({
    error: 'Server error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
let serverInstance;

app.setServer = (server) => {
  serverInstance = server;
};

app.getServer = () => {
  return serverInstance;
};

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  if (serverInstance) {
    serverInstance.close(() => {
      console.log('HTTP server closed.');

      // Close MongoDB connection
      const { disconnectDB } = require('./config/db.js');
      disconnectDB()
        .then(() => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        })
        .catch((err) => {
          console.error('Error closing MongoDB:', err);
          process.exit(1);
        });
    });

    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// ==========================================
// EXPORT
// ==========================================
export default app;
