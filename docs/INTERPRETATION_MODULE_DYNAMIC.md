# Fully Dynamic Interpretation Module - Complete

> Historical module reference. These contracts are not the deployed consumer API. For current runtime boundaries, see [Consumer implementation](CONSUMER_LOCAL_IMPLEMENTATION.md).

## ✅ Status: COMPLETE

The Interpretation module now supports full customization with industry-specific templates and user overrides for insight generation.

---

## 📋 What Was Changed

### 1. Insight Template Model
**File:** `backend/src/models/InsightTemplate.js`

A new model for storing industry-specific and user-customizable insight templates:

**Features:**
- Industry-specific templates (manufacturing, retail, service, agriculture, technology, trading)
- User-customizable templates that override defaults
- Dynamic severity calculation based on business context
- Dynamic affected area mapping
- Industry-specific variables (e.g., {keyRawMaterial}, {keyProduct})
- Priority adjustment per template

**Template Structure:**
```javascript
{
  code: 'INFLATION_CRITICAL',
  type: 'industry', // or 'user', 'system'
  industry: 'manufacturing',
  templates: {
    titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}%...',
    bodyTemplate: 'Manufacturing input costs are surging...',
    actionTemplate: '1. Review supplier contracts...'
  },
  industryVariables: {
    keyRawMaterial: 'raw materials'
  },
  severityConfig: {
    useCustom: true,
    rules: [
      { condition: 'INFLATION_RATE > 25', severity: 'critical' }
    ]
  },
  affectedAreaConfig: {
    useCustom: true,
    mappings: [
      { businessContext: 'import_dependent', affectedArea: 'logistics' }
    ]
  }
}
```

---

### 2. Updated Insight Model
**File:** `backend/src/models/Insight.js`

Modified `createFromRule` to accept custom templates:

**Changes:**
- Now accepts `customTemplate` parameter
- Applies custom templates with industry variables
- Calculates dynamic severity
- Maps dynamic affected areas

---

### 3. Updated Interpretation Controller
**File:** `backend/src/controllers/interpretationController.js`

Modified `generateInsights` to use custom templates:

**Changes:**
- Fetches user's business profile for industry context
- Loads custom templates for triggered rules
- Passes templates to insight generation
- Applies industry-specific variables

---

### 4. Admin Template Management
**Files:**
- `backend/src/controllers/adminController.js` - Added 7 template functions
- `backend/src/routes/admin.js` - Added 7 template endpoints

**New Endpoints:**
- `GET /api/admin/templates` - Get all templates
- `GET /api/admin/templates/:ruleCode` - Get specific template
- `PUT /api/admin/templates/:ruleCode` - Create/update custom template
- `DELETE /api/admin/templates/:templateId` - Delete custom template
- `POST /api/admin/templates/:ruleCode/reset` - Reset to default
- `GET /api/admin/templates/:ruleCode/preview` - Preview with sample data
- `POST /api/admin/templates/seed` - Seed industry templates

---

## 🏭 Industry-Specific Templates

### Manufacturing
```javascript
INFLATION_CRITICAL: {
  title: "🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Production Costs Rising",
  body: "Manufacturing input costs are surging... Your {keyRawMaterial} procurement strategy...",
  variables: { keyRawMaterial: "raw materials" }
}

FX_CRITICAL: {
  title: "💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Import Costs Soaring",
  body: "Your imported machinery and {keyRawMaterial} costs are soaring...",
  variables: { keyRawMaterial: "imported components" }
}
```

### Retail
```javascript
INFLATION_CRITICAL: {
  title: "🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Shelf Prices Under Pressure",
  body: "Retail costs are rising... Your COGS for {keyProduct} categories...",
  variables: { keyProduct: "key products" }
}

FX_CRITICAL: {
  title: "💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Imported Goods Cost More",
  body: "Imported retail goods now cost more... Your {keyCategory} category margins...",
  variables: { keyCategory: "imported products" }
}
```

### Service
```javascript
INFLATION_CRITICAL: {
  title: "🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Service Costs Rising",
  body: "Your operational costs for {keyCost} are increasing...",
  variables: { keyCost: "key cost centers" }
}

FX_CRITICAL: {
  title: "💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Equipment & Software Costs Up",
  body: "Imported equipment, software licenses... Your {keyCost} overhead...",
  variables: { keyCost: "technology expenses" }
}
```

### Agriculture
```javascript
INFLATION_CRITICAL: {
  title: "🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Farm Input Costs Surging",
  body: "Agricultural inputs (fertilizer, feed, equipment)... Your {keyCrop} production...",
  variables: { keyCrop: "key crops" }
}

FX_CRITICAL: {
  title: "💱 CRITICAL: FX Rate ₦{CURRENCY_USD.value}/$ - Equipment & Chemicals Cost More",
  body: "Imported farm equipment and chemicals... Your {keyCrop} efficiency...",
  variables: { keyCrop: "key crops" }
}
```

---

## 📊 Template Hierarchy

Templates are applied in the following priority order:

1. **User Template** - Highest priority, completely custom
2. **Industry Template** - Industry-specific defaults
3. **System Template** - Generic fallback

```
User requests insight for INFLATION_CRITICAL:
  ↓
Check for user's custom template?
  ↓ Yes → Use user template
  ↓ No
Check for industry template (e.g., manufacturing)?
  ↓ Yes → Use industry template
  ↓ No
Use system/default template
```

