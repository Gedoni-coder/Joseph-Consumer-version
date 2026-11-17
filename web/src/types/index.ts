export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
};

export type AccountInput = {
  id: string;
  label: string;
  balance: number; // in kobo
  institution?: string;
  kind?: "cash" | "bank";
  confirmedAt?: string;
};

export type CommitmentInput = {
  id: string;
  label: string;
  amount: number; // in kobo
  kind: "bill" | "goal";
  dueDate: string; // YYYY-MM-DD
  frequency?: "once" | "monthly" | "weekly";
};

export type Purchase = {
  id: string;
  label: string;
  amount: number; // in kobo
  occurredOn: string; // YYYY-MM-DD
  category: string;
};

export type EngineInput = {
  horizon: number;
  daily: number;
  reserve: number;
  accounts: AccountInput[];
  commitments: CommitmentInput[];
  planConfirmed: boolean;
};

export type State = {
  id?: string;
  balance: number;
  reserve: number;
  daily: number;
  horizon: number;
  available: number;
  runway: number;
  burnRate?: number;
  safeToSpend?: number;
  projections?: { date: string; balance: number; buffer: number }[];
};

export type Dashboard = {
  spending: {
    from: string;
    to: string;
    days: number;
    count: number;
    total: number;
    daily: number | null;
  };
  requiresOnboarding: boolean;
  user: User;
  consent: boolean;
  inputs: EngineInput;
  state: State;
  history: { id: string; generatedAt: string; reason: string }[];
};

export type WorkspaceTab = "overview" | "accounts" | "commitments" | "plan" | "grow" | "privacy";

