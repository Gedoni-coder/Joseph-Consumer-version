// Fail closed before loading modules that capture environment configuration.
for (const key of ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"]) {
  if (
    !process.env[key] ||
    (key !== "DATABASE_URL" && process.env[key].length < 32)
  ) {
    throw new Error(`Missing or invalid server configuration: ${key}`);
  }
}
if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET)
  throw new Error("Session secrets must differ.");
// Vercel-provided domains are project-bound, unlike untrusted Host headers.
process.env.FRONTEND_URL = [
  process.env.FRONTEND_URL,
  ...["VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"].map((key) =>
    process.env[key] ? `https://${process.env[key]}` : "",
  ),
]
  .filter(Boolean)
  .join(",");
const { attachDatabasePool } = require("@vercel/functions");
const { pool } = require("../backend/core/db/dist");
attachDatabasePool(pool);
module.exports = require("../backend/dist/consumer-app").default;
