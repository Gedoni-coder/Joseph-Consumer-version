# JOSEPH consumer backend

The active consumer API uses Node 24, TypeScript, Express, Prisma and PostgreSQL. Production mounts backend/src/consumer-app.ts through api/index.js. The broader app.ts entry point and legacy-mongo directory contain separate historical services.

## Contracts

- [Deployment configuration](../docs/CONSUMER_DEPLOYMENT.md)
- [Implementation boundaries](../docs/CONSUMER_LOCAL_IMPLEMENTATION.md)

Financial rules are defined in src/consumer/engine.ts. Do not duplicate their arithmetic in controllers or frontend components. Validate money at the API boundary and persist integer kobo. Keep database queries scoped to the authenticated user and maintain the row lock around financial reads and writes.

## Development

Install the pinned workspace dependencies through the root scripts/install.cjs script after npm ci. Node and package-manager versions are declared in the package manifests.

From this directory:

    npm run local:init
    npm run local:build
    npm run local:start

The helper uses PostgreSQL 17 on loopback port 55439 and serves the API on port 4000. Set JOSEPH_PG_BIN when PostgreSQL binaries are installed outside the default Windows directory. Local secrets and database files live under ignored .local/.

## Validation

    npm run local:test

This includes the isolated PostgreSQL consumer suite. The suite refuses non-loopback database connections and cleans up its test users. Production builds run from the repository root with npm run build. Migration verification must use an isolated database before production deployment. Applied migration files are immutable.

The historical services retain a separate lint baseline. Use targeted lint for changed modules and record any broader baseline failures explicitly.

SR
