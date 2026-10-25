# Consumer implementation

## Runtime boundary

The React frontend calls same-origin /api/consumer routes. The consumer Express entry point reuses the session service and Prisma/PostgreSQL layer. The financial engine is backend/src/consumer/engine.ts; spending aggregation is backend/src/consumer/spending.ts. Type-only frontend imports do not bundle executable financial calculations.

The active versions are fse-1.1.0 and daily-plan-1.1.0.

## Persistence and consistency

ConsumerPlan, MoneyAccount, ConsumerCommitment, ConsumerPurchase, FinancialSnapshot and ConsumerConsent are user-owned records with cascading deletion. ConsumerBankConnection and ConsumerBankLinkSession support sandbox linking. Monetary amounts use BIGINT kobo; API validation bounds values and collection sizes. Financial reads and writes serialize on the user's row. Every query is scoped to the authenticated owner.

Snapshots preserve financial inputs, outputs, versions and reasons. Changes in spending dates, balance freshness or the Nigeria calendar date can change a result without a plan edit. A matching material state reuses the previous snapshot.

## Authentication and privacy

Consumer sessions use HttpOnly, SameSite=Strict cookies scoped to /api/consumer, with Secure enabled in production. Refresh credentials are hashed, rotated and revocable. Mutations require an allowlisted Origin and JSON. Planning writes require current consent. Browser storage contains no session tokens.

Export omits credential material and private provider identifiers. Planning erasure removes financial data while retaining the account and consent audit. Password-confirmed account deletion removes the user and cascaded records. Bank connections must be disconnected before deletion; pending exchanges and failed unlink operations remain visible for retry.

## Local environment

backend/scripts/local.cjs runs an isolated PostgreSQL cluster and API bound to loopback. It uses local credentials under ignored .local/ and does not reuse an external DATABASE_URL. PostgreSQL data is persistent; removing .local/ deletes the local test accounts and plans. DB_LOG_QUERIES enables optional query logging.

## Outstanding work

- Live bank linking, transaction ingestion, normalization, deduplication, automatic refresh and verified webhooks.
- Email/phone verification, recovery email delivery configuration and reviewed terms/privacy flows.
- Recurring commitments, transaction correction workflows and complete goal progress schedules.
- WhatsApp account linking, consent, message delivery, scheduled reminders and financial-response integration.
- Shared rate-limit storage, monitoring, backup/restore procedures and operational acceptance checks.

The historical root application and upstream feat/Auth rewrite use different contracts. Reconcile their session and migration models before enabling any of those routes in the consumer runtime.

SR
