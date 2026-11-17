import { useState } from "react";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface FinancialGoal {
  id: string;
  name: string;
  icon: string;
  targetAmountNgn: number;
  currentSavedNgn: number;
  deadline: string;
  monthlyAllocationNgn: number;
  category: "migration" | "housing" | "emergency" | "wealth";
}

export interface ConnectedAccount {
  id: string;
  institution: string;
  institutionCode: string;
  accountType: "Savings" | "Current" | "Fintech Wallet" | "Mutual Fund";
  accountNumberMasked: string;
  balanceNgn: number;
  lastSynced: string;
  isConnected: boolean;
}

const INITIAL_GOALS: FinancialGoal[] = [
  {
    id: "g-1",
    name: "Japa Relocation & Visa Proof of Funds (2027)",
    icon: "✈️",
    targetAmountNgn: 15000000,
    currentSavedNgn: 4800000,
    deadline: "Dec 2027",
    monthlyAllocationNgn: 250000,
    category: "migration",
  },
  {
    id: "g-2",
    name: "Lekki Apartment Annual Rent Stash",
    icon: "🏠",
    targetAmountNgn: 3600000,
    currentSavedNgn: 2100000,
    deadline: "Aug 2027",
    monthlyAllocationNgn: 150000,
    category: "housing",
  },
  {
    id: "g-3",
    name: "6-Month Emergency Survival Runway",
    icon: "🛡️",
    targetAmountNgn: 2400000,
    currentSavedNgn: 1800000,
    deadline: "Continuous",
    monthlyAllocationNgn: 60000,
    category: "emergency",
  },
];

const INITIAL_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "acc-1",
    institution: "Guaranty Trust Bank (GTBank)",
    institutionCode: "058",
    accountType: "Current",
    accountNumberMasked: "•••• 4821",
    balanceNgn: 845200,
    lastSynced: "10 mins ago",
    isConnected: true,
  },
  {
    id: "acc-2",
    institution: "Kuda Microfinance Bank",
    institutionCode: "090267",
    accountType: "Fintech Wallet",
    accountNumberMasked: "•••• 1930",
    balanceNgn: 142600,
    lastSynced: "Just now",
    isConnected: true,
  },
  {
    id: "acc-3",
    institution: "Cowrywise Mutual Funds",
    institutionCode: "CW",
    accountType: "Mutual Fund",
    accountNumberMasked: "•••• 8820",
    balanceNgn: 3200000,
    lastSynced: "Today 08:00 AM",
    isConnected: true,
  },
  {
    id: "acc-4",
    institution: "Zenith Bank PLC",
    institutionCode: "057",
    accountType: "Savings",
    accountNumberMasked: "•••• 9012",
    balanceNgn: 520000,
    lastSynced: "Yesterday",
    isConnected: false,
  },
];

