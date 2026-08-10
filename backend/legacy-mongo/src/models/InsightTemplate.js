/**
 * Insight Template Model
 * Stores industry-specific and user-customizable insight templates
 * Allows dynamic generation of insights with custom messaging
 */

import mongoose from 'mongoose';

// ==========================================
// TEMPLATE CONTENT SUB-SCHEMA
// ==========================================

const templateContentSchema = new mongoose.Schema({
  titleTemplate: {
    type: String,
    required: true,
    trim: true
    // Example: "🔴 CRITICAL: Inflation at {INFLATION_RATE.value}%"
  },
  bodyTemplate: {
    type: String,
    required: true,
    trim: true
    // Example: "Inflation has reached {INFLATION_RATE.value}%, impacting your {industry} business."
  },
  actionTemplate: {
    type: String,
    trim: true
    // Example: "1. Review pricing\n2. Secure supplier contracts"
  }
}, { _id: false });

// ==========================================
// MAIN SCHEMA
// ==========================================

const insightTemplateSchema = new mongoose.Schema({
  // Owner (null = system/industry template, userId = user custom)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // Template Identity
  code: {
    type: String,
    required: true,
    trim: true
    // Maps to InterpretationRule.code
  },

  // Template Classification
  type: {
    type: String,
    enum: ['industry', 'user', 'system'],
    default: 'user'
  },

  industry: {
    type: String,
    enum: ['manufacturing', 'retail', 'service', 'trading', 'agriculture', 'technology', 'other'],
    default: 'retail'
  },

  businessType: {
    type: String,
    enum: ['import_dependent', 'local_supplier', 'export_oriented', 'domestic_only'],
    default: null
  },

  // Template Content
  templates: {
    type: templateContentSchema,
    required: true
  },

  // Dynamic Severity Configuration
  severityConfig: {
    useCustom: {
      type: Boolean,
      default: false
    },
    rules: [{
      condition: String, // "value > 25"
      severity: String  // "critical"
    }]
  },

  // Dynamic Affected Area Configuration
  affectedAreaConfig: {
    useCustom: {
      type: Boolean,
      default: false
    },
    mappings: [{
      businessContext: String, // "import_dependent"
      affectedArea: String     // "logistics"
    }]
  },

  // Priority Adjustment
  priorityAdjustment: {
    type: Number,
    default: 0,
    min: -5,
    max: 5
  },

  // Industry-Specific Variables
  industryVariables: {
    // Custom variables that can be used in templates
    type: Map,
    of: String
    // Example: { "keyRawMaterial": "groundnuts", "mainMarket": "Lagos" }
  },

  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String,

  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==========================================
// INDEXES
// ==========================================

insightTemplateSchema.index({ userId: 1, code: 1 }, { unique: true, sparse: true });
insightTemplateSchema.index({ type: 1, industry: 1, code: 1 });
insightTemplateSchema.index({ isDeleted: 1 });

// ==========================================
// INSTANCE METHODS
// ==========================================

/**
 * Apply template variables to content
 */
insightTemplateSchema.methods.applyVariables = function(data, variables = {}) {
  const result = {
    titleTemplate: this.replaceVariables(this.templates.titleTemplate, data, variables),
    bodyTemplate: this.replaceVariables(this.templates.bodyTemplate, data, variables),
    actionTemplate: this.templates.actionTemplate
      ? this.replaceVariables(this.templates.actionTemplate, data, variables)
      : null
  };

  return result;
};

/**
 * Replace variables in template
 */
insightTemplateSchema.methods.replaceVariables = function(template, data, variables) {
  let result = template;

  // Replace data variables {INDICATOR_CODE.value}
  Object.keys(data).forEach(key => {
    const item = data[key];
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(prop => {
        const pattern = new RegExp(`\\{${key}\\.${prop}\\}`, 'g');
        result = result.replace(pattern, item[prop] !== undefined ? item[prop] : '');
      });
    }
  });

  // Replace industry variables
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(pattern, value);
  });

  return result;
};

/**
 * Calculate dynamic severity based on config
 */
insightTemplateSchema.methods.calculateSeverity = function(indicatorValues, defaultSeverity) {
  if (!this.severityConfig.useCustom || !this.severityConfig.rules.length) {
    return defaultSeverity;
  }

  for (const rule of this.severityConfig.rules) {
    if (this.evaluateCondition(rule.condition, indicatorValues)) {
      return rule.severity;
    }
  }

  return defaultSeverity;
};

/**
 * Evaluate a condition string
 */
insightTemplateSchema.methods.evaluateCondition = function(condition, data) {
  try {
    // Simple condition evaluator
    // Replace indicators with values
    let expr = condition;

    Object.keys(data).forEach(key => {
      const value = data[key]?.value ?? data[key];
      if (typeof value === 'number') {
        const pattern = new RegExp(`\\b${key}\\b`, 'g');
        expr = expr.replace(pattern, value.toString());
      }
    });

    // Safe evaluation (only numeric comparisons)
    // eslint-disable-next-line no-new-func
    return new Function('return ' + expr)();
  } catch {
    return false;
  }
};

/**
 * Get affected area based on config
 */
insightTemplateSchema.methods.getAffectedArea = function(businessContext, defaultArea) {
  if (!this.affectedAreaConfig.useCustom || !this.affectedAreaConfig.mappings.length) {
    return defaultArea;
  }

  const mapping = this.affectedAreaConfig.mappings.find(
    m => m.businessContext === businessContext
  );

  return mapping?.affectedArea || defaultArea;
};

// ==========================================
// STATIC METHODS
// ==========================================

/**
 * Find template for rule and user
 */
