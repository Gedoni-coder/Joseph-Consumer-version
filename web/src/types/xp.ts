export type XpRuleId =
  // Learn & Practice (200 XP Benchmark)
  | "L1" // Daily Lesson Complete (9 XP)
  | "L2" // Sharp Mind Quiz Bonus (3 XP)
  | "L3" // Stage Mastery Exam (25 XP)
  | "L4" // 7-Day Learning Streak (15 XP)
  | "S1" // Daily Market Check-In (5 XP)
  | "S2" // Smart Close Positive/Hedged (5 XP)
  | "S3" // Spread the Risk Diversification (14 XP)
  | "S4" // Beat the NGX Market Return (12 XP)
  // Track (100 XP Benchmark)
  | "T1" // Daily Check-In 1st Log/Review (6 XP)
  | "T2" // Detail Bonus extra logs (0.5 XP)
  | "T3" // 7-Day Consistency Streak (24 XP)
  | "T4" // Stay Under Budget weekly (15 XP)
  | "T5" // Weekly Money Review (12 XP)
  // Games (100 XP Benchmark)
  | "G1" // 1v1 Duel Win (2 XP)
  | "G2" // 1v1 Duel Played (1 XP)
  | "G3" // Arena Podium 1st/2nd/3rd (25/18/12 XP)
  | "G4" // Arena Entry (5 XP)
  | "G5" // Team Sprint 7-day all members (25 XP)
  | "G6"; // Network Tournament Match (11 XP)

export type XpRule = {
  id: XpRuleId;
  pillar: "learn_practice" | "track" | "games";
  name: string;
  trigger: string;
  baseXp: number;
  typicalWeeklyCount: number;
  benchmarkXp: number;
  isBoosterEligible: boolean; // T1 to T5 (x1.25 for Premium)
};

export const XP_BENCHMARK_RULES: Record<XpRuleId, XpRule> = {
  L1: { id: "L1", pillar: "learn_practice", name: "Daily Lesson Complete", trigger: "Finish day's chat lesson and quiz", baseXp: 9, typicalWeeklyCount: 7, benchmarkXp: 63, isBoosterEligible: false },
  L2: { id: "L2", pillar: "learn_practice", name: "Sharp Mind Bonus", trigger: "Daily quiz score ≥ 80%", baseXp: 3, typicalWeeklyCount: 7, benchmarkXp: 21, isBoosterEligible: false },
  L3: { id: "L3", pillar: "learn_practice", name: "Mastery Test", trigger: "Pass stage exam or weekly challenge", baseXp: 25, typicalWeeklyCount: 1, benchmarkXp: 25, isBoosterEligible: false },
  L4: { id: "L4", pillar: "learn_practice", name: "Learning Streak", trigger: "Lessons completed 7 days in a row", baseXp: 15, typicalWeeklyCount: 1, benchmarkXp: 15, isBoosterEligible: false },
  S1: { id: "S1", pillar: "learn_practice", name: "Daily Market Check-In", trigger: "Open simulator & confirm trade/hold", baseXp: 5, typicalWeeklyCount: 5, benchmarkXp: 25, isBoosterEligible: false },
  S2: { id: "S2", pillar: "learn_practice", name: "Smart Close", trigger: "End day in green or hedged allocation", baseXp: 5, typicalWeeklyCount: 5, benchmarkXp: 25, isBoosterEligible: false },
  S3: { id: "S3", pillar: "learn_practice", name: "Spread the Risk", trigger: "Holdings spread across ≥2 archetypes", baseXp: 14, typicalWeeklyCount: 1, benchmarkXp: 14, isBoosterEligible: false },
  S4: { id: "S4", pillar: "learn_practice", name: "Beat the Market", trigger: "Weekly return beats NGX ASI", baseXp: 12, typicalWeeklyCount: 1, benchmarkXp: 12, isBoosterEligible: false },

  T1: { id: "T1", pillar: "track", name: "Daily Check-In", trigger: "First manual log or ledger review", baseXp: 6, typicalWeeklyCount: 7, benchmarkXp: 42, isBoosterEligible: true },
  T2: { id: "T2", pillar: "track", name: "Detail Bonus", trigger: "Extra logged or reviewed transactions", baseXp: 0.5, typicalWeeklyCount: 14, benchmarkXp: 7, isBoosterEligible: true },
  T3: { id: "T3", pillar: "track", name: "7-Day Streak", trigger: "Daily check-in 7 consecutive days", baseXp: 24, typicalWeeklyCount: 1, benchmarkXp: 24, isBoosterEligible: true },
  T4: { id: "T4", pillar: "track", name: "Stay Under Budget", trigger: "Spend within flexible limits at week close", baseXp: 15, typicalWeeklyCount: 1, benchmarkXp: 15, isBoosterEligible: true },
  T5: { id: "T5", pillar: "track", name: "Weekly Money Review", trigger: "Review weekly spending summary", baseXp: 12, typicalWeeklyCount: 1, benchmarkXp: 12, isBoosterEligible: true },

  G1: { id: "G1", pillar: "games", name: "Duel Win", trigger: "Win a 1v1 wager duel", baseXp: 2, typicalWeeklyCount: 4, benchmarkXp: 8, isBoosterEligible: false },
  G2: { id: "G2", pillar: "games", name: "Duel Played", trigger: "Complete a 1v1 duel", baseXp: 1, typicalWeeklyCount: 5, benchmarkXp: 5, isBoosterEligible: false },
  G3: { id: "G3", pillar: "games", name: "Arena Podium", trigger: "Finish scheduled quiz in top 3", baseXp: 25, typicalWeeklyCount: 1, benchmarkXp: 25, isBoosterEligible: false },
  G4: { id: "G4", pillar: "games", name: "Arena Entry", trigger: "Join and complete multiplayer quiz", baseXp: 5, typicalWeeklyCount: 3, benchmarkXp: 15, isBoosterEligible: false },
  G5: { id: "G5", pillar: "games", name: "Team Sprint", trigger: "All team members hit 7-day streak", baseXp: 25, typicalWeeklyCount: 1, benchmarkXp: 25, isBoosterEligible: false },
  G6: { id: "G6", pillar: "games", name: "Network Match", trigger: "Play slot in Team vs Team tournament", baseXp: 11, typicalWeeklyCount: 2, benchmarkXp: 22, isBoosterEligible: false },
};

export type XpEvent = {
  id: string;
  ruleId: XpRuleId;
  baseXp: number;
  boosterXp: number;
  totalXp: number;
  timestamp: string;
  label: string;
};

