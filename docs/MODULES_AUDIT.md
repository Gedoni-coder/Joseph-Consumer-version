# MODULES DATA AUDIT

## SUMMARY TABLE

┌───────────────┬────────────────┬────────────┬─────────────┐   
│    Module     │     Route      │ Core Value │ Key Output  │   
├───────────────┼────────────────┼────────────┼─────────────┤   
│ Dream         │ /dream         │ Market     │ Commodity   │   
│               │                │ foresight  │ prices,     │   
│               │                │            │ inflation   │   
│               │                │            │ alerts      │   
├───────────────┼────────────────┼────────────┼─────────────┤   
│ Interpretation│ /interpret     │ Context    │ Plain       │   
│               │                │ translation│ English     │   
│               │                │            │ insights    │   
├───────────────┼────────────────┼────────────┼─────────────┤   
│ Finance       │ /finance       │ Capital    │ Budget      │   
│               │                │ protection │ tracking,   │   
│               │                │            │ vault,      │   
│               │                │            │ runway      │   
├───────────────┼────────────────┼────────────┼─────────────┤   
│ Strategy      │ /strategy      │ Actionable │ Pricing,    │   
│               │                │ execution │ procurement,│   
│               │                │            │ goals       │   
└───────────────┴────────────────┴────────────┴─────────────┘   

---

## DREAM MODULE ✅ (IMPLEMENTED)

**Status**: Complete backend implementation

### Parent Data (UI Structure - Hardcoded)
- Module labels ("Dream Module", "Market Radar", etc.)
- Feature badges ("Feature 1", "Feature 2")
- Section headers
- Icon definitions
- Static text

### Child Data (Dynamic - From Database/API)
- 85+ Economic Indicators (grouped by category)
- Economic News items
- Upcoming Events
- Calculated values (health score, stress level, projections)

### Database Collections Created:
1. `EconomicIndicator` - 85+ indicators with history
2. `EconomicNews` - News articles with impact analysis
3. `EconomicEvent` - Upcoming economic events

---

## INTERPRETATION MODULE

**Purpose**: Context translation - converts economic data into plain English insights

### Parent Data (Hardcoded)
- Section labels ("Interpretation", "What This Means")
- Insight templates
- Category definitions
- UI structure

### Child Data (Dynamic - Generated from Dream module data)

#### Data Points:

| Data Point | Type | Source |
|------------|------|--------|
| Insight Title | CHILD | Generated from indicator trends |
| Insight Body | CHILD | Natural language generation |
| Affected Area | CHILD | Business impact analysis |
| Recommended Action | CHILD | Action recommendations |
| Severity Level | CHILD | Based on indicator values |
| Timeframe | CHILD | Event horizons from data |

#### Example Child Data Generation:
```
Input: Inflation Rate = 15.93%, Food Inflation = 16.96%
Output:
  Title: "Food Costs Rising Faster Than General Inflation"
  Body: "Your raw material costs (groundnuts, oil) are increasing
        1.03% faster than overall inflation. This means profit margins
        are under pressure."
  Affected Area: "Cost of Goods Sold"
  Recommended Action: "Review pricing or secure bulk purchases"
  Severity: "Medium"
  Timeframe: "Next 30 days"
```

#### API Endpoints Needed:
- `GET /api/interpret/overview` - All plain English insights
- `GET /api/interpret/indicator/:code` - Interpretation of specific indicator
- `GET /api/interpret/news/:id` - News interpretation
- `GET /api/interpret/alerts` - Actionable alerts from interpretations

#### Database Collections Needed:
1. `InterpretationRule` - Rules for generating insights
2. `InsightTemplate` - Templates for different insight types

---

## FINANCE MODULE

**Purpose**: Capital protection - budget tracking, vault management, runway calculation

### Existing Models:
- `Ledger` (Life & Business ledgers)
- `Transaction` 
- `CreditEntry`

### Parent Data (Hardcoded)
- Module labels ("Finance Module", "Budget Tracker", "Capital Vault")
- 50:30:20 rule labels (Needs, Wants, Savings)
- Business capital labels (Working Capital, Available Capital)
- UI structure

### Child Data (Dynamic - From Ledgers/Transactions)

#### Data Points:

**Life Ledger Section:**

| Data Point | Type | Source |
|------------|------|--------|
| Current Balance | CHILD | Ledger.balance |
| Monthly Budget | CHILD | Ledger.monthlyBudget |
| Needs Spent | CHILD | Ledger.categoryTracking.needs.spent |
| Needs Budget | CHILD | Ledger.categoryTracking.needs.budget |
| Needs Variance | CHILD | CALC: spent - budget |
| Wants Spent | CHILD | Ledger.categoryTracking.wants.spent |
| Wants Budget | CHILD | Ledger.categoryTracking.wants.budget |
| Wants Variance | CHILD | CALC: spent - budget |
| Savings Saved | CHILD | Ledger.categoryTracking.savings.saved |
| Savings Target | CHILD | Ledger.categoryTracking.savings.target |
| Burn Rate | CHILD | Ledger.burnRate |
| Runway Days | CHILD | Ledger.runwayDays |
| Runway Status | CHILD | CALC: based on runwayDays |

**Business Ledger Section:**

| Data Point | Type | Source |
|------------|------|--------|
| Current Balance | CHILD | Ledger.balance |
| Working Capital | CHILD | Ledger.workingCapital |
| Available Capital | CHILD | Ledger.availableCapital |
| Working Capital Target | CHILD | Ledger.workingCapitalTarget |
| Total Sales | CHILD | Ledger.businessMetrics.totalSales |
| Net Profit | CHILD | Ledger.businessMetrics.netProfit |
| Profit Margin | CHILD | Ledger.businessMetrics.profitMargin |
| Transaction Count | CHILD | Ledger.businessMetrics.transactionCount |
| Credit Sales Amount | CHILD | Ledger.businessMetrics.creditSalesAmount |
| Credit Collection Rate | CHILD | Ledger.businessMetrics.creditCollectionRate |
| Reinvestment Ratio | PARENT | Default 0.4 (configurable) |

