/**
 * Database Seed Script - Prisma (PostgreSQL)
 * Seeds initial data for testing
 */

import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';

// ==========================================
// SEED DATA
// ==========================================

const USERS = [
  {
    email: 'test@josephai.com',
    password: 'password123',
    name: 'Test User',
    phone: '+2348012345678'
  },
  {
    email: 'business@josephai.com',
    password: 'password123',
    name: 'Business Owner',
    phone: '+2348087654321'
  }
];

const ECONOMIC_INDICATORS = [
  {
    code: 'INFLATION_RATE',
    name: 'Inflation Rate',
    category: 'inflation',
    value: 34.6,
    change: 0.5,
    changePercent: 1.5,
    trend: 'up',
    unit: '%',
    source: 'NBS'
  },
  {
    code: 'CURRENCY_USD',
    name: 'USD to NGN Exchange Rate',
    category: 'fx',
    value: 1650,
    change: 25,
    changePercent: 1.5,
    trend: 'up',
    unit: '₦',
    source: 'CBN'
  },
  {
    code: 'INTEREST_RATE',
    name: 'Monetary Policy Rate',
    category: 'interest',
    value: 26.25,
    change: 0,
    changePercent: 0,
    trend: 'stable',
    unit: '%',
    source: 'CBN'
  },
  {
    code: 'GDP_GROWTH_RATE',
    name: 'GDP Growth Rate',
    category: 'gdp',
    value: 2.98,
    change: -0.2,
    changePercent: -6.3,
    trend: 'down',
    unit: '%',
    source: 'NBS'
  },
  {
    code: 'UNEMPLOYMENT_RATE',
    name: 'Unemployment Rate',
    category: 'employment',
    value: 5.8,
    change: -0.3,
    changePercent: -4.9,
    trend: 'down',
    unit: '%',
    source: 'NBS'
  }
];

const INTERPRETATION_RULES = [
  {
    code: 'HIGH_INFLATION',
    name: 'High Inflation Alert',
    description: 'Alert when inflation exceeds 30%',
    conditionType: 'threshold',
    operator: 'greater_than',
    thresholdValue: 30,
    indicatorCode: 'INFLATION_RATE',
    insightTemplate: 'Inflation is at {value}%, which is {changeDirection} from last month. Consider reducing discretionary spending and focusing on essential goods.',
    severity: 'high',
    recommendedAction: 'Review budget and prioritize essential spending'
  },
  {
    code: 'FX_DEPRECIATION',
    name: 'FX Depreciation Alert',
    description: 'Alert when NGN depreciates significantly',
    conditionType: 'threshold',
    operator: 'greater_than',
    thresholdValue: 1600,
    indicatorCode: 'CURRENCY_USD',
    insightTemplate: 'USD rate is ₦{value}, {changeDirection} from last week. Import costs may rise - consider local alternatives.',
    severity: 'medium',
    recommendedAction: 'Hedge FX risk by sourcing locally or forward contracting'
  }
];

// ==========================================
// SEED FUNCTIONS
// ==========================================

async function seedUsers() {
  console.log('🌱 Seeding users...');

  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        ...user,
        password: hashedPassword,
        isEmailVerified: true,
        onboardingComplete: false,
        onboardingStep: 0
      }
    });
  }

  console.log('✅ Users seeded');
}

async function seedLedgers() {
  console.log('🌱 Seeding ledgers...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    // Create LIFE Ledger
    await prisma.ledger.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: 'LIFE'
        }
      },
      update: {},
      create: {
        userId: user.id,
        type: 'LIFE',
        name: 'Personal Ledger',
        currency: 'NGN',
        balance: 250000,
        totalIncome: 500000,
        totalExpenses: 250000,
        netCashFlow: 250000,
        monthlyBudget: 400000,
        budgetNeeds: 200000,
        budgetWants: 120000,
        budgetSavings: 80000,
        runwayDays: 45,
        burnRate: 8333
      }
    });

    // Create BUSINESS Ledger
    await prisma.ledger.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: 'BUSINESS'
        }
      },
      update: {},
      create: {
        userId: user.id,
        type: 'BUSINESS',
        name: 'Business Ledger',
        currency: 'NGN',
        balance: 1500000,
        totalIncome: 5000000,
        totalExpenses: 3500000,
        netCashFlow: 1500000,
        workingCapital: 800000,
        availableCapital: 700000,
        workingCapitalTarget: 1000000,
        reinvestmentRatio: 0.4,
        businessTotalSales: 5000000,
        businessTotalExpenses: 3500000,
        businessNetProfit: 1500000,
        businessProfitMargin: 30,
        businessAvgTransaction: 5000,
        businessTxnCount: 1000
      }
    });
  }

  console.log('✅ Ledgers seeded');
}

