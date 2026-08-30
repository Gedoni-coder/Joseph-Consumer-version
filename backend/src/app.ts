import express, { Application, NextFunction, Request, Response } from "express";
import "./types/express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { createAppError } from "@app-core/errors";
import { appLogger } from "@app-core/logger";
import { MESSAGES } from "@app-core/messages";
import { prisma } from "./config/prisma";
import { getRateLimitConfig } from "./config/rate-limit";
import {
  createRateLimiter,
  getDefaultRateLimitKeyDetails,
} from "./middleware/rate-limit.middleware";
import authRoutes from "./features/auth/auth.route";
import { sendSuccess } from "./utils/response.utils";
import { sendNormalizedError } from "./utils/service-error.utils";

dotenv.config();

// Create the Express application and load runtime settings used by middleware.
const app: Application = express();
const skipDb = process.env.SKIP_DB === "true";
const rateLimitConfig = getRateLimitConfig();
const apiRateLimiter = createRateLimiter({
  name: "api",
  windowMs: rateLimitConfig.apiWindowMs,
  limit: rateLimitConfig.apiMax,
  keyDetails: getDefaultRateLimitKeyDetails,
});

app.set("trust proxy", rateLimitConfig.trustProxy);

// Helmet adds common security headers.
app.use(helmet());

// CORS controls which frontend origins can call this API and send credentials.
app.use(
  cors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim())
      : [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3002",
        ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Parse incoming JSON and form payloads before requests reach route handlers.
// The size limit reduces accidental or abusive oversized request bodies.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Log every completed HTTP request with method, path, status, and response time.
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    appLogger.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
      "HTTP",
    );
  });

  next();
});

// Public health check: confirms the server is up and, when enabled, Prisma can reach the database.
app.get("/health", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (skipDb) {
      return sendSuccess(
        res,
        { database: "skipped", timestamp: new Date().toISOString() },
        "Server is healthy (database check skipped)",
      );
    }

    await prisma.$queryRaw`SELECT 1`;
    return sendSuccess(
      res,
      { database: "connected", timestamp: new Date().toISOString() },
      "Server is healthy",
    );
  } catch (_error) {
    return next(
      createAppError("Server is unhealthy", "SERVICE_UNAVAILABLE", {
        details: {
          database: "disconnected",
          timestamp: new Date().toISOString(),
        },
      }),
    );
  }
});

// Lightweight root route for a quick browser/API sanity check.
app.get("/", (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    { timestamp: new Date().toISOString() },
    "JOSEPH AI API is running",
  );
});

// Apply API-wide rate limiting to the remaining API namespace.
app.use("/api", apiRateLimiter);
app.use("/api/auth", authRoutes);

// API index route lists the top-level health endpoint.
app.get("/api", (_req: Request, res: Response) => {
  return sendSuccess(
    res,
    {
      health: "/health",
    },
    "API route index loaded",
  );
});

// Return a normalized 404 for unknown /api routes.
app.use("/api", (req: Request, _res: Response, next: NextFunction) => {
  next(
    createAppError(
      `Endpoint not found: ${req.method} ${req.originalUrl}`,
      "NOT_FOUND",
    ),
  );
});

// Return a generic 404 for anything outside the API namespace.
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(createAppError(MESSAGES.COMMON.ROUTE_NOT_FOUND, "NOT_FOUND"));
});

// Central error handler: logs the error and converts it into the shared response shape.
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  appLogger.errorX(err, "APP-ERROR");
  return sendNormalizedError(res, err);
});

export default app;
