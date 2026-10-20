import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import * as mono from "../src/consumer/mono";
import {
  calculate,
  nigeriaDate,
  type EngineInput,
} from "../src/consumer/engine";

describe.runIf(process.env.JOSEPH_LOCAL_TEST === "true")(
  "consumer HTTP against isolated PostgreSQL",
  () => {
    let server: Server, url: string;
    let prisma: (typeof import("../src/config/prisma"))["prisma"];
    const ids: string[] = [];
    const origin = "http://127.0.0.1:5180";
    type Jar = Record<string, string>;
    let alice: Jar = {},
      bob: Jar = {};
    let aliceId: string, accountId: string;
    async function request(
      jar: Jar,
      path: string,
      method = "GET",
      body?: object,
      from = origin,
    ) {
      const response = await fetch(url + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: from,
          Cookie: Object.entries(jar)
            .map(([key, value]) => key + "=" + value)
            .join("; "),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      for (const value of response.headers.getSetCookie()) {
        const [key, ...rest] = value.split(";")[0].split("=");
        jar[key] = rest.join("=");
      }
      return { response, body: await response.json() };
    }
    async function register(jar: Jar) {
      const result = await request(jar, "/register", "POST", {
        name: "Integration User",
        email: randomUUID() + "@example.com",
        password: "LocalTestPassword42!",
        phone:
          "080" +
          Date.now().toString().slice(-6) +
          String(ids.length).padStart(2, "0"),
      });
      expect(result.response.status).toBe(201);
      ids.push(result.body.user.id);
      expect(result.body.accessToken).toBeUndefined();
      expect(result.body.refreshToken).toBeUndefined();
      expect(
        result.response.headers
          .getSetCookie()
          .every(
            (value) =>
              value.includes("HttpOnly") && value.includes("SameSite=Strict"),
          ),
      ).toBe(true);
      return result.body.user.id;
    }
    beforeAll(async () => {
      // Never enable this suite against a shared database.
      if (!process.env.DATABASE_URL?.includes("@127.0.0.1:55439/postgres"))
        throw new Error(
          "Use scripts/local.cjs test for an isolated local database.",
        );
      prisma = (await import("../src/config/prisma")).prisma;
      const app = (await import("../src/consumer-app")).default;
      server = app.listen(0, "127.0.0.1");
      await new Promise<void>((resolve) => server.once("listening", resolve));
      url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/consumer`;
      aliceId = await register(alice);
      await register(bob);
    });
    afterAll(async () => {
      if (server)
        await new Promise<void>((resolve) => server.close(() => resolve()));
      if (prisma) {
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
        await prisma.$disconnect();
      }
    });
    it("exposes only the consumer API and rejects malformed or oversized bodies", async () => {
      const base = url.replace("/api/consumer", "");
      const health = await fetch(base + "/api/health");
      expect(health.status).toBe(200);
      expect(health.headers.get("x-content-type-options")).toBe("nosniff");
      for (const route of ["/api/admin", "/api/whatsapp", "/api/auth/login"]) {
        expect((await fetch(base + route)).status).toBe(404);
      }
      for (const [body, status] of [
        ["{", 400],
        [JSON.stringify({ data: "x".repeat(33000) }), 413],
      ] as const) {
        const response = await fetch(url + "/register", {
          method: "POST",
          headers: { "Content-Type": "application/json", Origin: origin },
          body,
        });
        expect(response.status).toBe(status);
        expect((await response.json()).message).toBeTruthy();
      }
    });
    it("requires consent and rejects cross-origin mutations", async () => {
      expect(
        (
          await request(alice, "/accounts", "POST", {
            label: "Cash",
            balance: 100,
          })
        ).response.status,
      ).toBe(409);
      expect(
        (
          await request(
            alice,
            "/consent",
            "POST",
            { accepted: true, version: "manual-planning-2026-10-16" },
            "https://unrelated.invalid",
          )
        ).response.status,
      ).toBe(403);
      expect(
        (
          await request(alice, "/consent", "POST", {
            accepted: true,
            version: "manual-planning-2026-10-16",
          })
        ).response.status,
      ).toBe(200);
      expect(
        (
          await request(bob, "/consent", "POST", {
            accepted: true,
            version: "manual-planning-2026-10-16",
          })
        ).response.status,
      ).toBe(200);
    });
    it("persists actual records and calculates from them", async () => {
      const account = await request(alice, "/accounts", "POST", {
        label: "Cash",
        balance: 10_000_000,
      });
      expect(account.response.status).toBe(201);
      accountId = account.body.id;
      expect(
        (
          await prisma.moneyAccount.findUniqueOrThrow({
            where: { id: accountId },
          })
        ).balance,
      ).toBe(10_000_000n);
      const plan = await request(alice, "/plan", "PUT", {
        daily: 100_000,
        reserve: 1_000_000,
        horizon: 30,
      });
      expect(plan.body.state.safeToSpend).toBe(300_000);
    });
    it("validates amounts and calendar dates without saving bad data", async () => {
      expect(
        (
          await request(alice, "/accounts", "POST", {
            label: "Invalid",
            balance: 0.1,
          })
        ).response.status,
      ).toBe(400);
      expect(
        (
          await request(alice, "/commitments", "POST", {
            label: "Invalid",
            amount: 1,
            dueDate: "2026-02-30",
            kind: "bill",
          })
        ).response.status,
      ).toBe(400);
      expect(
        (
          await request(alice, "/accounts", "POST", {
            label: "Invalid",
            balance: -100,
          })
        ).response.status,
      ).toBe(400);
    });
    it("reuses an unchanged snapshot instead of duplicating history on refresh", async () => {
      const first = await request(alice, "/dashboard");
      const second = await request(alice, "/dashboard");
      expect(second.body.state.id).toBe(first.body.state.id);
    });
    it("isolates user data on read, update and deletion", async () => {
      expect((await request(bob, "/dashboard")).body.inputs.accounts).toEqual(
        [],
      );
      expect(
        (
          await request(bob, "/accounts/" + accountId, "PUT", {
            label: "Stolen",
            balance: 1,
          })
        ).response.status,
      ).toBe(404);
      expect(
        (await request(bob, "/accounts/" + accountId, "DELETE", {})).response
          .status,
      ).toBe(404);
      expect(
        (
          await prisma.moneyAccount.findUniqueOrThrow({
            where: { id: accountId },
          })
        ).balance,
      ).toBe(10_000_000n);
    });
    it("simulates without changing source records and replays persisted snapshots", async () => {
      const result = await request(alice, "/simulate", "POST", {
        amount: 2_000_000,
      });
      expect(result.body.scenario.afterSafeToSpend).toBe(233_333);
      const snapshot = await prisma.financialSnapshot.findUniqueOrThrow({
        where: { id: result.body.stateId },
      });
      expect(calculate(snapshot.inputs as unknown as EngineInput)).toEqual(
        snapshot.result,
      );
      expect(
        (
          await prisma.moneyAccount.findUniqueOrThrow({
            where: { id: accountId },
          })
        ).balance,
      ).toBe(10_000_000n);
    });
    it("rotates cookies, stores only token digests, and invalidates a replayed family", async () => {
      const old = { ...bob };
      const result = await request(bob, "/refresh", "POST", {});
      expect(result.response.status).toBe(200);
      expect(bob.joseph_refresh).not.toBe(old.joseph_refresh);
      const record = await prisma.refreshToken.findFirstOrThrow({
        where: { userId: ids[1], revokedAt: null },
      });
      expect(record.token).not.toBe(decodeURIComponent(bob.joseph_refresh));
      expect(record.token).toHaveLength(64);
      expect((await request(old, "/refresh", "POST", {})).response.status).toBe(
        401,
      );
      expect((await request(bob, "/me")).response.status).toBe(401);
    });
    it("erases planning data, withdraws consent, and leaves another account untouched", async () => {
      expect(
        (
          await request(alice, "/planning-data", "DELETE", {
            confirmation: "DELETE",
          })
        ).response.status,
      ).toBe(200);
      expect(
        await prisma.moneyAccount.count({ where: { userId: aliceId } }),
      ).toBe(0);
      expect(
        await prisma.financialSnapshot.count({ where: { userId: aliceId } }),
      ).toBe(0);
      expect(await prisma.user.count({ where: { id: ids[1] } })).toBe(1);
      expect((await request(alice, "/dashboard")).body.consent).toBe(false);
      expect(
        await prisma.financialSnapshot.count({ where: { userId: aliceId } }),
      ).toBe(0);
      expect(
        (
          await request(alice, "/accounts", "POST", {
            label: "Cash",
            balance: 100,
          })
        ).response.status,
      ).toBe(409);
    });
    it("revokes authenticated access on logout", async () => {
      const old = { ...alice };
      expect(
        (await request(alice, "/logout", "POST", {})).response.status,
      ).toBe(200);
      expect((await request(old, "/me")).response.status).toBe(401);
    });
    it("sets up the onboarding modules atomically and prevents a replay from replacing them", async () => {
      const jar: Jar = {};
      const id = await register(jar);
      const setup = {
        accepted: true,
        version: "manual-planning-2026-10-16",
        daily: 100000,
        reserve: 500000,
        horizon: 30,
        cashBalance: 10000000,
        commitments: [
          {
            label: "Rent",
            amount: 1000000,
            dueDate: "2026-12-01",
            kind: "bill",
          },
        ],
      };
      const invalid = await request(jar, "/onboarding", "POST", {
        ...setup,
        daily: -1,
      });
      expect(invalid.response.status).toBe(400);
      expect(await prisma.consumerPlan.count({ where: { userId: id } })).toBe(
        0,
      );
      expect(
        (await request(jar, "/onboarding", "POST", setup)).response.status,
      ).toBe(200);
      const dashboard = (await request(jar, "/dashboard")).body;
      expect(dashboard.requiresOnboarding).toBe(false);
      expect(dashboard.inputs.accounts[0].balance).toBe(10000000);
      expect(dashboard.inputs.commitments[0].label).toBe("Rent");
      expect(dashboard.inputs.daily).toBe(100000);
      expect(
        (
          await request(jar, "/onboarding", "POST", {
            ...setup,
            cashBalance: 0,
          })
        ).response.status,
      ).toBe(409);
      expect(
        (await request(jar, "/dashboard")).body.inputs.accounts[0].balance,
      ).toBe(10000000);
    });
    it("binds bank sessions to users, blocks replay and excludes sandbox balances from spending estimates", async () => {
      const jar: Jar = {};
      await register(jar);
      const other: Jar = {};
      await register(other);
      await request(other, "/consent", "POST", {
        accepted: true,
        version: "manual-planning-2026-10-16",
      });
      await request(jar, "/onboarding", "POST", {
        accepted: true,
        version: "manual-planning-2026-10-16",
        daily: 0,
        reserve: 0,
        horizon: 30,
        cashBalance: null,
        commitments: [],
      });
      vi.spyOn(mono, "monoConfigured").mockReturnValue(true);
      vi.spyOn(mono, "exchangeMonoCode").mockImplementation(async () => {
        expect(
          (
            await request(jar, "/planning-data", "DELETE", {
              confirmation: "DELETE",
            })
          ).response.status,
        ).toBe(409);
        expect(
          (
            await request(jar, "/account", "DELETE", {
              password: "LocalTestPassword42!",
              confirmation: "DELETE MY ACCOUNT",
            })
          ).response.status,
        ).toBe(409);
        return "provider-account-123456";
      });
      vi.spyOn(mono, "fetchMonoAccount").mockResolvedValue({
        bankName: "Test Bank",
        accountName: "Test User",
        last4: "1234",
        currency: "NGN",
        balance: 8000000n,
        status: "connected",
        syncedAt: new Date(),
      });
      const unlink = vi
        .spyOn(mono, "unlinkMonoAccount")
        .mockResolvedValue({ status: "successful" });
      try {
        expect(
          (await request(jar, "/banks/session", "POST", {})).response.status,
        ).toBe(400);
        const session = await request(jar, "/banks/session", "POST", {
          accepted: true,
          version: mono.BANK_CONSENT_VERSION,
        });
        expect(session.response.status).toBe(200);
        const body = {
          sessionId: session.body.sessionId,
          code: "one-time-code-12345",
        };
        expect(
          (await request(other, "/banks/exchange", "POST", body)).response
            .status,
        ).toBe(409);
        const results = await Promise.all([
          request(jar, "/banks/exchange", "POST", body),
          request(jar, "/banks/exchange", "POST", body),
        ]);
        expect(results.map((r) => r.response.status).sort()).toEqual([
          200, 409,
        ]);
        const bank = results.find((r) => r.response.status === 200)!.body.bank;
        expect(bank.balance).toBe(8000000);
        expect(bank.sandbox).toBe(true);
        expect(bank.providerAccountId).toBeUndefined();
        expect(
          (await request(jar, "/dashboard")).body.state.safeToSpend,
        ).toBeNull();
        expect(
          (await request(other, `/banks/${bank.id}/refresh`, "POST", {}))
            .response.status,
        ).toBe(404);
        expect(
          (
            await request(jar, "/planning-data", "DELETE", {
              confirmation: "DELETE",
            })
          ).response.status,
        ).toBe(409);
        const exported = (await request(jar, "/export")).body;
        expect(JSON.stringify(exported)).not.toContain(
          "provider-account-123456",
        );
        unlink.mockRejectedValueOnce(
          Object.assign(new Error("Unlink failed"), { status: 502 }),
        );
        expect(
          (await request(jar, `/banks/${bank.id}`, "DELETE", {})).response
            .status,
        ).toBe(502);
        expect((await request(jar, "/banks")).body.banks[0].status).toBe(
          "disconnecting",
        );
        expect(
          (await request(jar, `/banks/${bank.id}`, "DELETE", {})).response
            .status,
        ).toBe(200);
        expect((await request(jar, "/banks")).body.banks).toEqual([]);
        expect(
          (
            await request(jar, "/planning-data", "DELETE", {
              confirmation: "DELETE",
            })
          ).response.status,
        ).toBe(200);
      } finally {
        vi.restoreAllMocks();
      }
    });
    it("persists real purchase history, prevents replay, isolates owners and calculates elapsed-day burn", async () => {
      const jar: Jar = {};
      const id = await register(jar);
      const other: Jar = {};
      await register(other);
      const today = nigeriaDate(new Date());
      const entry = {
        requestId: randomUUID(),
        label: "Groceries",
        amount: 700000,
        occurredOn: today,
      };
      expect(
        (await request(jar, "/purchases", "POST", entry)).response.status,
      ).toBe(409);
      await request(jar, "/consent", "POST", {
        accepted: true,
        version: "manual-planning-2026-10-16",
      });
      await request(other, "/consent", "POST", {
        accepted: true,
        version: "manual-planning-2026-10-16",
      });
      for (const invalid of [
        { ...entry, amount: 0 },
        { ...entry, occurredOn: "2099-01-01" },
        { ...entry, occurredOn: "2026-02-30" },
      ])
        expect(
          (await request(jar, "/purchases", "POST", invalid)).response.status,
        ).toBe(400);
      const saved = await Promise.all([
        request(jar, "/purchases", "POST", entry),
        request(jar, "/purchases", "POST", entry),
      ]);
      expect(saved.map((r) => r.response.status)).toEqual([200, 200]);
      expect(saved[0].body.purchase.id).toBe(saved[1].body.purchase.id);
      expect(
        (await request(jar, "/purchases", "POST", { ...entry, amount: 1 }))
          .response.status,
      ).toBe(409);
      const oldDate = new Date(Date.parse(today + "T00:00:00Z") - 7 * 86400000)
        .toISOString()
        .slice(0, 10);
      await request(jar, "/purchases", "POST", {
        ...entry,
        requestId: randomUUID(),
        label: "Older purchase",
        amount: 999999,
        occurredOn: oldDate,
      });
      const dashboard = (await request(jar, "/dashboard")).body;
      expect(dashboard.spending).toMatchObject({
        count: 2,
        total: 1699999,
        daily: 1699999 / 8,
        days: 8,
        from: oldDate,
        to: today,
      });
      expect(dashboard.inputs.accounts).toEqual([]);
      expect(dashboard.state.safeToSpend).toBeNull();
      await request(jar, "/accounts", "POST", {
        label: "Remaining cash",
        balance: 10_000_000,
      });
      await request(jar, "/plan", "PUT", {
        daily: 100_000,
        reserve: 1_000_000,
        horizon: 30,
      });
      const withBalance = (await request(jar, "/dashboard")).body;
      expect(withBalance.state.safeToSpend).toBe(300_000);
      expect(withBalance.state.runwayDays).toBeCloseTo(
        10_000_000 / (1699999 / 8),
      );
      const simulated = (
        await request(jar, "/simulate", "POST", { amount: 1_000_000 })
      ).body;
      expect(simulated.scenario.afterRunwayDays).toBeCloseTo(
        9_000_000 / (1699999 / 8),
      );
      const recorded = await prisma.financialSnapshot.findUniqueOrThrow({
        where: { id: withBalance.state.id },
      });
      expect(calculate(recorded.inputs as unknown as EngineInput)).toEqual(
        recorded.result,
      );
      expect((await request(other, "/purchases")).body.purchases).toEqual([]);
      expect(
        (
          await request(
            other,
            "/purchases/" + saved[0].body.purchase.id,
            "DELETE",
            {},
          )
        ).response.status,
      ).toBe(404);
      const history = (await request(jar, "/purchases")).body;
      expect(history.purchases.map((p: { label: string }) => p.label)).toEqual([
        "Groceries",
        "Older purchase",
      ]);
      expect((await request(jar, "/export")).body.purchases).toHaveLength(2);
      await prisma.consumerPurchase.createMany({
        data: Array.from({ length: 50 }, (_, i) => ({
          userId: id,
          requestId: randomUUID(),
          label: "Pagination " + i,
          amount: 100n,
          occurredOn: oldDate,
        })),
      });
      const first = (await request(jar, "/purchases")).body;
      const second = (await request(jar, "/purchases?offset=50")).body;
      expect(first.purchases).toHaveLength(50);
      expect(first.nextOffset).toBe(50);
      expect(second.purchases).toHaveLength(2);
      expect(second.nextOffset).toBeNull();
      expect(
        new Set([...first.purchases, ...second.purchases].map((p) => p.id))
          .size,
      ).toBe(52);
      expect(
        (
          await request(
            jar,
            "/purchases/" + saved[0].body.purchase.id,
            "DELETE",
            {},
          )
        ).response.status,
      ).toBe(200);
      expect((await request(jar, "/dashboard")).body.spending.daily).toBe(
        1004999 / 8,
      );
      await request(jar, "/planning-data", "DELETE", {
        confirmation: "DELETE",
      });
      expect(
        await prisma.consumerPurchase.count({ where: { userId: id } }),
      ).toBe(0);
    });
    it("requires the password for account deletion and invalidates its sessions", async () => {
      const jar: Jar = {};
      const id = await register(jar);
      const old = { ...jar };
      expect(
        (
          await request(jar, "/account", "DELETE", {
            password: "WrongPassword1",
            confirmation: "DELETE MY ACCOUNT",
          })
        ).response.status,
      ).toBe(401);
      expect(
        (
          await request(jar, "/account", "DELETE", {
            password: "LocalTestPassword42!",
            confirmation: "DELETE MY ACCOUNT",
          })
        ).response.status,
      ).toBe(200);
      expect(await prisma.user.count({ where: { id } })).toBe(0);
      expect((await request(old, "/me")).response.status).toBe(401);
    });
  },
);

// SR
