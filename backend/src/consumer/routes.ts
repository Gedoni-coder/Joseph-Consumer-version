import { Router, Request, Response, NextFunction } from "express";
import { isDeepStrictEqual } from "node:util";
import rateLimit from "express-rate-limit";
import Joi from "joi";
import { bankRoutes, assertNoPendingBankExchange } from "./banks";
import { monoConfigured } from "./mono";
import authService from "../services/prisma/authService";
import {
  createAuthSession,
  rotateAuthSession,
  revokeAuthSession,
  revokeAllAuthSessions,
  withLockedUser,
} from "../services/prisma/authSessionService";
import { authenticate } from "../middleware/authPrisma";
import { validateRegister, validateLogin } from "../middleware/validation";
import {
  calculate,
  ENGINE_VERSION,
  RULES_VERSION,
  MAX_MONEY,
  type EngineInput,
} from "./engine";
import type { Prisma } from "@prisma/client";

const router = Router();
router.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    message: {
      message: "Too many requests. Please wait a minute and try again.",
    },
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);
const COOKIE_PATH = "/api/consumer";
const consentVersion = "manual-planning-2026-10-16";
function cookie(req: Request, name: string) {
  const value = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(name + "="));
  try {
    return value ? decodeURIComponent(value.slice(name.length + 1)) : "";
  } catch {
    return "";
  }
}
function cookies(
  res: Response,
  pair: { accessToken: string; refreshToken: string },
) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: COOKIE_PATH,
  };
  res.cookie("joseph_access", pair.accessToken, {
    ...options,
    maxAge: 15 * 60_000,
  });
  res.cookie("joseph_refresh", pair.refreshToken, {
    ...options,
    maxAge: 7 * 86_400_000,
  });
}
function clearCookies(res: Response) {
  for (const name of ["joseph_access", "joseph_refresh"])
    res.clearCookie(name, {
      path: COOKIE_PATH,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
}
router.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const allowed = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!req.headers.origin || !allowed.includes(req.headers.origin))
    return res
      .status(403)
      .json({ message: "This request must come from the JOSEPH app." });
  if (!req.is("application/json"))
    return res.status(415).json({ message: "Send a JSON request." });
  next();
});
const authLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  message: {
    message: "Too many sign-in attempts. Please wait 15 minutes and try again.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
const safeUser = (user: {
  id: string;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  isEmailVerified?: unknown;
}) => ({
  id: user.id,
  name: String(user.name || ""),
  email: String(user.email || ""),
  phone: String(user.phone || ""),
  emailVerified: user.isEmailVerified === true,
  phoneVerified: false,
});
router.get("/capabilities", (_req, res) =>
  res.json({
    bankConnection: monoConfigured(),
    bankEnvironment: "sandbox",
    emailVerification: false,
    phoneVerification: false,
    whatsapp: false,
    mode: "manual-planning",
    consentVersion,
  }),
);
router.post("/register", authLimiter, validateRegister, async (req, res) => {
  if (Buffer.byteLength(req.body.password, "utf8") > 72)
    return res
      .status(400)
      .json({ message: "Password must be at most 72 bytes." });
  if (!/^\+?\d{10,15}$/.test(req.body.phone || ""))
    return res
      .status(400)
      .json({ message: "Enter a phone number with 10–15 digits." });
  const user = await authService.registerUser(req.body);
  const pair = await createAuthSession(user, {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });
  cookies(res, pair);
  res.status(201).json({ user: safeUser(user) });
});
router.post("/login", authLimiter, validateLogin, async (req, res) => {
  const user = await authService.verifyCredentials(
    req.body.email,
    req.body.password,
  );
  cookies(
    res,
    await createAuthSession(user, {
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    }),
  );
  res.json({ user: safeUser(user) });
});
router.post("/refresh", async (req, res) => {
  try {
    cookies(res, await rotateAuthSession(cookie(req, "joseph_refresh")));
    res.json({ ok: true });
  } catch {
    clearCookies(res);
    res.status(401).json({ message: "Please sign in again." });
  }
});
router.use((req, _res, next) => {
  const token = cookie(req, "joseph_access");
  // The consumer app accepts its own HttpOnly session only; legacy bearer routes remain separate.
  req.headers.authorization = token ? "Bearer " + token : undefined;
  next();
}, authenticate);
router.get("/me", (req, res) => res.json({ user: safeUser(req.user) }));
router.post("/logout", async (req, res) => {
  if (req.body.all === true) await revokeAllAuthSessions(req.userId);
  else await revokeAuthSession(req.userId, cookie(req, "joseph_refresh"));
  clearCookies(res);
  res.json({ ok: true });
});

const money = Joi.number().integer().min(0).max(MAX_MONEY).required();
const label = Joi.string().trim().min(1).max(80).required();
const accountSchema = Joi.object({ label, balance: money }).unknown(false);
const planSchema = Joi.object({
  daily: money,
  reserve: money,
  horizon: Joi.number().integer().min(7).max(90).required(),
}).unknown(false);
const commitmentSchema = Joi.object({
  label,
  amount: money.min(1),
  kind: Joi.string().valid("bill", "goal").required(),
  dueDate: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const date = new Date(value + "T00:00:00Z");
      return Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
        ? helpers.error("any.invalid")
        : value;
    })
    .required(),
}).unknown(false);
function validate(schema: Joi.ObjectSchema, req: Request) {
  const { error, value } = schema.validate(req.body, { convert: false });
  if (error)
    throw Object.assign(new Error(error.details[0].message), { status: 400 });
  return value;
}
async function hasConsent(tx: Prisma.TransactionClient, userId: string) {
  const consent = await tx.consumerConsent.findFirst({
    where: { userId, purpose: "manual-planning" },
    orderBy: { createdAt: "desc" },
  });
  if (!consent?.accepted || consent.version !== consentVersion)
    throw Object.assign(
      new Error("Review and accept the planning consent first."),
      { status: 409 },
    );
}
async function inputs(
  tx: Prisma.TransactionClient,
  userId: string,
): Promise<EngineInput> {
  const plan = await tx.consumerPlan.findUnique({ where: { userId } });
  const accounts = await tx.moneyAccount.findMany({
    where: { userId },
    orderBy: { id: "asc" },
  });
  const commitments = await tx.consumerCommitment.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { id: "asc" }],
  });
  return {
    asOf: new Date().toISOString(),
    horizon: plan?.horizon ?? 30,
    daily: Number(plan?.daily ?? 0),
    reserve: Number(plan?.reserve ?? 0),
    planConfirmed: !!plan,
    accounts: accounts.map((item) => ({
      id: item.id,
      label: item.label,
      balance: Number(item.balance),
      confirmedAt: item.confirmedAt.toISOString(),
    })),
    commitments: commitments.map((item) => ({
      id: item.id,
      label: item.label,
      amount: Number(item.amount),
      dueDate: item.dueDate,
      kind: item.kind as "bill" | "goal",
    })),
  };
}
async function snapshot(
  tx: Prisma.TransactionClient,
  userId: string,
  reason: string,
) {
  const source = await inputs(tx, userId);
  const result = calculate(source);
  const previous = await tx.financialSnapshot.findFirst({
    where: { userId },
    orderBy: { generatedAt: "desc" },
  });
  if (previous) {
    const oldInputs = previous.inputs as unknown as EngineInput;
    const oldResult = previous.result as unknown as ReturnType<
      typeof calculate
    >;
    if (
      isDeepStrictEqual(
        { ...oldInputs, asOf: null },
        { ...source, asOf: null },
      ) &&
      isDeepStrictEqual(
        { ...oldResult, generatedAt: null },
        { ...result, generatedAt: null },
      )
    ) {
      return { id: previous.id, ...oldResult };
    }
  }
  const state = await tx.financialSnapshot.create({
    data: {
      userId,
      reason,
      engineVersion: ENGINE_VERSION,
      rulesVersion: RULES_VERSION,
      inputs: source as unknown as Prisma.InputJsonValue,
      result: result as unknown as Prisma.InputJsonValue,
    },
  });
  return { id: state.id, ...result };
}
router.get("/dashboard", async (req, res) => {
  const dashboard = await withLockedUser(req.userId, async (tx) => {
    const source = await inputs(tx, req.userId);
    const consent = await tx.consumerConsent.findFirst({
      where: { userId: req.userId, purpose: "manual-planning" },
      orderBy: { createdAt: "desc" },
    });
    const recent = await tx.financialSnapshot.findMany({
      where: { userId: req.userId },
      orderBy: { generatedAt: "desc" },
      take: 8,
      select: { id: true, generatedAt: true, reason: true },
    });
    return {
      user: safeUser(req.user),
      inputs: source,
      consent: !!consent?.accepted && consent.version === consentVersion,
      state:
        consent?.accepted && consent.version === consentVersion
          ? await snapshot(tx, req.userId, "STATE_REVIEWED")
          : calculate(source),
      history: recent,
      requiresOnboarding: !req.user.onboardingComplete && !source.planConfirmed,
    };
  });
  res.json(dashboard);
});
router.post("/consent", async (req, res) => {
  validate(
    Joi.object({
      accepted: Joi.boolean().valid(true).required(),
      version: Joi.string().valid(consentVersion).required(),
    }),
    req,
  );
  await withLockedUser(req.userId, (tx) =>
    tx.consumerConsent.create({
      data: {
        userId: req.userId,
        version: consentVersion,
        purpose: "manual-planning",
        accepted: true,
      },
    }),
  );
  res.json({ ok: true });
});
router.use("/banks", bankRoutes(hasConsent));
router.post("/onboarding", async (req, res) => {
  const data = validate(
    Joi.object({
      accepted: Joi.boolean().valid(true).required(),
      version: Joi.string().valid(consentVersion).required(),
      daily: money,
      reserve: money,
      horizon: Joi.number().integer().min(7).max(90).required(),
      cashBalance: Joi.number()
        .integer()
        .min(0)
        .max(MAX_MONEY)
        .allow(null)
        .required(),
      commitments: Joi.array().items(commitmentSchema).max(20).required(),
    }).unknown(false),
    req,
  );
  await withLockedUser(req.userId, async (tx, user) => {
    if (
      user.onboardingComplete ||
      (await tx.consumerPlan.findUnique({ where: { userId: user.id } }))
    ) {
      throw Object.assign(
        new Error(
          "Your plan is already set up. Update it from your dashboard.",
        ),
        { status: 409 },
      );
    }
    if (
      (await tx.moneyAccount.count({ where: { userId: user.id } })) ||
      (await tx.consumerCommitment.count({ where: { userId: user.id } }))
    ) {
      throw Object.assign(
        new Error(
          "You already have saved entries. Complete your spending plan from the dashboard.",
        ),
        { status: 409 },
      );
    }
    await tx.consumerConsent.create({
      data: {
        userId: user.id,
        version: consentVersion,
        purpose: "manual-planning",
        accepted: true,
      },
    });
    await tx.consumerPlan.create({
      data: {
        userId: user.id,
        daily: data.daily,
        reserve: data.reserve,
        horizon: data.horizon,
      },
    });
    if (data.cashBalance !== null)
      await tx.moneyAccount.create({
        data: {
          userId: user.id,
          label: "Cash and unlinked money",
          balance: data.cashBalance,
        },
      });
    for (const commitment of data.commitments)
      await tx.consumerCommitment.create({
        data: { userId: user.id, ...commitment },
      });
    await tx.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true, onboardingStep: 2 },
    });
    await snapshot(tx, user.id, "ONBOARDING_COMPLETED");
  });
  res.json({ ok: true });
});
router.put("/plan", async (req, res) => {
  const data = validate(planSchema, req);
  const state = await withLockedUser(req.userId, async (tx) => {
    await hasConsent(tx, req.userId);
    await tx.consumerPlan.upsert({
      where: { userId: req.userId },
      create: { userId: req.userId, ...data },
      update: { ...data, confirmedAt: new Date() },
    });
    return snapshot(tx, req.userId, "SPENDING_PLAN_CONFIRMED");
  });
  res.json({ state });
});
for (const resource of ["accounts", "commitments"] as const) {
  const schema = resource === "accounts" ? accountSchema : commitmentSchema;
  const reason =
    resource === "accounts" ? "BALANCE_REFRESH" : "COMMITMENT_CHANGED";
  router.post("/" + resource, async (req, res) => {
    const data = validate(schema, req);
    const result = await withLockedUser(req.userId, async (tx) => {
      await hasConsent(tx, req.userId);
      const count =
        resource === "accounts"
          ? await tx.moneyAccount.count({ where: { userId: req.userId } })
          : await tx.consumerCommitment.count({
              where: { userId: req.userId },
            });
      if (count >= 100)
        throw Object.assign(
          new Error("You can save up to 100 records of this type."),
          { status: 400 },
        );
      const record =
        resource === "accounts"
          ? await tx.moneyAccount.create({
              data: { userId: req.userId, ...data },
            })
          : await tx.consumerCommitment.create({
              data: { userId: req.userId, ...data },
            });
      return { id: record.id, state: await snapshot(tx, req.userId, reason) };
    });
    res.status(201).json(result);
  });
  router.put("/" + resource + "/:id", async (req, res) => {
    const data = validate(schema, req);
    const state = await withLockedUser(req.userId, async (tx) => {
      await hasConsent(tx, req.userId);
      const where = { id: String(req.params.id), userId: req.userId };
      const changed =
        resource === "accounts"
          ? await tx.moneyAccount.updateMany({
              where,
              data: { ...data, confirmedAt: new Date() },
            })
          : await tx.consumerCommitment.updateMany({ where, data });
      if (!changed.count)
        throw Object.assign(new Error("Record not found."), { status: 404 });
      return snapshot(tx, req.userId, reason);
    });
    res.json({ state });
  });
  router.delete("/" + resource + "/:id", async (req, res) => {
    const state = await withLockedUser(req.userId, async (tx) => {
      await hasConsent(tx, req.userId);
      const where = { id: String(req.params.id), userId: req.userId };
      const changed =
        resource === "accounts"
          ? await tx.moneyAccount.deleteMany({ where })
          : await tx.consumerCommitment.deleteMany({ where });
      if (!changed.count)
        throw Object.assign(new Error("Record not found."), { status: 404 });
      return snapshot(tx, req.userId, reason);
    });
    res.json({ state });
  });
}
router.post("/simulate", async (req, res) => {
  const { amount } = validate(Joi.object({ amount: money.min(1) }), req);
  const result = await withLockedUser(req.userId, async (tx) => {
    await hasConsent(tx, req.userId);
    const state = await snapshot(tx, req.userId, "PURCHASE_CHECKED");
    const saved = await tx.financialSnapshot.findUniqueOrThrow({
      where: { id: state.id },
    });
    return {
      stateId: state.id,
      ...calculate(saved.inputs as unknown as EngineInput, amount),
    };
  });
  res.json(result);
});
router.get("/export", async (req, res) => {
  const data = await withLockedUser(req.userId, async (tx) => ({
    user: safeUser(req.user),
    inputs: await inputs(tx, req.userId),
    banks: (
      await tx.consumerBankConnection.findMany({
        where: { userId: req.userId },
      })
    ).map(({ providerAccountId: _privateId, balance, ...bank }) => ({
      ...bank,
      balance: balance === null ? null : Number(balance),
    })),
    consents: await tx.consumerConsent.findMany({
      where: { userId: req.userId },
    }),
    snapshots: await tx.financialSnapshot.findMany({
      where: { userId: req.userId },
      orderBy: { generatedAt: "desc" },
      take: 100,
    }),
  }));
  res.json(data);
});
router.delete("/planning-data", async (req, res) => {
  validate(
    Joi.object({ confirmation: Joi.string().valid("DELETE").required() }),
    req,
  );
  await withLockedUser(req.userId, async (tx) => {
    await assertNoPendingBankExchange(tx, req.userId);
    if (
      await tx.consumerBankConnection.count({ where: { userId: req.userId } })
    )
      throw Object.assign(
        new Error(
          "Disconnect your banks in Balances before erasing your planning data.",
        ),
        { status: 409 },
      );
    await tx.consumerBankLinkSession.deleteMany({
      where: { userId: req.userId },
    });
    await tx.moneyAccount.deleteMany({ where: { userId: req.userId } });
    await tx.consumerCommitment.deleteMany({ where: { userId: req.userId } });
    await tx.consumerPlan.deleteMany({ where: { userId: req.userId } });
    await tx.financialSnapshot.deleteMany({ where: { userId: req.userId } });
    await tx.consumerConsent.create({
      data: {
        userId: req.userId,
        version: consentVersion,
        purpose: "manual-planning",
        accepted: false,
      },
    });
  });
  res.json({ ok: true });
});
router.delete("/account", async (req, res) => {
  const body = validate(
    Joi.object({
      password: Joi.string().max(72).required(),
      confirmation: Joi.string().valid("DELETE MY ACCOUNT").required(),
    }),
    req,
  );
  const verified = await authService.verifyCredentials(
    req.user.email,
    body.password,
  );
  await withLockedUser(req.userId, async (tx, user) => {
    if (verified.id !== user.id || verified.password !== user.password)
      throw Object.assign(new Error("Please sign in again."), { status: 401 });
    await assertNoPendingBankExchange(tx, user.id);
    if (await tx.consumerBankConnection.count({ where: { userId: user.id } }))
      throw Object.assign(
        new Error(
          "Disconnect your banks in Balances before deleting your account.",
        ),
        { status: 409 },
      );
    await tx.user.delete({ where: { id: user.id } });
  });
  clearCookies(res);
  res.json({ ok: true });
});
router.use(
  (
    error: Error & { status?: number; code?: string },
    _req: Request,
    res: Response,
    _next: NextFunction,
  ) => {
    const duplicate =
      ["DUPLICATE_EMAIL", "DUPLICATE_PHONE"].includes(error.message) ||
      error.code === "P2002";
    const unauthorized = [
      "USER_NOT_FOUND",
      "INVALID_PASSWORD",
      "ACCOUNT_INACTIVE",
    ].includes(error.message);
    res
      .status(duplicate ? 409 : unauthorized ? 401 : error.status || 500)
      .json({
        message: duplicate
          ? "An account already uses these details. Try signing in."
          : unauthorized
            ? "Email or password is incorrect."
            : error.status
              ? error.message
              : "We could not save this change. Please try again.",
      });
  },
);
export default router;