**Credit Tracking Section:**

| Data Point | Type | Source |
|------------|------|--------|
| Outstanding Credits | CHILD | COUNT: CreditEntry where status != 'paid' |
| Total Credit Amount | CHILD | SUM: CreditEntry.amount |
| Overdue Credits | CHILD | COUNT: CreditEntry where status = 'overdue' |
| Overdue Amount | CHILD | SUM: CreditEntry where status = 'overdue' |
| Collection Rate | CHILD | CALC: from Ledger.businessMetrics |

#### API Endpoints Needed:
- `GET /api/finance/ledgers` - All user ledgers
- `GET /api/finance/ledger/:type` - Specific ledger (life/business)
- `GET /api/finance/budget/:type` - Budget breakdown
- `GET /api/finance/runway/:type` - Runway analysis
- `GET /api/finance/capital/:type` - Capital position (business)
- `GET /api/finance/credits` - Credit tracking overview
- `POST /api/finance/ledger/:type/budget` - Set budget allocation

---

## STRATEGY MODULE

**Purpose**: Actionable execution - pricing decisions, procurement planning, goal tracking

### Parent Data (Hardcoded)
- Module labels ("Strategy Module", "Pricing Engine", "Procurement Planner")
- Goal templates
- Strategy frameworks
- UI structure

### Child Data (Dynamic - Generated from Finance + Dream data)

#### Data Points:

**Pricing Section:**

| Data Point | Type | Source |
|------------|------|--------|
| Current Price | CHILD | USER: Business.currentPrice |
| Current COGS | CHILD | USER: Business.currentCOGS |
| Current Margin | CHILD | CALC: (price - COGS) / price |
| Target Margin | PARENT | Default 20% (configurable) |
| Recommended Price | CHILD | CALC: based on target margin |
| Price Change Needed | CHILD | CALC: recommended - current |
| Inflation Impact | CHILD | CALC: from Dream module inflation |
| Competitor Price | CHILD | USER/DB: Competitor.pricing |
| Positioning | CHILD | CALC: vs competitors |

**Procurement Section:**

| Data Point | Type | Source |
|------------|------|--------|
| Groundnut Price | CHILD | Dream: commodities API |
| Groundnut Trend | CHILD | Dream: price trend |
| Oil Price | CHILD | Dream: commodities API |
| Oil Trend | CHILD | Dream: price trend |
| Packaging Cost | CHILD | USER: Business.packagingUnitCost |
| Bulk Discount Available | CHILD | USER/DB: Supplier.bulkDiscount |
| Recommended Order | CHILD | CALC: based on trends + demand |
| Order Timing | CHILD | CALC: based on price forecasts |
| Savings Opportunity | CHILD | CALC: if ordering now vs later |

**Goals Section:**

| Data Point | Type | Source |
|------------|------|--------|
| Goal Title | CHILD | USER: Goal.title |
| Goal Type | PARENT | Enum: revenue, savings, expansion |
| Target Value | CHILD | USER: Goal.targetValue |
| Current Progress | CHILD | CALC: from actual data |
| Progress Percent | CHILD | CALC: progress / target |
| Deadline | CHILD | USER: Goal.deadline |
| Days Remaining | CHILD | CALC: deadline - today |
| Status | CHILD | CALC: on_track, at_risk, behind |
| Action Items | CHILD | USER: Goal.actionItems |

#### API Endpoints Needed:
- `GET /api/strategy/pricing` - Pricing recommendations
- `GET /api/strategy/procurement` - Procurement planning
- `GET /api/strategy/goals` - Goal tracking
- `POST /api/strategy/goals` - Create goal
- `PUT /api/strategy/goals/:id` - Update goal progress
- `GET /api/strategy/actions` - Recommended actions (combined)

#### Database Collections Needed:
1. `BusinessProfile` - Store business pricing, costs, suppliers
2. `Goal` - Strategic goals tracking
3. `ActionItem` - Recommended/pending actions

---

## CROSS-MODULE DATA FLOW

```
Dream Module (Economic Intel)
    ↓
    ├→ Inflation Rate ────────────────────────┐
    ├→ Commodity Prices ──────────────┐       │
    └→ FX Rate ────────────────┐       │       │
                              │       │       │
                              ↓       ↓       ↓
Interpretation Module    Finance Module  Strategy Module
(Plain English)          (Capital)      (Execution)
                              │       │       │
                              └───────┴───────┘
                                      │
                                      ↓
                            Combined Recommendations
```

---

## IMPLEMENTATION PRIORITY

1. ✅ **Dream Module** - COMPLETE
   - 85+ indicators
   - News feed
   - Events
   - Stress testing

2. **Interpretation Module** - NEXT
   - Insight generation rules
   - Natural language templates
   - Alert generation

3. **Finance Module** - Existing models need:
   - Controller for ledgers
   - Budget tracking endpoints
   - Credit tracking endpoints
   - Runway calculations

4. **Strategy Module** - NEW
   - Business profile model
   - Goals model
   - Pricing engine
   - Procurement planner

---

## NEXT STEPS

1. **Install MongoDB** to seed and test the Dream module
2. **Create Interpretation module** - Rule-based insight generation
3. **Complete Finance endpoints** - Expose existing ledger data
4. **Build Strategy module** - Pricing, procurement, goals