export function ManageModule({
  onAwardXp = () => {},
}: {
  onAwardXp?: (xp: number, label: string) => void;
}) {
  const [goals, setGoals] = useState<FinancialGoal[]>(INITIAL_GOALS);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(INITIAL_ACCOUNTS);
  const [activeTab, setActiveTab] = useState<"goals" | "banking" | "networth">("goals");

  // New Goal modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalMonthly, setNewGoalMonthly] = useState("");

  const totalConnectedCash = accounts
    .filter((a) => a.isConnected)
    .reduce((acc, a) => acc + a.balanceNgn, 0);

  const totalSavedInGoals = goals.reduce((acc, g) => acc + g.currentSavedNgn, 0);
  const totalTargetGoals = goals.reduce((acc, g) => acc + g.targetAmountNgn, 0);

  const handleToggleAccount = (accId: string) => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === accId) {
          const nextState = !a.isConnected;
          if (nextState) {
            onAwardXp(15, `Connected Open Banking: ${a.institution}`);
            triggerXpCelebration(15, `Connected Banking: ${a.institution}`);
          }
          return { ...a, isConnected: nextState, lastSynced: "Just now" };
        }
        return a;
      })
    );
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTarget.replace(/,/g, ""));
    const monthly = parseFloat(newGoalMonthly.replace(/,/g, ""));
    if (isNaN(target) || target <= 0) return;

    const newGoal: FinancialGoal = {
      id: `g-${Date.now()}`,
      name: newGoalName || "Financial Milestone",
      icon: "🎯",
      targetAmountNgn: target,
      currentSavedNgn: 0,
      deadline: "2028",
      monthlyAllocationNgn: isNaN(monthly) ? 50000 : monthly,
      category: "wealth",
    };

    setGoals([...goals, newGoal]);
    onAwardXp(10, `Established Wealth Milestone: ${newGoal.name}`);
    triggerXpCelebration(10, `Goal Established: ${newGoal.name}`);
    setNewGoalName("");
    setNewGoalTarget("");
    setNewGoalMonthly("");
    setIsGoalModalOpen(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#03031d", // Midnight navy background framing
        color: "#ffffff",
        padding: "24px 20px 80px",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .manage-header-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 14px !important;
          }
          .manage-header-row button {
            width: 100% !important;
            min-height: 44px !important;
          }
          .manage-nav-tabs {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            overflow-x: visible !important;
            white-space: normal !important;
          }
          .manage-nav-btn {
            width: 100% !important;
            min-height: 44px !important;
            justify-content: flex-start !important;
            white-space: normal !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        
        {/* Header Eyebrow */}
        <div className="manage-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
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
                MODULE III • THE ASSET ENGINE
              </span>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 750, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>
              Manage & Open Banking
            </h1>
            <p style={{ fontSize: "14px", color: "#94a3b8", margin: "4px 0 0" }}>
              Connect your Nigerian bank accounts, track long-term milestones (Japa, Rent, Emergency), and safeguard your net worth.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsGoalModalOpen(true)}
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
            }}
          >
            + CREATE NEW GOAL
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="manage-nav-tabs" style={{ display: "flex", gap: "10px", marginBottom: "24px", overflowX: "auto", WebkitOverflowScrolling: "touch", whiteSpace: "nowrap", paddingBottom: "4px" }}>
          {[
            { id: "goals", label: "🎯 Goals & Stashes Portfolio", count: goals.length },
            { id: "banking", label: "🏦 Open Banking Sync (Mono / Okra)", count: accounts.length },
            { id: "networth", label: "📈 Net Worth & Asset Summary" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="manage-nav-btn"
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: 800,
                background: activeTab === tab.id ? "#ffffff" : "rgba(255, 255, 255, 0.08)",
                color: activeTab === tab.id ? "#03031d" : "#cbd5e1",
                border: "none",
                cursor: "pointer",
                boxShadow: activeTab === tab.id ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                transition: "all 0.15s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {tab.label} {tab.count !== undefined && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* TAB 1: GOALS PORTFOLIO */}
        {activeTab === "goals" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "18px" }}>
              {goals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentSavedNgn / goal.targetAmountNgn) * 100));

                return (
                  <div
                    key={goal.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "24px",
                      color: "#03031d",
                      boxShadow: "0 4px 14px rgba(3, 3, 29, 0.05)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "10px",
                            background: "#f0f2ff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                          }}
                        >
                          {goal.icon}
                        </div>

                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#166534",
                            background: "#f0fdf4",
                            padding: "3px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {percent}% FUNDED
                        </span>
                      </div>

                      <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 4px", color: "#03031d" }}>
                        {goal.name}
                      </h3>
                      <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 650 }}>
                        Target Deadline: {goal.deadline}
                      </span>
                    </div>

                    <div style={{ marginTop: "20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <strong style={{ color: "#16a34a" }}>₦{goal.currentSavedNgn.toLocaleString()}</strong>
                        <span style={{ color: "#64748b" }}>of ₦{goal.targetAmountNgn.toLocaleString()}</span>
                      </div>

                      {/* Progress Bar */}
                      <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden", marginBottom: "12px" }}>
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            background: "#24248f",
                            borderRadius: "99px",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                        <span>Monthly: ₦{goal.monthlyAllocationNgn.toLocaleString()}</span>
                        <span style={{ color: "#24248f", fontWeight: 750 }}>Automated via Plan</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: OPEN BANKING CONNECTIONS */}
        {activeTab === "banking" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "26px",
              color: "#03031d",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>
                  Open Banking Data Feeds (Mono / Okra Certified)
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
                  Bank-grade 256-bit encrypted read-only sync with Central Bank of Nigeria licensed institutions.
                </p>
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 800 }}>
                  TOTAL SYNCED CASH
                </span>
                <div style={{ fontSize: "22px", fontWeight: 800, color: "#16a34a" }}>
                  ₦{totalConnectedCash.toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderRadius: "8px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "8px",
                        background: acc.isConnected ? "#24248f" : "#cbd5e1",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "14px",
                        fontWeight: 900,
                      }}
                    >
                      {acc.institution.substring(0, 2)}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "15px", color: "#03031d" }}>
                          {acc.institution}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                          {acc.accountNumberMasked}
                        </span>
                        <span
                          style={{
                            fontSize: "10px",
                            padding: "1px 6px",
                            borderRadius: "3px",
                            background: acc.isConnected ? "#dcfce7" : "#fee2e2",
                            color: acc.isConnected ? "#15803d" : "#b91c1c",
                            fontWeight: 800,
                          }}
                        >
                          {acc.isConnected ? "CONNECTED" : "PAUSED"}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        {acc.accountType} • Last synced {acc.lastSynced}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#03031d" }}>
                        ₦{acc.balanceNgn.toLocaleString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleAccount(acc.id)}
                      style={{
                        padding: "7px 14px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: 750,
                        background: acc.isConnected ? "#fee2e2" : "#24248f",
                        color: acc.isConnected ? "#b91c1c" : "#ffffff",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {acc.isConnected ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: NET WORTH BREAKDOWN */}
        {activeTab === "networth" && (
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "26px",
              color: "#03031d",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
                  CONSOLIDATED NIGERIAN NET WORTH
                </span>
                <h2 style={{ fontSize: "32px", fontWeight: 800, color: "#03031d", margin: "4px 0 0", letterSpacing: "-0.04em" }}>
                  ₦{(totalConnectedCash + totalSavedInGoals).toLocaleString()}
                </h2>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#166534",
                }}
              >
                +14.2% YTD Growth
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 750 }}>
                  Liquid Cash in Banks
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#03031d", marginTop: "4px" }}>
                  ₦{totalConnectedCash.toLocaleString()}
                </div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 750 }}>
                  Funded Milestones & Goals
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a", marginTop: "4px" }}>
                  ₦{totalSavedInGoals.toLocaleString()}
                </div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 750 }}>
                  Unfunded Goal Gap
                </span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706", marginTop: "4px" }}>
                  ₦{(totalTargetGoals - totalSavedInGoals).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CREATE GOAL MODAL */}
      {isGoalModalOpen && (
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
                  WEALTH MILESTONE
                </span>
                <h3 style={{ fontSize: "20px", fontWeight: 800, margin: "2px 0 0" }}>
                  Create Financial Goal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGoalModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGoal}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  GOAL NAME
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master's Degree Tuition 2027"
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
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

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  TARGET AMOUNT (₦ NGN)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 750,
                    color: "#03031d",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#475569", marginBottom: "4px" }}>
                  MONTHLY SAVINGS TARGET (₦ NGN)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100000"
                  value={newGoalMonthly}
                  onChange={(e) => setNewGoalMonthly(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: 750,
                    color: "#03031d",
                    outline: "none",
                  }}
                />
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
                ESTABLISH GOAL & EARN +10 XP 🎯
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