---

## 🎯 Dynamic Severity Calculation

Templates can define custom severity rules:

```javascript
severityConfig: {
  useCustom: true,
  rules: [
    { condition: 'INFLATION_RATE > 30', severity: 'critical' },
    { condition: 'INFLATION_RATE > 20', severity: 'high' },
    { condition: 'INFLATION_RATE > 15', severity: 'medium' }
  ]
}
```

The system evaluates conditions in order and uses the first matching rule.

---

## 🗺️ Dynamic Affected Area Mapping

Templates can map business context to affected areas:

```javascript
affectedAreaConfig: {
  useCustom: true,
  mappings: [
    { businessContext: 'import_dependent', affectedArea: 'logistics' },
    { businessContext: 'local_supplier', affectedArea: 'cogs' },
    { businessContext: 'export_oriented', affectedArea: 'revenue' }
  ]
}
```

---

## 📝 API Usage Examples

### Get All Templates

```http
GET /api/admin/templates?type=industry&industry=manufacturing
Authorization: Bearer {token}
```

### Get Template for Rule

```http
GET /api/admin/templates/INFLATION_CRITICAL
Authorization: Bearer {token}
```

Returns user template, industry template, or system template (in priority order).

### Create Custom Template

```http
PUT /api/admin/templates/INFLATION_CRITICAL
Authorization: Bearer {token}
Content-Type: application/json

{
  "titleTemplate": "⚠️ HIGH INFLATION ALERT: {INFLATION_RATE.value}%",
  "bodyTemplate": "Inflation is impacting our {specialFocus}. Please review pricing.",
  "actionTemplate": "1. Check {specialFocus} costs\n2. Adjust prices",
  "industryVariables": {
    "specialFocus": "groundnut processing"
  },
  "priorityAdjustment": 2
}
```

### Preview Template

```http
GET /api/admin/templates/INFLATION_CRITICAL/preview?industry=manufacturing
Authorization: Bearer {token}
```

Returns the template with sample indicator values applied.

### Reset to Default

```http
POST /api/admin/templates/INFLATION_CRITICAL/reset
Authorization: Bearer {token}
```

Deletes the user custom template, reverting to industry/system defaults.

### Seed Industry Templates

```http
POST /api/admin/templates/seed
Authorization: Bearer {token}
```

Creates all industry-specific templates for manufacturing, retail, service, and agriculture.

---

## 🔄 How It Works

### Before (Fully Hardcoded):
```javascript
// In seeder
{
  code: 'INFLATION_CRITICAL',
  titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}%',
  bodyTemplate: 'Inflation has reached {INFLATION_RATE.value}%, significantly above...',
  severity: 'critical',
  affectedArea: 'cogs'
}
```

### After (Fully Dynamic):
```javascript
// 1. Industry template provides contextual messaging
{
  code: 'INFLATION_CRITICAL',
  type: 'industry',
  industry: 'manufacturing',
  titleTemplate: '🔴 CRITICAL: Inflation at {INFLATION_RATE.value}% - Production Costs Rising',
  bodyTemplate: 'Manufacturing input costs are surging... Your {keyRawMaterial} procurement...',
  industryVariables: { keyRawMaterial: 'raw materials' }
}

// 2. User can override
PUT /api/admin/templates/INFLATION_CRITICAL
{
  "industryVariables": { "keyRawMaterial": "groundnut oil processing" }
}

// 3. Insight generation uses custom template
// Title: "🔴 CRITICAL: Inflation at 18.5% - Production Costs Rising"
// Body: "Manufacturing input costs are surging... Your groundnut oil processing procurement..."
```

---

## 📁 Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `models/InsightTemplate.js` | 350+ | Template model with industry support |
| `docs/INTERPRETATION_MODULE_DYNAMIC.md` | This file | Complete documentation |

---

## 📝 Files Modified

| File | Changes |
|------|---------|
| `models/Insight.js` | Added template support to createFromRule |
| `controllers/interpretationController.js` | Uses custom templates when generating insights |
| `controllers/adminController.js` | Added 7 template management functions |
| `routes/admin.js` | Added 7 template endpoints |

---

## 🎯 Summary

The Interpretation module is now **fully dynamic** with:

✅ **Industry-Specific Templates** - Different messaging for manufacturing, retail, service, agriculture

✅ **User Customization** - Each user can create their own templates

✅ **Dynamic Severity** - Severity calculated based on business context

✅ **Dynamic Affected Areas** - Mapped based on business type

✅ **Industry Variables** - Contextual placeholders like {keyRawMaterial}, {keyProduct}

✅ **Template Hierarchy** - User > Industry > System fallback

✅ **7 New Admin Endpoints** - Full CRUD for templates

✅ **Preview & Reset** - Test templates before using, revert to defaults

---

## 📚 Related Documentation

- [HARDCODED_DATA_REMOVAL.md](./HARDCODED_DATA_REMOVAL.md) - Economic data dynamic updates
- [STRATEGY_MODULE_COMPLETE.md](./STRATEGY_MODULE_COMPLETE.md) - Strategy module docs
- [FINANCE_MODULE_COMPLETE.md](./FINANCE_MODULE_COMPLETE.md) - Finance module docs

---

*Last Updated: July 2026*
