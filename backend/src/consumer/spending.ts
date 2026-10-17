import type { Prisma } from "@prisma/client";
import { nigeriaDate } from "./engine";

export async function spendingSummary(
  tx: Prisma.TransactionClient,
  userId: string,
  asOf = new Date(),
) {
  const today = nigeriaDate(asOf);
  const from = new Date(Date.parse(today + "T00:00:00Z") - 6 * 86400000)
    .toISOString()
    .slice(0, 10);
  const result = await tx.consumerPurchase.aggregate({
    where: { userId, occurredOn: { gte: from, lte: today } },
    _sum: { amount: true },
    _count: true,
  });
  const total = Number(result._sum.amount ?? 0);
  return {
    from,
    to: today,
    days: 7,
    count: result._count,
    total,
    daily: result._count ? Math.round(total / 7) : null,
  };
}
