export type StageStatus = "completed" | "active" | "locked";

export type QuestionType = "multiple-choice" | "term-builder";

export interface TermTile {
  id: string;
  word: string;
}

export interface LessonQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  tutorBanter: string;
  tutorExpression: "explaining" | "happy" | "thinking" | "celebrating";
  options?: {
    id: string;
    text: string;
    subtext?: string;
  }[];
  correctOptionId?: string;
  availableTiles?: TermTile[];
  correctSentence?: string[];
  explanation: string;
}

export interface AcademyStage {
  id: "beginner" | "intermediate" | "professional";
  stepNumber: 1 | 2 | 3;
  title: string;
  category: string;
  subtitle: string;
  nature: "Finishable" | "Endless";
  status: StageStatus;
  xpReward: number;
  icon: string;
  topics: string[];
  questions: LessonQuestion[];
}

export const ACADEMY_STAGES: AcademyStage[] = [
  {
    id: "beginner",
    stepNumber: 1,
    title: "Beginner Stage",
    category: "Foundational Concepts",
    subtitle: "Explains foundational terms: Shares, Market Cap, & Treasury Bills.",
    nature: "Finishable",
    status: "active",
    xpReward: 40,
    icon: "🌱",
    topics: ["Market Capitalization", "NGX Shares Ownership", "Treasury Bills vs Equities"],
    questions: [
      {
        id: "b-q1",
        type: "multiple-choice",
        prompt: "Quick-Fire: If you buy 1,000 shares of GTCO on the Nigerian Exchange (NGX), what does that make you?",
        tutorBanter: "Oya listen well well! Buying shares isn't just watching numbers go up and down. What does having skin in the game really mean?",
        tutorExpression: "explaining",
        options: [
          {
            id: "opt-a",
            text: "A customer who gets priority banking services",
            subtext: "Common misconception",
          },
          {
            id: "opt-b",
            text: "A part-owner of the bank entitled to dividend profits",
            subtext: "Equity ownership with voting rights",
          },
          {
            id: "opt-c",
            text: "A lender who receives fixed guaranteed monthly interest",
            subtext: "That describes debt/bonds, not shares",
          },
        ],
        correctOptionId: "opt-b",
        explanation: "Correct! When you purchase shares on the NGX, you are literally buying equity. If the company makes a profit and declares dividends, you get paid directly into your bank CSCS account!",
      },
      {
        id: "b-q2",
        type: "term-builder",
        prompt: "Term Builder: Assemble the correct financial definition of 'Market Capitalization' (Market Cap):",
        tutorBanter: "People shout 'Market Cap' everywhere on financial Twitter. Let's arrange the formula so nobody can confuse you again!",
        tutorExpression: "thinking",
        availableTiles: [
          { id: "t1", word: "Total" },
          { id: "t2", word: "Outstanding" },
          { id: "t3", word: "Shares" },
          { id: "t4", word: "Multiplied" },
          { id: "t5", word: "By" },
          { id: "t6", word: "Current" },
          { id: "t7", word: "Share" },
          { id: "t8", word: "Price" },
        ],
        correctSentence: [
          "Total",
          "Outstanding",
          "Shares",
          "Multiplied",
          "By",
          "Current",
          "Share",
          "Price",
        ],
        explanation: "Spot on! Market Capitalization is simply the total market value of a publicly traded company's outstanding shares. Total Shares × Share Price!",
      },
      {
        id: "b-q3",
        type: "multiple-choice",
        prompt: "Yield Comparison: Zenith Bank trades at ₦40 with a ₦4 dividend. What is its Dividend Yield?",
        tutorBanter: "Let's do some quick market math! Dividend yield shows your cash return relative to the share price.",
        tutorExpression: "explaining",
        options: [
          {
            id: "opt-a",
            text: "10% Annual Cash Yield",
            subtext: "(₦4 ÷ ₦40) × 100",
          },
          {
            id: "opt-b",
            text: "4% Annual Cash Yield",
            subtext: "Incorrect denominator",
          },
          {
            id: "opt-c",
            text: "16% Annual Cash Yield",
            subtext: "Mathematical miscalculation",
          },
        ],
        correctOptionId: "opt-a",
        explanation: "Boom! ₦4 dividend divided by ₦40 price = 0.10, which is exactly a 10% cash return before capital appreciation!",
      },
    ],
  },
  {
    id: "intermediate",
    stepNumber: 2,
    title: "Intermediate Stage",
    category: "Application & Scenario Drills",
    subtitle: "Scenario-based evaluation and math drills: contrasting dividend yields vs T-Bills.",
    nature: "Finishable",
    status: "locked",
    xpReward: 60,
    icon: "⚖️",
    topics: ["364-Day T-Bills vs Equities", "Dividend Reinvestment Compounding", "Inflation-Adjusted Real Returns"],
    questions: [
      {
        id: "i-q1",
        type: "multiple-choice",
        prompt: "Scenario: CBN 364-day Treasury Bills offer 19.5% risk-free, while Dangote Cement pays 6% dividend with 15% estimated growth. How should a conservative saver allocate?",
        tutorBanter: "Now we're talking real money management! When inflation is high, do you take guaranteed government paper or stock market volatility?",
        tutorExpression: "explaining",
        options: [
          {
            id: "opt-1",
            text: "Put 100% in lottery or crypto meme coins",
            subtext: "Pure gambling, zero financial safety",
          },
          {
            id: "opt-2",
            text: "Anchor the core in T-Bills for guaranteed cash flow, then diversify surplus into equities",
            subtext: "Conservative Diverse allocation",
          },
          {
            id: "opt-3",
            text: "Hold 100% in a regular zero-interest commercial bank account",
            subtext: "Guaranteed loss of purchasing power to inflation",
          },
        ],
        correctOptionId: "opt-2",
        explanation: "Masterful! Anchoring guaranteed risk-free T-Bill yield gives stability, while equity participation protects against long-term inflation.",
      },
    ],
  },
  {
    id: "professional",
    stepNumber: 3,
    title: "Professional Stage",
    category: "Advanced Real-Time Market Shifts",
    subtitle: "High-level analysis using live NGX corporate disclosures and MPC actions.",
    nature: "Endless",
    status: "locked",
    xpReward: 100,
    icon: "⚡",
    topics: ["Live Corporate Earnings Disclosures", "CBN Monetary Policy Rate (MPR) Shifts", "Portfolio Alpha Evaluation"],
    questions: [
      {
        id: "p-q1",
        type: "multiple-choice",
        prompt: "Daily Macro Brief: The CBN MPC just raised the Monetary Policy Rate to 27.25%. What is the immediate expected effect on commercial bank Net Interest Margins (NIM)?",
        tutorBanter: "Welcome to the big leagues! Live daily economic events drive actual profits in Nigerian banks.",
        tutorExpression: "thinking",
        options: [
          {
            id: "p-opt-1",
            text: "Asset-sensitive tier-1 banks reprice loans faster than deposits, expanding NIM",
            subtext: "Positive earnings catalyst for GTCO & Zenith",
          },
          {
            id: "p-opt-2",
            text: "All banks immediately shut down lending and declare bankruptcy",
            subtext: "Inaccurate and extreme",
          },
          {
            id: "p-opt-3",
            text: "Loan demand increases to historic highs overnight",
            subtext: "High rates compress borrowing demand",
          },
        ],
        correctOptionId: "p-opt-1",
        explanation: "Correct! When rates spike, asset-sensitive lenders with large zero-cost current account balances expand their interest spreads, driving earnings higher.",
      },
    ],
  },
];
