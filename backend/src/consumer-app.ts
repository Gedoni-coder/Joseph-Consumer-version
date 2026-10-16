import express from "express";
import helmet from "helmet";
import consumerRoutes from "./consumer/routes";

// Only the reviewed consumer surface is deployed. Legacy integrations are separate.
const app = express();
app.disable("x-powered-by");
if (process.env.VERCEL === "1") app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "joseph-consumer" }),
);
app.use("/api/consumer", consumerRoutes);
app.use((_req, res) => res.status(404).json({ message: "Route not found." }));
app.use(
  (
    error: { status?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status =
      error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    res
      .status(status)
      .json({
        message:
          status === 413
            ? "Request is too large."
            : status === 400
              ? "Invalid request."
              : "Unable to complete this request.",
      });
  },
);
export default app;
