import type { Prisma } from "@prisma/client";
import { nigeriaDate } from "./engine";

export async function spendingSummary(
  tx: Prisma.TransactionClient,
  userId: string,
  asOf = new Date(),
) {
  const today = nigeriaDate(asOf);
  const result = await tx.consumerPurchase.aggregate({
    where: { userId, occurredOn: { lte: today } },
    _sum: { amount: true },
    _min: { occurredOn: true },
    _count: true,
  });
  const total = Number(result._sum.amount ?? 0);
  const from = result._min.occurredOn ?? today;
  // Inclusive calendar days, including days with no purchases. First day = one.
  const days = result._count
    ? Math.round(
        (Date.parse(today + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) /
          86400000,
      ) + 1
    : 0;
  return {
    from,
    to: today,
    days,
    count: result._count,
    total,
    daily: days ? total / days : null,
  };
}
