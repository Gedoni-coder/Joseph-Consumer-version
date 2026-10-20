# Strategy Module Dynamic UI Implementation

> Historical module reference. These contracts are not the deployed consumer API. For current runtime boundaries, see [Consumer implementation](CONSUMER_LOCAL_IMPLEMENTATION.md).

## Summary

The Strategy module UI now fetches and displays **real-time dynamic data** from the backend APIs instead of hardcoded values. All strategy components are now connected to live data sources.

---

## Changes Made

### 1. API Client (`frontend-api-client.js`)

Added `StrategyAPI` with 17 methods:

```javascript
const StrategyAPI = {
  async getDashboard()              // GET /api/strategy/dashboard
  async getPricingOverview()         // GET /api/strategy/pricing
  async getProductPricing(productId) // GET /api/strategy/pricing/:id
  async updateProductPrice()         // PUT /api/strategy/pricing/:id
  async addProduct()                 // POST /api/strategy/products
  async getProcurement()             // GET /api/strategy/procurement
  async getSupplierDetails()         // GET /api/strategy/suppliers/:id
  async addSupplier()                // POST /api/strategy/suppliers
  async updateMaterialStock()        // PUT /api/strategy/materials/:id
  async getGoals()                   // GET /api/strategy/goals
  async getGoalDetails()             // GET /api/strategy/goals/:id
  async createGoal()                 // POST /api/strategy/goals
  async updateGoal()                 // PUT /api/strategy/goals/:id
  async deleteGoal()                 // DELETE /api/strategy/goals/:id
  async addAction()                  // POST /api/strategy/goals/:id/actions
  async updateAction()               // PUT /api/strategy/goals/:id/actions/:actionId
  async addMilestone()               // POST /api/strategy/goals/:id/milestones
  async completeMilestone()          // PUT /api/strategy/goals/:id/milestones/:milestoneId
};
```

---

### 2. App Bootstrap (`app.js`)

Modified `navigateTo()` to trigger data loading for Strategy module:

```javascript
function navigateTo(pageId) {
  // ... existing code ...

  // Load module-specific data
  if (pageId === 'page-strategy') {
    loadStrategyDashboard();
  }
}
```

**New Functions Added:**

| Function | Description |
|----------|-------------|
| `loadStrategyDashboard()` | Fetches all strategy data in parallel |
| `renderStrategyDashboard()` | Updates dashboard with fetched data |
| `renderStrategyGoals()` | Processes and displays goals |
| `updateStrategySnapshot()` | Updates goal progress card |
| `renderForecastTimeline()` | Renders milestones timeline |
| `renderStrategyRecommendations()` | Shows AI advice cards |
| `renderPricingOverview()` | Updates pricing data |
| `renderBreakEvenAnalysis()` | Calculates break-even progress |
| `updateProcurementOptions()` | Shows supplier options |

---

## Dynamic Elements

### AI Strategy Recommendations

| Element | Before (Hardcoded) | After (Dynamic) |
|---------|-------------------|-----------------|
| Inflation Alert | Fixed text | From insights/recommendations |
| Campus Demand | Fixed text | From economic events data |
| Fuel Price | Fixed text | From fuel price indicators |
| Status badges | "New"/"Reviewed" | From recommendation status |

### Strategy Snapshot

| Element | Before (Hardcoded) | After (Dynamic) |
|---------|-------------------|-----------------|
| Goal Title | "Build ₦500k Emergency Fund" | `goal.title` from API |
| Current Progress | ₦320,000 | `goal.currentAmount` |
| Target | ₦500,000 | `goal.targetAmount` |
| Progress % | 64% | Calculated from actual data |
| Remaining | ₦180k | `target - current` |
| Timeline | "6 mo" | `goal.timeline` |

### Forecast Timeline

| Element | Before (Hardcoded) | After (Dynamic) |
|---------|-------------------|-----------------|
| Milestone 1 | Week 1 / ₦1,000 | `milestone.timeline` / `milestone.amount` |
| Milestone 2 | Week 2 / ₦2,500 | From goal milestones array |
| Status | "Achieved"/"Pending" | `milestone.completed` or `milestone.status` |
| Checkmarks | Fixed | Dynamic based on completion |

