/**
 * Strategy Routes
 * Routes for pricing strategy, procurement, and goal management
 *
 * Endpoints:
 * - GET    /api/strategy/dashboard          - Strategy dashboard
 * - GET    /api/strategy/pricing            - Pricing overview
 * - GET    /api/strategy/pricing/:id        - Product pricing details
 * - PUT    /api/strategy/pricing/:id        - Update product price
 * - POST   /api/strategy/products           - Add new product
 * - GET    /api/strategy/procurement        - Procurement overview
 * - GET    /api/strategy/suppliers/:id      - Supplier details
 * - POST   /api/strategy/suppliers          - Add supplier
 * - PUT    /api/strategy/materials/:id      - Update material stock
 * - GET    /api/strategy/goals              - Goals overview
 * - GET    /api/strategy/goals/:id          - Goal details
 * - POST   /api/strategy/goals              - Create goal
 * - PUT    /api/strategy/goals/:id          - Update goal
 * - DELETE /api/strategy/goals/:id          - Delete goal
 * - POST   /api/strategy/goals/:id/actions  - Add action item
 * - PUT    /api/strategy/goals/:id/actions/:actionId - Update action
 * - POST   /api/strategy/goals/:id/milestones - Add milestone
 * - PUT    /api/strategy/goals/:id/milestones/:milestoneId - Complete milestone
 */

import express from 'express';
import strategyController from '../controllers/strategyControllerPrisma.js';
import {
  authenticate
} from '../middleware/authPrisma.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// ==========================================
// DASHBOARD
// ==========================================

/**
 * @route   GET /api/strategy/dashboard
 * @desc    Get complete strategy dashboard with recommendations
 * @access  Private
 */
router.get('/dashboard', strategyController.getStrategyDashboard);

// ==========================================
// PRICING STRATEGY
// ==========================================

/**
 * @route   GET /api/strategy/pricing
 * @desc    Get pricing overview with margin analysis
 * @access  Private
 */
router.get('/pricing', strategyController.getPricingOverview);

/**
 * @route   GET /api/strategy/pricing/:id
 * @desc    Get detailed pricing analysis for a product
 * @access  Private
 */
router.get('/pricing/:id', strategyController.getProductPricing);

/**
 * @route   PUT /api/strategy/pricing/:id
 * @desc    Update product price
 * @access  Private
 */
router.put('/pricing/:id', strategyController.updateProductPrice);

/**
 * @route   POST /api/strategy/products
 * @desc    Add new product to business profile
 * @access  Private
 */
router.post('/products', strategyController.addProduct);

// ==========================================
// PROCUREMENT & SUPPLIERS
// ==========================================

/**
 * @route   GET /api/strategy/procurement
 * @desc    Get procurement overview with supplier analysis
 * @access  Private
 */
router.get('/procurement', strategyController.getProcurementOverview);

/**
 * @route   GET /api/strategy/suppliers/:id
 * @desc    Get supplier details with products and discounts
 * @access  Private
 */
router.get('/suppliers/:id', strategyController.getSupplierDetails);

/**
 * @route   POST /api/strategy/suppliers
 * @desc    Add new supplier
 * @access  Private
 */
router.post('/suppliers', strategyController.addSupplier);

/**
 * @route   PUT /api/strategy/materials/:id
 * @desc    Update raw material stock levels
 * @access  Private
 */
router.put('/materials/:id', strategyController.updateMaterialStock);

// ==========================================
// GOAL MANAGEMENT
// ==========================================

/**
 * @route   GET /api/strategy/goals
 * @desc    Get goals overview with summary
 * @access  Private
 * @query   category - Filter by goal category
 * @query   status - Filter by goal status
 */
router.get('/goals', strategyController.getGoalsOverview);

/**
 * @route   GET /api/strategy/goals/:id
 * @desc    Get goal details with milestones and action items
 * @access  Private
 */
router.get('/goals/:id', strategyController.getGoalDetails);

/**
 * @route   POST /api/strategy/goals
 * @desc    Create new goal
 * @access  Private
 */
router.post('/goals', strategyController.createGoal);

/**
 * @route   PUT /api/strategy/goals/:id
 * @desc    Update goal (progress, status, etc.)
 * @access  Private
 */
router.put('/goals/:id', strategyController.updateGoal);

/**
 * @route   DELETE /api/strategy/goals/:id
 * @desc    Delete goal (soft delete)
 * @access  Private
 */
router.delete('/goals/:id', strategyController.deleteGoal);

/**
 * @route   POST /api/strategy/goals/:id/actions
 * @desc    Add action item to goal
 * @access  Private
 */
router.post('/goals/:id/actions', strategyController.addActionItem);

/**
 * @route   PUT /api/strategy/goals/:id/actions/:actionId
 * @desc    Update action item status
 * @access  Private
 */
router.put('/goals/:id/actions/:actionId', strategyController.updateActionItem);

/**
 * @route   POST /api/strategy/goals/:id/milestones
 * @desc    Add milestone to goal
 * @access  Private
 */
router.post('/goals/:id/milestones', strategyController.addMilestone);

/**
 * @route   PUT /api/strategy/goals/:id/milestones/:milestoneId
 * @desc    Mark milestone as complete
 * @access  Private
 */
router.put('/goals/:id/milestones/:milestoneId', strategyController.completeMilestone);

export default router;

// SR
