/**
 * Interpretation Module Seeder
 * Seeds interpretation rules for generating insights from economic data
 */

import InterpretationRule from '../models/InterpretationRule.js';

// ==========================================
// INTERPRETATION RULES
// ==========================================

const RULES = [
  // === INFLATION RULES ===
  {
    code: 'INFLATION_CRITICAL',
    name: 'Critical Inflation Alert',
    description: 'Alert when inflation is critically high',
    category: 'inflation',
    severity: 'critical',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'INFLATION_RATE', operator: 'gte', value: 20 }
    ],
    titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Immediate Action Required',
    bodyTemplate: 'Inflation has reached {INFLATION_RATE.value}%, significantly above the healthy range of 8-12%. ' +
                  'This is severely impacting your purchasing power. Your costs are rising faster than you can adjust prices.',
    affectedArea: 'cogs',
    impactLevel: 'critical',
    actionRequired: true,
    actionTemplate: '1. Review all pricing immediately\n2. Secure supplier contracts\n3. Reduce non-essential costs',
    actionPriority: 'urgent',
    timeframe: 'immediate',
    relatedIndicators: ['FOOD_INFLATION', 'CORE_INFLATION_RATE'],
    priority: 10
  },
  {
    code: 'INFLATION_HIGH',
    name: 'High Inflation Warning',
    description: 'Warning when inflation is high',
    category: 'inflation',
    severity: 'high',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'INFLATION_RATE', operator: 'between', valueMin: 15, valueMax: 20 }
    ],
    titleTemplate: '⚠️ High Inflation: {INFLATION_RATE.value}% - Monitor Closely',
    bodyTemplate: 'Inflation at {INFLATION_RATE.value}% is above the target range. ' +
                  'Expect continued pressure on raw material costs over the next 1-2 months.',
    affectedArea: 'cogs',
    impactLevel: 'high',
    actionRequired: true,
    actionTemplate: 'Consider gradual price increases of 5-10% over the next month',
    actionPriority: 'high',
    timeframe: '1_month',
    relatedIndicators: ['FOOD_INFLATION'],
    priority: 9
  },
  {
    code: 'INFLATION_MODERATE',
    name: 'Moderate Inflation Notice',
    description: 'Notice for moderate inflation',
    category: 'inflation',
    severity: 'medium',
    insightType: 'trend',
    conditions: [
      { indicatorCode: 'INFLATION_RATE', operator: 'between', valueMin: 12, valueMax: 15 }
    ],
    titleTemplate: '📊 Inflation at {INFLATION_RATE.value}% - Within Manageable Range',
    bodyTemplate: 'Inflation is elevated but manageable. Continue monitoring costs and adjust pricing gradually.',
    affectedArea: 'cogs',
    impactLevel: 'medium',
    actionRequired: false,
    timeframe: '3_months',
    relatedIndicators: ['FOOD_INFLATION'],
    priority: 7
  },
  {
    code: 'FOOD_INFLATION_SPIKE',
    name: 'Food Inflation Spike',
    description: 'Alert when food inflation exceeds general inflation',
    category: 'inflation',
    severity: 'high',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'FOOD_INFLATION', operator: 'gt', compareWith: 'INFLATION_RATE' }
    ],
    titleTemplate: '🥜 Food Costs Rising Faster Than General Inflation',
    bodyTemplate: 'Food inflation at {FOOD_INFLATION.value}% is {FOOD_INFLATION.trend} while ' +
                  'general inflation is {INFLATION_RATE.value}%. Your key raw materials (groundnuts, oils) ' +
                  'are getting more expensive faster than other costs.',
    affectedArea: 'cogs',
    impactLevel: 'high',
    actionRequired: true,
    actionTemplate: 'Lock in groundnut prices now before further increases',
    actionPriority: 'high',
    timeframe: '2_weeks',
    relatedIndicators: ['INFLATION_RATE', 'GROUNDNUT_INDEX'],
    priority: 9
  },

  // === FX RULES ===
  {
    code: 'FX_CRITICAL',
    name: 'Critical FX Rate',
    description: 'Alert when Naira depreciates critically',
    category: 'fx',
    severity: 'critical',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'CURRENCY_USD', operator: 'gte', value: 1700 }
    ],
    titleTemplate: '💱 CRITICAL: Naira at ₦{CURRENCY_USD.value}/$ - Import Costs Soaring',
    bodyTemplate: 'The Naira has weakened to ₦{CURRENCY_USD.value} per USD. ' +
                  'Imported packaging, ingredients, and equipment costs are rising sharply.',
    affectedArea: 'logistics',
    impactLevel: 'critical',
    actionRequired: true,
    actionTemplate: 'Switch to local suppliers where possible and hedge FX exposure',
    actionPriority: 'urgent',
    timeframe: 'immediate',
    relatedIndicators: ['FOREX_RESERVES'],
    priority: 10
  },
  {
    code: 'FX_HIGH_VOLATILITY',
    name: 'High FX Volatility',
    description: 'Warning for high FX rate',
    category: 'fx',
    severity: 'high',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'CURRENCY_USD', operator: 'between', valueMin: 1500, valueMax: 1700 }
    ],
    titleTemplate: '⚠️ Naira at ₦{CURRENCY_USD.value}/$ - Monitor Import Costs',
    bodyTemplate: 'FX rate is elevated. Review your import dependency and consider local alternatives.',
    affectedArea: 'logistics',
    impactLevel: 'high',
    actionRequired: true,
    actionTemplate: 'Calculate FX impact on imported inputs and adjust pricing',
    actionPriority: 'high',
    timeframe: '1_month',
    relatedIndicators: ['FOREX_RESERVES'],
    priority: 8
  },

  // === INTEREST RATE RULES ===
  {
    code: 'INTEREST_RATE_HIGH',
    name: 'High Interest Rate Impact',
    description: 'Impact of high interest rates',
    category: 'interest_rates',
    severity: 'high',
    insightType: 'explanation',
    conditions: [
      { indicatorCode: 'INTEREST_RATE', operator: 'gte', value: 25 }
    ],
    titleTemplate: '🏦 Interest Rate at {INTEREST_RATE.value}% - Borrowing is Expensive',
    bodyTemplate: 'With interest rates at {INTEREST_RATE.value}%, access to credit is tight. ' +
                  'Working capital loans are costly. Focus on internal cash generation.',
    affectedArea: 'capital',
    impactLevel: 'high',
    actionRequired: true,
    actionTemplate: 'Prioritize cash sales and tighten credit terms to customers',
    actionPriority: 'high',
    timeframe: '1_month',
    relatedIndicators: ['INTERBANK_RATE', 'LENDING_RATE'],
    priority: 8
  },

  // === GROWTH RULES ===
  {
    code: 'GDP_CONTRACTION',
    name: 'GDP Contraction Alert',
    description: 'Alert when GDP is contracting',
    category: 'growth',
    severity: 'critical',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'GDP_GROWTH_RATE', operator: 'lt', value: 0 }
    ],
    titleTemplate: '📉 Economy Contracting: GDP Growth at {GDP_GROWTH_RATE.value}%',
    bodyTemplate: 'The economy is shrinking. Consumer demand is likely to weaken. ' +
                  'Focus on essential products and preserve cash.',
    affectedArea: 'demand',
    impactLevel: 'critical',
    actionRequired: true,
    actionTemplate: 'Reduce inventory, focus on cash-preserving strategies',
    actionPriority: 'high',
    timeframe: '3_months',
    relatedIndicators: ['UNEMPLOYMENT_RATE'],
    priority: 9
  },
  {
    code: 'GDP_SLOW_GROWTH',
    name: 'Slow GDP Growth',
    description: 'Notice for slow GDP growth',
    category: 'growth',
    severity: 'medium',
    insightType: 'trend',
    conditions: [
      { indicatorCode: 'GDP_GROWTH_RATE', operator: 'between', valueMin: 1, valueMax: 3 }
    ],
    titleTemplate: '📊 Slow Economic Growth: {GDP_GROWTH_RATE.value}% GDP Growth',
    bodyTemplate: 'Economic growth is sluggish. Consumer spending may be muted. Focus on value offerings.',
    affectedArea: 'demand',
    impactLevel: 'medium',
    actionRequired: false,
    timeframe: '6_months',
    relatedIndicators: ['UNEMPLOYMENT_RATE'],
    priority: 6
  },
  {
    code: 'GDP_HEALTHY',
    name: 'Healthy GDP Growth',
    description: 'Positive growth signal',
    category: 'growth',
    severity: 'low',
    insightType: 'opportunity',
    conditions: [
      { indicatorCode: 'GDP_GROWTH_RATE', operator: 'gte', value: 3 }
    ],
    titleTemplate: '💪 Healthy Growth: {GDP_GROWTH_RATE.value}% GDP Growth',
    bodyTemplate: 'The economy is growing. Consumer demand should be strong. Consider expansion.',
    affectedArea: 'revenue',
    impactLevel: 'low',
    actionRequired: false,
    timeframe: '6_months',
    relatedIndicators: ['UNEMPLOYMENT_RATE'],
    priority: 5
  },

  // === EMPLOYMENT RULES ===
  {
    code: 'UNEMPLOYMENT_HIGH',
    name: 'High Unemployment Impact',
    description: 'Impact of high unemployment',
    category: 'employment',
    severity: 'medium',
    insightType: 'explanation',
    conditions: [
      { indicatorCode: 'UNEMPLOYMENT_RATE', operator: 'gte', value: 6 }
    ],
    titleTemplate: '👥 Unemployment at {UNEMPLOYMENT_RATE.value}% - Purchasing Pressure',
    bodyTemplate: 'High unemployment means reduced disposable income for many. Focus on affordable products.',
    affectedArea: 'demand',
    impactLevel: 'medium',
    actionRequired: false,
    timeframe: '3_months',
    relatedIndicators: ['MINIMUM_WAGE'],
    priority: 6
  },

  // === COMBINED RULES ===
  {
    code: 'STAGFLATION_RISK',
    name: 'Stagflation Risk',
    description: 'High inflation + low growth',
    category: 'combined',
    severity: 'critical',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'INFLATION_RATE', operator: 'gte', value: 15 },
      { indicatorCode: 'GDP_GROWTH_RATE', operator: 'lt', value: 2 }
    ],
    titleTemplate: '🔴 STAGFLATION RISK: High Inflation + Low Growth',
    bodyTemplate: 'The economy faces stagflation - prices rising while growth slows. ' +
                  'This is a challenging environment. Preserve cash and reduce non-essential costs.',
    affectedArea: 'all',
    impactLevel: 'critical',
    actionRequired: true,
    actionTemplate: '1. Minimize inventory\n2. Tighten credit\n3. Focus on essential products',
    actionPriority: 'urgent',
    timeframe: 'immediate',
    relatedIndicators: ['INFLATION_RATE', 'GDP_GROWTH_RATE', 'UNEMPLOYMENT_RATE'],
    priority: 10
  },
  {
    code: 'COST_PRESSURE_COMBO',
    name: 'Combined Cost Pressure',
    description: 'High FX + High Inflation',
    category: 'combined',
    severity: 'high',
    insightType: 'alert',
    conditions: [
      { indicatorCode: 'CURRENCY_USD', operator: 'gte', value: 1500 },
      { indicatorCode: 'FOOD_INFLATION', operator: 'gte', value: 15 }
    ],
    titleTemplate: '⚠️ Double Cost Pressure: FX + Food Inflation',
    bodyTemplate: 'Both imported costs (FX: ₦{CURRENCY_USD.value}/$) and domestic food costs ({FOOD_INFLATION.value}%) ' +
                  'are elevated. Your cost base is under pressure from both sides.',
    affectedArea: 'cogs',
    impactLevel: 'high',
    actionRequired: true,
    actionTemplate: 'Increase prices by 10-15% and actively seek local suppliers',
    actionPriority: 'high',
    timeframe: '2_weeks',
    relatedIndicators: ['CURRENCY_USD', 'FOOD_INFLATION', 'INFLATION_RATE'],
    priority: 9
  },

  // === POSITIVE RULES ===
  {
    code: 'FAVORABLE_ENVIRONMENT',
    name: 'Favorable Business Environment',
    description: 'Positive economic conditions',
    category: 'combined',
    severity: 'info',
    insightType: 'opportunity',
    conditions: [
      { indicatorCode: 'INFLATION_RATE', operator: 'lt', value: 12 },
      { indicatorCode: 'GDP_GROWTH_RATE', operator: 'gte', value: 3 },
      { indicatorCode: 'INTEREST_RATE', operator: 'lte', value: 20 }
    ],
    titleTemplate: '✅ Favorable Environment for Growth',
    bodyTemplate: 'Economic conditions are favorable: moderate inflation ({INFLATION_RATE.value}%), ' +
                  'healthy GDP growth ({GDP_GROWTH_RATE.value}%), and manageable interest rates ({INTEREST_RATE.value}%). ' +
                  'Good time to consider expansion.',
    affectedArea: 'revenue',
    impactLevel: 'low',
    actionRequired: false,
    timeframe: '6_months',
    relatedIndicators: ['INFLATION_RATE', 'GDP_GROWTH_RATE', 'INTEREST_RATE'],
    priority: 7
  }
];