### Break-Even Gauge

| Element | Before (Hardcoded) | After (Dynamic) |
|---------|-------------------|-----------------|
| Gauge Fill | 73.3% | `(netProfit / fixedCosts) * 100` |
| Status | "Amber Zone" | Based on progress: Green/Amber/Red |
| Net Profit Logged | ₦22,000 | `businessMetrics.netProfit` |
| Remaining Gap | ₦8,000 | `fixedCosts - netProfit` |
| Target | ₦30,000 | Configurable fixed costs |
| Banner Message | Fixed text | Dynamic recommendation |

### Pricing & Procurement

| Element | Before (Hardcoded) | After (Dynamic) |
|---------|-------------------|-----------------|
| Current Option COGS | ₦500/bottle | From procurement options |
| Wholesale Option COGS | ₦410/bottle | From supplier data |
| Savings % | −18% | Calculated from actual options |
| Trade-off Verdict | Fixed | From API recommendation |

---

## Data Flow

```
User navigates to Strategy page
    ↓
navigateTo('page-strategy')
    ↓
loadStrategyDashboard()
    ↓
Parallel API calls:
├── getDashboard() → Recommendations
├── getGoals() → Goals & Milestones
├── getPricingOverview() → Pricing data
└── getLedgerByType('business') → Break-even data
    ↓
Render functions update UI elements
    ↓
All components display real-time data
```

---

## Visual Updates

### Break-Even Gauge
```javascript
// Color zones based on progress
if (progress >= 100%) → Green (profit territory)
else if (progress >= 70%) → Amber (approaching break-even)
else → Red (loss zone)
```

### Goal Progress
```javascript
// Status indicator
if (progress >= 70%) → "✓ On Track"
else → "⏳ In Progress"
```

### Recommendation Cards
```javascript
// Priority styling
urgent → high (red)
warning → medium (orange)
info → low (green)
```

---

## Files Modified

| File | Changes |
|------|---------|
| `frontend-api-client.js` | Added `StrategyAPI` with 17 methods (~150 lines) |
| `app.js` | Added `loadStrategyDashboard()` and rendering functions (~250 lines) |

---

## API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /api/strategy/dashboard` | Complete dashboard data |
| `GET /api/strategy/goals` | Goals and milestones |
| `GET /api/strategy/pricing` | Pricing overview |
| `GET /api/strategy/procurement` | Procurement options |
| `GET /api/finance/ledgers/business` | Break-even calculations |

---

## Testing

To test the implementation:

1. Start the backend server
2. Open the application
3. Log in
4. Navigate to Strategy module
5. Verify all components show real data:
   - AI Strategy Recommendations show actual insights
   - Strategy Snapshot shows real goal progress
   - Forecast Timeline shows actual milestones
   - Break-Even Gauge shows real business metrics

**Console logs to look for:**
- `🔄 Loading Strategy Dashboard...`
- `🎨 Rendering strategy dashboard:`

---

## Components Summary

| Component | Data Source | Status |
|-----------|-------------|--------|
| AI Strategy Recommendations | Dashboard API | ✅ Dynamic |
| Strategy Snapshot | Goals API | ✅ Dynamic |
| Forecast Timeline | Goal Milestones | ✅ Dynamic |
| Break-Even Gauge | Business Ledger | ✅ Dynamic |
| Pricing Overview | Pricing API | ✅ Dynamic |
| Procurement Advisor | Procurement API | ✅ Dynamic |

---

## Summary

✅ **Strategy Module UI is now fully dynamic!**

All components now fetch real-time data:
- Recommendations show actual AI insights from economic indicators
- Goals display real progress with milestones
- Break-even analysis uses actual business ledger data
- Pricing and procurement reflect real supplier options
- All visualizations update automatically with data changes

The Strategy module is now fully connected to the backend and displays live data!
