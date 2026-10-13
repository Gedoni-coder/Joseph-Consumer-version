# Authentication security foundation

This local change enforces admin authorization and replaces the active authentication controller's refresh-token persistence stubs with database-backed sessions. It is a first security pass, not a production-readiness certification.

## Source and scope

The working tree was imported from the supplied `Joseph-Consumer-version-main.zip`. Its archive comment is `64a98207eef2a717b30b34fb3e4d49c4eba4245c`; that identifier has not been verified against GitHub. The local branch is `fix/security-foundation`, based on a local `snapshot-baseline` import. It does not contain upstream Git history. Reconcile against the live default branch and the existing authentication PR before publishing this change.

Update, 13 October 2026: local Git access verified that archive identifier and the matching upstream tree. The patch was cherry-picked onto real upstream `main` as `e245648` on local `feat/consumer-web`. The original branches are retained. The upstream `feat/Auth` rewrite has an incompatible refresh-token schema that still needs deliberate reconciliation; see `UPSTREAM_AUTH_RECONCILIATION.md`.

## Behavior

- Admin routes require authentication and the current database user's admin role.
- Registration, password login, WhatsApp link verification and OTP verification issue tokens bound to a persisted session.
- New refresh tokens are stored as SHA-256 digests, rotate once, and have a fixed seven-day session expiry. Rotation does not extend that deadline. Access tokens default to 15 minutes.
- Reusing a rotated refresh token revokes its entire session, including the successor. Clients must serialize refresh requests; concurrent refresh attempts intentionally fail closed.
- Logout revokes one session. Logout-all, password changes and password resets revoke all of the user's sessions. Auth middleware checks session revocation on subsequent requests.
- Session issuance, rotation and revocation serialize on a PostgreSQL user-row lock. Password changes and reset-token consumption commit with revocation. WhatsApp proof consumption commits with issuance.
- Password-reset secrets are no longer returned by the public reset-request endpoint or logged by that controller. Request validation now covers reset, password change and logout.

The HTTP contract continues to use bearer access tokens and JSON refresh-token bodies. HTTP-only cookies and the associated CSRF design remain separate work. Older unbound tokens require a fresh login after rollout.

## Validation

Run from `backend`, using the package-manager version declared in `package.json`:

```sh
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:validate
pnpm test
pnpm typecheck
pnpm build
pnpm lint
```

The regression suite contains 25 tests across admin authorization, session lifecycle and HTTP authentication routes. It covers ownership checks, rotation replay, rollback, competing operations, reset-token consumption and WhatsApp linking. Database operations use an in-memory transactional test double: these tests do not prove PostgreSQL locking or migration behavior. Local validation used Node 24.14.1 and pnpm 11.25 with package-manager auto-switching disabled; the lockfile was unchanged. Installation scripts were disabled during installation, and Prisma generation ran explicitly.

Prisma validation and client generation passed. An offline Prisma schema diff produced the same columns, indexes and foreign keys as the proposed migration. All 25 tests, the backend production build, changed-file lint and TypeScript checking passed. Repository-wide lint reports 40 errors in 27 untouched files, plus one warning; do not treat the full CI command as green.

## Migration and rollout

`backend/prisma/migrations/20261011000000_auth_session_rotation/migration.sql` adds nullable session/parent relationships, revocation metadata and indexes. It does not delete historical rows or rewrite old tokens. Old tokens cannot authenticate through the new session service.

Before deployment:

1. Reconcile this snapshot-based patch with the live repository and existing migrations.
2. Apply the baseline and proposed migration to an isolated PostgreSQL database; also test upgrading a database containing historical sessions and tokens. Exercise real concurrent refresh/logout/password-change transactions there.
3. Confirm the intended database and migration history, recovery procedure, and deployment credentials. Prisma configuration reads `DATABASE_URL`; use the designated migration connection for that environment.
4. Coordinate migration and application rollout, then verify admin denial, login, rotation, replay revocation and logout. Avoid a mixed fleet of old and new authentication handlers. Inform users that they must sign in again.

No database migration, deployment, remote push or PR update was performed for this local patch. Reverting application code to the insecure snapshot would restore the original vulnerabilities; rollback needs an explicit operational decision.

## Remaining work

Password-reset email delivery is still unimplemented: the existing generic success response does not mean an email was sent. WhatsApp OTP generation/delivery and secret logging, public phone-profile lookup, signed provider webhooks and bot/API contract mismatches still require remediation. The unused older token service remains in the tree and should not be wired back in without review.

Cookie sessions, consent, Mono ingestion, authoritative financial-state calculations, exact monetary representation, frontend integration and operational checks remain outside this patch. The supplied technical documentation is the target specification, not evidence these features already exist.
