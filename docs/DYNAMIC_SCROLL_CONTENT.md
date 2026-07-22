# Dynamic Scroll Content Implementation

## Summary

The Micro and Macro Economic Interpretation scrolls now fetch **real-time dynamic data** from the Finance and Dream modules instead of displaying hardcoded values.

---

## New API Endpoints

### Micro Economic Interpretation (Finance Module)

**Endpoint:** `GET /api/interpret/micro`

**Description:** Returns dynamic plain English interpretation of personal finance data from the Finance module.

**Response Data:**
```json
{
  "success": true,
  "interpretation": {
    "title": "📘 Finance Module — Plain English Interpretation",
    "lastUpdated": "2025-01-15T10:30:00.000Z",
    "items": [
      {
        "icon": "💚",
        "label": "Safe-to-Spend (Discretionary)",
        "value": "₦45,000",
        "context": "You have healthy discretionary income for non-essentials",
        "recommendation": null
      },
      {
        "icon": "🪣",
        "label": "Budget Buckets",
        "value": "Needs 85% • Wants 60% • Savings 40%",
        "context": "Needs: ₦85,000 of ₦100,000 used",
        "breakdown": [...],
        "recommendation": "Needs spending over budget - review essential expenses"
      },
      {
        "icon": "📉",
        "label": "Burn Rate",
        "value": "₦2,500/day",
        "context": "Projected monthly spend: ₦75,000",
        "trend": "burning",
        "recommendation": null
      },
      {
        "icon": "🏦",
        "label": "Vault (Total Balance)",
        "value": "₦350,000",
        "context": "Net cash flow: +₦50,000 this month",
        "trend": "positive",
        "recommendation": null
      },
      {
        "icon": "✈️",
        "label": "Runway",
        "value": "4 months",
        "context": "Healthy runway - you have buffer",
        "runwayDays": 120,
        "recommendation": null
      }
    ],
    "summary": "Financial health looks good - keep tracking!",
    "metrics": {
      "safeToSpend": 45000,
      "burnRate": 2500,
      "runwayDays": 120,
      "balance": 350000,
      "netCashFlow": 50000
    }
  }
}
```

**Features:**
- **Safe-to-Spend Calculation**: Discretionary income = (Remaining budget) + (Unallocated income)
- **Budget Buckets**: 50:30:20 breakdown with percent utilization
- **Burn Rate**: Daily average spending with monthly projection
- **Vault**: Total balance with net cash flow trend
- **Runway**: Time until cash runs out, with health status
- **Dynamic Recommendations**: Context-aware suggestions based on financial health

---

### Macro Economic Interpretation (Dream Module)

**Endpoint:** `GET /api/interpret/macro`

**Description:** Returns dynamic plain English interpretation of economic indicators from the Dream module.

**Response Data:**
```json
{
  "success": true,
  "interpretation": {
    "title": "🌍 Dream Module — Plain English Interpretation",
    "lastUpdated": "2025-01-15T10:30:00.000Z",
    "items": [
      {
        "icon": "🟡",
        "label": "Inflation Rate",
        "value": "18.5%",
        "context": "Elevated inflation - monitor costs closely",
        "trend": "up",
        "change": "+2.3% vs last month",
        "recommendation": "Review pricing strategy and negotiate with suppliers"
      },
      {
        "icon": "💱",
        "label": "FX Rate (USD/NGN)",
        "value": "₦1,650.00/$",
        "context": "Naira significantly weakened - import costs soaring",
        "trend": "up",
        "change": "+5.1% vs last month",
        "recommendation": "Hedge currency risk - lock in FX rates for imports"
      },
      {
        "icon": "🥜",
        "label": "Food Inflation (Raw Materials)",
        "value": "28.3%",
        "context": "Raw material costs up ₦140/kg from baseline",
        "impact": "Current estimated: ₦640/kg",
        "trend": "up",
        "change": "+3.2% vs last month",
        "recommendation": "Lock in bulk raw material purchases before further hikes"
      },
      {
        "icon": "📈",
        "label": "Interest Rate (MPR)",
        "value": "24.8%",
        "context": "High interest rates - borrowing costs elevated",
        "trend": "stable",
        "change": "+0.5% vs last month",
        "recommendation": "Minimize borrowing - prioritize internal funding"
      },
      {
        "icon": "📊",
        "label": "GDP Growth Rate",
        "value": "2.1%",
        "context": "Slow growth - conservative approach recommended",
        "trend": "down",
        "change": "-0.3% vs last quarter",
        "recommendation": "Focus on essential products - reduce inventory"
      }
    ],
    "summary": "Economic Stress: Elevated Inflation, FX Pressure, Food Cost Surge",
    "healthScore": 58,
    "overallStress": "high",
    "metrics": {
      "inflation": 18.5,
      "fxRate": 1650,
      "foodInflation": 28.3,
      "interestRate": 24.8,
      "gdpGrowth": 2.1
    }
  }
}
```