// ==========================================
// SEEDER FUNCTIONS
// ==========================================

/**
 * Seed interpretation rules
 */
export async function seedRules(options = {}) {
  const { force = false, dryRun = false } = options;

  console.log('🌱 Seeding Interpretation Rules...');

  if (dryRun) {
    console.log(`   Would seed ${RULES.length} rules`);
    return { success: true, count: RULES.length };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const rule of RULES) {
    try {
      const existing = await InterpretationRule.findOne({ code: rule.code });

      if (existing) {
        if (force) {
          await InterpretationRule.updateOne(
            { code: rule.code },
            { $set: rule }
          );
          updated++;
        } else {
          skipped++;
        }
      } else {
        await InterpretationRule.create(rule);
        created++;
      }
    } catch (error) {
      console.error(`   Error seeding rule ${rule.code}:`, error.message);
    }
  }

  console.log(`   ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { success: true, created, updated, skipped };
}

/**
 * Seed all interpretation data
 */
export async function seedAll(options = {}) {
  console.log('\n🌱=== Seeding Interpretation Module ===\n');

  const result = await seedRules(options);

  console.log('\n✅ Interpretation Module Seeding Complete!\n');

  return {
    success: true,
    rules: result
  };
}

export default {
  seedRules,
  seedAll,
  RULES
};
