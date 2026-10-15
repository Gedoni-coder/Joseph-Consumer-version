import { describe, expect, it } from "vitest";
import {
  calculate,
  nigeriaDate,
  type EngineInput,
} from "../src/consumer/engine";
const input = (): EngineInput => ({
  asOf: "2026-10-15T10:00:00.000Z",
  horizon: 30,
  daily: 100_000,
  reserve: 1_000_000,
  planConfirmed: true,
  accounts: [
    {
      id: "a",
      label: "Current account",
      balance: 10_000_000,
      confirmedAt: "2026-10-15T09:00:00.000Z",
    },
  ],
  commitments: [
    {
      id: "bill",
      label: "Rent",
      amount: 2_000_000,
      dueDate: "2026-10-20",
      kind: "bill",
    },
    {
      id: "goal",
      label: "Laptop contribution",
      amount: 500_000,
      dueDate: "2026-10-25",
      kind: "goal",
    },
  ],
});
describe("dated financial state engine", () => {
  it("reserves daily spending, bills, goals and buffer in integer kobo", () => {
    const result = calculate(input());
    expect(result.safeToSpend).toBe(3_500_000);
    expect(result.protectedCash).toBe(3_500_000);
    expect(result.projection.at(-1)?.cash).toBe(4_500_000);
    expect(result.runwayBeyondHorizon).toBe(true);
    expect(result.confidence).toBe("estimated");
  });
  it("accepts the exact safe amount and rejects one kobo more", () => {
    expect(calculate(input(), 3_500_000).scenario.affordable).toBe(true);
    expect(calculate(input(), 3_500_001).scenario.affordable).toBe(false);
    expect(calculate(input(), 3_500_001).scenario.shortfall).toBe(1);
  });
  it("does not mutate inputs or deduct money for a simulation", () => {
    const source = input(),
      before = structuredClone(source);
    const result = calculate(source, 1_000_000);
    expect(source).toEqual(before);
    expect(result.scenario.afterSafeToSpend).toBe(2_500_000);
    expect(result.liquid).toBe(10_000_000);
  });
  it("reconstructs identical results from a stored input snapshot", () => {
    const source = input();
    expect(calculate(JSON.parse(JSON.stringify(source)))).toEqual(
      calculate(source),
    );
  });
  it("uses dated bills for runway, not cash divided by daily spend", () => {
    const source = input();
    source.commitments[0].amount = 9_000_000;
    expect(calculate(source).runwayDays).toBe(5);
    source.commitments[0].dueDate = "2026-10-30";
    expect(calculate(source).runwayDays).toBe(15);
  });
  it("reserves overdue bills on day zero", () => {
    const source = input();
    source.commitments[0].dueDate = "2026-10-01";
    source.commitments[0].amount = 10_000_000;
    expect(calculate(source).runwayDays).toBe(0);
    expect(calculate(source).reasons).toContain("OVERDUE_COMMITMENTS");
  });
  it("includes a bill on the final day but excludes later dates", () => {
    const source = input();
    source.commitments = [{ ...source.commitments[0], dueDate: "2026-11-14" }];
    expect(calculate(source).safeToSpend).toBe(4_000_000);
    source.commitments[0].dueDate = "2026-11-15";
    expect(calculate(source).safeToSpend).toBe(6_000_000);
  });
  it("returns uncertain rather than precise answers for stale balances", () => {
    const source = input();
    source.accounts[0].confirmedAt = "2026-10-14T09:59:59Z";
    const state = calculate(source, 1);
    expect(state.safeToSpend).toBeNull();
    expect(state.scenario.affordable).toBeNull();
    expect(state.reasons).toContain("BALANCE_STALE");
  });
  it("accepts freshness exactly at the 24-hour boundary", () => {
    const source = input();
    source.accounts[0].confirmedAt = "2026-10-14T10:00:00Z";
    expect(calculate(source).safeToSpend).toBe(3_500_000);
  });
  it("distinguishes missing data from an explicit zero balance or zero spending", () => {
    const source = input();
    source.accounts = [];
    expect(calculate(source).safeToSpend).toBeNull();
    source.accounts = [{ ...input().accounts[0], balance: 0 }];
    expect(calculate(source).safeToSpend).toBe(0);
    source.planConfirmed = false;
    expect(calculate(source).safeToSpend).toBeNull();
    expect(calculate(source).reasons).not.toContain('CONFIRMED_SPENDING_PLAN');
  });
  it("handles no spending without infinity or a fabricated runway", () => {
    const source = input();
    source.daily = 0;
    source.commitments = [];
    expect(calculate(source).runwayDays).toBeNull();
    expect(calculate(source).runwayBeyondHorizon).toBe(true);
  });
  it("uses Nigeria calendar boundaries, including month rollover", () => {
    expect(nigeriaDate("2026-10-31T23:30:00Z")).toBe("2026-11-01");
    const source = input();
    source.asOf = "2026-10-19T23:30:00Z";
    source.accounts[0].confirmedAt = source.asOf;
    expect(calculate(source).due[0].day).toBe(0);
  });
  it("maintains safe-spend and monotonicity invariants across balances", () => {
    let previous = 0;
    for (let balance = 0; balance <= 200_000; balance += 997) {
      const source = input();
      source.accounts[0].balance = balance;
      source.daily = 113;
      source.reserve = 199;
      source.commitments = [{ ...source.commitments[0], amount: 1500 }];
      const result = calculate(source);
      const spend = result.safeToSpend!;
      expect(spend).toBeGreaterThanOrEqual(previous);
      expect(spend).toBeLessThanOrEqual(balance);
      if (!result.shortfall)
        expect(calculate(source, spend).scenario.affordable).toBe(true);
      expect(calculate(source, spend + 1).scenario.affordable).toBe(false);
      previous = spend;
    }
  });
});