async function seedTransactions() {
  console.log('🌱 Seeding transactions...');

  const users = await prisma.user.findMany();
  const ledgers = await prisma.ledger.findMany();

  for (const ledger of ledgers) {
    const isBusiness = ledger.type === 'BUSINESS';
    const count = isBusiness ? 20 : 10;

    for (let i = 0; i < count; i++) {
      const type = i % 3 === 0 ? 'CREDIT' : 'DEBIT';
      const amount = isBusiness
        ? Math.floor(Math.random() * 50000) + 5000
        : Math.floor(Math.random() * 50000) + 1000;

      await prisma.transaction.create({
        data: {
          userId: ledger.userId,
          ledgerId: ledger.id,
          type,
          amount,
          currency: 'NGN',
          narration: isBusiness
            ? (type === 'CREDIT' ? 'Sales from shop' : 'Supplier payment')
            : (type === 'CREDIT' ? 'Salary' : 'Grocery shopping'),
          timestamp: new Date(Date.now() - i * 86400000),
          category: type === 'DEBIT' ? (i % 2 === 0 ? 'NEEDS' : 'WANTS') : null
        }
      });
    }
  }

  console.log('✅ Transactions seeded');
}

async function seedEconomicIndicators() {
  console.log('🌱 Seeding economic indicators...');

  for (const indicator of ECONOMIC_INDICATORS) {
    await prisma.economicIndicator.upsert({
      where: { code: indicator.code },
      update: {},
      create: indicator
    });
  }

  console.log('✅ Economic indicators seeded');
}

async function seedInterpretationRules() {
  console.log('🌱 Seeding interpretation rules...');

  for (const rule of INTERPRETATION_RULES) {
    await prisma.interpretationRule.upsert({
      where: { code: rule.code },
      update: {},
      create: rule
    });
  }

  console.log('✅ Interpretation rules seeded');
}

async function seedGoals() {
  console.log('🌱 Seeding goals...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    await prisma.goal.upsert({
      where: {
        id: user.id + '-savings-goal'
      },
      update: {},
      create: {
        id: user.id + '-savings-goal',
        userId: user.id,
        title: 'Build Emergency Fund',
        description: 'Save 6 months of expenses for emergencies',
        category: 'SAVINGS',
        goalType: 'numeric',
        targetValue: 2400000,
        currentValue: 450000,
        unit: '₦',
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        progress: 18.75,
        status: 'IN_PROGRESS',
        priority: 'HIGH'
      }
    });
  }

  console.log('✅ Goals seeded');
}

async function seedBusinessProfile() {
  console.log('🌱 Seeding business profiles...');

  const users = await prisma.user.findMany();

  for (const user of users) {
    if (user.email.includes('business')) {
      await prisma.businessProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          businessName: 'Sample Retail Store',
          businessType: 'retail',
          industry: 'retail',
          pricingStrategy: 'cost_plus',
          pricingFrequency: 'monthly',
          fixedCosts: 150000,
          variableCostRatio: 0.6,
          monthlyRevenueTarget: 1000000,
          profitMarginTarget: 25,
          currency: 'NGN'
        }
      });

      // Add some products
      const profile = await prisma.businessProfile.findUnique({
        where: { userId: user.id }
      });

      if (profile) {
        const products = [
          { name: 'Groundnut Oil (1L)', currentPrice: 1500, cogs: 1000, sku: 'GNO-001' },
          { name: 'Rice (50kg)', currentPrice: 45000, cogs: 35000, sku: 'RICE-050' },
          { name: 'Beverages (carton)', currentPrice: 3000, cogs: 2400, sku: 'BEV-CART' }
        ];

        for (const product of products) {
          await prisma.product.upsert({
            where: { id: profile.id + '-' + product.sku },
            update: {},
            create: {
              id: profile.id + '-' + product.sku,
              businessProfileId: profile.id,
              ...product
            }
          });
        }
      }
    }
  }

  console.log('✅ Business profiles seeded');
}

// ==========================================
// MAIN SEED FUNCTION
// ==========================================

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    await seedUsers();
    await seedLedgers();
    await seedTransactions();
    await seedEconomicIndicators();
    await seedInterpretationRules();
    await seedGoals();
    await seedBusinessProfile();

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Users: ${await prisma.user.count()}`);
    console.log(`  - Ledgers: ${await prisma.ledger.count()}`);
    console.log(`  - Transactions: ${await prisma.transaction.count()}`);
    console.log(`  - Economic Indicators: ${await prisma.economicIndicator.count()}`);
    console.log(`  - Goals: ${await prisma.goal.count()}`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
