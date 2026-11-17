export type ChampionshipWeek = 1 | 2 | 3 | 4;

export interface TournamentStageInfo {
  week: ChampionshipWeek;
  title: string;
  subtitle: string;
  scope: string;
  qualificationCriteria: string;
  status: "active" | "upcoming" | "completed";
}

export const CHAMPIONSHIP_STAGES: TournamentStageInfo[] = [
  {
    week: 1,
    title: "Premier League",
    subtitle: "State-Level Base Pool",
    scope: "Lagos State Division (36 States + FCT)",
    qualificationCriteria: "350 XP Individual or 1,200 XP Team Cut-off",
    status: "active",
  },
  {
    week: 2,
    title: "Champions League",
    subtitle: "Regional Phase",
    scope: "South-West Geopolitical Zone",
    qualificationCriteria: "Top 2 Teams per State League",
    status: "upcoming",
  },
  {
    week: 3,
    title: "World Cup",
    subtitle: "National Finale",
    scope: "Top 32 National Finalist Squads",
    qualificationCriteria: "Regional Champions League Winners",
    status: "upcoming",
  },
  {
    week: 4,
    title: "Awards & Recovery",
    subtitle: "Transfer Window & Ballon d'Or",
    scope: "National Hall of Fame & Squad Restructuring",
    qualificationCriteria: "Bi-Monthly Ballon d'Or Honor (Every 2 Months)",
    status: "upcoming",
  },
];

export interface LeagueTeamStanding {
  rank: number;
  id: string;
  name: string;
  institutionOrCompany: string;
  state: string;
  membersCount: number;
  totalWeeklyXp: number;
  isPromotionZone: boolean;
  streakDays: number;
}

export const SAMPLE_LEAGUE_STANDINGS: LeagueTeamStanding[] = [
  {
    rank: 1,
    id: "team-1",
    name: "Chelsea FC, Computer Science",
    institutionOrCompany: "UNILAG",
    state: "Lagos",
    membersCount: 5,
    totalWeeklyXp: 1680,
    isPromotionZone: true,
    streakDays: 14,
  },
  {
    rank: 2,
    id: "team-2",
    name: "Arsenal FC, Mechanical Eng.",
    institutionOrCompany: "LASU",
    state: "Lagos",
    membersCount: 5,
    totalWeeklyXp: 1510,
    isPromotionZone: true,
    streakDays: 12,
  },
  {
    rank: 3,
    id: "team-3",
    name: "Real Madrid, Product Design",
    institutionOrCompany: "YabaTech",
    state: "Lagos",
    membersCount: 5,
    totalWeeklyXp: 1390,
    isPromotionZone: true,
    streakDays: 9,
  },
  {
    rank: 4,
    id: "team-4",
    name: "Man City, Accounting & Finance",
    institutionOrCompany: "Pan-Atlantic Univ",
    state: "Lagos",
    membersCount: 4,
    totalWeeklyXp: 1240,
    isPromotionZone: true,
    streakDays: 8,
  },
  {
    rank: 5,
    id: "team-5",
    name: "Barcelona, Software Engineering",
    institutionOrCompany: "FUTA Lagos Hub",
    state: "Lagos",
    membersCount: 4,
    totalWeeklyXp: 1080,
    isPromotionZone: false,
    streakDays: 6,
  },
  {
    rank: 6,
    id: "team-6",
    name: "Liverpool FC, Economics",
    institutionOrCompany: "Covenant Alumni Hub",
    state: "Lagos",
    membersCount: 3,
    totalWeeklyXp: 860,
    isPromotionZone: false,
    streakDays: 4,
  },
];

export interface BallonDorContender {
  rank: number;
  name: string;
  teamName: string;
  state: string;
  consistencyStreakDays: number;
  quizAccuracyPercent: number;
  simulationRoiPercent: number;
  compositeScore: number;
  avatar: string;
}

export const BALLON_DOR_CONTENDERS: BallonDorContender[] = [
  {
    rank: 1,
    name: "Toluwalase Adeniyi",
    teamName: "Chelsea FC, Computer Science",
    state: "Lagos",
    consistencyStreakDays: 48,
    quizAccuracyPercent: 96,
    simulationRoiPercent: 28.4,
    compositeScore: 98.2,
    avatar: "🧑🏾‍💼",
  },
  {
    rank: 2,
    name: "Chukwudi Okafor",
    teamName: "Arsenal FC, Mechanical Eng.",
    state: "Lagos",
    consistencyStreakDays: 44,
    quizAccuracyPercent: 94,
    simulationRoiPercent: 25.1,
    compositeScore: 95.8,
    avatar: "👨🏾‍💼",
  },
  {
    rank: 3,
    name: "Amina Bello",
    teamName: "Real Madrid, Product Design",
    state: "Abuja",
    consistencyStreakDays: 42,
    quizAccuracyPercent: 92,
    simulationRoiPercent: 22.8,
    compositeScore: 93.4,
    avatar: "👩🏾‍💼",
  },
];

