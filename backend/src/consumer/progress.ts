import type { Prisma } from "@prisma/client";
import { nigeriaDate } from "./engine";
import {
  CATEGORIES,
  currentStreak,
  shiftDay,
  trackEntitlements,
  weekOf,
  XP_RULES_VERSION,
} from "./progress-rules";

// The caller holds the user row lock for the entire financial mutation.
export async function reconcileTrackXp(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const [purchases, reviews, entries] = await Promise.all([
    tx.consumerPurchase.findMany({
      where: { userId, deletedAt: null, xpEligible: true },
      select: { occurredOn: true },
    }),
    tx.consumerWeeklyReview.findMany({
      where: { userId },
      select: { weekStart: true },
    }),
    tx.consumerXpEntry.findMany({
      where: { userId, rulesVersion: XP_RULES_VERSION },
    }),
  ]);
  const desired = trackEntitlements(
    purchases.map((p) => p.occurredOn),
    reviews.map((r) => r.weekStart),
  );
  const balances = new Map<
    string,
    {
      rule: string;
      sourceKey: string;
      weekStart: string;
      total: number;
      revision: number;
    }
  >();
  for (const entry of entries) {
    const key = `${entry.rule}:${entry.sourceKey}`;
    const old = balances.get(key);
    balances.set(key, {
      ...entry,
      total: (old?.total || 0) + entry.baseMilliXp,
      revision: Math.max(old?.revision || 0, entry.revision),
    });
  }
  const changes: Prisma.ConsumerXpEntryCreateManyInput[] = [];
  for (const entitlement of desired) {
    const key = `${entitlement.rule}:${entitlement.sourceKey}`;
    const old = balances.get(key);
    const delta = entitlement.milliXp - (old?.total || 0);
    if (delta)
      changes.push({
        userId,
        rule: entitlement.rule,
        sourceKey: entitlement.sourceKey,
        weekStart: entitlement.weekStart,
        revision: (old?.revision || 0) + 1,
        baseMilliXp: delta,
        rulesVersion: XP_RULES_VERSION,
      });
    balances.delete(key);
  }
  for (const old of balances.values()) {
    if (old.total)
      changes.push({
        userId,
        rule: old.rule,
        sourceKey: old.sourceKey,
        weekStart: old.weekStart,
        revision: old.revision + 1,
        baseMilliXp: -old.total,
        rulesVersion: XP_RULES_VERSION,
      });
  }
  if (changes.length) await tx.consumerXpEntry.createMany({ data: changes });
}

export async function weeklyProgress(
  tx: Prisma.TransactionClient,
  userId: string,
  now = new Date(),
) {
  const today = nigeriaDate(now);
  const weekStart = weekOf(today);
  const previousWeek = shiftDay(weekStart, -7);
  const [purchases, budgets, entries, reviews] = await Promise.all([
    tx.consumerPurchase.findMany({
      where: { userId, deletedAt: null },
      select: {
        category: true,
        amount: true,
        occurredOn: true,
        xpEligible: true,
      },
    }),
    tx.consumerCategoryBudget.findMany({
      where: { userId, weekStart: { in: [weekStart, previousWeek] } },
    }),
    tx.consumerXpEntry.findMany({
      where: { userId },
      select: {
        rule: true,
        baseMilliXp: true,
        boosterMilliXp: true,
        weekStart: true,
      },
    }),
    tx.consumerWeeklyReview.findMany({
      where: { userId, weekStart: previousWeek },
    }),
  ]);
  const period = (start: string) => {
    const end = shiftDay(start, 7);
    const records = purchases.filter(
      (p) => p.occurredOn >= start && p.occurredOn < end,
    );
    const categories = [
      ...CATEGORIES,
      { id: "uncategorized", label: "Uncategorized" },
    ].map((category) => {
      const budget = budgets.find(
        (b) => b.weekStart === start && b.category === category.id,
      );
      return {
        ...category,
        limit: budget ? Number(budget.amount) : null,
        spent: records
          .filter((p) => p.category === category.id)
          .reduce((sum, p) => sum + Number(p.amount), 0),
      };
    });
    return {
      weekStart: start,
      weekEnd: shiftDay(start, 6),
      categories,
      total: records.reduce((sum, p) => sum + Number(p.amount), 0),
      count: records.length,
    };
  };
  const eligibleDays = purchases
    .filter((p) => p.xpEligible)
    .map((p) => p.occurredOn);
  const sum = (values: typeof entries) =>
    values.reduce(
      (total, entry) => total + entry.baseMilliXp + entry.boosterMilliXp,
      0,
    );
  return {
    ...period(weekStart),
    today,
    timezone: "Africa/Lagos",
    rulesVersion: XP_RULES_VERSION,
    xp: {
      totalMilli: sum(entries),
      weekMilli: sum(entries.filter((e) => e.weekStart === weekStart)),
      streak: currentStreak(eligibleDays, today),
      checkedInToday: eligibleDays.includes(today),
      rules: { daily: 6, additional: 0.5, streak: 24, review: 12 },
    },
    previous: {
      ...period(previousWeek),
      reviewed: reviews.length > 0,
      canReview: eligibleDays.some((day) => weekOf(day) === previousWeek),
    },
  };
}
// SR
