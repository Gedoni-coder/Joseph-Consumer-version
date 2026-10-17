# Consumer spending history and navigation

This release replaces the top module navigation with an accessible side drawer, opened by the hamburger beside the brand. It contains four modules; Privacy & account and sign-out are at the bottom. The native modal dialog traps focus, closes with Escape and returns focus to its trigger.

The logo uses real alpha transparency. Navy artwork appears on white surfaces; a CSS filter renders the same transparent artwork white on the navy sign-in panel. Source asset: `web/public/joseph-ai-logo-transparent.png` (720 × 240). It was recreated with the built-in imagegen tool using the prompt below, then resized proportionally with alpha preserved.

## Spending records

An authenticated user can record an amount, purchase description and actual purchase date, browse all their saved records (50 per page), and remove an incorrect entry. Records are scoped to the user, persisted in PostgreSQL, included in exports and removed by planning-data erasure or account deletion. Replayed submission IDs return the existing record; changed content with the same ID is rejected. Amounts use integer kobo. Dates follow Africa/Lagos and cannot be future or invalid dates. Limits are 10,000 records and a cumulative 1,000,000,000,000 kobo per user.

Recording a past purchase does not adjust an already-entered account balance: doing so could double-deduct spending already reflected in that balance. The form explains when a manual balance update is needed. Purchase simulations remain separate from actual purchase records. Bank transactions are not yet imported, so the list contains recorded purchases only.

## Burn rate and forecast

Daily calculation correction (17 October): Safe to Spend = max(0, available balances - bills/goals due within the horizon - safety buffer) / planning days, rounded down to whole kobo. It includes everyday spending rather than subtracting that spending a second time. The existing horizon is a rolling number of days from today, not a fixed end date.

Burn rate = all recorded spending through today / inclusive Nigeria calendar days from the earliest remaining purchase through today. Days with no purchases count; the first day has a denominator of one. No records gives a no-data state, not a fabricated zero. Adding a backdated purchase or deleting the earliest purchase changes the observed period; its dates and denominator are visible. The exact average (potentially fractional kobo) is retained for calculation; currency formatting rounds only the display.

Projected runway = current remaining account balances / average daily burn rate. It is not capped at the planning horizon and does not subtract future commitments or a reserve. Missing spending, zero burn, missing plan/accounts or stale balances produce no finite runway estimate. Zero remaining balance with positive burn gives zero days. Purchase simulations use the post-purchase remaining balance and the same observed burn rate. The separate dated forecast and purchase affordability guardrails continue to reserve bills/goals, the buffer and planned everyday spending; internal planBufferDays records the forecast's buffer crossing separately from runway.

Engine/rules versions are fse-1.1.0 and daily-plan-1.1.0. Spending totals, dates and denominator are included in new input snapshots for deterministic replay. No database migration is required. The meter dynamically calibrates against planned daily spend and actual rate, displays Naira/day and updates after saves/deletions. Reduced-motion preferences disable its transitions.

Correction validation: 53 non-database checks and 14 isolated PostgreSQL checks passed. The combined run initially hit the database suite's 10-second startup timeout; the database rerun passed with a 30-second startup allowance. Both production builds and targeted backend lint passed. All six desktop/mobile browser checks passed, including daily currency values, actual-burn runway, purchase deletion, persistence, simulation, export and erasure. Desktop/mobile dashboard screenshots were reviewed.

The forecast remains based on confirmed account balances, spending assumptions and dated commitments. It now labels the horizontal axis with actual dates and the vertical axis with NGN amounts; compact amounts, negative balances and the safety buffer share the same scale. Point tooltips show the full date and amount.

## Transparent logo generation prompt

Validation: production builds and targeted backend lint passed. All 48 non-database backend checks passed; the 14 database checks passed on a separate rerun after the initial combined run hit a cold-start timeout. All six desktop/mobile browser regressions passed, including saved history, burn-rate recalculation, drawer keyboard behaviour and privacy actions. Additional desktop/320px onboarding checks passed. The additive purchase migration passed on the existing isolated Neon test branch and then production.

Edit the attached JOSEPH AI logo into a polished production website logo with REAL TRANSPARENCY. Preserve the exact words JOSEPH AI, the distinctive left-facing dove carrying an olive branch, raised wings, and their basic arrangement (dove above the AI at the right). Remove the navy rectangular background completely. Change all lettering and dove/branch linework to solid deep navy #03031d so the logo is clearly legible on a white website. True alpha transparency everywhere else, no white rectangle and no simulated checkerboard. Refine the lettering into clean bold sans serif with crisp spacing, and the dove into confident consistent clean strokes readable at small header sizes. Tight composition with minimal transparent margins, approximately 3:1 wide logo canvas. No shadows, glows, gradients, texture, decoration, border, tagline, mockup or presentation sheet. One finished transparent navy logo.
