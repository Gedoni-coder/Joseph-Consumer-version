# JOSEPH consumer app

React/TypeScript/Vite frontend connected to the existing Express/Prisma backend. The former fixtures, scripted chat and signup placeholder have been removed. `web/` is the current consumer frontend; the historical root HTML application is not its entrypoint.

Live planning beta: **https://joseph-consumer.vercel.app**. See [deployment notes](../docs/CONSUMER_DEPLOYMENT.md) for hosting and operational limits.

## Run locally on Windows

Prerequisites: Node 22.12+, the locked backend/frontend dependencies, PostgreSQL 17. This machine has PostgreSQL at `C:/Program Files/PostgreSQL/17/bin`; set `JOSEPH_PG_BIN` if yours is elsewhere. The helper always uses an isolated repository-local cluster on `127.0.0.1:55439`, never a supplied cloud DATABASE_URL.

From the repository root, initialize and build:

```powershell
cd backend
npm run local:init
npm run local:build
npm run local:start
```

Keep that terminal running. In a second terminal:

```powershell
cd web
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 5180 --strictPort
```

Open **http://127.0.0.1:5180** and create your own account. For hot reload use `npm run dev -- --port 5180 --strictPort`. Vite proxies `/api` to the local backend on port 4000; frontend and cookies share one browser origin.

Restore backend packages with the pinned pnpm workspace lockfile before building if necessary. `local:init` is repeatable: it starts the existing cluster and applies pending repository migrations. Random database/JWT secrets and persistent PostgreSQL files live in ignored `.local/`. Do not delete that directory unless you intend to lose local accounts and plans. Stop PostgreSQL with `npm run local:stop-db` from `backend` after closing the API server.

## Working flows

- Account registration, sign-in, session refresh, sign-out and sign-out everywhere. HttpOnly SameSite=Strict cookies; tokens never enter browser storage. Explicit Origin checks protect mutations.
- Versioned consent for manual planning, with financial writes gated on consent. Privacy controls remain accessible without consent.
- Create, update and remove available balances, dated bills and individual goal contributions; confirm daily spending, safety buffer and a 7–90 day horizon.
- Backend-calculated Safe-to-Spend, dated runway projection, shortfall, restricted answers for missing/stale data, and purchase simulations that do not change balances.
- PostgreSQL persistence, immutable reproducible snapshots on material state changes, source references, rule versions and reason codes.
- JSON export, planning-data erasure with consent withdrawal, and password-confirmed account deletion with session invalidation.

Amounts are entered in naira and sent/stored as integer kobo. The browser formats server results and draws the projection; it does not calculate financial truth. New accounts start empty. There are no preloaded balances, scripted conversations or generated illustration assets in the shipped UI.

## What this does not claim

This is a working **planning beta with Mono sandbox testing**, not the full documentation's bank-connected MVP. Signup has two steps: account details, then a questionnaire that saves the plan, optional cash balance, bills and goals. Bank connection follows within the same interface. Sandbox bank balances are displayed separately and excluded from Safe-to-Spend. Mono supports initial retrieval, manual refresh and disconnect; no connection success is simulated. Email/SMS verification, password recovery and Meta WhatsApp remain unavailable. There is no LLM integration, transaction ingestion/classification, automatic recurring-obligation detection, complete goal progress tracking, or scheduled WhatsApp nudges yet.

Balances are self-reported and become stale after 24 hours. Bills and goal contributions are individual dated entries; there is no automatic repeat schedule. Future income is not assumed. Reservations are planning allocations, never bank locks. The document's rules need validation and approval before broader production rollout; this local implementation is versioned `manual-plan-1.0.0` rather than presented as approved bank-data policy.

The new `/api/consumer` cookie endpoints reuse the local hardened session service. They do not merge the incompatible upstream `feat/Auth` token schema. The old root app and legacy API remain present and require separate review before public deployment.

## Verification

From `backend`, run `npm run local:test` with the local cluster running. It runs the existing auth/admin regressions, deterministic-engine tests and real PostgreSQL API tests. Integration tests refuse any database except the isolated loopback cluster and remove only their own test users.

From `web`, run `npm run build` then `npm test` with the backend running. Playwright uses installed Google Chrome and temporary browser profiles. Its own preview server runs on 5178. Desktop, tablet, mobile and small-mobile checks create real test accounts, enter a plan, check purchases, reload, log out/in, edit data, export, erase and delete those accounts. No API mocks are used. Screenshots and failure traces go to ignored `test-results/`; traces contain test credentials and must not be published.

See `../docs/CONSUMER_LOCAL_IMPLEMENTATION.md` for the implementation and remaining gates.

Verified on 15 October 2026: 48 backend tests, eight browser checks across four viewport sizes, both builds, and targeted lint passed. Only the isolated local database was migrated. This was the local validation baseline. See CONSUMER_DEPLOYMENT.md for the 16 October hosted release.
