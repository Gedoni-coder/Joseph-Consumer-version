# AGENTS.md

Guidance for Codex when working in this repository. Prefer the current code over older docs when they disagree.

## Project Overview

JOSEPH AI is a financial/economic assistant for micro-merchants and families. The repository currently contains:

- A static browser frontend at the repository root (`index.html`, `app.js`, `frontend-api-client.js`, `style.css`, standalone HTML pages).
- A TypeScript Express backend in `backend/` using PostgreSQL through Prisma.
- A JavaScript WhatsApp bot in `whatsapp-bot/` with provider-based transport and handler modules.

Main technologies:

- Frontend: vanilla HTML, CSS, and browser JavaScript. No React framework, components, hooks, or pages were found.
- Backend: Node.js >= 20, Express 5, TypeScript, Prisma 7, PostgreSQL, JWT, Joi, Helmet, CORS, express-rate-limit, Vitest, ESLint.
- Backend package manager: `pnpm` via `backend/package.json` (`packageManager: pnpm@10.18.1`).
- WhatsApp bot: ES module JavaScript, dotenv, provider pattern (`baileys` and `meta` providers in code). This checkout does not contain `whatsapp-bot/package.json`, even though README files mention npm scripts/dependencies.

## Repository Structure

- `index.html`, `home.html`, `login.html`, `signup.html`, `settings.html`, `payment.html`: root browser pages.
- `app.js`: main static SPA/router and module UI behavior for root frontend routes such as `/dream`, `/interpretation`, `/finance`, and `/strategy`.
- `app-bootstrap.js`: browser auth/bootstrap helpers.
- `frontend-api-client.js`: browser API client exposed as `window.JosephAPI`; manages tokens in `localStorage`, refreshes auth, and wraps backend endpoint groups.
- `dataEngine.js`: economic data fetching/cache logic; prefers `window.JosephAPI.economic` when available, with fallback data paths.
- `transactionEngine.js`: browser-side transaction classification/FP&A automation helpers using `localStorage`.
- `server.js`: simple Node static development server with HTML fallback for client-side routes.
- `backend/src/index.ts`: backend process entry point; loads dotenv, connects Prisma unless `SKIP_DB=true`, starts Express, and handles graceful shutdown.
- `backend/src/app.ts`: Express app setup, security middleware, CORS, body parsing, request logging, `GET /health`, root routes, API rate limiter, 404s, and global error handler. Check this file before assuming feature routes are mounted.
- `backend/src/routes/`: Express routers for feature modules. These files exist, but current `backend/src/app.ts` does not mount the feature routers.
- `backend/src/controllers/`: request handlers; parse request data, call services, and shape HTTP responses.
- `backend/src/services/`: business and data-access logic. Most services import Prisma directly from `backend/src/config/prisma.ts`.
- `backend/src/middleware/`: auth, authorization, validation, and rate limit middleware.
- `backend/src/config/`: Prisma, JWT, constants, database, and rate-limit configuration.
- `backend/src/utils/`: shared HTTP response and normalized error response helpers.
- `backend/core/*`: small workspace packages published internally as `@app-core/*` aliases, including db, errors, logger, messages, jwt, and repository helpers.
- `backend/prisma/schema.prisma`: Prisma data model. Migrations live in `backend/prisma/migrations/`.
- `backend/legacy-mongo/`, `backend/legacy-sqlite-migrations/`, `backend/dist/`, `backend/node_modules/`: legacy/generated/runtime areas. Do not edit unless explicitly asked.
- `docs/`: historical module notes and architecture docs. Some docs still describe Mongo/Mongoose; verify against current Prisma code before relying on them.
- `whatsapp-bot/src/index.js`: provider-agnostic bot entry point.
- `whatsapp-bot/src/config/index.js`: bot dotenv config and minimal validation.
- `whatsapp-bot/src/providers/`: provider factory plus Baileys and Meta providers.
- `whatsapp-bot/src/handlers/`: intent detection and domain-specific message handlers.
- `whatsapp-bot/src/utils/api-client.js`: Axios backend client for bot handlers.

## Architecture and Data Flow

### Backend

The backend follows a layered Express pattern:

1. `backend/src/index.ts` loads runtime config, imports `app`, connects Prisma through `backend/src/config/prisma.ts`, and listens on `PORT`/`HOST`.
2. `backend/src/app.ts` applies middleware in order: Helmet, CORS, JSON/form parsers, request logging, health/root/API routes, 404 handlers, then global error handling.
3. Feature routers in `backend/src/routes/*.ts` define HTTP method/path/middleware/controller wiring.
4. Controllers in `backend/src/controllers/*` read `req.body`, `req.params`, `req.query`, and `req.userId`, then call services.
5. Services in `backend/src/services/*` hold most domain logic and database operations through Prisma.
6. Shared response helpers live in `backend/src/utils/response.utils.ts`.
7. App-core errors from `@app-core/errors` are normalized by `backend/src/utils/service-error.utils.ts` and handled in `app.ts`.

