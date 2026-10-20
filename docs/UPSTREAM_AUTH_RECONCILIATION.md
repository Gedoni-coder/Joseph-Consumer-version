# Upstream authentication comparison — 13 October 2026

> Historical review. Current consumer deployment details are maintained in [CONSUMER_DEPLOYMENT.md](CONSUMER_DEPLOYMENT.md).

This historical comparison records repository refs fetched on 13 October 2026. Pull-request discussion was not part of the review. Refer to CONSUMER_DEPLOYMENT.md for the current runtime.

Verified refs:

| Ref | Commit |
| --- | --- |
| Default `main` | `64a98207eef2a717b30b34fb3e4d49c4eba4245c` |
| `dev` | `e78636af5660b6c3370dab6bb50f2a24e9b2d162` |
| `feat/Auth` | `893517c166faec60d0cb181f484e74fa372315b8` |

The supplied archive matches the complete tracked tree of upstream `main`. Local `feat/consumer-web` now descends from that real upstream commit. The previous security commit `f82d22f` was cherry-picked as `e245648`, preserving `fix/security-foundation` and `snapshot-baseline` for traceability.

## Overlap that must be reconciled

`feat/Auth` contains a substantive, unmerged rewrite across 43 files. It moves authentication into `backend/src/features/auth/`, moves service files, introduces opaque refresh cookies, changes frontend session handling and replaces the refresh-token schema with hashed token families and revocation reasons.

Our earlier security patch targets `main`'s original auth layout, uses session-bound JWT refresh tokens and adds `sessionId`/`parentId` relationships. Its migration cannot be combined blindly with the feature branch's replacement schema. This comparison did not merge or certify the feature branch.

Before deployment, choose one canonical cookie/session architecture and port the regression requirements into it: admin role enforcement, hashed refresh persistence, rotation/replay detection, owner-bound logout, all-device revocation, atomic password/reset behavior, access-session revocation, and WhatsApp proof consumption. Preserve the feature branch's cookie transport direction while checking CSRF/origin policy and concurrency against real PostgreSQL. The admin guard remains disabled in the fetched feature branch.

The new landing page is self-contained and does not call either auth contract. Neither migration was applied. No remote branch, pull request, or deployment was changed.

SR
