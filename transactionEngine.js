/**
 * JOSEPH AI - Transaction Processing Engine
 * API-agnostic webhook receiver and FP&A automation system
 * Handles incoming transactions from any banking API (Mono, Okra, Stitch, etc.)
 */

// ==========================================
// CONFIGURATION
// ==========================================
const TRANSACTION_CONFIG = {
  // Supported API providers (extensible)
  supportedProviders: ['mono', 'okra', 'stitch', 'custom'],

  // Webhook endpoints (would be configured in production backend)
  webhookEndpoints: {
    mono: '/api/webhooks/mono',
    okra: '/api/webhooks/okra',
    stitch: '/api/webhooks/stitch',
    custom: '/api/webhooks/custom'
  },

  // Processing options
  autoCategorize: true,
  learnFromConfirmations: true,
  detectCreditTransactions: true,
  varianceAnalysis: true,

  // Variance thresholds
  varianceThresholds: {
    budgetOverSpend: 0.15, // Alert at 15% over budget
    runwayCritical: 14, // Days
    runwayWarning: 21, // Days
    creditOverdue: 3, // Days
    velocityAnomaly: 0.3 // 30% change in transaction velocity
  }
};

// ==========================================
// STATE (synced with main app.js state)
// ==========================================
let appState = null;

// ==========================================
// ACCOUNT CLASSIFICATION SYSTEM
// ==========================================
const accountClassification = {
  // User-defined rules: which accounts map to which ledgers
  rules: {
    // Format: { accountId: { type: 'business'|'personal', name: 'Account Name' } }
  },

  // Default rules for common patterns
  defaultPatterns: {
    business: ['business', 'trading', 'enterprise', 'venture', 'company', 'ltd', 'plc'],
    personal: ['personal', 'savings', 'current', 'salary', 'wallet']
  },

  // Load from localStorage
  load() {
    const saved = localStorage.getItem('joseph_account_rules');
    if (saved) {
      this.rules = JSON.parse(saved);
    }
  },

  // Save to localStorage
  save() {
    localStorage.setItem('joseph_account_rules', JSON.stringify(this.rules));
  },

  // Add a classification rule
  addRule(accountId, type, name) {
    this.rules[accountId] = { type, name };
    this.save();
  },

  // Get classification for an account
  getClassification(accountId, accountName = '') {
    // Check explicit rules first
    if (this.rules[accountId]) {
      return this.rules[accountId];
    }

    // Check pattern matching on account name
    const nameLower = accountName.toLowerCase();
    for (const [type, patterns] of Object.entries(this.defaultPatterns)) {
      if (patterns.some(pattern => nameLower.includes(pattern))) {
        return { type, name: accountName };
      }
    }

    // Default to personal if no match
    return { type: 'personal', name: accountName };
  },

  // Auto-classify based on transaction patterns (ML-lite)
  autoClassify(accountId, accountName, transactionHistory) {
    // If we have history, analyze patterns
    if (transactionHistory && transactionHistory.length >= 5) {
      const businessKeywords = ['sale', 'shop', 'store', 'market', 'goods', 'inventory'];
      const businessCount = transactionHistory.filter(tx =>
        businessKeywords.some(kw => (tx.narration || '').toLowerCase().includes(kw))
      ).length;

      if (businessCount >= 3) {
        this.addRule(accountId, 'business', accountName);
        return { type: 'business', name: accountName };
      }
    }

    return this.getClassification(accountId, accountName);
  }
};

