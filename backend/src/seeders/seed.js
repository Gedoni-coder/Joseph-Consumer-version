/**
 * JOSEPH AI - Comprehensive Seed Script (Prisma)
 * Seeds the database with sample data for all modules
 */

import { prisma } from '../config/prisma.js';
import bcrypt from 'bcrypt';

// ==========================================
// CONFIGURATION
// ==========================================
const SEED_CONFIG = {
  cleanBeforeSeed: false, // Set to true to clear existing data
  verbose: true
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function log(message) {
  if (SEED_CONFIG.verbose) {
    console.log(`🌱 ${message}`);
  }
}

async function cleanDatabase() {
  log('Cleaning existing data...');

  // Delete in order of dependencies
  await prisma.creditEntry.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.ledger.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.rawMaterial.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.economicEvent.deleteMany({});
  await prisma.economicNews.deleteMany({});
  await prisma.economicIndicator.deleteMany({});
  await prisma.insight.deleteMany({});
  await prisma.user.deleteMany({});

  log('✅ Database cleaned');
}

// ==========================================
// USER DATA
// ==========================================

async function seedUsers() {
  log('Seeding users...');

  const hashedPassword = await bcrypt.hash('Test123456', 12);

  // Use upsert to handle duplicates
  await prisma.user.upsert({
    where: { email: 'demo@joseph.ai' },
    update: {},
    create: {
      id: 'demo-user-id',
      email: 'demo@joseph.ai',
      password: hashedPassword,
      name: 'Demo Studentpreneur',
      phone: '+2348012345678',
      isActive: true,
      isEmailVerified: true,
      onboardingComplete: true,
      onboardingStep: 5,
      currency: 'NGN',
      language: 'en',
      notifications: true,
      lastLogin: new Date(),
      createdAt: new Date('2025-01-01')
    }
  });

  await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-id',
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      isActive: true,
      isEmailVerified: false,
      onboardingComplete: false,
      onboardingStep: 0
    }
  });

  log(`✅ Created 2 users`);
  return 'demo-user-id';
}

// ==========================================
// ECONOMIC INDICATORS (Dream Module)
// ==========================================

async function seedEconomicIndicators() {
  log('Seeding economic indicators...');

  const indicators = [
    // Overview Indicators
    { code: 'CURRENCY_USD', category: 'overview', name: 'Currency (USD to NGN)', unit: 'NGN/USD', value: 1650, change: 30, changePercent: 1.85, trend: 'up' },
    { code: 'STOCK_MARKET', category: 'overview', name: 'Nigeria Stock Market Index', unit: 'points', value: 229240, change: 4918, changePercent: 2.15, trend: 'up' },
    { code: 'GDP_GROWTH_RATE', category: 'overview', name: 'GDP Growth Rate', unit: 'percent', value: 3.4, change: 0.5, changePercent: 17.2, trend: 'up' },
    { code: 'INFLATION_RATE', category: 'overview', name: 'Inflation Rate', unit: 'percent', value: 31.7, change: 0.5, changePercent: 1.6, trend: 'up' },
    { code: 'INTEREST_RATE', category: 'overview', name: 'Interest Rate', unit: 'percent', value: 26.5, change: 0.25, changePercent: 0.95, trend: 'up' },
    { code: 'UNEMPLOYMENT_RATE', category: 'overview', name: 'Unemployment Rate', unit: 'percent', value: 33.3, change: 0.2, changePercent: 0.6, trend: 'up' },
    // Labour Indicators
    { code: 'POPULATION', category: 'labour', name: 'Population', unit: 'millions', value: 223.8, change: 5.3, changePercent: 2.4, trend: 'up' },
    { code: 'EMPLOYMENT_RATE', category: 'labour', name: 'Employment Rate', unit: 'percent', value: 66.7, change: -0.2, changePercent: -0.3, trend: 'down' },
    // Prices Indicators
    { code: 'FOOD_INFLATION', category: 'prices', name: 'Food Inflation', unit: 'percent', value: 39.2, change: 0.7, changePercent: 1.8, trend: 'up' },
    { code: 'CORE_INFLATION', category: 'prices', name: 'Core Inflation', unit: 'percent', value: 26.5, change: 0.4, changePercent: 1.5, trend: 'up' },
    // Money Indicators
    { code: 'MONEY_SUPPLY_M2', category: 'money', name: 'Money Supply M2', unit: 'NGN Trillion', value: 105.2, change: 6.5, changePercent: 6.6, trend: 'up' },
    { code: 'FOREIGN_RESERVES', category: 'money', name: 'Foreign Exchange Reserves', unit: 'USD Billion', value: 32.5, change: -0.6, changePercent: -1.8, trend: 'down' },
    // Trade Indicators
    { code: 'BALANCE_OF_TRADE', category: 'trade', name: 'Balance of Trade', unit: 'NGN Billion', value: 4142, change: 2711, changePercent: 189.5, trend: 'up' },
    { code: 'IMPORTS', category: 'trade', name: 'Imports', unit: 'NGN Trillion', value: 35.2, change: 3.4, changePercent: 10.7, trend: 'up' },
    // Government Indicators
    { code: 'GOV_DEBT_TO_GDP', category: 'government', name: 'Government Debt to GDP', unit: 'percent', value: 42.3, change: 1.5, changePercent: 3.7, trend: 'up' },
    { code: 'GOV_BUDGET', category: 'government', name: 'Government Budget', unit: 'NGN Trillion', value: 28.7, change: 3.9, changePercent: 15.7, trend: 'up' }
  ];

  let created = 0;
  for (const indicator of indicators) {
    try {
      await prisma.economicIndicator.upsert({
        where: { code: indicator.code },
        update: {
          ...indicator,
          lastUpdated: new Date()
        },
        create: {
          ...indicator,
          lastUpdated: new Date()
        }
      });
      created++;
    } catch (error) {
      console.error(`Failed to seed indicator ${indicator.code}:`, error.message);
    }
  }

  log(`✅ Created ${created} economic indicators`);
}

