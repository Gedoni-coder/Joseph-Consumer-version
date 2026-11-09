import { describe, expect, it } from "vitest";
import {
  currentStreak,
  shiftDay,
  trackEntitlements,
  weekOf,
} from "../src/consumer/progress-rules";
import { nigeriaDate } from "../src/consumer/engine";

describe("Track reward rules", () => {
  it("opens a week at Monday midnight WAT across year boundaries", () => {
    expect(weekOf(nigeriaDate(new Date("2026-11-08T22:59:59Z")))).toBe(
      "2026-11-02",
    );
    expect(weekOf(nigeriaDate(new Date("2026-11-08T23:00:00Z")))).toBe(
      "2026-11-09",
    );
    expect(weekOf("2027-01-01")).toBe("2026-12-28");
  });
  it("keeps half-point awards exact and rewards non-overlapping seven-day streaks", () => {
    const days = Array.from({ length: 15 }, (_, i) =>
      shiftDay("2026-11-01", i),
    );
    const awards = trackEntitlements([...days, days[0]], []);
    expect(
      awards.filter((a) => a.rule === "T3").map((a) => a.sourceKey),
    ).toEqual(["2026-11-07", "2026-11-14"]);
    expect(awards.filter((a) => a.rule === "T2")[0].milliXp).toBe(500);
    expect(awards.reduce((sum, a) => sum + a.milliXp, 0)).toBe(138500);
  });
  it("breaks streaks on missing days and removes unsupported review awards", () => {
    const days = ["2026-11-01", "2026-11-02", "2026-11-04"];
    expect(currentStreak(days, "2026-11-05")).toBe(1);
    expect(currentStreak(days, "2026-11-06")).toBe(0);
    const awards = trackEntitlements(days, [
      "2026-10-19",
      "2026-11-02",
      "2026-11-02",
    ]);
    expect(awards.filter((a) => a.rule === "T3")).toHaveLength(0);
    expect(awards.filter((a) => a.rule === "T5")).toEqual([
      {
        rule: "T5",
        sourceKey: "2026-11-02",
        weekStart: "2026-11-02",
        milliXp: 12000,
      },
    ]);
  });
});
// SR