**Features:**
- **Economic Indicators**: Inflation, FX Rate, Food Inflation, Interest Rate, GDP Growth
- **Stress Level Analysis**: Automatic assessment of economic pressure
- **Trend Tracking**: Directional movement (up/down/stable)
- **Contextual Interpretation**: Plain English explanations of what indicators mean
- **Dynamic Recommendations**: Actionable business guidance based on economic conditions

---

## Deterministic Reasoning Logic

### Micro Economic (Finance)

The interpretation uses deterministic if-then logic:

```
Safe-to-Spend Status:
  IF > ₦50,000 → "healthy" 💚
  ELSE IF > ₦10,000 → "moderate" 💛
  ELSE → "low" ❤️

Budget Status:
  IF needs > 100% → "Needs over budget"
  IF wants > 100% → "Wants over budget"  
  IF savings < 50% → "Behind on savings target"

Burn Rate:
  IF daily > (budget/30) → "burning" 🔥
  ELSE → "stable" 📉

Runway:
  IF >= 60 days → "healthy" ✈️
  IF >= 30 days → "moderate" 🛫
  IF >= 14 days → "warning" ⚠️
  ELSE → "critical" 🚨
```

### Macro Economic (Dream)

The interpretation uses deterministic thresholds:

```
Inflation:
  IF >= 25% → "severe" 🔴
  IF >= 20% → "high" 🟠
  IF >= 15% → "elevated" 🟡
  ELSE → "low" 🟢

FX Rate:
  IF >= ₦1,700 → "severe"
  IF >= ₦1,600 → "high"
  IF >= ₦1,500 → "elevated"
  ELSE → "stable"

Food Inflation:
  IF >= 30% → "severe" 🥜
  IF >= 25% → "high"
  IF >= 20% → "elevated"
  ELSE → "moderate"

Interest Rate:
  IF >= 25% → "high" 📈
  IF >= 20% → "elevated"
  ELSE → "moderate" 📊

GDP Growth:
  IF >= 3% → "growing" 📈
  IF >= 1% → "slow" 📊
  IF >= 0% → "stagnant" ➡️
  ELSE → "contracting" 📉
```

---

## Files Modified

| File | Changes |
|------|---------|
| `backend/src/controllers/interpretationController.js` | Added `getMicroEconomicInterpretation` and `getMacroEconomicInterpretation` functions |
| `backend/src/routes/interpretation.js` | Added routes `/micro` and `/macro` |
| `backend/src/app.js` | Updated API documentation |

---

## How to Use

### Frontend Integration

Replace the hardcoded scroll content with dynamic API calls:

```javascript
// Micro Economic Interpretation (Finance)
fetch('/api/interpret/micro', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    // Update the Micro Economic Scroll
    updateMicroScroll(data.interpretation);
  });

// Macro Economic Interpretation (Dream)
fetch('/api/interpret/macro', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    // Update the Macro Economic Scroll
    updateMacroScroll(data.interpretation);
  });
```

---

## Response When No Data

If the user has no finance data yet:

```json
{
  "success": true,
  "interpretation": {
    "title": "📘 Finance Module — Plain English Interpretation",
    "items": [
      {
        "icon": "💡",
        "label": "Getting Started",
        "value": "Set up your budget to see personalized insights",
        "context": "Add your monthly income and expenses to begin tracking"
      }
    ],
    "summary": "No finance data available yet"
  }
}
```

---

## Summary

- ✅ **Micro Economic Scroll** now displays **real Finance module data**
- ✅ **Macro Economic Scroll** now displays **real Dream module data**
- ✅ Content updates **dynamically** as user data changes
- ✅ Uses **deterministic reasoning** for consistent interpretation
- ✅ Provides **contextual recommendations** based on current conditions
