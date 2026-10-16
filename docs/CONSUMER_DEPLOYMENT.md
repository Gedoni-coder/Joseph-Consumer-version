# JOSEPH consumer deployment

Public planning beta: https://joseph-consumer.vercel.app

## Runtime

Vercel project `joseph-consumer` builds the React/Vite frontend from `web/` and serves a single Express function through `api/index.js`. API traffic is rewritten to that function on the same origin. `backend/src/consumer-app.ts` exposes only `/api/health` and `/api/consumer`; historical authentication, admin, and WhatsApp routes are not mounted.

The dedicated Neon project is `old-fog-03221545`, named `joseph-consumer`, with database `joseph` in AWS Frankfurt. The three committed Prisma migrations initialize the schema. No existing project databases are reused. The function region is Frankfurt. Application connections use the pooled endpoint, a five-connection process pool, idle eviction, and Vercel's pool lifecycle integration.

## Configuration and publishing

Root `npm ci` installs deployment tooling. `node scripts/install.cjs` restores the locked backend workspace and frontend. `npm run build` generates Prisma, compiles the six backend core packages and API, typechecks the frontend, and builds its assets.

Set `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` as sensitive production environment variables in Vercel. Use different randomly generated session secrets of at least 32 characters. Never put credentials in Git, client environment variables, screenshots, or command arguments. The entrypoint rejects missing/weak secrets. Mutations require JSON and an exact allowed Origin. Vercel's project-provided deployment and production origins are allowed; configure `FRONTEND_URL` explicitly when adding a custom domain.

Publish from the repository root with `vercel deploy --prod`, after validation and Git commit. Local `.vercel` linkage, `.local` databases, secrets, test artifacts, and dependencies are excluded from source/upload. GitHub source is on `feat/consumer-web`. Automatic GitHub-to-Vercel deployment is not connected: the Vercel account needs its GitHub login connection configured first. CLI deployment works independently.

Schema migrations are deliberate: use `prisma migrate deploy` against a direct connection after testing in an isolated database. Do not run migrations automatically in application startup or on every preview build.

## Scope

This release supports real accounts, stored manual balances, dated commitments, spending plans, deterministic forecasts, purchase checks, export, consent withdrawal, and account deletion. It starts empty and never invents bank balances or pretends that provider integrations succeeded.

Bank linking, transaction sync, email/phone verification, password recovery, WhatsApp, and LLM conversations are not available. The app records manual-planning consent `manual-planning-2026-10-16`. Server-calculated results are estimates based on user entries; no money is moved or locked. Older consent versions require renewed consent.

Before broader production rollout: configure provider flows, approve terms/privacy and calculation policies, add operational monitoring and account recovery, and replace process-local rate-limit counters with shared storage or platform-wide enforcement. Current counters protect each running instance but are not a global quota across serverless instances.

## Verification on 16 October 2026

Backend tests: 48 existing tests passed; the revised consumer entrypoint suite passed all 11 tests, adding route isolation and malformed/oversized request checks. Both TypeScript builds passed. The new deployment tooling audit reports zero known vulnerabilities.

Chrome flows passed locally at desktop, tablet, mobile, and 320px widths. The initial combined run hit the shared IP rate limit on its fourth full account flow; the isolated 320px rerun passed. The deployed desktop and mobile flows passed registration, consent, persistence/reload, purchase calculations, login, edits, export, erasure and account deletion. Landing and dashboard screenshots were reviewed.

`node backend/scripts/local.cjs test` uses only the isolated loopback database. `npm test --prefix web` runs the browser suite. Set `JOSEPH_TEST_URL` to a deployed origin to test remotely without starting a local preview. Use disposable QA accounts; successful tests delete their accounts. Test traces contain test credentials and stay ignored. Safari/Firefox and unconfigured external-provider flows are not verified.