// ==========================================
// TRANSACTION CATEGORIZATION (50:30:20 + Learning)
// ==========================================
const transactionCategorizer = {
  // Category patterns
  patterns: {
    needs: [
      'rent', 'hostel', 'accommodation', 'housing', 'electricity', 'water',
      'food', 'groceries', 'provision', 'market', 'eating', 'restaurant',
      'transport', 'fare', 'fuel', 'petrol', 'danfo', 'uber', 'taxi',
      'internet', 'data', 'wifi', 'airtime', 'recharge', 'call',
      'medical', 'hospital', 'clinic', 'medicine', 'pharmacy',
      'school fees', 'tuition', 'books', 'education', 'academic'
    ],
    wants: [
      'clothing', 'fashion', 'shoes', 'wear', 'accessories',
      'entertainment', 'movie', 'cinema', 'concert', 'event', 'party',
      'subscription', 'netflix', 'spotify', 'showmax', 'betting',
      'vacation', 'travel', 'trip', 'holiday', 'leisure',
      'luxury', 'gadget', 'phone', 'laptop', 'electronics',
      'gift', 'present', 'donation'
    ],
    savings: [
      'transfer', 'deposit', 'savings', 'investment', 'fixed',
      'target', 'goal', 'emergency', 'fund'
    ]
  },

  // Learn from user confirmations
  learnings: {}, // { pattern: category }

  load() {
    const saved = localStorage.getItem('joseph_category_learnings');
    if (saved) {
      this.learnings = JSON.parse(saved);
    }
  },

  save() {
    localStorage.setItem('joseph_category_learnings', JSON.stringify(this.learnings));
  },

  // Categorize a transaction
  categorize(transaction) {
    const narration = (transaction.narration || transaction.description || '').toLowerCase();
    const amount = transaction.amount || 0;

    // Check learned patterns first (highest priority)
    for (const [pattern, category] of Object.entries(this.learnings)) {
      if (narration.includes(pattern.toLowerCase())) {
        return category;
      }
    }

    // NLP-based categorization
    for (const [category, keywords] of Object.entries(this.patterns)) {
      for (const keyword of keywords) {
        if (narration.includes(keyword)) {
          return category;
        }
      }
    }

    // Heuristic based on amount
    if (amount > 100000) {
      return 'savings'; // Large amounts likely savings/investment
    } else if (amount < 1000) {
      return 'needs'; // Small amounts likely necessities (airtime, data, etc.)
    }

    // Default to wants if uncertain
    return 'wants';
  },

  // Learn from user confirmation
  learn(transaction, confirmedCategory) {
    const narration = (transaction.narration || transaction.description || '');
    // Extract key pattern (first meaningful word)
    const words = narration.split(/\s+/).filter(w => w.length > 3);
    if (words.length > 0) {
      const pattern = words[0].toLowerCase();
      this.learnings[pattern] = confirmedCategory;
      this.save();
    }
  }
};