// ==========================================
// ECONOMIC NEWS (Dream Module)
// ==========================================

async function seedEconomicNews() {
  log('Seeding economic news...');

  const news = [
    {
      title: 'Northern Groundnut Harvest Season Delay',
      summary: 'Heavy rains in Kaduna extended drying times by 2 weeks. Expect 15-20% wholesale price hike in Mile 12 & Bodija markets.',
      source: 'Weather Report',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      affectedSectors: ['agriculture', 'food_production'],
      impact: 'high'
    },
    {
      title: 'PET Plastics Import Tariff Drop',
      summary: 'Local bottle manufacturers report improved FX liquidity. 35cl peanut bottles wholesale price down ₦5/unit in Lagos.',
      source: 'Market Report',
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      affectedSectors: ['packaging'],
      impact: 'medium'
    },
    {
      title: 'University Resumption Surge Expected',
      summary: 'Students returning for 2nd semester next Monday. Historical snack velocity jumps 2.4× during first fortnight of resumption.',
      source: 'Education Sector',
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      affectedSectors: ['retail', 'food'],
      impact: 'high'
    },
    {
      title: 'Fuel Price Adjustment Alert',
      summary: 'PMS pump price now ₦680/litre in major cities. Logistics costs expected to increase by 8-12%.',
      source: 'Energy Sector',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      affectedSectors: ['logistics', 'transport'],
      impact: 'medium'
    },
    {
      title: 'CBN MPC Meeting Scheduled',
      summary: 'Monetary Policy Committee meeting to hold next week. Interest rate decision expected to impact borrowing costs.',
      source: 'CBN',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      affectedSectors: ['finance', 'credit'],
      impact: 'medium'
    }
  ];

  let created = 0;
  for (const item of news) {
    try {
      await prisma.economicNews.upsert({
        where: { id: item.title.toLowerCase().replace(/\s+/g, '_') },
        update: item,
        create: { id: item.title.toLowerCase().replace(/\s+/g, '_'), ...item }
      });
      created++;
    } catch (error) {
      console.error('Failed to seed news:', error.message);
    }
  }

  log(`✅ Created ${created} economic news items`);
}

// ==========================================
// ECONOMIC EVENTS (Dream Module)
// ==========================================

async function seedEconomicEvents() {
  log('Seeding economic events...');

  const now = new Date();
  const events = [
    {
      code: 'CBN_MPC_MEETING',
      name: 'CBN MPC Meeting',
      description: 'Monetary Policy Committee meeting to decide interest rates',
      category: 'monetary_policy',
      eventDate: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'GDP_Q2_RELEASE',
      name: 'GDP Q2 Release',
      description: 'Second quarter GDP figures to be released',
      category: 'economic_data',
      eventDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
    },
    {
      code: 'STUDENT_RESUMPTION',
      name: 'Student Resumption Week',
      description: 'Major universities resume for new semester',
      category: 'seasonal',
      eventDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    }
  ];

  let created = 0;
  for (const event of events) {
    try {
      await prisma.economicEvent.upsert({
        where: { code: event.code },
        update: event,
        create: event
      });
      created++;
    } catch (error) {
      // Skip duplicates
    }
  }

  log(`✅ Created ${created} economic events`);
}

