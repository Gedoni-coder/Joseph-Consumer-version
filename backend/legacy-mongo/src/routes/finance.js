/**
 * Finance Module Routes
 * All routes for the Finance module
 */

import express from 'express';
import financeController from '../controllers/financeControllerPrisma.js';
import { authenticate } from '../middleware/authPrisma.js';

const router = express.Router();

// ==========================================
// OVERVIEW
// ==========================================

/**
 * @route   GET /api/finance/overview
 * @desc    Get complete Finance module overview
 * @access  Private (requires auth)
 */
router.get('/overview', authenticate, financeController.getFinanceOverview);

// ==========================================
// LEDGERS
// ==========================================

/**
 * @route   GET /api/finance/ledgers
 * @desc    Get all ledgers for user
 * @access  Private
 */
router.get('/ledgers', authenticate, financeController.getLedgers);

/**
 * @route   GET /api/finance/ledgers/:type
 * @desc    Get specific ledger by type (life/business)
 * @access  Private
 * @param   type - Ledger type (life/business)
 */
router.get('/ledgers/:type', authenticate, financeController.getLedgerByType);

// ==========================================
// BUDGET TRACKING (Life Ledger)
// ==========================================

/**
 * @route   GET /api/finance/budget
 * @desc    Get budget breakdown for life ledger
 * @access  Private
 * @query   period - Period for budget analysis (month/quarter/year)
 */
router.get('/budget', authenticate, financeController.getBudgetBreakdown);

/**
 * @route   PUT /api/finance/budget
 * @desc    Set budget allocation for life ledger
 * @access  Private
 * @body    monthlyBudget - Monthly budget amount
 * @body    allocation - Budget allocation object { needs, wants, savings }
 */
router.put('/budget', authenticate, financeController.setBudgetAllocation);

// ==========================================
// RUNWAY ANALYSIS (Life Ledger)
// ==========================================

/**
 * @route   GET /api/finance/runway
 * @desc    Get runway analysis for life ledger
 * @access  Private
 */
router.get('/runway', authenticate, financeController.getRunwayAnalysis);

// ==========================================
// CAPITAL MANAGEMENT (Business Ledger)
// ==========================================

/**
 * @route   GET /api/finance/capital
 * @desc    Get capital position for business ledger
 * @access  Private
 */
router.get('/capital', authenticate, financeController.getCapitalPosition);

/**
 * @route   PUT /api/finance/capital/targets
 * @desc    Set capital targets for business ledger
 * @access  Private
 * @body    workingCapitalTarget - Target working capital amount
 * @body    reinvestmentRatio - Ratio of income to reinvest (0-1)
 */
router.put('/capital/targets', authenticate, financeController.setCapitalTargets);

// ==========================================
// CREDIT MONITORING
// ==========================================

/**
 * @route   GET /api/finance/credits
 * @desc    Get credit overview summary
 * @access  Private
 */
router.get('/credits', authenticate, financeController.getCreditOverview);

/**
 * @route   GET /api/finance/credits/overdue
 * @desc    Get overdue credits
 * @access  Private
 */
router.get('/credits/overdue', authenticate, financeController.getOverdueCredits);

/**
 * @route   GET /api/finance/credits/upcoming
 * @desc    Get credits due soon
 * @access  Private
 * @query   days - Days to look ahead (default: 7)
 */
router.get('/credits/upcoming', authenticate, financeController.getUpcomingCredits);

/**
 * @route   POST /api/finance/credits/:id/payment
 * @desc    Add payment to credit entry
 * @access  Private
 * @param   id - Credit entry ID
 * @body    amount - Payment amount
 * @body    method - Payment method (cash/transfer/pos/other)
 * @body    reference - Payment reference
 * @body    notes - Payment notes
 */
router.post('/credits/:id/payment', authenticate, financeController.addCreditPayment);

// ==========================================
// TRANSACTIONS
// ==========================================

/**
 * @route   GET /api/finance/transactions
 * @desc    Get recent transactions for the logged-in user
 * @access  Private
 * @query   ledgerType - Filter by ledger type (life/business)
 * @query   type       - Filter by txn type (CREDIT/DEBIT)
 * @query   limit      - Max results (default: 50)
 */
router.get('/transactions', authenticate, financeController.getTransactions);

// ==========================================
// GOALS
// ==========================================

/**
 * @route   GET /api/finance/goals
 * @desc    Get all financial goals for the logged-in user
 * @access  Private
 * @query   status - Filter by goal status
 */
router.get('/goals', authenticate, financeController.getGoals);

/**
 * @route   POST /api/finance/goals
 * @desc    Create a new financial goal
 * @access  Private
 */
router.post('/goals', authenticate, financeController.createGoal);

/**
 * @route   PUT /api/finance/goals/:id
 * @desc    Update a financial goal
 * @access  Private
 */
router.put('/goals/:id', authenticate, financeController.updateGoal);

// ==========================================
// EXPORTS
// ==========================================
export default router;

// SR
