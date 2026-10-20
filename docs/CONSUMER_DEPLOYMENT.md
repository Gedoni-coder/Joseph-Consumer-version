# JOSEPH consumer deployment

Public planning beta: https://joseph-consumer.vercel.app

## Runtime

Vercel project `joseph-consumer` builds the React/Vite frontend from `web/` and serves a single Express function through `api/index.js`. API traffic is rewritten to that function on the same origin. `backend/src/consumer-app.ts` exposes only `/api/health` and `/api/consumer`; historical authentication, admin, and WhatsApp routes are not mounted.

The dedicated Neon project is `old-fog-03221545`, named `joseph-consumer`, with database `joseph` in AWS Frankfurt. The committed Prisma migrations initialize the schema; `20261016000000_consumer_bank_onboarding` adds bank connections and single-use link sessions. The function region is Frankfurt. Application connections use the pooled endpoint, a five-connection process pool, idle eviction, and Vercel's pool lifecycle integration.

## Configuration and publishing

Root `npm ci` installs deployment tooling. `node scripts/install.cjs` restores the locked backend workspace and frontend. `npm run build` generates Prisma, compiles the six backend core packages and API, typechecks the frontend, and builds its assets.

Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` as sensitive production environment variables in Vercel. Use different randomly generated session secrets of at least 32 characters. Never put credentials in Git, client environment variables, screenshots, or command arguments. The entrypoint rejects missing/weak secrets. Mutations require JSON and an exact allowed Origin. Vercel's project-provided deployment and production origins are allowed; configure `FRONTEND_URL` explicitly when adding a custom domain.

Publish from the repository root with `vercel deploy --prod`, after validation and Git commit. Local `.vercel` linkage, `.local` databases, secrets, test artifacts, and dependencies are excluded from source/upload. GitHub source is on `feat/consumer-web`. Automatic GitHub-to-Vercel deployment is not connected: the Vercel account needs its GitHub login connection configured first. CLI deployment works independently.

For bank testing, configure `MONO_SECRET_KEY`, `MONO_PUBLIC_KEY`, and `MONO_APP_ID` in the production host environment. Only the public key is returned to an authenticated browser starting a consented bank connection; the secret stays on the server. This release requires sandbox key prefixes and rejects live keys. The official Mono Connect SDK runs in `https://connect.mono.co`; account-code exchange, details retrieval and unlink run server-side against `https://api.withmono.com/v2`. The browser validates the iframe origin/source before accepting SDK messages.

Schema migrations are deliberate: use `prisma migrate deploy` against a direct connection after testing in an isolated database. Do not run migrations automatically in application startup or on every preview build.

## Scope

17 October update: transparent navy logo (white on the dark sign-in surface), a keyboard-accessible hamburger drawer with four modules and Privacy & account at the bottom, persistent purchase history, daily Safe to Spend, burn rate across the recorded calendar period, balance/actual-burn projected runway, and dated/NGN-labelled forecast axes. See [spending history notes](SPENDING_HISTORY.md) for calculation semantics and data handling. Migration `20261017000000_consumer_purchases` was tested on the isolated Neon branch before production. The daily calculation correction requires no further schema migration.

This release supports real accounts, two-step signup, stored manual balances, dated commitments, spending plans, deterministic forecasts, purchase checks, export, consent withdrawal, and account deletion. The second signup form atomically saves answers into the plan, optional cash balance, bills and goals; retrying cannot overwrite a completed setup. The same flow then offers an optional Mono sandbox connection. Existing completed plans are preserved.

Sandbox bank connections support consent, initial account/balance retrieval, manual refresh and disconnect. Incomplete provider data stays pending rather than becoming a zero balance. Test balances are separate from real manually entered money and never increase Safe-to-Spend. Bank ownership is enforced server-side, link sessions are single-use and expire after ten minutes, and exports omit provider account IDs. Remote unlink failures retain a visible retryable record; connected banks must be disconnected before erasure or account deletion. Concurrent deletion waits for an in-flight bank exchange to finish.

Bank transaction ingestion, automatic/webhook sync, live bank linking, email/phone verification, password recovery and the WhatsApp channel remain unavailable. The app records manual-planning consent `manual-planning-2026-10-16` and separate bank consent `mono-sandbox-2026-10-16`. Server-calculated forecasts are estimates based on user entries; no money is moved or locked.

Before broader production rollout: configure provider flows, approve terms/privacy and calculation policies, add operational monitoring and account recovery, and replace process-local rate-limit counters with shared storage or platform-wide enforcement. Current counters protect each running instance but are not a global quota across serverless instances.

## Verification on 16 October 2026

The navy/white onboarding and sandbox update passes all 61 backend tests, both production builds and targeted backend lint. Six desktop/mobile browser tests passed, including questionnaire persistence and module population. Bank API tests use real local PostgreSQL with only the external Mono boundary mocked; they check session ownership/replay, concurrent erasure protection, disconnect retries, export redaction and sandbox balance exclusion. Mono accepted the configured sandbox credential during the integration check. The new migration passed on an isolated Neon branch before being applied to production. Brand asset specifications are maintained in BRAND_ASSETS.md.

Backend tests: 48 existing tests passed; the revised consumer entrypoint suite passed all 11 tests, adding route isolation and malformed/oversized request checks. Both TypeScript builds passed. The new deployment tooling audit reports zero known vulnerabilities.

Chrome flows passed locally at desktop, tablet, mobile, and 320px widths. The initial combined run hit the shared IP rate limit on its fourth full account flow; the isolated 320px rerun passed. The deployed desktop and mobile flows passed registration, consent, persistence/reload, purchase calculations, login, edits, export, erasure and account deletion. Landing and dashboard screenshots were reviewed.

`node backend/scripts/local.cjs test` uses only the isolated loopback database. `npm test --prefix web` runs the browser suite. Set `JOSEPH_TEST_URL` to a deployed origin to test remotely without starting a local preview. Use disposable QA accounts; successful tests delete their accounts. Test traces contain test credentials and stay ignored. Safari/Firefox and unconfigured external-provider flows are not verified.

SR
