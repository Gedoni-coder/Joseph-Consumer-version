import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { spendingSummary } from "../src/consumer/spending";

function database(total: bigint | null, count: number, first: string | null) {
  const aggregate = vi
    .fn()
    .mockResolvedValue({
      _sum: { amount: total },
      _count: count,
      _min: { occurredOn: first },
    });
  return {
    aggregate,
    tx: {
      consumerPurchase: { aggregate },
    } as unknown as Prisma.TransactionClient,
  };
}
describe("elapsed calendar spending", () => {
  it("counts zero-spend days and rolls over at Nigeria midnight", async () => {
    const { tx, aggregate } = database(10000n, 2, "2026-10-30");
    const summary = await spendingSummary(
      tx,
      "owner",
      new Date("2026-10-31T23:30:00Z"),
    );
    expect(summary).toMatchObject({
      from: "2026-10-30",
      to: "2026-11-01",
      days: 3,
      total: 10000,
      daily: 10000 / 3,
    });
    expect(aggregate.mock.calls[0][0].where).toEqual({
      userId: "owner",
      occurredOn: { lte: "2026-11-01" },
    });
  });
  it("uses one day for the first purchase, not seven", async () => {
    const { tx } = database(700000n, 1, "2026-10-17");
    expect(
      await spendingSummary(tx, "owner", new Date("2026-10-17T12:00:00Z")),
    ).toMatchObject({ days: 1, daily: 700000 });
  });
  it("does not fabricate a spending history for an empty account", async () => {
    const { tx } = database(null, 0, null);
    expect(
      await spendingSummary(tx, "owner", new Date("2026-10-17T12:00:00Z")),
    ).toMatchObject({ days: 0, total: 0, daily: null });
  });
});

// SR