Current mounted backend endpoints in `backend/src/app.ts`:

- `GET /health`: checks server health and runs `SELECT 1` through Prisma unless `SKIP_DB=true`.
- `GET /`: basic API sanity route.
- `GET /api`: currently returns only `{ health: "/health" }`.
- Unknown `/api/*` routes return a normalized not-found error.

Important: feature routers such as `auth`, `finance`, `dream`, `economic`, `strategy`, `whatsapp`, `preferences`, `notifications`, and `admin` exist under `backend/src/routes/`, but they are not currently mounted in `app.ts`. Do not assume `/api/auth` or other feature endpoints are live without checking `app.ts`.

### Database and Transactions

- Prisma is configured through `backend/core/db/src/index.ts` and re-exported by `backend/src/config/prisma.ts`.
- `DATABASE_URL` is required unless `SKIP_DB=true`; this validation happens in `@app-core/db`.
- Prisma models and enum fields belong in `backend/prisma/schema.prisma`; migrations belong in `backend/prisma/migrations/`.
- Most services call `prisma.model.*` directly.
- `backend/core/repository/src/index.ts` exposes `runRepositoryTransaction(callback)` for Prisma `$transaction` work, but most current services do not use a repository layer.
- Use a Prisma transaction when a behavior change requires multiple writes to succeed or fail together.

### Validation

- Request validation uses Joi in `backend/src/middleware/validation.ts`.
- Existing validation middleware replaces `req.body` or `req.query` with sanitized values using `stripUnknown` and `convert`.
- Some controllers still perform inline validation for module-specific rules.
- Environment configuration is partly centralized but not fully schema-validated. Dotenv is loaded in `backend/src/app.ts`, `backend/src/index.ts`, and `backend/core/db/src/index.ts`; JWT config warns about weak secrets in `backend/src/config/jwt.ts`.

### Errors

- New normalized backend errors should use `createAppError` or `throwAppError` from `@app-core/errors`.
- `backend/src/app.ts` logs errors with `appLogger.errorX` and sends normalized responses through `sendNormalizedError`.
- Existing older controllers often return `res.status(...).json(...)` directly and call `next(error)` in catch blocks. Preserve local style unless intentionally normalizing a module.

### Authentication and Authorization

- JWT helpers live in `backend/src/config/jwt.ts`.
- `backend/src/middleware/authPrisma.ts` exports `authenticate`, `optionalAuth`, `authorize`, `isOwner`, `requireVerifiedEmail`, and `requireOnboarding`.
- `authenticate` verifies a bearer access token, loads the user through Prisma, updates `lastActivity`, and attaches `req.user` and `req.userId`.
- `backend/src/middleware/role.middleware.ts` has a typed `requireAdmin` helper using `throwAppError`.
- Request type augmentation is in `backend/src/types/express.ts`; `app.ts` imports `./types/express` for it.

### Frontend

- The root frontend is not React. It is vanilla browser JavaScript with globals.
- `app.js` waits for `DOMContentLoaded`, maps URL paths to `.page` elements, mutates DOM classes, and stores state in `localStorage`.
- `frontend-api-client.js` creates `window.JosephAPI`; use that existing client rather than ad hoc `fetch` calls when adding frontend API usage.
- The browser app currently expects backend API base URL `http://localhost:4000/api`.

### WhatsApp Bot

- `whatsapp-bot/src/index.js` is provider-agnostic. It loads dotenv, validates config, creates a provider, rate-limits messages by phone number, passes messages to `processMessage`, and sends replies.
- `whatsapp-bot/src/providers/index.js` chooses `BaileysProvider` or `MetaProvider` from `WHATSAPP_PROVIDER`.
- `whatsapp-bot/src/handlers/message-handler.js` detects intents, manages conversation state in a `Map`, checks authentication state, and routes to finance/strategy/dream/interpretation handlers.
- `whatsapp-bot/src/utils/api-client.js` wraps backend calls with Axios.

## Coding Conventions

Existing conventions observed in code:

- Backend source files use `.ts`; many route/controller/service files currently start with `// @ts-nocheck`.
- Backend main `tsconfig.json` has `strict: false` and `noImplicitAny: false`. Core packages under `backend/core/*` use stricter TypeScript settings and emit declarations.
- Backend package type is CommonJS, but source uses TypeScript `import`/`export`.
- Route files generally default-export an Express router.
- Controllers generally export named async handler functions and often default-export an object of handlers.
- Services use mixed styles: named functions (`authService.ts`) and exported objects (`financeService.ts`).
- Constants are centralized in `backend/src/config/constants.ts`.
- Internal core packages are imported as `@app-core/db`, `@app-core/errors`, `@app-core/logger`, `@app-core/messages`, etc.
- ESLint uses flat config in `backend/eslint.config.mjs`; `@typescript-eslint/no-explicit-any`, `no-namespace`, and `no-non-null-assertion` are currently off.
- No Prettier config or format script was found, although `prettier` is installed in backend devDependencies.
- Existing files use comments heavily for route/controller/service section headings. Add comments when they clarify flow, not as a substitute for readable code.
- Root frontend uses globals, DOM queries, event listeners, and `localStorage`; keep additions consistent with that style.
- No React files, components, hooks, or framework pages were found. Do not introduce React conventions unless the project is explicitly migrated.
- No active test files were found under `backend/tests`, `backend/src`, or `backend/core`; Vitest is configured with `passWithNoTests: true`.