insightTemplateSchema.statics.findTemplate = async function(ruleCode, userId, industry = 'retail') {
  // First look for user-specific template
  const userTemplate = await this.findOne({
    userId,
    code: ruleCode,
    isDeleted: false
  });

  if (userTemplate) return userTemplate;

  // Then look for industry-specific template
  const industryTemplate = await this.findOne({
    userId: null,
    code: ruleCode,
    type: 'industry',
    industry,
    isDeleted: false
  });

  if (industryTemplate) return industryTemplate;

  // Finally look for generic system template
  return this.findOne({
    userId: null,
    code: ruleCode,
    type: 'system',
    isDeleted: false
  });
};

/**
 * Get industry-specific defaults
 */
insightTemplateSchema.statics.getIndustryDefaults = function(industry) {
  const defaults = {
    manufacturing: {
      INFLATION_CRITICAL: {
        titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Production Costs Rising',
        bodyTemplate: 'Manufacturing input costs are surging with inflation at {INFLATION_RATE.value}%. ' +
                     'Your raw material, energy, and labor costs are all under pressure. ' +
                     'Consider adjusting your {keyRawMaterial} procurement strategy.',
        actionTemplate: '1. Review supplier contracts\n2. Consider local alternatives for imported inputs\n3. Optimize production efficiency',
        industryVariables: { keyRawMaterial: 'raw materials' }
      },
      FX_CRITICAL: {
        titleTemplate: '💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Import Costs Soaring',
        bodyTemplate: 'Your imported machinery and raw material costs are soaring with the FX rate. ' +
                     'Production costs for {keyRawMaterial} are directly impacted.',
        actionTemplate: '1. Negotiate FX-forward contracts\n2. Seek local suppliers\n3. Increase prices for FX-sensitive products',
        industryVariables: { keyRawMaterial: 'imported components' }
      }
    },
    retail: {
      INFLATION_CRITICAL: {
        titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Shelf Prices Under Pressure',
        bodyTemplate: 'Retail costs are rising across the board. Your COGS for {keyProduct} categories ' +
                     'are increasing faster than shelf prices can adjust.',
        actionTemplate: '1. Review pricing strategy for {keyProduct}\n2. Negotiate with suppliers\n3. Consider shrinkage reduction',
        industryVariables: { keyProduct: 'key products' }
      },
      FX_CRITICAL: {
        titleTemplate: '💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Imported Goods Cost More',
        bodyTemplate: 'Imported retail goods now cost significantly more. ' +
                     'Your {keyCategory} category margins are being squeezed.',
        actionTemplate: '1. Increase prices on imported items\n2. Promote local alternatives\n3. Reassess product mix',
        industryVariables: { keyCategory: 'imported products' }
      }
    },
    service: {
      INFLATION_CRITICAL: {
        titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Service Costs Rising',
        bodyTemplate: 'Your operational costs for {keyCost} are increasing with inflation. ' +
                     'Service pricing may need adjustment to maintain margins.',
        actionTemplate: '1. Review service pricing\n2. Optimize {keyCost} usage\n3. Improve productivity',
        industryVariables: { keyCost: 'key cost centers' }
      },
      FX_CRITICAL: {
        titleTemplate: '💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Equipment & Software Costs Up',
        bodyTemplate: 'Imported equipment, software licenses, and cloud services cost more with FX pressure. ' +
                     'Your technology overhead is increasing.',
        actionTemplate: '1. Review software subscriptions\n2. Prioritize local solutions\n3. Bundle services to improve margins',
        industryVariables: { keyCost: 'technology expenses' }
      }
    },
    agriculture: {
      INFLATION_CRITICAL: {
        titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Farm Input Costs Surging',
        bodyTemplate: 'Agricultural inputs (fertilizer, feed, equipment) are costing more. ' +
                     'Your {keyCrop} production margins are under pressure.',
        actionTemplate: '1. Secure fertilizer and feed supply\n2. Review pricing for {keyCrop}\n3. Consider value-added processing',
        industryVariables: { keyCrop: 'key crops' }
      },
      FX_CRITICAL: {
        titleTemplate: '💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Equipment & Chemicals Cost More',
        bodyTemplate: 'Imported farm equipment and chemicals now cost significantly more. ' +
                     'Your production efficiency may be impacted.',
        actionTemplate: '1. Source local alternatives\n2. Form equipment cooperatives\n3. Consider crop substitution',
        industryVariables: { keyCrop: 'key crops' }
      }
    }
  };

  return defaults[industry] || defaults.retail;
};

/**
 * Seed industry-specific templates
 */
insightTemplateSchema.statics.seedIndustryTemplates = async function() {
  const industries = ['manufacturing', 'retail', 'service', 'agriculture'];
  const ruleCodes = ['INFLATION_CRITICAL', 'FX_CRITICAL', 'INTEREST_RATE_HIGH', 'GDP_CONTRACTION'];

  let seeded = 0;

  for (const industry of industries) {
    const defaults = this.getIndustryDefaults(industry);

    for (const code of ruleCodes) {
      const template = defaults[code];
      if (!template) continue;

      const existing = await this.findOne({
        userId: null,
        code,
        type: 'industry',
        industry
      });

      if (!existing) {
        await this.create({
          userId: null,
          code,
          type: 'industry',
          industry,
          templates: {
            titleTemplate: template.titleTemplate,
            bodyTemplate: template.bodyTemplate,
            actionTemplate: template.actionTemplate
          },
          industryVariables: template.industryVariables
        });
        seeded++;
      }
    }
  }

  return { seeded };
};

// ==========================================
// EXPORT
// ==========================================

export default mongoose.model('InsightTemplate', insightTemplateSchema);
