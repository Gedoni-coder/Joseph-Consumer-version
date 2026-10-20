# Source maintenance review

Date: 20 October 2026
Baseline: `08ef571`, branch `feat/consumer-web`

## Scope

Reviewed the inventory of 293 tracked files, source comments, documentation, deployment boundaries and file-footer conventions. Functional validation covers the existing consumer regression suite and production builds. Historical modules retain their existing runtime and lint limitations.

## Changes

- Updated repository, backend and frontend entry-point documentation.
- Corrected outdated descriptions of daily Safe to Spend, burn rate and projected runway.
- Replaced asset-editing notes with dimensions, usage and export requirements.
- Removed workstation-specific setup history from the authentication comparison.
- Marked historical module documents and security reviews with their scope and links to the current consumer implementation.
- Added `SR` end-of-file comments to 221 source files, including historical source.

## Boundaries

Executable statements, financial formulas, API contracts, interface layout and official branding are unchanged. Source comparisons cover 203 JavaScript/TypeScript files; HTML content and CSS rules are also checked independently of footer comments.

Applied SQL migrations, lockfiles, JSON configuration and image assets are unchanged. They do not receive footer comments. The Prisma schema receives a comment only, with no schema migration.

Git history is retained. Existing release and schema version identifiers remain valid.

## Validation

- Frontend typecheck and production build.
- Backend compilation and Prisma client build.
- 53 non-database regression checks.
- 14 isolated PostgreSQL regression checks.
- Source syntax comparison against the baseline, ignoring comments and platform line endings.
- Documentation link and formatting checks.

The first database test attempt found the local cluster stopped. The cluster was started and all database checks passed on rerun. No production database changes are required.

## Maintenance conventions

Comments should explain invariants, security constraints, non-obvious decisions and public contracts. Keep operational procedures in the relevant README or deployment reference. Retain historical documents as explicitly scoped references rather than treating them as active consumer specifications.

Maintain the `SR` footer on source files using the file's comment syntax. Preserve applied migrations and structured formats that do not support comments.

SR