Recommendations when adding new code:

- Prefer typed code for new backend/core work, even though many existing feature modules are `@ts-nocheck`.
- Prefer `sendSuccess`, `sendError`, `createAppError`, and `sendNormalizedError` for new normalized backend paths.
- Add or extend Joi validation middleware when a route accepts request input.
- Keep database field names aligned with `schema.prisma`; never invent fields from frontend assumptions.

## Adding or Changing Features

Use these locations unless nearby code clearly establishes another pattern:

- API routes: `backend/src/routes/<feature>.ts`; mount them in `backend/src/app.ts` only when the task explicitly requires the endpoint to be live.
- Controllers: `backend/src/controllers/<feature>Controller*.ts`.
- Services/business logic: `backend/src/services/<feature>Service.ts`.
- Prisma models/enums: `backend/prisma/schema.prisma`, with migrations in `backend/prisma/migrations/`.
- Validation schemas/middleware: `backend/src/middleware/validation.ts`, or a focused validator module if the feature becomes large.
- Auth/role guards: `backend/src/middleware/authPrisma.ts` and `backend/src/middleware/role.middleware.ts`.
- Shared backend utilities: `backend/src/utils/` or `backend/core/*` only when the utility is genuinely cross-cutting.
- Root frontend UI: existing HTML pages plus `app.js`, `app-bootstrap.js`, `style.css`, and `frontend-api-client.js`.
- Frontend API calls: add methods to `frontend-api-client.js` under `window.JosephAPI`.
- WhatsApp commands/intents: `whatsapp-bot/src/handlers/message-handler.js` plus the appropriate domain handler file.
- WhatsApp transport changes: `whatsapp-bot/src/providers/`.
- Tests: use `backend/tests/**/*.test.ts`, `backend/src/**/*.test.ts`, or `backend/core/**/*.test.ts` per `backend/vitest.config.mts`.

Feature checklist:

1. Inspect the existing route, controller, service, Prisma model, client, and tests for the relevant module.
2. Decide whether the feature is backend-only, frontend-only, WhatsApp-only, or cross-cutting.
3. Add validation before controller logic for request input.
4. Put business rules in services, not route files.
5. Keep Prisma reads/writes in services or repository helpers.
6. Use a transaction for multi-write invariants.
7. Update frontend/bot API clients only for endpoints that actually exist and are mounted.
8. Add or update tests when behavior changes.
9. Run the smallest relevant verification commands before reporting done.

## Mandatory Rules

- Inspect relevant files before editing.
- Preserve existing architectural boundaries.
- Follow established local patterns in the files being changed.
- Reuse existing utilities and abstractions before adding new ones.
- Keep business logic out of route definitions.
- Keep database operations aligned with Prisma models and existing services.
- Avoid modifying unrelated files or generated output.
- Never invent routes, database fields, environment variables, API response shapes, or business rules.
- Avoid new dependencies unless they are necessary and approved by the task.
- Update or add tests when behavior changes.
- Preserve existing behavior unless the task explicitly asks to change it.
- Never expose secrets or copy real `.env` values into docs, code, tests, logs, or responses.
- Respect dirty working trees and user changes. Do not revert changes you did not make.
- Do not edit `node_modules`, `dist`, coverage, session/cache folders, or generated migration output unless explicitly requested.
- Check `backend/src/app.ts` before claiming an API route is active.

## Project Commands

Backend commands are defined in `backend/package.json`. On Windows PowerShell, use `pnpm.cmd` if `pnpm` is blocked by script execution policy.

```bash
cd backend
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm prisma:validate
pnpm prisma:generate
pnpm migrate:dev
pnpm migrate:deploy
pnpm ci
```

Formatting:

- No configured `format` script and no Prettier config were found.
- Do not claim formatting verification passed unless a concrete command was run.

Root frontend:

```bash
node server.js
```

Notes:

- No root `package.json` was found. The root `package-lock.json` is effectively empty, so do not rely on root npm scripts.
- `whatsapp-bot/package.json` is absent in this checkout. README commands such as `npm install` and `npm start` for the bot could not be verified from package files.

## Completion Checklist

Before reporting a task finished:

1. Review the changed files.
2. Run relevant linting and type-checking commands.
3. Run relevant tests.
4. Run the build when appropriate.
5. Check for accidental unrelated changes.
6. Report any command that could not be run.
7. Never claim verification passed if it was not performed.