// ==========================================
// CREDIT TRANSACTION DETECTION
// ==========================================
const creditDetector = {
  // Credit indicators in transaction narration
  creditIndicators: [
    'iou', 'i.o.u', 'owed', 'owing', 'owe', 'from ', ' loan ',
    'credit ', 'debit ', 'balance', 'pay later', 'postpaid'
  ],

  // Known customers (from learning)
  knownCustomers: {},

  load() {
    const saved = localStorage.getItem('joseph_customers');
    if (saved) {
      this.knownCustomers = JSON.parse(saved);
    }
  },

  save() {
    localStorage.setItem('joseph_customers', JSON.stringify(this.knownCustomers));
  },

  // Detect if transaction is a credit sale
  detect(transaction, businessContext) {
    const narration = (transaction.narration || transaction.description || '').toLowerCase();

    // Check for credit indicators
    const hasCreditIndicator = this.creditIndicators.some(indicator =>
      narration.includes(indicator)
    );

    if (hasCreditIndicator) {
      // Extract customer name and amount
      const customer = this.extractCustomer(narration);
      if (customer) {
        return {
          isCredit: true,
          customerName: customer.name,
          customerPhone: customer.phone,
          items: this.extractItems(narration),
          dueDate: this.inferDueDate(narration)
        };
      }
    }

    return { isCredit: false };
  },

  // Extract customer name from narration
  extractCustomer(narration) {
    // Patterns: "from Chinedu Okonkwo", "Chinedu Okonkwo - 2 bottles"
    const patterns = [
      /from\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i,
      /^([A-Z][a-z]+\s+[A-Z][a-z]+)\s+-/,
      /by\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/i
    ];

    for (const pattern of patterns) {
      const match = narration.match(pattern);
      if (match && match[1]) {
        // Check if known customer
        const known = this.knownCustomers[match[1].toLowerCase()];
        return {
          name: match[1],
          phone: known?.phone || null
        };
      }
    }

    return null;
  },

  // Extract items from narration
  extractItems(narration) {
    // Pattern: "2 bottles", "5 bags", etc.
    const qtyMatch = narration.match(/(\d+)\s+(bottle|bag|carton|kg|litre)/i);
    if (qtyMatch) {
      return [{
        name: 'Goods',
        qty: parseInt(qtyMatch[1]),
        unit: qtyMatch[2],
        unitPrice: null // Would be calculated from total amount
      }];
    }
    return [];
  },

  // Infer due date from context
  inferDueDate(narration) {
    // Pattern: "due in 7 days", "by Friday", etc.
    const daysMatch = narration.match(/(\d+)\s+days?/i);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    // Default to 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  },

  // Add a customer
  addCustomer(name, phone) {
    this.knownCustomers[name.toLowerCase()] = { name, phone };
    this.save();
  }
};

// ==========================================
// VARIANCE ANALYSIS ENGINE
// ==========================================
const varianceEngine = {
  // Variance history
  history: [],

  load() {
    const saved = localStorage.getItem('joseph_variance_history');
    if (saved) {
      this.history = JSON.parse(saved);
    }
  },

  save() {
    localStorage.setItem('joseph_variance_history', JSON.stringify(this.history.slice(-100))); // Keep last 100
  },

  // Analyze variances and generate alerts
  analyze(state) {
    const alerts = [];
    const life = state.ledgers.life;
    const business = state.ledgers.business;

    // Budget variance
    const budgetVariance = this.analyzeBudgetVariance(life, state.transactions);
    if (budgetVariance) {
      alerts.push(budgetVariance);
    }

    // Runway variance
    const runwayAlert = this.analyzeRunway(life, business);
    if (runwayAlert) {
      alerts.push(runwayAlert);
    }

    // Credit variance
    const creditAlert = this.analyzeCreditExposure(state.creditLedger, business);
    if (creditAlert) {
      alerts.push(creditAlert);
    }

    // Velocity variance
    const velocityAlert = this.analyzeVelocityAnomaly(state.transactions);
    if (velocityAlert) {
      alerts.push(velocityAlert);
    }

    // Save to history
    this.history.push({
      timestamp: new Date().toISOString(),
      alerts: alerts.map(a => a.type)
    });
    this.save();

    return alerts;
  },

  // Analyze budget variance
  analyzeBudgetVariance(life, transactions) {
    const thisMonth = new Date().getMonth();
    const monthlyBudget = life.monthlyBudget;

    // Calculate actual spending by category
    const categorySpending = {
      needs: transactions.filter(tx =>
        tx.category === 'needs' &&
        tx.type === 'debit' &&
        tx.ledger === 'life' &&
        new Date(tx.timestamp).getMonth() === thisMonth
      ).reduce((sum, tx) => sum + tx.amount, 0),
      wants: transactions.filter(tx =>
        tx.category === 'wants' &&
        tx.type === 'debit' &&
        tx.ledger === 'life' &&
        new Date(tx.timestamp).getMonth() === thisMonth
      ).reduce((sum, tx) => sum + tx.amount, 0)
    };

    const needsTarget = monthlyBudget * 0.5;
    const wantsTarget = monthlyBudget * 0.3;

    const needsVariance = (categorySpending.needs - needsTarget) / needsTarget;
    const wantsVariance = (categorySpending.wants - wantsTarget) / wantsTarget;

    if (needsVariance > TRANSACTION_CONFIG.varianceThresholds.budgetOverSpend) {
      return {
        type: 'budget_overneeds',
        priority: 'high',
        title: 'Needs Spending Over Budget',
        message: `Your needs spending is ₦${formatNumber(categorySpending.needs)} - ${(needsVariance * 100).toFixed(0)}% over target. Review essential expenses.`,
        impact: `₦${formatNumber(categorySpending.needs - needsTarget)} over budget`
      };
    }

    if (wantsVariance > TRANSACTION_CONFIG.varianceThresholds.budgetOverSpend * 1.5) {
      return {
        type: 'budget_overwants',
        priority: 'medium',
        title: 'Wants Spending Excessive',
        message: `Your wants spending is ₦${formatNumber(categorySpending.wants)} - ${(wantsVariance * 100).toFixed(0)}% over target. Consider reducing discretionary spending.`,
        impact: `₦${formatNumber(categorySpending.wants - wantsTarget)} over budget`
      };
    }

    return null;
  },

  // Analyze runway status
  analyzeRunway(life, business) {
    const minRunway = Math.min(life.runwayDays, business.runwayDays);

    if (minRunway <= TRANSACTION_CONFIG.varianceThresholds.runwayCritical) {
      return {
        type: 'runway_critical',
        priority: 'high',
        title: 'Critical Runway Alert',
        message: `Your combined runway is ${minRunway} days - below the ${TRANSACTION_CONFIG.varianceThresholds.runwayCritical}-day safety threshold.`,
        impact: `${life.runwayDays < business.runwayDays ? 'Personal' : 'Business'} runway critical. Immediate action required.`,
        directive: 'Pause all discretionary spending and accelerate sales velocity.'
      };
    }

    if (minRunway <= TRANSACTION_CONFIG.varianceThresholds.runwayWarning) {
      return {
        type: 'runway_warning',
        priority: 'medium',
        title: 'Runway Warning',
        message: `Your combined runway is ${minRunway} days. Monitor spending closely.`,
        impact: `${minRunway} days of operational coverage remaining.`
      };
    }

    return null;
  },

  // Analyze credit exposure
  analyzeCreditExposure(creditLedger, business) {
    const totalOutstanding = creditLedger.reduce((sum, c) => sum + c.amountOutstanding, 0);
    const businessBalance = business.balance;
    const exposureRatio = totalOutstanding / (businessBalance || 1);

    const overdueCount = creditLedger.filter(c => new Date(c.dueDate) < new Date() && c.status !== 'paid').length;

    if (exposureRatio > 0.4 || overdueCount >= 3) {
      return {
        type: 'credit_alert',
        priority: overdueCount >= 3 ? 'high' : 'medium',
        title: 'Credit Exposure Alert',
        message: `₦${formatNumber(totalOutstanding)} locked in unpaid credit sales. ${overdueCount} customers overdue.`,
        impact: `${(exposureRatio * 100).toFixed(0)}% of business balance tied up in credit.`,
        directive: overdueCount > 0 ? 'Send payment reminders to overdue customers.' : 'Monitor credit sales carefully.'
      };
    }

    return null;
  },

  // Analyze transaction velocity anomaly
  analyzeVelocityAnomaly(transactions) {
    if (transactions.length < 30) return null;

    // Calculate average transaction count over last 30 days vs previous 30 days
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

    const recentCount = transactions.filter(tx => tx.timestamp >= thirtyDaysAgo).length;
    const previousCount = transactions.filter(tx =>
      tx.timestamp >= sixtyDaysAgo && tx.timestamp < thirtyDaysAgo
    ).length;

    if (previousCount === 0) return null;

    const velocityChange = Math.abs((recentCount - previousCount) / previousCount);

    if (velocityChange > TRANSACTION_CONFIG.varianceThresholds.velocityAnomaly) {
      const isIncrease = recentCount > previousCount;
      return {
        type: 'velocity_anomaly',
        priority: 'medium',
        title: `Transaction Velocity ${isIncrease ? 'Surge' : 'Drop'}`,
        message: `Your transaction activity ${isIncrease ? 'increased' : 'decreased'} by ${(velocityChange * 100).toFixed(0)}% this month.`,
        impact: isIncrease ? 'Higher sales velocity detected - consider increasing inventory.' : 'Lower activity detected - investigate potential issues.',
        comparison: `${recentCount} transactions vs ${previousCount} previous period`
      };
    }

    return null;
  }
};

// ==========================================
// MAIN TRANSACTION PROCESSOR
// ==========================================
class TransactionProcessor {
  constructor() {
    this.initialized = false;
  }

  init(state) {
    appState = state;
    accountClassification.load();
    transactionCategorizer.load();
    creditDetector.load();
    varianceEngine.load();
    this.initialized = true;
  }

  /**
   * Process incoming transaction from webhook
   * API-agnostic - normalizes any provider format
   */
  async processTransaction(rawTransaction, provider = 'mono') {
    if (!this.initialized) {
      throw new Error('TransactionProcessor not initialized. Call init() first.');
    }

    // Normalize transaction (API-agnostic)
    const normalized = this.normalizeTransaction(rawTransaction, provider);

    // Classify and route
    const processed = await this.routeTransaction(normalized);

    // Update state
    this.updateState(processed);

    // Run variance analysis
    const variances = varianceEngine.analyze(appState);

    // Trigger UI updates
    this.triggerUIUpdates(processed, variances);

    return {
      success: true,
      transaction: processed,
      variances,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * Normalize transaction from any API format
   */
  normalizeTransaction(raw, provider) {
    // Common fields extraction (API-agnostic)
    const common = {
      id: raw.id || raw.transaction_id || raw.reference || `tx_${Date.now()}`,
      amount: parseFloat(raw.amount || raw.value || 0),
      type: this.determineTransactionType(raw),
      currency: raw.currency || raw.currency_code || 'NGN',
      narration: raw.narration || raw.description || raw.memo || raw.reason || '',
      timestamp: raw.timestamp || raw.created_at || raw.date || new Date().toISOString(),
      accountId: raw.account_id || raw.account_number || raw.account_ref || '',
      accountName: raw.account_name || raw.account_type || '',
      balance: raw.balance || raw.balance_after || null,
      category: raw.category || null, // Some APIs provide categories
      merchant: this.extractMerchant(raw)
    };

    // Provider-specific adjustments
    switch (provider) {
      case 'mono':
        // Mono-specific normalization
        break;
      case 'okra':
        // Okra-specific normalization
        break;
      case 'stitch':
        // Stitch-specific normalization
        break;
      default:
        // Generic normalization
        break;
    }

    return common;
  }

  /**
   * Determine transaction type (credit/debit)
   */
  determineTransactionType(raw) {
    // Check explicit type
    if (raw.type) {
      const type = raw.type.toLowerCase();
      if (type === 'credit' || type === 'deposit' || type === 'income') return 'credit';
      if (type === 'debit' || type === 'withdrawal' || type === 'expense' || type === 'transfer_out') return 'debit';
    }

    // Infer from amount sign
    const amount = parseFloat(raw.amount || raw.value || 0);
    if (amount < 0) return 'debit';
    if (amount > 0) return 'credit';

    // Default to debit for safety
    return 'debit';
  }

  /**
   * Extract merchant information
   */
  extractMerchant(raw) {
    return raw.merchant || raw.merchant_name || raw.beneficiary || raw.beneficiary_name || null;
  }

  /**
   * Route transaction to correct ledger and apply FP&A logic
   */
  async routeTransaction(tx) {
    // Step 1: Account classification (Business vs Personal)
    const accountClass = accountClassification.getClassification(tx.accountId, tx.accountName);
    tx.ledger = accountClass.type === 'business' ? 'business' : 'life';

    // Step 2: For Personal ledgers, categorize for 50:30:20
    if (tx.ledger === 'life') {
      tx.category = transactionCategorizer.categorize(tx);
      tx.needsConfirmation = !transactionCategorizer.learnings[tx.narration.split(/\s+/)[0]?.toLowerCase()];
    }

    // Step 3: For Business credits, apply auto-splits
    if (tx.ledger === 'business' && tx.type === 'credit') {
      tx.split = {
        workingCapital: Math.round(tx.amount * appState.ledgers.business.reinvestmentRatio),
        available: tx.amount - Math.round(tx.amount * appState.ledgers.business.reinvestmentRatio),
        ratio: appState.ledgers.business.reinvestmentRatio
      };
    }

    // Step 4: Detect credit sales
    if (tx.type === 'credit') {
      const creditInfo = creditDetector.detect(tx);
      if (creditInfo.isCredit) {
        tx.isCreditSale = true;
        tx.creditInfo = creditInfo;
      }
    }

    // Step 5: Add FP&A metadata
    tx.fpna = {
      processedAt: new Date().toISOString(),
      processingSource: 'automated',
      confidence: this.calculateConfidence(tx),
      varianceFlags: []
    };

    return tx;
  }

  /**
   * Calculate processing confidence score
   */
  calculateConfidence(tx) {
    let confidence = 0.5; // Base confidence

    // High confidence if we have explicit categorization from API
    if (tx.category) confidence += 0.3;

    // High confidence if known pattern
    if (transactionCategorizer.learnings[tx.narration.split(/\s+/)[0]?.toLowerCase()]) {
      confidence += 0.3;
    }

    // High confidence if account rule exists
    if (accountClassification.rules[tx.accountId]) {
      confidence += 0.2;
    }

    return Math.min(1, confidence);
  }

  /**
   * Update app state with processed transaction
   */
  updateState(processedTx) {
    // Add to transaction history
    appState.transactions.unshift({
      id: processedTx.id,
      type: processedTx.type,
      title: this.generateTransactionTitle(processedTx),
      amount: processedTx.amount,
      date: 'Just now',
      timestamp: processedTx.timestamp,
      ledger: processedTx.ledger,
      category: processedTx.category,
      bank: processedTx.merchant || 'Bank API',
      narration: processedTx.narration,
      fpna: processedTx.fpna
    });

    // Update ledger balances
    if (processedTx.type === 'credit') {
      if (processedTx.ledger === 'business') {
        appState.ledgers.business.balance += processedTx.amount;
        appState.ledgers.business.workingCapital += processedTx.split.workingCapital;
        appState.ledgers.business.availableCapital += processedTx.split.available;
      } else {
        // Personal credit - trigger Smart Budgeter
        appState.ledgers.life.balance += processedTx.amount;
        // Would trigger Smart Budgeter split
      }
    } else {
      // Debit
      if (processedTx.ledger === 'business') {
        const deduct = Math.min(processedTx.amount, appState.ledgers.business.availableCapital);
        appState.ledgers.business.balance -= deduct;
        appState.ledgers.business.availableCapital -= deduct;
      } else {
        appState.ledgers.life.balance -= processedTx.amount;
      }
    }

    // Update credit ledger if credit sale
    if (processedTx.isCreditSale && processedTx.creditInfo) {
      const creditEntry = {
        id: processedTx.id,
        customerName: processedTx.creditInfo.customerName,
        phone: processedTx.creditInfo.customerPhone,
        totalCredit: processedTx.amount,
        amountPaid: 0,
        amountOutstanding: processedTx.amount,
        dueDate: processedTx.creditInfo.dueDate,
        items: processedTx.creditInfo.items,
        status: 'pending',
        createdAt: processedTx.timestamp
      };
      appState.creditLedger.push(creditEntry);
    }

    // Recalculate runways
    appState.ledgers.life.runwayDays = Math.max(0, Math.floor(
      appState.ledgers.life.balance / appState.ledgers.life.burnRate
    ));
    appState.ledgers.business.runwayDays = Math.max(0, Math.floor(
      appState.ledgers.business.balance / appState.ledgers.business.burnRate
    ));
  }

  /**
   * Generate readable transaction title
   */
  generateTransactionTitle(tx) {
    // Use narration if meaningful
    if (tx.narration && tx.narration.length > 5 && tx.narration.length < 50) {
      // Capitalize first letter
      return tx.narration.charAt(0).toUpperCase() + tx.narration.slice(1);
    }

    // Generate from type and merchant
    const merchant = tx.merchant || tx.accountName || 'Bank';
    if (tx.type === 'credit') {
      return `Credit from ${merchant}`;
    } else {
      return `Payment to ${merchant}`;
    }
  }

  /**
   * Trigger UI updates after processing
   */
  triggerUIUpdates(processedTx, variances) {
    // This would call the update functions in app.js
    // For now, we'll store for later retrieval
    window.lastProcessedTransaction = processedTx;
    window.lastVarianceAlerts = variances;
  }
}

// ==========================================
// WEBHOOK SIMULATOR (for demo/testing)
// ==========================================
function simulateWebhookTransaction(scenario = 'sale') {
  const scenarios = {
    sale: {
      id: `tx_${Date.now()}`,
      amount: 3000,
      type: 'credit',
      currency: 'NGN',
      narration: 'Transfer from Chinedu Okonkwo - 2 bottles peanuts',
      account_id: 'act_business_001',
      account_name: 'Business Account',
      timestamp: new Date().toISOString()
    },
    expense: {
      id: `tx_${Date.now()}`,
      amount: 1500,
      type: 'debit',
      currency: 'NGN',
      narration: 'Transfer to JUMIA Food - Lunch',
      account_id: 'act_personal_001',
      account_name: 'Personal Account',
      timestamp: new Date().toISOString()
    },
    salary: {
      id: `tx_${Date.now()}`,
      amount: 45000,
      type: 'credit',
      currency: 'NGN',
      narration: 'Salary Credit - June 2024',
      account_id: 'act_personal_001',
      account_name: 'Personal Account',
      timestamp: new Date().toISOString()
    },
    credit_sale: {
      id: `tx_${Date.now()}`,
      amount: 4500,
      type: 'credit',
      currency: 'NGN',
      narration: 'Transfer from Joy Eze - IOU for 3 bottles, due in 7 days',
      account_id: 'act_business_001',
      account_name: 'Business Account',
      timestamp: new Date().toISOString()
    },
    restock: {
      id: `tx_${Date.now()}`,
      amount: 12000,
      type: 'debit',
      currency: 'NGN',
      narration: 'Market - Raw materials purchase',
      account_id: 'act_business_001',
      account_name: 'Business Account',
      timestamp: new Date().toISOString()
    }
  };

  return scenarios[scenario] || scenarios.sale;
}

// ==========================================
// EXPORTS
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TransactionProcessor,
    accountClassification,
    transactionCategorizer,
    creditDetector,
    varianceEngine,
    TRANSACTION_CONFIG,
    simulateWebhookTransaction
  };
}
