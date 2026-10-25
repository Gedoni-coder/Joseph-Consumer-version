# JOSEPH consumer

Live planning beta: https://joseph-consumer.vercel.app

The consumer application uses React, TypeScript and Vite in web/, with an Express API, Prisma and PostgreSQL in backend/. The deployment entry point is api/index.js; only /api/health and /api/consumer are mounted in production.

## Engineering references

- [Local development](web/README.md)
- [Deployment and operations](docs/CONSUMER_DEPLOYMENT.md)
- [Implementation boundaries](docs/CONSUMER_LOCAL_IMPLEMENTATION.md)
- [Spending history](docs/SPENDING_HISTORY.md)
- [Brand assets](docs/BRAND_ASSETS.md)

## Current scope

Track displays daily Safe to Spend, observed daily burn rate, projected runway, dated cash-flow forecasts and purchase history. Manage maintains manual balances and optional Mono sandbox connections. Plan maintains the daily spending assumption, safety buffer and horizon. Bills & goals maintains dated commitments.

Authentication uses server-issued cookie sessions. Planning data is user-owned and supports export, consent withdrawal and deletion. Sandbox balances remain separate from planning balances. Bank transaction ingestion, live bank linking, verification delivery and the WhatsApp channel are not enabled in the consumer release.

## Build and checks

Use Node 24 and the repository lockfiles. From the repository root:

    npm ci
    node scripts/install.cjs
    npm run build

For isolated PostgreSQL tests and browser checks, follow web/README.md. Configure production secrets through the deployment platform; never commit local environment files.

## Historical code

The root HTML/JavaScript frontend, backend/legacy-mongo, backend/legacy-sqlite-migrations and whatsapp-bot are retained historical implementations. They are not deployed by the consumer entry point. Older module documents describe those implementations; the consumer reference above is authoritative for the current dashboard.

## Source conventions

Use comments to explain constraints and decisions rather than restating code. Document public contracts, validation rules and operational procedures beside their owning modules. Maintain SR as a trailing source comment. Do not add comments to JSON or lockfiles, or edit applied migration SQL for cosmetic changes.

Password recovery uses expiring, single-use email links and requires the SMTP settings documented in the deployment guide. It remains unavailable until mail delivery is configured.

SR
