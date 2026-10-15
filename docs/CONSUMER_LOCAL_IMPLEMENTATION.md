# Consumer implementation — 15 October 2026

The documentation pack (v2, 12 September 2026) remains the working product baseline. This change replaces the visual demo with a real local flow while external providers are unconfigured. It does not declare the full MVP complete.

## Architecture

`web/src/api.ts` → same-origin `/api/consumer` → `backend/src/consumer/routes.ts` → existing session service + Prisma/PostgreSQL. `backend/src/consumer/engine.ts` owns financial arithmetic. Its type-only imports in the frontend do not ship executable financial logic.

Prisma adds ConsumerPlan, MoneyAccount, ConsumerCommitment, FinancialSnapshot and ConsumerConsent; all are user-owned with cascading deletion. Money uses BIGINT kobo. Validated individual values are at most 10^12 kobo, accounts/commitments at most 100 each, keeping aggregate arithmetic within JavaScript's exact integer range. Writes and financial reads lock the user's row, providing a consistent input set and atomic snapshot persistence. Endpoint queries always include the authenticated user ID.

## Financial rules for this local flow

- Use confirmed available balances; manually entered accounts must not mirror one another. No provider-account identity or transaction deduplication is claimed.
- Reserve overdue commitments on day zero. Include dated bills and goal contributions through the final horizon day.
- Budget the confirmed daily variable spending on each of the next N days (days 1–N). Add no forecast income.
- Simulate cash daily; runway is the first day projected cash is below the chosen buffer. A null boundary with `runwayBeyondHorizon=true` means no breach within the horizon, not infinite runway.
- Binary-search the maximum immediate whole-kobo purchase that leaves every dated projection at or above the buffer. Any existing deficit means zero additional spending room.
- Missing balance/plan or a balance older than 24 hours restricts Safe-to-Spend and affordability to null. Manual plans are always estimates, never labelled bank-verified or high confidence.
- A scenario is hypothetical. Recording an actual payment currently requires updating the balance and removing its commitment; the UI states this explicitly.
- Persist input, output, engine/rules versions and a reason. Identical material state reuses the existing snapshot; time-dependent changes (day boundary/freshness) create a new one. No financial snapshots are written before consent or after withdrawal.

## Security and privacy

Consumer auth issues HttpOnly SameSite=Strict cookies scoped to `/api/consumer` (Secure in production). Refresh tokens are hashed server-side, rotated and bound to persisted revocable sessions. Mutations require an allowlisted Origin and JSON. Global and auth-specific rate limits apply. The frontend stores no tokens in localStorage or sessionStorage. Planning writes require current consent. Export excludes passwords/tokens; planning erasure retains account and consent audit, while password-confirmed account deletion removes the account and cascaded data.

The local helper binds PostgreSQL/API to loopback, creates random persistent credentials in ignored `.local/`, and never uses a supplied external DATABASE_URL. The migration was applied only to that isolated local cluster. Query logging is opt-in with DB_LOG_QUERIES=true. No production database, deployment or remote Git branch was modified.

## Remaining documentation gates

1. Configure Mono sandbox and implement verified connection/exchange, sync, normalization, deduplication, reconnect/disconnect and webhook handling.
2. Configure email/SMS delivery, verification and password recovery. Integrate approved terms/privacy and separate bank-data consent with withdrawal.
3. Build canonical transaction corrections, spending-history baseline, recurring-obligation confirmation and full goal contribution/progress schedules.
4. Configure Meta WhatsApp, signed webhooks, opt-in/linking, state-backed conversational answers, impulse-delay jobs and reminders. Any LLM must quote tool-supplied financial values.
5. Reconcile upstream `feat/Auth` deliberately, audit legacy routes, validate formulas/policies in controlled beta, finish production operations/monitoring and deployment controls.

Provider credentials are not the only remaining work: the provider adapters and the other flows above still need implementation and verification. This version is useful for local persistence and deterministic planning validation, not a substitute for the documentation's acceptance gate.

## Verification results

On 15 October 2026: all 48 backend tests passed (25 previous auth/admin regressions, 13 engine checks, 10 real-PostgreSQL API checks). Both backend compilation and frontend strict typechecking/production build passed. Targeted lint passed for the new consumer code, tests and database logging change; the unrelated repository-wide lint baseline remains as documented in SECURITY_FOUNDATION.md.

All eight Playwright checks passed in installed Chrome at widths 1440, 768, 390 and 320. They exercise actual HTTP/database flows without mocked API responses. Desktop landing and desktop/mobile dashboard screenshots were visually inspected. A test-only label lookup was corrected; a new database regression caught JSONB key reordering in snapshot comparisons, fixed with structural equality. Formula boundary, stale-data, cross-user, refresh replay, consent withdrawal and account deletion checks are covered. Safari/Firefox and external-provider flows remain unverified.
