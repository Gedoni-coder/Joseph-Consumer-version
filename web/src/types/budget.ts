export type BudgetCategory = {
  id: string;
  name: string;
  icon: string;
  limitNgn: number;
  spentNgn: number;
  isFlexible: boolean; // Flexible categories are tracked against the weekly T4 "Stay Under Budget" rule
};

export type BudgetTemplate = {
  id: "student" | "tech_bro" | "custom";
  name: string;
  description: string;
  badge: string;
  categories: {
    name: string;
    icon: string;
    defaultLimitNgn: number;
    isFlexible: boolean;
  }[];
};

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: "student",
    name: "Student Lifestyle",
    description: "Designed for Nigerian campus life: hostel living, data subs, and cafeteria meals.",
    badge: "🎓 Campus Life",
    categories: [
      { name: "Cafeteria & Groceries", icon: "🍲", defaultLimitNgn: 40000, isFlexible: true },
      { name: "Campus Shuttle & Transport", icon: "🚌", defaultLimitNgn: 15000, isFlexible: true },
      { name: "MTN/Airtel Night & Daily Data", icon: "📱", defaultLimitNgn: 12000, isFlexible: true },
      { name: "Handouts & Printing", icon: "📚", defaultLimitNgn: 8000, isFlexible: false },
      { name: "Hostel & Room Maintenance", icon: "🏠", defaultLimitNgn: 10000, isFlexible: false },
      { name: "Weekend Flex", icon: "🍿", defaultLimitNgn: 10000, isFlexible: true },
    ],
  },
  {
    id: "tech_bro",
    name: "Tech Bro Plan",
    description: "Built for remote creators & devs: high data quotas, power/fuel backups, and lifestyle pacing.",
    badge: "💻 Remote / Tech",
    categories: [
      { name: "Fiber Internet & Data Subs", icon: "⚡", defaultLimitNgn: 45000, isFlexible: false },
      { name: "Power Generator & Solar Fuel", icon: "⛽", defaultLimitNgn: 60000, isFlexible: true },
      { name: "Dining Out & Bukka Runs", icon: "🍔", defaultLimitNgn: 75000, isFlexible: true },
      { name: "Uber / Bolt Mobility", icon: "🚗", defaultLimitNgn: 40000, isFlexible: true },
      { name: "SaaS & Productivity Subs", icon: "🛠️", defaultLimitNgn: 30000, isFlexible: false },
      { name: "Weekend Hangouts & Networking", icon: "🍹", defaultLimitNgn: 50000, isFlexible: true },
    ],
  },
  {
    id: "custom",
    name: "Custom Blueprint",
    description: "Create your own zero-based allocation from scratch with custom categories.",
    badge: "🛠️ Zero-Based",
    categories: [
      { name: "Food & Household", icon: "🍲", defaultLimitNgn: 50000, isFlexible: true },
      { name: "Mobility & Transport", icon: "🚗", defaultLimitNgn: 25000, isFlexible: true },
      { name: "Utilities & Bills", icon: "💡", defaultLimitNgn: 35000, isFlexible: false },
      { name: "Flexible Spending", icon: "🛍️", defaultLimitNgn: 20000, isFlexible: true },
    ],
  },
];

