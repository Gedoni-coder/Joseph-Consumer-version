import { useState } from "react";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface TransactionItem {
  id: string;
  merchant: string;
  category: string;
  categoryIcon: string;
  envelopeGroup: "essentials" | "goals" | "lifestyle";
  amountNgn: number;
  paymentMethod: "Kuda Bank" | "GTBank" | "Zenith Bank" | "OPay" | "PalmPay" | "Cash";
  date: string;
  time: string;
  xpEarned: number;
}

const SAMPLE_TRANSACTIONS: TransactionItem[] = [
  {
    id: "tx-1",
    merchant: "Oando Fuel Station (Ikeja)",
    category: "Fuel & Power",
    categoryIcon: "⚡",
    envelopeGroup: "essentials",
    amountNgn: 14500,
    paymentMethod: "OPay",
    date: "Today",
    time: "02:15 PM",
    xpEarned: 0.5,
  },
  {
    id: "tx-2",
    merchant: "Shoprite (Ikeja City Mall)",
    category: "Groceries",
    categoryIcon: "🛒",
    envelopeGroup: "essentials",
    amountNgn: 32000,
    paymentMethod: "GTBank",
    date: "Today",
    time: "11:30 AM",
    xpEarned: 0.5,
  },
  {
    id: "tx-3",
    merchant: "MTN Nigeria Fiber Data",
    category: "Internet & Data",
    categoryIcon: "📶",
    envelopeGroup: "essentials",
    amountNgn: 18000,
    paymentMethod: "Kuda Bank",
    date: "Yesterday",
    time: "06:45 PM",
    xpEarned: 0.5,
  },
  {
    id: "tx-4",
    merchant: "Chopsticks Bistro Lekki",
    category: "Dining & Hangout",
    categoryIcon: "🍹",
    envelopeGroup: "lifestyle",
    amountNgn: 24000,
    paymentMethod: "Zenith Bank",
    date: "Nov 10",
    time: "08:20 PM",
    xpEarned: 0.5,
  },
  {
    id: "tx-5",
    merchant: "Cowrywise T-Bills Autoinvest",
    category: "Sovereign Debt",
    categoryIcon: "📈",
    envelopeGroup: "goals",
    amountNgn: 50000,
    paymentMethod: "GTBank",
    date: "Nov 08",
    time: "09:00 AM",
    xpEarned: 0.5,
  },
];

