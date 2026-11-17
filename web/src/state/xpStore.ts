import { XP_BENCHMARK_RULES, type XpEvent, type XpRuleId } from "../types/xp";

export type XpState = {
  weeklyXp: number;
  lifetimeXp: number;
  streakDays: number;
  isPremium: boolean;
  pillars: {
    learnPractice: number; // Benchmark: 200 XP
    track: number;         // Benchmark: 100 XP
    games: number;         // Benchmark: 100 XP
  };
  todayManualLogs: number;
  todaySyncreviews: number;
  history: XpEvent[];
};

const STORAGE_KEY = "joseph_xp_state_v1";

const defaultState: XpState = {
  weeklyXp: 284,
  lifetimeXp: 1420,
  streakDays: 5,
  isPremium: false,
  pillars: {
    learnPractice: 145,
    track: 74,
    games: 65,
  },
  todayManualLogs: 1,
  todaySyncreviews: 0,
  history: [
    { id: "1", ruleId: "L1", baseXp: 9, boosterXp: 0, totalXp: 9, timestamp: "Today, 10:15 AM", label: "Finished NGX Treasury Bill Concept" },
    { id: "2", ruleId: "L2", baseXp: 3, boosterXp: 0, totalXp: 3, timestamp: "Today, 10:18 AM", label: "Sharp Mind: 100% quiz score" },
    { id: "3", ruleId: "T1", baseXp: 6, boosterXp: 0, totalXp: 6, timestamp: "Today, 08:30 AM", label: "Daily Check-in: Bukka Lunch Logged" },
    { id: "4", ruleId: "S1", baseXp: 5, boosterXp: 0, totalXp: 5, timestamp: "Yesterday", label: "NGX Simulator Market Check-in" },
    { id: "5", ruleId: "G1", baseXp: 2, boosterXp: 0, totalXp: 2, timestamp: "Yesterday", label: "Won 1v1 Wager Duel vs Chidi" },
  ],
};

function loadState(): XpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultState;
}

function saveState(state: XpState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

let currentState: XpState = loadState();
const listeners = new Set<(state: XpState) => void>();

export function getXpState(): XpState {
  return currentState;
}

export function subscribeXpState(listener: (state: XpState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  saveState(currentState);
  listeners.forEach((l) => l(currentState));
}

export function setPremiumTier(isPremium: boolean) {
  currentState = { ...currentState, isPremium };
  notify();
}

/**
 * Core XP Distribution Engine
 * Enforces anti-gaming checks, 1.25x track booster for premium, and pillar buckets
 */
export function awardXp(ruleId: XpRuleId, customLabel?: string, overrideBaseXp?: number): XpEvent {
  const rule = XP_BENCHMARK_RULES[ruleId];
  let baseXp = overrideBaseXp !== undefined ? overrideBaseXp : rule.baseXp;
  let boosterXp = 0;

  // Anti-gaming rule: manual logging velocity throttling
  if (ruleId === "T1") {
    if (currentState.todayManualLogs === 0) {
      baseXp = 10; // First valid manual log of the day earns 10 XP
    } else if (currentState.todayManualLogs <= 3) {
      baseXp = 2; // Up to 3 subsequent logs earn 2 XP
    } else {
      baseXp = 0; // Exceeded 4 logs today -> 0 XP
    }
    currentState.todayManualLogs += 1;
  }

  // 1.25x Track booster for premium members on T1-T5
  if (rule.isBoosterEligible && currentState.isPremium && baseXp > 0) {
    boosterXp = Math.round(baseXp * 0.25 * 10) / 10;
  }

  const total = baseXp + boosterXp;

  const event: XpEvent = {
    id: Date.now().toString(),
    ruleId,
    baseXp,
    boosterXp,
    totalXp: total,
    timestamp: "Just now",
    label: customLabel || rule.name,
  };

  const newPillars = { ...currentState.pillars };
  if (rule.pillar === "learn_practice") newPillars.learnPractice += total;
  if (rule.pillar === "track") newPillars.track += total;
  if (rule.pillar === "games") newPillars.games += total;

  currentState = {
    ...currentState,
    weeklyXp: currentState.weeklyXp + total,
    lifetimeXp: currentState.lifetimeXp + total,
    pillars: newPillars,
    history: [event, ...currentState.history].slice(0, 50),
  };

  notify();
  return event;
}

