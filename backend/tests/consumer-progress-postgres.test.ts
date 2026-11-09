import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { nigeriaDate } from "../src/consumer/engine";
import { shiftDay, weekOf } from "../src/consumer/progress-rules";
import { reconcileTrackXp } from "../src/consumer/progress";

describe.runIf(process.env.JOSEPH_LOCAL_TEST === "true")(
  "category budgets and XP against PostgreSQL",
  () => {
    let server: Server, url: string, userId: string, otherId: string;
    let prisma: (typeof import("../src/config/prisma"))["prisma"];
    const jar: Record<string, string> = {};
    const today = () => nigeriaDate(new Date());
    const purchase = (amount = 10000, occurredOn = today()) => ({
      requestId: randomUUID(),
      label: "Groceries",
      category: "food",
      amount,
      occurredOn,
    });
    async function request(path: string, method = "GET", body?: object) {
      const response = await fetch(url + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          Origin: "http://127.0.0.1:5180",
          Cookie: Object.entries(jar)
            .map(([key, value]) => `${key}=${value}`)
            .join("; "),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      for (const cookie of response.headers.getSetCookie()) {
        const [key, ...value] = cookie.split(";")[0].split("=");
        jar[key] = value.join("=");
      }
      return { status: response.status, body: await response.json() };
    }
    beforeAll(async () => {
      if (!process.env.DATABASE_URL?.includes("@127.0.0.1:55439/postgres"))
        throw new Error("An isolated local database is required.");
      prisma = (await import("../src/config/prisma")).prisma;
      server = (await import("../src/consumer-app")).default.listen(
        0,
        "127.0.0.1",
      );
      await new Promise<void>((resolve) => server.once("listening", resolve));
      url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/consumer`;
      const registered = await request("/register", "POST", {
        name: "Progress Test",
        email: `${randomUUID()}@example.com`,
        phone: "08012345678",
        password: "LocalTestPassword42!",
      });
      expect(registered.status).toBe(201);
      userId = registered.body.user.id;
      otherId = (
        await prisma.user.create({
          data: { email: `${randomUUID()}@example.com`, password: "unused" },
        })
      ).id;
    });
    beforeEach(async () => {
      for (const user of [userId, otherId]) {
        await prisma.consumerPurchase.deleteMany({ where: { userId: user } });
        await prisma.consumerXpEntry.deleteMany({ where: { userId: user } });
        await prisma.consumerWeeklyReview.deleteMany({
          where: { userId: user },
        });
        await prisma.consumerCategoryBudget.deleteMany({
          where: { userId: user },
        });
      }
      await prisma.consumerConsent.create({
        data: {
          userId,
          version: "manual-planning-2026-10-16",
          purpose: "manual-planning",
          accepted: true,
        },
      });
    });
    afterAll(async () => {
      if (server)
        await new Promise<void>((resolve) => server.close(() => resolve()));
      if (prisma) {
        await prisma.user.deleteMany({
          where: { id: { in: [userId, otherId].filter(Boolean) } },
        });
        await prisma.$disconnect();
      }
    });
    it("awards a single daily check-in under concurrent retries, with exact additional XP", async () => {
      const body = purchase();
      const results = await Promise.all([
        request("/purchases", "POST", body),
        request("/purchases", "POST", body),
      ]);
      expect(results.map((r) => r.status)).toEqual([200, 200]);
      expect(results[0].body.purchase.id).toBe(results[1].body.purchase.id);
      expect((await request("/progress")).body.xp.totalMilli).toBe(6000);
      expect(
        (await request("/purchases", "POST", purchase(11000))).status,
      ).toBe(200);
      expect((await request("/progress")).body.xp.totalMilli).toBe(6500);
      expect(await prisma.consumerXpEntry.count({ where: { userId } })).toBe(2);
      expect(
        (
          await request("/purchases", "POST", {
            ...purchase(12000),
            xpEligible: true,
          })
        ).status,
      ).toBe(400);
    });
    it("retains spending without rewarding duplicate amounts, backdating or legacy entries", async () => {
      await request("/purchases", "POST", purchase());
      await request("/purchases", "POST", purchase());
      await request(
        "/purchases",
        "POST",
        purchase(12000, shiftDay(today(), -1)),
      );
      await request("/purchases", "POST", {
        ...purchase(13000),
        category: "uncategorized",
      });
      const progress = (await request("/progress")).body;
      expect(progress.xp.totalMilli).toBe(6000);
      expect((await request("/dashboard")).body.spending.total).toBe(45000);
      expect((await request("/purchases")).body.purchases).toHaveLength(4);
    });
    it("reverses awards on deletion, prevents replay and enforces ownership", async () => {
      const original = purchase();
      const saved = (await request("/purchases", "POST", original)).body
        .purchase;
      const other = await prisma.consumerPurchase.create({
        data: { ...purchase(), userId: otherId },
      });
      expect(
        (await request(`/purchases/${other.id}`, "DELETE", {})).status,
      ).toBe(404);
      expect(
        (
          await request(`/purchases/${other.id}/category`, "PUT", {
            category: "transport",
          })
        ).status,
      ).toBe(404);
      expect(
        (await request(`/purchases/${saved.id}`, "DELETE", {})).status,
      ).toBe(200);
      expect((await request("/purchases", "POST", original)).status).toBe(409);
      expect((await request("/dashboard")).body.spending.total).toBe(0);
      expect((await request("/progress")).body.xp.totalMilli).toBe(0);
      expect(await prisma.consumerXpEntry.count({ where: { userId } })).toBe(2);
      await request("/purchases", "POST", purchase());
      expect((await request("/progress")).body.xp.totalMilli).toBe(0);
      await request("/purchases", "POST", purchase(15000));
      expect((await request("/progress")).body.xp.totalMilli).toBe(6000);
    });
    it("saves current-week limits without changing available money and categorizes old purchases", async () => {
      const weekStart = weekOf(today());
      const before = (await request("/dashboard")).body.state;
      const saved = await request("/category-budgets", "PUT", {
        weekStart,
        budgets: [
          { category: "food", amount: 0 },
          { category: "transport", amount: 30000 },
        ],
      });
      expect(saved.status).toBe(200);
      expect(
        saved.body.categories.find((c: { id: string }) => c.id === "food")
          .limit,
      ).toBe(0);
      expect(
        saved.body.categories.find((c: { id: string }) => c.id === "other")
          .limit,
      ).toBeNull();
      expect((await request("/dashboard")).body.state.safeToSpend).toBe(
        before.safeToSpend,
      );
      expect(
        (
          await request("/category-budgets", "PUT", {
            weekStart: shiftDay(weekStart, -7),
            budgets: [],
          })
        ).status,
      ).toBe(409);
      expect(
        (
          await request("/category-budgets", "PUT", {
            weekStart,
            budgets: [
              { category: "food", amount: 2 },
              { category: "food", amount: 3 },
            ],
          })
        ).status,
      ).toBe(400);
      const old = await prisma.consumerPurchase.create({
        data: { ...purchase(), category: "uncategorized", userId },
      });
      expect(
        (
          await request(`/purchases/${old.id}/category`, "PUT", {
            category: "food",
          })
        ).status,
      ).toBe(200);
      expect((await request("/progress")).body.xp.totalMilli).toBe(0);
      expect(
        await prisma.consumerCategoryBudget.count({
          where: { userId: otherId },
        }),
      ).toBe(0);
    });
    it("reconciles a seven-day streak and a once-only closed-week review", async () => {
      const start = shiftDay(weekOf(today()), -7);
      const records = Array.from({ length: 7 }, (_, i) => ({
        ...purchase(10000 + i, shiftDay(start, i)),
        userId,
        xpEligible: true,
      }));
      await prisma.consumerPurchase.createMany({ data: records });
      await prisma.$transaction((tx) => reconcileTrackXp(tx, userId));
      expect((await request("/progress")).body.xp.totalMilli).toBe(66000);
      expect(
        (
          await request("/weekly-review", "POST", {
            weekStart: weekOf(today()),
          })
        ).status,
      ).toBe(400);
      expect(
        (await request("/weekly-review", "POST", { weekStart: start })).status,
      ).toBe(200);
      await request("/weekly-review", "POST", { weekStart: start });
      expect((await request("/progress")).body.xp.totalMilli).toBe(78000);
      const first = await prisma.consumerPurchase.findFirstOrThrow({
        where: { userId, occurredOn: start },
      });
      await request(`/purchases/${first.id}`, "DELETE", {});
      expect((await request("/progress")).body.xp.totalMilli).toBe(48000);
      const exported = (await request("/export")).body;
      expect(
        exported.xpEntries.some(
          (e: { baseMilliXp: number }) => e.baseMilliXp < 0,
        ),
      ).toBe(true);
      expect(exported.weeklyReviews).toHaveLength(1);
      expect(
        (await request("/planning-data", "DELETE", { confirmation: "DELETE" }))
          .status,
      ).toBe(200);
      const where = { userId };
      expect(
        await Promise.all([
          prisma.consumerXpEntry.count({ where }),
          prisma.consumerPurchase.count({ where }),
          prisma.consumerCategoryBudget.count({ where }),
          prisma.consumerWeeklyReview.count({ where }),
        ]),
      ).toEqual([0, 0, 0, 0]);
    });
  },
);
// SR