export function TrackModule({
  onAwardXp = () => {},
}: {
  onAwardXp?: (xp: number, label: string) => void;
}) {
  const [transactions, setTransactions] = useState<TransactionItem[]>(SAMPLE_TRANSACTIONS);
  const [filterGroup, setFilterGroup] = useState<"all" | "essentials" | "goals" | "lifestyle">("all");

  // Streak State
  const [streakDays, setStreakDays] = useState(5);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(true);

  // Quick Log Drawer / Modal State
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newMerchant, setNewMerchant] = useState("");
  const [newCategory, setNewCategory] = useState("Groceries");
  const [newPaymentMethod, setNewPaymentMethod] = useState<TransactionItem["paymentMethod"]>("Kuda Bank");

  // WhatsApp bot test state
  const [waMessageInput, setWaMessageInput] = useState("");
  const [waBotNotification, setWaBotNotification] = useState<string | null>(null);

  // Daily Budget Allowance calculation
  const monthlyBudget = 450000;
  const totalSpent = transactions.reduce((acc, t) => acc + t.amountNgn, 0);
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);
  const daysInMonthLeft = 18;
  const safeDailySpend = Math.round(remainingBudget / daysInMonthLeft);

  const handleCheckInToday = () => {
    if (!hasCheckedInToday) {
      setHasCheckedInToday(true);
      setStreakDays((prev) => prev + 1);
      onAwardXp(6, "Daily Financial Log Streak Check-in");
      triggerXpCelebration(6, "Daily Financial Log Streak Check-in");
    }
  };

  const handleLogTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount.replace(/,/g, ""));
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    let group: "essentials" | "goals" | "lifestyle" = "essentials";
    let icon = "🛒";

    if (newCategory === "Dining & Hangout" || newCategory === "Detty Life") {
      group = "lifestyle";
      icon = "🍹";
    } else if (newCategory === "Savings" || newCategory === "Investments") {
      group = "goals";
      icon = "📈";
    } else if (newCategory === "Fuel & Power") {
      icon = "⚡";
    } else if (newCategory === "Internet & Data") {
      icon = "📶";
    }

    const newTx: TransactionItem = {
      id: `tx-${Date.now()}`,
      merchant: newMerchant || "Direct Merchant",
      category: newCategory,
      categoryIcon: icon,
      envelopeGroup: group,
      amountNgn: parsedAmount,
      paymentMethod: newPaymentMethod,
      date: "Just Now",
      time: "Now",
      xpEarned: 0.5,
    };

    setTransactions([newTx, ...transactions]);
    onAwardXp(0.5, `Detailed Expense Entry: ${newMerchant}`);
    triggerXpCelebration(0.5, "Detailed Expense Entry");

    setNewAmount("");
    setNewMerchant("");
    setIsLoggingModalOpen(false);
  };

  // WhatsApp Assistant Simulation
  const handleSimulateWhatsAppSync = () => {
    if (!waMessageInput.trim()) return;
    const text = waMessageInput.toLowerCase();
    let amt = 5000;
    const match = text.match(/\d+/g);
    if (match) amt = parseInt(match.join(""), 10);

    const botTx: TransactionItem = {
      id: `tx-wa-${Date.now()}`,
      merchant: "WhatsApp Auto-Sync: " + waMessageInput.substring(0, 24),
      category: text.includes("fuel") ? "Fuel & Power" : text.includes("food") ? "Groceries" : "General Expense",
      categoryIcon: text.includes("fuel") ? "⚡" : "💬",
      envelopeGroup: "essentials",
      amountNgn: amt,
      paymentMethod: "OPay",
      date: "Just Now",
      time: "WhatsApp Bot",
      xpEarned: 0.5,
    };

    setTransactions([botTx, ...transactions]);
    onAwardXp(0.5, "WhatsApp Bot Instant Capture");
    triggerXpCelebration(0.5, "WhatsApp Bot Instant Capture");
    setWaBotNotification(`✓ WhatsApp Auto-Logged ₦${amt.toLocaleString()} under ${botTx.category}! (+0.5 XP)`);
    setWaMessageInput("");
    setTimeout(() => setWaBotNotification(null), 4000);
  };

  const filteredTransactions = transactions.filter((t) => {
    if (filterGroup === "all") return true;
    return t.envelopeGroup === filterGroup;
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#03031d", // Deep midnight navy framing
        color: "#ffffff",
        padding: "24px 20px 80px",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* Header Eyebrow */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  background: "#24248f",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                }}
              >
                <img
                  src="/brand/dove-transparent-white.png"
                  alt="Joseph AI Dove"
                  style={{ width: "20px", height: "20px", objectFit: "contain" }}
                />
              </div>
              <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "1.2px", color: "#60a5fa", textTransform: "uppercase" }}>
                MODULE II • THE CONSISTENCY ENGINE
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 750, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>
              Track & Log Consistency
            </h1>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0" }}>
              Daily expense logging builds financial discipline, protects your plan envelopes, and earns daily League XP.
            </p>
          </div>

          {/* Quick Log Button */}
          <button
            type="button"
            onClick={() => setIsLoggingModalOpen(true)}
            style={{
              padding: "13px 24px",
              borderRadius: "8px",
              background: "#24248f",
              color: "#ffffff",
              border: "none",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 0 #11115c",
              transition: "all 0.12s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px" }}>+</span>
            <span>LOG NEW EXPENSE (+0.5 XP)</span>
          </button>
        </div>

        {/* 1. Consistency & Burn Rate Matrix Top HUD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          {/* 7-Day Consistency Streak Meter */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "22px 24px",
              color: "#03031d",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#24248f", textTransform: "uppercase", letterSpacing: "1px" }}>
                  DISCIPLINE STREAK
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0", color: "#03031d" }}>
                  {streakDays} Days Consecutive Logging 🔥
                </h3>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#166534",
                }}
              >
                +6 XP DAILY ACTIVE
              </div>
            </div>

            {/* 7-Day Visual Badges */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "16px" }}>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                const isDone = idx < streakDays;
                const isToday = idx === streakDays - 1;

                return (
                  <div
                    key={day}
                    style={{
                      background: isDone ? "#f0fdf4" : "#f8fafc",
                      border: isToday ? "2px solid #16a34a" : isDone ? "1px solid #86efac" : "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "8px 2px",
                      textAlign: "center",
                      boxShadow: isDone ? "0 2px 0 #16a34a" : "none",
                    }}
                  >
                    <span style={{ fontSize: "10px", fontWeight: 700, color: isDone ? "#166534" : "#94a3b8", display: "block" }}>
                      {day}
                    </span>
                    <span style={{ fontSize: "13px", marginTop: "2px", display: "block" }}>
                      {isDone ? "🔥" : "🔒"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>
                Keep logging every day to maintain your Lagos League multiplier.
              </span>
              {!hasCheckedInToday && (
                <button
                  type="button"
                  onClick={handleCheckInToday}
                  style={{
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 14px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: "0 3px 0 #15803d",
                  }}
                >
                  CLAIM TODAY'S +6 XP
                </button>
              )}
            </div>
          </div>

          {/* Safe Daily Spend & Burn Rate */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "22px 24px",
              color: "#03031d",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.05)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
                SAFE DAILY SPEND ROOM
              </span>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#16a34a", margin: "4px 0 2px", letterSpacing: "-0.03em" }}>
                ₦{safeDailySpend.toLocaleString()} <span style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>/ day</span>
              </div>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                Based on ₦{remainingBudget.toLocaleString()} left across your plan envelopes for the next {daysInMonthLeft} days.
              </p>
            </div>

            {/* Burn Progress */}
            <div style={{ marginTop: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: 750, color: "#475569", marginBottom: "6px" }}>
                <span>Spent: ₦{totalSpent.toLocaleString()}</span>
                <span>Budget: ₦{monthlyBudget.toLocaleString()}</span>
              </div>
              <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.round((totalSpent / monthlyBudget) * 100))}%`,
                    height: "100%",
                    background: "#24248f",
                    borderRadius: "99px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. WhatsApp Auto-Capture Companion Banner */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "18px 22px",
            marginBottom: "24px",
            color: "#03031d",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "#f0fdf4",
                border: "2px solid #22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              💬
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <strong style={{ fontSize: "15px", color: "#03031d" }}>WhatsApp Financial Companion</strong>
                <span style={{ fontSize: "10px", background: "#dcfce7", color: "#15803d", padding: "1px 6px", borderRadius: "3px", fontWeight: 800 }}>
                  PREMIUM SYNC ACTIVE
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                Send texts or bank debit SMS to Joseph on WhatsApp to auto-categorize expenses without opening the app.
              </p>
            </div>
          </div>

          {/* Quick Simulation Input */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", width: "100%", maxWidth: "460px" }}>
            <input
              type="text"
              placeholder='e.g. "Bought generator fuel ₦15000"'
              value={waMessageInput}
              onChange={(e) => setWaMessageInput(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "12px",
                flex: "1 1 200px",
                minWidth: "180px",
                color: "#03031d",
                outline: "none",
              }}
            />
            <button
              type="button"
              onClick={handleSimulateWhatsAppSync}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                background: "#25d366",
                color: "#ffffff",
                border: "none",
                fontSize: "11px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 3px 0 #16a34a",
              }}
            >
              SIMULATE WHATSAPP SYNC
            </button>
          </div>
        </div>

        {waBotNotification && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #86efac",
              color: "#166534",
              padding: "10px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 750,
              marginBottom: "20px",
            }}
          >
            {waBotNotification}
          </div>
        )}

        {/* 3. Recent Transactions Feed */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "24px",
            color: "#03031d",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          {/* Filter Tabs */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 750, margin: 0, color: "#03031d" }}>
              Categorized Transactions ({filteredTransactions.length})
            </h3>

            <div style={{ display: "flex", gap: "6px" }}>
              {(["all", "essentials", "goals", "lifestyle"] as const).map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setFilterGroup(grp)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 750,
                    background: filterGroup === grp ? "#24248f" : "#f1f5f9",
                    color: filterGroup === grp ? "#ffffff" : "#475569",
                    border: "none",
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  transition: "all 0.12s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                    }}
                  >
                    {tx.categoryIcon}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <strong style={{ fontSize: "14px", color: "#03031d" }}>
                        {tx.merchant}
                      </strong>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 750,
                          padding: "1px 6px",
                          borderRadius: "3px",
                          background: tx.envelopeGroup === "essentials" ? "#fef3c7" : tx.envelopeGroup === "goals" ? "#dcfce7" : "#f1f5f9",
                          color: tx.envelopeGroup === "essentials" ? "#92400e" : tx.envelopeGroup === "goals" ? "#166534" : "#475569",
                          textTransform: "uppercase",
                        }}
                      >
                        {tx.category}
                      </span>
                    </div>

                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {tx.paymentMethod} • {tx.date} at {tx.time}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "15px", fontWeight: 800, color: "#03031d" }}>
                    -₦{tx.amountNgn.toLocaleString()}
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a" }}>
                    +{tx.xpEarned} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QUICK LOGGING MODAL */}
      {isLoggingModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(3, 3, 29, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "460px",
              width: "100%",
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
              color: "#03031d",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#24248f", textTransform: "uppercase", letterSpacing: "1px" }}>
                  CONSISTENCY LOG
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0" }}>
                  Log New Transaction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLoggingModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogTransaction}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  AMOUNT (₦ NGN)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 15000"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "2px solid #cbd5e1",
                    fontSize: "18px",
                    fontWeight: 800,
                    color: "#03031d",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  MERCHANT / NOTE
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TotalEnergies Fuel, Lekki"
                  value={newMerchant}
                  onChange={(e) => setNewMerchant(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    fontWeight: 650,
                    color: "#03031d",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                    CATEGORY
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#03031d",
                    }}
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Fuel & Power">Fuel & Power</option>
                    <option value="Internet & Data">Internet & Data</option>
                    <option value="Dining & Hangout">Dining & Hangout</option>
                    <option value="Investments">Investments</option>
                    <option value="Savings">Savings</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                    PAYMENT ACCOUNT
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#03031d",
                    }}
                  >
                    <option value="Kuda Bank">Kuda Bank</option>
                    <option value="GTBank">GTBank</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                    <option value="OPay">OPay</option>
                    <option value="PalmPay">PalmPay</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "8px",
                  background: "#24248f",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 4px 0 #11115c",
                }}
              >
                SAVE EXPENSE & EARN +0.5 XP ⚡
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
