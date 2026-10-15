/** Financial truth lives here, never in a language model or the browser.
 * Integer kobo throughout. Dates use the Nigeria calendar; input snapshots are replayable.
 */
export const ENGINE_VERSION = "fse-1.0.0";
export const RULES_VERSION = "manual-plan-1.0.0";
export const MAX_MONEY = 1_000_000_000_000;
export type AccountInput = {
  id: string;
  label: string;
  balance: number;
  confirmedAt: string;
};
export type CommitmentInput = {
  id: string;
  label: string;
  amount: number;
  dueDate: string;
  kind: "bill" | "goal";
};
export type EngineInput = {
  asOf: string;
  horizon: number;
  daily: number;
  reserve: number;
  planConfirmed: boolean;
  accounts: AccountInput[];
  commitments: CommitmentInput[];
};
export function nigeriaDate(value: string | Date): string {
  return new Date(new Date(value).getTime() + 3_600_000)
    .toISOString()
    .slice(0, 10);
}
function dayOffset(date: string, today: string) {
  return Math.round(
    (Date.parse(date + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) /
      86_400_000,
  );
}
export function calculate(input: EngineInput, purchase = 0) {
  const today = nigeriaDate(input.asOf);
  const liquid = input.accounts.reduce(
    (sum, account) => sum + account.balance,
    0,
  );
  const due = input.commitments
    .map((item) => ({
      ...item,
      day: Math.max(0, dayOffset(item.dueDate, today)),
    }))
    .filter((item) => item.day <= input.horizon);
  const reasons: string[] = [
    "MANUAL_BALANCES",
    "NO_BANK_HISTORY",
  ];
  if (input.planConfirmed) reasons.push('CONFIRMED_SPENDING_PLAN');
  const missing = !input.accounts.length || !input.planConfirmed;
  const stale = input.accounts.some(
    (account) =>
      Date.parse(input.asOf) - Date.parse(account.confirmedAt) > 86_400_000,
  );
  if (!input.accounts.length) reasons.push("BALANCE_MISSING");
  if (!input.planConfirmed) reasons.push("SPENDING_PLAN_MISSING");
  if (stale) reasons.push("BALANCE_STALE");
  if (due.some((item) => item.kind === "bill"))
    reasons.push("OBLIGATIONS_RESERVED");
  if (due.some((item) => item.kind === "goal")) reasons.push("GOALS_RESERVED");
  if (due.some((item) => item.dueDate < today))
    reasons.push("OVERDUE_COMMITMENTS");
  function project(spend: number) {
    let cash = liquid - spend;
    let runway: number | null = cash < input.reserve ? 0 : null;
    let minimum = cash;
    const days: { date: string; cash: number; commitments: number }[] = [];
    for (let day = 0; day <= input.horizon; day++) {
      const commitments = due
        .filter((item) => item.day === day)
        .reduce((sum, item) => sum + item.amount, 0);
      cash -= commitments + (day > 0 ? input.daily : 0);
      minimum = Math.min(minimum, cash);
      if (runway === null && cash < input.reserve) runway = day;
      days.push({
        date: new Date(Date.parse(today + "T00:00:00Z") + day * 86_400_000)
          .toISOString()
          .slice(0, 10),
        cash,
        commitments,
      });
    }
    return {
      runwayDays: runway,
      minimum,
      days,
      passes: minimum >= input.reserve,
    };
  }
  const baseline = project(0);
  // Monotone candidate simulation: find the largest whole-kobo spend meeting every dated guardrail.
  let low = 0,
    high = liquid;
  while (low < high) {
    const candidate = Math.ceil((low + high) / 2);
    if (project(candidate).passes) low = candidate;
    else high = candidate - 1;
  }
  const restricted = missing || stale;
  const after = project(purchase);
  const protectedCash = due.reduce(
    (sum, item) => sum + item.amount,
    input.reserve,
  );
  if (!baseline.passes) reasons.push("PLAN_SHORTFALL");
  return {
    engineVersion: ENGINE_VERSION,
    rulesVersion: RULES_VERSION,
    generatedAt: input.asOf,
    liquid,
    protectedCash,
    daily: input.daily,
    reserve: input.reserve,
    horizon: input.horizon,
    safeToSpend: restricted ? null : low,
    runwayDays: restricted ? null : baseline.runwayDays,
    runwayBeyondHorizon: !restricted && baseline.runwayDays === null,
    confidence: restricted ? "restricted" : "estimated",
    reasons,
    shortfall: Math.max(0, input.reserve - baseline.minimum),
    due,
    projection: baseline.days,
    scenario: {
      purchase,
      affordable: restricted ? null : after.passes,
      afterSafeToSpend: restricted ? null : Math.max(0, low - purchase),
      afterRunwayDays: restricted ? null : after.runwayDays,
      afterRunwayBeyondHorizon: !restricted && after.runwayDays === null,
      shortfall: Math.max(0, input.reserve - after.minimum),
    },
  };
}
