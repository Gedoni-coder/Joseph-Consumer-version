import { Router, type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import { createHash } from "node:crypto";
import type { Prisma, ConsumerBankConnection } from "@prisma/client";
import { prisma } from "../config/prisma";
import { withLockedUser } from "../services/prisma/authSessionService";
import {
  BANK_CONSENT_VERSION,
  bankError,
  monoConfigured,
  exchangeMonoCode,
  fetchMonoAccount,
  unlinkMonoAccount,
} from "./mono";

const safeBank = (bank: ConsumerBankConnection) => ({
  id: bank.id,
  bankName: bank.bankName,
  accountName: bank.accountName,
  last4: bank.last4,
  currency: bank.currency,
  balance: bank.balance === null ? null : Number(bank.balance),
  status: bank.status,
  sandbox: bank.sandbox,
  syncedAt: bank.syncedAt,
});
export async function assertNoPendingBankExchange(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const pending = await tx.consumerBankLinkSession.count({
    where: { userId, consumedAt: { not: null }, expiresAt: { gt: new Date() } },
  });
  if (pending)
    throw bankError(
      "Your bank connection is still completing. Please wait a moment and try again.",
      409,
    );
}
export function bankRoutes(
  hasPlanningConsent: (
    tx: Prisma.TransactionClient,
    userId: string,
  ) => Promise<void>,
) {
  const router = Router();
  router.get("/", async (req, res) => {
    const banks = await prisma.consumerBankConnection.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "asc" },
    });
    res.json({
      configured: monoConfigured(),
      sandbox: true,
      consentVersion: BANK_CONSENT_VERSION,
      banks: banks.map(safeBank),
    });
  });
  router.use(
    rateLimit({
      windowMs: 60_000,
      limit: 8,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Please wait a minute before trying another bank request.",
      },
    }),
  );
  router.post("/session", async (req, res) => {
    if (!monoConfigured())
      throw bankError("Bank testing is not configured yet.", 503);
    if (req.body.accepted !== true || req.body.version !== BANK_CONSENT_VERSION)
      throw bankError("Please review the bank connection consent first.");
    const session = await withLockedUser(req.userId, async (tx) => {
      await hasPlanningConsent(tx, req.userId);
      if (
        (await tx.consumerBankConnection.count({
          where: { userId: req.userId },
        })) >= 10
      )
        throw bankError("You can connect up to 10 test accounts.");
      await tx.consumerBankLinkSession.deleteMany({
        where: { userId: req.userId, expiresAt: { lt: new Date() } },
      });
      await tx.consumerConsent.create({
        data: {
          userId: req.userId,
          purpose: "bank-connection",
          version: BANK_CONSENT_VERSION,
          accepted: true,
        },
      });
      return tx.consumerBankLinkSession.create({
        data: {
          userId: req.userId,
          expiresAt: new Date(Date.now() + 10 * 60_000),
        },
      });
    });
    res.json({
      sessionId: session.id,
      publicKey: process.env.MONO_PUBLIC_KEY,
      customer: { name: req.user.name, email: req.user.email },
      sandbox: true,
    });
  });
  router.post("/exchange", async (req, res) => {
    const { sessionId, code } = req.body;
    if (
      typeof sessionId !== "string" ||
      typeof code !== "string" ||
      code.length < 6 ||
      code.length > 300
    )
      throw bankError("Invalid bank connection response.");
    const codeHash = createHash("sha256").update(code).digest("hex");
    await withLockedUser(req.userId, async (tx) => {
      await hasPlanningConsent(tx, req.userId);
      const session = await tx.consumerBankLinkSession.findFirst({
        where: { id: sessionId, userId: req.userId },
      });
      if (
        !session ||
        session.consumedAt ||
        session.expiresAt.getTime() < Date.now()
      )
        throw bankError(
          "This bank connection has expired or was already used. Start a new connection.",
          409,
        );
      await assertNoPendingBankExchange(tx, req.userId);
      if (
        (await tx.consumerBankConnection.count({
          where: { userId: req.userId },
        })) >= 10
      )
        throw bankError("You can connect up to 10 test accounts.");
      await tx.consumerBankLinkSession.update({
        where: { id: session.id },
        data: { codeHash, consumedAt: new Date() },
      });
    });
    try {
      const providerAccountId = await exchangeMonoCode(code);
      const bank = await withLockedUser(req.userId, async (tx) => {
        await hasPlanningConsent(tx, req.userId);
        if (
          !(await tx.consumerBankLinkSession.findFirst({
            where: { id: sessionId, userId: req.userId },
          }))
        )
          throw bankError("This connection was cancelled.", 409);
        const existing = await tx.consumerBankConnection.findUnique({
          where: { providerAccountId },
        });
        if (existing && existing.userId !== req.userId)
          throw bankError(
            "This bank account is already connected to another JOSEPH account.",
            409,
          );
        if (existing) return existing;
        if (
          (await tx.consumerBankConnection.count({
            where: { userId: req.userId },
          })) >= 10
        )
          throw bankError("You can connect up to 10 test accounts.");
        return tx.consumerBankConnection.create({
          data: { userId: req.userId, providerAccountId, sandbox: true },
        });
      });
      // A slow/processing provider response does not lose the completed connection.
      try {
        await refreshBank(req.userId, bank.id);
      } catch {
        /* Retry is available from the saved account. */
      }
      const current = await prisma.consumerBankConnection.findFirst({
        where: { id: bank.id, userId: req.userId },
      });
      res.json({ bank: current ? safeBank(current) : null });
    } finally {
      await prisma.consumerBankLinkSession.updateMany({
        where: { id: sessionId, userId: req.userId },
        data: { expiresAt: new Date() },
      });
    }
  });
  async function refreshBank(userId: string, id: string) {
    const bank = await prisma.consumerBankConnection.findFirst({
      where: { id, userId },
    });
    if (!bank) throw bankError("Bank connection not found.", 404);
    if (bank.status === "disconnecting")
      throw bankError("Disconnect this bank before connecting it again.", 409);
    const details = await fetchMonoAccount(bank.providerAccountId);
    return withLockedUser(userId, async (tx) => {
      await hasPlanningConsent(tx, userId);
      const changed = await tx.consumerBankConnection.updateMany({
        where: { id, userId, status: { not: "disconnecting" } },
        data: details,
      });
      if (!changed.count) throw bankError("Bank connection was removed.", 409);
      return tx.consumerBankConnection.findUniqueOrThrow({ where: { id } });
    });
  }
  router.post("/:id/refresh", async (req, res) =>
    res.json({
      bank: safeBank(await refreshBank(req.userId, String(req.params.id))),
    }),
  );
  router.delete("/:id", async (req, res) => {
    const bank = await withLockedUser(req.userId, async (tx) => {
      await assertNoPendingBankExchange(tx, req.userId);
      const current = await tx.consumerBankConnection.findFirst({
        where: { id: String(req.params.id), userId: req.userId },
      });
      if (!current) throw bankError("Bank connection not found.", 404);
      return tx.consumerBankConnection.update({
        where: { id: current.id },
        data: { status: "disconnecting", balance: null, syncedAt: null },
      });
    });
    // Keep the record for retry if remote unlink fails. Never claim revocation prematurely.
    await unlinkMonoAccount(bank.providerAccountId);
    await withLockedUser(req.userId, async (tx) => {
      await tx.consumerBankConnection.deleteMany({
        where: { id: bank.id, userId: req.userId },
      });
      if (
        !(await tx.consumerBankConnection.count({
          where: { userId: req.userId },
        }))
      ) {
        await tx.consumerBankLinkSession.deleteMany({
          where: { userId: req.userId },
        });
        await tx.consumerConsent.create({
          data: {
            userId: req.userId,
            purpose: "bank-connection",
            version: BANK_CONSENT_VERSION,
            accepted: false,
          },
        });
      }
    });
    res.json({ ok: true });
  });
  const errors: ErrorRequestHandler = (error, _req, res, next) => {
    if (error.code === "P2002") {
      res
        .status(409)
        .json({
          message:
            "This bank connection was already used. Start a new connection.",
        });
      return;
    }
    next(error);
  };
  router.use(errors);
  return router;
}

// SR
