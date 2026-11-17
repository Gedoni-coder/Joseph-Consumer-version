export type TournamentStage =
  | "premier_league"       // Week 1: State Tier (Top 20 per state advance, 350 XP solo / 1,200 XP team cut-off)
  | "champions_league"     // Week 2: Regional Phase (6 Geo-Political Zones, Top 10 per zone = 60 advance)
  | "world_cup"            // Week 3: National Finale (Top 20 compete, top 4 crowned)
  | "international_break"; // Week 4: Awards, Prize Payouts, Transfer Window

export type GeopoliticalZone =
  | "South West"
  | "South South"
  | "South East"
  | "North Central"
  | "North West"
  | "North East";

export type TeamMember = {
  id: string;
  name: string;
  phone: string;
  weeklyXp: number;
  lifetimeXp: number;
  streak: number;
  isPremium: boolean;
  role: "founder" | "member";
  avatar: string;
};

export type Team = {
  id: string;
  name: string;            // e.g. "Chelsea, Computer Science, UNILAG"
  clubName: string;        // e.g. "Chelsea"
  departmentOrRole: string;// e.g. "Computer Science"
  institution: string;     // e.g. "UNILAG"
  state: string;           // e.g. "Lagos"
  zone: GeopoliticalZone;
  founderId: string;
  members: TeamMember[];
  totalWeeklyXp: number;
  qualifiedForNextStage: boolean;
  inviteToken: string;
  createdAt: string;
};

export type TransferRequest = {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userWeeklyXp: number;
  currentTeamId: string;
  currentTeamName: string;
  status: "pending" | "transferred" | "cancelled";
  createdAt: string;
};

export type BallonDorAward = {
  bimonthlyCycleId: string; // Awarded every 2 months
  title: "JOSEPH AI Ballon d'Or";
  status: "active_cycle" | "crowned";
  candidates: {
    userId: string;
    userName: string;
    teamName: string;
    state: string;
    score: number;
    metrics: {
      consistencyScore: number;
      simulatorAlpha: number;
      duelWinRate: number;
      budgetComplianceRate: number;
    };
  }[];
  winner?: {
    userId: string;
    userName: string;
    teamName: string;
    crownedAt: string;
    perks: string[];
  };
};

export const TOP_EUROPEAN_CLUBS = [
  "Arsenal", "Aston Villa", "Chelsea", "Liverpool", "Manchester City", "Manchester United", "Newcastle", "Tottenham",
  "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla", "Real Sociedad", "Athletic Bilbao", "Villarreal",
  "Bayern Munich", "Borussia Dortmund", "Bayer Leverkusen", "RB Leipzig", "Eintracht Frankfurt", "Stuttgart",
  "Inter Milan", "AC Milan", "Juventus", "Napoli", "Roma", "Lazio", "Atalanta", "Fiorentina",
  "Paris Saint-Germain", "Marseille", "Monaco", "Lyon", "Lille", "Lens", "Rennes",
  "Ajax", "PSV Eindhoven", "Feyenoord", "Benfica", "Sporting CP", "Porto", "Celtic", "Rangers"
];