// ==========================================
// LEDGERS & TRANSACTIONS (Finance Module)
// ==========================================

async function seedFinanceData(userId) {
  log('Seeding finance data...');

  // Create Life Ledger
  const lifeLedger = await prisma.ledger.upsert({
    where: { id: 'demo-life-ledger' },
    update: {},
    create: {
      id: 'demo-life-ledger',
      userId: userId,
      type: 'LIFE',
      name: 'Personal Ledger',
      currency: 'NGN',
      balance: 15000,
      totalIncome: 15000,
      totalExpenses: 0,
      monthlyBudget: 15000,
      budgetNeeds: 7500,
      budgetWants: 4500,
      budgetSavings: 3000,
      spentNeeds: 5280,
      spentWants: 1890,
      spentSavings: 2100,
      burnRate: 850
    }
  });

  // Create Business Ledger
  const businessLedger = await prisma.ledger.upsert({
    where: { id: 'demo-business-ledger' },
    update: {},
    create: {
      id: 'demo-business-ledger',
      userId: userId,
      type: 'BUSINESS',
      name: 'Peanut Butter Business',
      currency: 'NGN',
      balance: 20000,
      totalIncome: 20000,
      totalExpenses: 6000,
      netCashFlow: 14000,
      workingCapital: 14000,
      availableCapital: 6000,
      workingCapitalTarget: 0.7,
      reinvestmentRatio: 0.4,
      businessTotalSales: 20000,
      businessTotalExpenses: 6000,
      businessNetProfit: 14000,
      businessProfitMargin: 0.7,
      runwayDays: 18
    }
  });

  // Create sample transactions
  const transactions = [
    // Life Ledger Income
    { ledgerId: 'demo-life-ledger', userId, type: 'CREDIT', amount: 15000, category: 'income', subcategory: 'allowance', narration: 'Monthly Allowance', timestamp: new Date('2025-01-01') },
    // Life Ledger Expenses
    { ledgerId: 'demo-life-ledger', userId, type: 'DEBIT', amount: 3500, category: 'needs', subcategory: 'housing', narration: 'Hostel Rent', timestamp: new Date('2025-01-02') },
    { ledgerId: 'demo-life-ledger', userId, type: 'DEBIT', amount: 1780, category: 'needs', subcategory: 'food', narration: 'Food & Groceries', timestamp: new Date('2025-01-03') },
    { ledgerId: 'demo-life-ledger', userId, type: 'DEBIT', amount: 1200, category: 'wants', subcategory: 'data', narration: 'Data Subscription', timestamp: new Date('2025-01-04') },
    { ledgerId: 'demo-life-ledger', userId, type: 'DEBIT', amount: 690, category: 'wants', subcategory: 'snacks', narration: 'Snacks & Drinks', timestamp: new Date('2025-01-05') },
    // Business Ledger Income
    { ledgerId: 'demo-business-ledger', userId, type: 'CREDIT', amount: 8500, category: 'sales', subcategory: 'bulk', narration: 'Bulk Sales - Campus', timestamp: new Date('2025-01-06') },
    { ledgerId: 'demo-business-ledger', userId, type: 'CREDIT', amount: 6000, category: 'sales', subcategory: 'retail', narration: 'Retail Sales', timestamp: new Date('2025-01-07') },
    { ledgerId: 'demo-business-ledger', userId, type: 'CREDIT', amount: 3500, category: 'sales', subcategory: 'wholesale', narration: 'Wholesale Order', timestamp: new Date('2025-01-08') },
    { ledgerId: 'demo-business-ledger', userId, type: 'CREDIT', amount: 2000, category: 'sales', subcategory: 'market', narration: 'Weekend Market', timestamp: new Date('2025-01-09') },
    // Business Ledger Expenses
    { ledgerId: 'demo-business-ledger', userId, type: 'DEBIT', amount: 2500, category: 'inventory', subcategory: 'raw_materials', narration: 'Restock Supplies', timestamp: new Date('2025-01-10') },
    { ledgerId: 'demo-business-ledger', userId, type: 'DEBIT', amount: 1500, category: 'operations', subcategory: 'logistics', narration: 'Transport & Logistics', timestamp: new Date('2025-01-11') },
    { ledgerId: 'demo-business-ledger', userId, type: 'DEBIT', amount: 800, category: 'marketing', subcategory: 'promotion', narration: 'Marketing Materials', timestamp: new Date('2025-01-12') },
    { ledgerId: 'demo-business-ledger', userId, type: 'DEBIT', amount: 700, category: 'operations', subcategory: 'packaging', narration: 'Packaging Materials', timestamp: new Date('2025-01-13') },
    { ledgerId: 'demo-business-ledger', userId, type: 'DEBIT', amount: 500, category: 'operations', subcategory: 'platform', narration: 'Platform Fees', timestamp: new Date('2025-01-14') }
  ];

  let txCreated = 0;
  for (const tx of transactions) {
    try {
      await prisma.transaction.create({ data: tx });
      txCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  // Create Credit Entries
  const credits = [
    {
      userId,
      ledgerId: 'demo-business-ledger',
      customerName: 'Chinedu Okonkwo',
      phone: '+2348023456789',
      totalCredit: 2500,
      amountPaid: 0,
      amountOutstanding: 2500,
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      items: [{ name: '35cl Peanut Butter', quantity: 5, unitPrice: 500 }],
      status: 'OVERDUE',
      reminders: []
    },
    {
      userId,
      ledgerId: 'demo-business-ledger',
      customerName: 'Fatima Ibrahim',
      phone: '+2348034567890',
      totalCredit: 1800,
      amountPaid: 1000,
      amountOutstanding: 800,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      items: [{ name: '35cl Peanut Butter', quantity: 3, unitPrice: 600 }],
      status: 'PARTIAL',
      payments: [
        { amount: 500, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), method: 'transfer' },
        { amount: 500, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), method: 'cash' }
      ],
      reminders: []
    },
    {
      userId,
      ledgerId: 'demo-business-ledger',
      customerName: 'Emeka Okafor',
      phone: '+2348045678901',
      totalCredit: 3500,
      amountPaid: 0,
      amountOutstanding: 3500,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      items: [{ name: '70cl Family Size', quantity: 5, unitPrice: 700 }],
      status: 'PENDING',
      reminders: []
    }
  ];

  let creditsCreated = 0;
  for (const credit of credits) {
    try {
      await prisma.creditEntry.create({ data: credit });
      creditsCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  log(`✅ Created ${txCreated} transactions and ${creditsCreated} credit entries`);
}

// ==========================================
// BUSINESS PROFILE & PRODUCTS (Strategy Module)
// ==========================================

async function seedStrategyData(userId) {
  log('Seeding strategy data...');

  // Create Business Profile
  const businessProfile = await prisma.businessProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      businessName: 'Joseph Peanut Butter',
      businessType: 'retail',
      industry: 'food_production',
      marketSegment: 'students',
      pricingStrategy: 'cost_plus',
      profitMarginTarget: 20
    }
  });

  // Create Products
  const products = [
    {
      name: '35cl Peanut Butter',
      category: 'finished_goods',
      currentPrice: 500,
      unit: 'bottle',
      cogs: 220,
      targetMargin: 20
    },
    {
      name: '70cl Family Size',
      category: 'finished_goods',
      currentPrice: 900,
      unit: 'bottle',
      cogs: 400,
      targetMargin: 20
    },
    {
      name: '35cl with Cravings',
      category: 'finished_goods',
      currentPrice: 600,
      unit: 'bottle',
      cogs: 250,
      targetMargin: 20
    }
  ];

  let productsCreated = 0;
  for (const product of products) {
    try {
      await prisma.product.create({
        data: {
          ...product,
          businessProfileId: businessProfile.id
        }
      });
      productsCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  // Create Suppliers
  const suppliers = [
    {
      name: 'Kaduna Groundnut Suppliers',
      address: 'Kaduna',
      contactPerson: 'Malam Yusuf',
      phone: '+2348012345670',
      rating: 4.5,
      leadTimeDays: 3
    },
    {
      name: 'Lagos Packaging Co.',
      address: 'Lagos',
      contactPerson: 'Chioma Eze',
      phone: '+2348023456781',
      rating: 4.8,
      leadTimeDays: 2
    }
  ];

  let suppliersCreated = 0;
  for (const supplier of suppliers) {
    try {
      await prisma.supplier.create({
        data: {
          ...supplier,
          businessProfileId: businessProfile.id
        }
      });
      suppliersCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  // Create Raw Materials
  const materials = [
    {
      name: 'Groundnuts (Raw)',
      stockOnHand: 85,
      unit: 'kg',
      reorderLevel: 50,
      currentPrice: 220
    },
    {
      name: 'PET Bottles (35cl)',
      stockOnHand: 120,
      unit: 'pieces',
      reorderLevel: 100,
      currentPrice: 45
    },
    {
      name: 'Labels',
      stockOnHand: 500,
      unit: 'pieces',
      reorderLevel: 200,
      currentPrice: 8
    }
  ];

  let materialsCreated = 0;
  for (const material of materials) {
    try {
      await prisma.rawMaterial.create({
        data: {
          ...material,
          businessProfileId: businessProfile.id
        }
      });
      materialsCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  // Create Goals
  const goals = [
    {
      userId,
      title: 'Build Emergency Fund',
      category: 'SAVINGS',
      targetValue: 50000,
      currentValue: 32000,
      unit: '₦',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'IN_PROGRESS'
    },
    {
      userId,
      title: 'Double Monthly Sales',
      category: 'REVENUE',
      targetValue: 40000,
      currentValue: 20000,
      unit: '₦/month',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-06-30'),
      status: 'IN_PROGRESS'
    },
    {
      userId,
      title: 'Expand to 5 Campuses',
      category: 'GROWTH',
      targetValue: 5,
      currentValue: 1,
      unit: 'campuses',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      status: 'IN_PROGRESS'
    }
  ];

  let goalsCreated = 0;
  for (const goal of goals) {
    try {
      await prisma.goal.create({ data: goal });
      goalsCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  log(`✅ Created ${productsCreated} products, ${suppliersCreated} suppliers, ${materialsCreated} materials, and ${goalsCreated} goals`);
}

// ==========================================
// INSIGHTS (Interpretation Module)
// ==========================================

async function seedInterpretationData(userId) {
  log('Seeding interpretation data...');

  const insights = [
    {
      userId,
      title: 'Raw Material Cost Increase Alert',
      body: 'Groundnut prices up 12% due to harvest delays in Kaduna. Consider locking in current supplier prices or increasing product prices by ₦50-₦100.',
      category: 'pricing',
      severity: 'warning',
      isActionable: true,
      recommendedAction: 'Review supplier contracts and adjust pricing',
      sourceType: 'dream'
    },
    {
      userId,
      title: 'Campus Resumption Opportunity',
      body: 'Student resumption week begins in 2 days. Historical data shows 2.4× sales velocity increase. Prepare extra stock to capture demand.',
      category: 'opportunity',
      severity: 'info',
      isActionable: true,
      recommendedAction: 'Increase stock for campus resumption',
      sourceType: 'dream'
    },
    {
      userId,
      title: 'Packaging Cost Decrease',
      body: 'PET bottle prices down ₦5/unit due to improved FX liquidity. Consider maintaining current prices to increase margins or offer temporary promotion.',
      category: 'cost_savings',
      severity: 'success',
      isActionable: true,
      recommendedAction: 'Review pricing strategy for margin optimization',
      sourceType: 'dream'
    },
    {
      userId,
      title: 'Credit Collection Needed',
      body: 'Chinedu Okonkwo has ₦2,500 overdue for 7 days. Follow up with reminder call or visit.',
      category: 'credit_management',
      severity: 'warning',
      isActionable: true,
      recommendedAction: 'Follow up on overdue payment',
      sourceType: 'finance'
    },
    {
      userId,
      title: 'Healthy Burn Rate',
      body: 'Your business burn rate of ₦1,111/day gives you 18 days of runway. This is healthy - aim to maintain above 21 days.',
      category: 'financial_health',
      severity: 'success',
      isActionable: false,
      sourceType: 'finance'
    }
  ];

  let insightsCreated = 0;
  for (const insight of insights) {
    try {
      await prisma.insight.create({ data: insight });
      insightsCreated++;
    } catch (error) {
      // Skip duplicates
    }
  }

  log(`✅ Created ${insightsCreated} insights`);
}

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function seed() {
  const startTime = Date.now();
  log('🌱 Starting JOSEPH AI database seeding...');
  log('');

  try {
    // Clean database if configured
    if (SEED_CONFIG.cleanBeforeSeed) {
      await cleanDatabase();
      log('');
    }

    // Seed all data
    const userId = await seedUsers();
    log('');

    await seedEconomicIndicators();
    log('');

    await seedEconomicNews();
    log('');

    await seedEconomicEvents();
    log('');

    await seedFinanceData(userId);
    log('');

    await seedStrategyData(userId);
    log('');

    await seedInterpretationData(userId);
    log('');

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`✨ Seeding completed in ${elapsed}s`);
    log('');
    log('📊 Demo Account Credentials:');
    log('   Email: demo@joseph.ai');
    log('   Password: Test123456');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seeding
seed();
