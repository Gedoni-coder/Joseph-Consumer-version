export const CATEGORIES = [
  { id: "food", label: "Food & groceries" },
  { id: "transport", label: "Transport" },
  { id: "shopping", label: "Shopping" },
  { id: "leisure", label: "Leisure" },
  { id: "health", label: "Health & care" },
  { id: "education", label: "Education" },
  { id: "home", label: "Home & utilities" },
  { id: "other", label: "Other" },
] as const;

export const XP_RULES_VERSION = "track-1.0.0";
// Integer thousandths preserve fractional XP without floating-point rounding.
export const TRACK_XP = { T1: 6000, T2: 500, T3: 24000, T5: 12000 } as const;
export function shiftDay(day: string, offset: number): string {
  return new Date(Date.parse(day + "T00:00:00Z") + offset * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function weekOf(day: string): string {
  const weekday = new Date(day + "T00:00:00Z").getUTCDay();
  return shiftDay(day, -((weekday + 6) % 7));
}
export type Entitlement = {
  rule: keyof typeof TRACK_XP;
  sourceKey: string;
  weekStart: string;
  milliXp: number;
};
export function trackEntitlements(
  days: string[],
  reviewedWeeks: string[],
): Entitlement[] {
  const counts = new Map<string, number>();
  for (const day of days) counts.set(day, (counts.get(day) || 0) + 1);
  const result: Entitlement[] = [];
  const sorted = [...counts.keys()].sort();
  let streak = 0;
  let previous = "";
  for (const day of sorted) {
    streak = previous && shiftDay(previous, 1) === day ? streak + 1 : 1;
    previous = day;
    const weekStart = weekOf(day);
    result.push({
      rule: "T1",
      sourceKey: day,
      weekStart,
      milliXp: TRACK_XP.T1,
    });
    const extra = counts.get(day)! - 1;
    if (extra)
      result.push({
        rule: "T2",
        sourceKey: day,
        weekStart,
        milliXp: extra * TRACK_XP.T2,
      });
    // One award per completed seven-day block, including streaks across weeks.
    if (streak % 7 === 0)
      result.push({
        rule: "T3",
        sourceKey: day,
        weekStart,
        milliXp: TRACK_XP.T3,
      });
  }
  const activeWeeks = new Set(days.map(weekOf));
  for (const weekStart of new Set(reviewedWeeks)) {
    if (activeWeeks.has(weekStart))
      result.push({
        rule: "T5",
        sourceKey: weekStart,
        weekStart,
        milliXp: TRACK_XP.T5,
      });
  }
  return result;
}
export function currentStreak(days: string[], today: string): number {
  const dates = new Set(days);
  let cursor = dates.has(today) ? today : shiftDay(today, -1);
  let count = 0;
  while (dates.has(cursor)) {
    count++;
    cursor = shiftDay(cursor, -1);
  }
  return count;
}
// SR
