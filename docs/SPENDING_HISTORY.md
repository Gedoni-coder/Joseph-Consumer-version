# Consumer spending history and navigation

This release replaces the top module navigation with an accessible side drawer, opened by the hamburger beside the brand. It contains four modules; Privacy & account and sign-out are at the bottom. The native modal dialog traps focus, closes with Escape and returns focus to its trigger.

The logo uses real alpha transparency. Navy artwork appears on white surfaces; a CSS filter renders the same transparent artwork white on the navy sign-in panel. Source asset: `web/public/joseph-ai-logo-transparent.png` (720 × 240). Preserve the aspect ratio and alpha channel when exporting additional sizes.

## Spending records

An authenticated user can record an amount, purchase description and actual purchase date, browse all their saved records (50 per page), and remove an incorrect entry. Records are scoped to the user, persisted in PostgreSQL, included in exports and removed by planning-data erasure or account deletion. Replayed submission IDs return the existing record; changed content with the same ID is rejected. Amounts use integer kobo. Dates follow Africa/Lagos and cannot be future or invalid dates. Limits are 10,000 records and a cumulative 1,000,000,000,000 kobo per user.

Recording a past purchase does not adjust an already-entered account balance: doing so could double-deduct spending already reflected in that balance. The form explains when a manual balance update is needed. Purchase simulations remain separate from actual purchase records. Bank transactions are not yet imported, so the list contains recorded purchases only.

## Category budgets and Track XP

Category limits apply to a single Monday–Sunday week in Africa/Lagos. `PUT /api/consumer/category-budgets` replaces the authenticated user's current-week limits; the supplied `weekStart` must match the server's current week. Blank categories have no limit and zero is an explicit zero-spend target. These limits are comparisons, not reserves, and never change Safe to Spend. Prior-week budgets remain available for review. New weeks start without limits.

Purchases accept a category from `progress-rules.ts`. Legacy records default to `uncategorized`; categorizing them updates spending summaries without retroactive rewards. New browser submissions require a category. `PUT /purchases/:id/category` is owner-scoped. Monetary values remain integer kobo.

The server awards T1 (6 XP for the first eligible purchase on its actual recording day), T2 (0.5 XP per additional eligible purchase), T3 (24 XP per completed, non-overlapping seven-day streak block), and T5 (12 XP for explicitly reviewing the last completed week with eligible check-ins). A purchase with the same amount recorded in the previous 60 seconds is retained in spending but does not earn XP. Historical entries do not earn XP. T5 belongs to the reviewed week's total. There is no paid multiplier or competitive ranking in this release.

Awards and purchase mutations share the per-user transaction lock. The versioned ledger stores integer thousandths of XP, with separate base and booster columns. Reconciliation appends positive or negative deltas and never edits an existing award. Replayed requests cannot duplicate XP. Removing a purchase recalculates dependent daily, streak and review awards. Removed rows retain amount, date, category and reward eligibility, with their description replaced, so deletion cannot bypass duplicate checks; they are excluded from spending queries. Exports include this audit history. Planning-data erasure and account deletion remove purchases, category limits, reviews and the XP ledger.

Migration `20261108000000_category_budgets_track_xp` is additive and must precede the application release. Existing purchases receive no XP on migration. Rules are defined by `track-1.0.0`; changing reward values requires a versioned migration strategy, not editing historical awards.

The under-budget award (T4) is not enabled: it needs budget locking and a weekly settlement policy. Grow lessons, teams, games, tournament qualification, subscriptions and boosters remain outside this release.

## Burn rate and forecast

Daily calculation correction (17 October): Safe to Spend = max(0, available balances - bills/goals due within the horizon - safety buffer) / planning days, rounded down to whole kobo. It includes everyday spending rather than subtracting that spending a second time. The existing horizon is a rolling number of days from today, not a fixed end date.

Burn rate = all recorded spending through today / inclusive Nigeria calendar days from the earliest remaining purchase through today. Days with no purchases count; the first day has a denominator of one. No records gives a no-data state, not a fabricated zero. Adding a backdated purchase or deleting the earliest purchase changes the observed period; its dates and denominator are visible. The exact average (potentially fractional kobo) is retained for calculation; currency formatting rounds only the display.

Projected runway = current remaining account balances / average daily burn rate. It is not capped at the planning horizon and does not subtract future commitments or a reserve. Missing spending, zero burn, missing plan/accounts or stale balances produce no finite runway estimate. Zero remaining balance with positive burn gives zero days. Purchase simulations use the post-purchase remaining balance and the same observed burn rate. The separate dated forecast and purchase affordability guardrails continue to reserve bills/goals, the buffer and planned everyday spending; internal planBufferDays records the forecast's buffer crossing separately from runway.

Engine/rules versions are fse-1.1.0 and daily-plan-1.1.0. Spending totals, dates and denominator are included in new input snapshots for deterministic replay. No database migration is required. The meter dynamically calibrates against planned daily spend and actual rate, displays Naira/day and updates after saves/deletions. Reduced-motion preferences disable its transitions.

Correction validation: 53 non-database checks and 14 isolated PostgreSQL checks passed. The combined run initially hit the database suite's 10-second startup timeout; the database rerun passed with a 30-second startup allowance. Both production builds and targeted backend lint passed. All six desktop/mobile browser checks passed, including daily currency values, actual-burn runway, purchase deletion, persistence, simulation, export and erasure. Desktop/mobile dashboard screenshots were reviewed.

The forecast remains based on confirmed account balances, spending assumptions and dated commitments. It now labels the horizontal axis with actual dates and the vertical axis with NGN amounts; compact amounts, negative balances and the safety buffer share the same scale. Point tooltips show the full date and amount.

SR
