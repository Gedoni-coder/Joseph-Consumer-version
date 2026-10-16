import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calculate, type EngineInput } from "../src/consumer/engine";

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
      expect(plan.body.state.safeToSpend).toBe(6_000_000);
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
      expect(result.body.scenario.afterSafeToSpend).toBe(4_000_000);
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
