import { useState } from "react";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface PlanCategoryEnvelope {
  id: string;
  name: string;
  icon: string;
  group: "essentials" | "goals" | "lifestyle";
  amountNgn: number;
  isLocked?: boolean;
}

export type PlanArchetype = "tech-bro" | "student" | "corper" | "young-family" | "custom";

interface BlueprintTemplate {
  id: PlanArchetype;
  label: string;
  icon: string;
  monthlyIncome: number;
  description: string;
  envelopes: PlanCategoryEnvelope[];
}

const BLUEPRINT_TEMPLATES: BlueprintTemplate[] = [
  {
    id: "tech-bro",
    label: "Tech Bro Plan",
    icon: "💼",
    monthlyIncome: 1200000,
    description: "High savings rate, sovereign investments, co-working, gym, and USD hedge.",
    envelopes: [
      { id: "e1", name: "Rent & Service Charge", icon: "🏠", group: "essentials", amountNgn: 300000 },
      { id: "e2", name: "Groceries & Meal Prep", icon: "🛒", group: "essentials", amountNgn: 120000 },
      { id: "e3", name: "Electricity & Generator Fuel", icon: "⚡", group: "essentials", amountNgn: 80000 },
      { id: "e4", name: "Data (Starlink / Fiber)", icon: "📶", group: "essentials", amountNgn: 40000 },
      { id: "g1", name: "Japa Migration Fund 2027", icon: "✈️", group: "goals", amountNgn: 250000 },
      { id: "g2", name: "NGX Stocks & T-Bills", icon: "📈", group: "goals", amountNgn: 200000 },
      { id: "g3", name: "Emergency Stash (6 Months)", icon: "🛡️", group: "goals", amountNgn: 60000 },
      { id: "l1", name: "Black Tax & Family Support", icon: "🤝", group: "lifestyle", amountNgn: 80000 },
      { id: "l2", name: "Weekend Detty Life & Dining", icon: "🍹", group: "lifestyle", amountNgn: 70000 },
    ],
  },
  {
    id: "student",
    label: "Student Hustle",
    icon: "🎓",
    monthlyIncome: 85000,
    description: "Campus living, hostel upkeep, data bundles, and survival savings.",
    envelopes: [
      { id: "se1", name: "Campus Food & Canteen", icon: "🍲", group: "essentials", amountNgn: 35000 },
      { id: "se2", name: "Hostel & Gas Refill", icon: "🏠", group: "essentials", amountNgn: 20000 },
      { id: "se3", name: "Campus Transport (Shuttle)", icon: "🚌", group: "essentials", amountNgn: 10000 },
      { id: "se4", name: "Night Data Bundles", icon: "📶", group: "essentials", amountNgn: 8000 },
      { id: "sg1", name: "Post-Graduation Emergency Stash", icon: "🛡️", group: "goals", amountNgn: 7000 },
      { id: "sl1", name: "Handouts & Printing", icon: "📚", group: "lifestyle", amountNgn: 5000 },
    ],
  },
  {
    id: "corper",
    label: "Corper Starter",
    icon: "🇳🇬",
    monthlyIncome: 70000,
    description: "Federal allowance survival, CDS transportation, and job search buffer.",
    envelopes: [
      { id: "ce1", name: "Foodstuffs & Cooking", icon: "🛒", group: "essentials", amountNgn: 30000 },
      { id: "ce2", name: "PPA & CDS Transport", icon: "🚕", group: "essentials", amountNgn: 15000 },
      { id: "ce3", name: "Lodge Electricity Token", icon: "💡", group: "essentials", amountNgn: 8000 },
      { id: "ce4", name: "Mobile Data", icon: "📶", group: "essentials", amountNgn: 7000 },
      { id: "cg1", name: "Post-NYSC Transition Fund", icon: "💼", group: "goals", amountNgn: 10000 },
    ],
  },
  {
    id: "young-family",
    label: "Young Family",
    icon: "👨‍👩‍👧",
    monthlyIncome: 650000,
    description: "Children school fees, family groceries, healthcare, and household generator fuel.",
    envelopes: [
      { id: "ye1", name: "House Rent Amortization", icon: "🏡", group: "essentials", amountNgn: 180000 },
      { id: "ye2", name: "Family Food & Groceries", icon: "🛒", group: "essentials", amountNgn: 150000 },
      { id: "ye3", name: "School Fees Sinking Fund", icon: "🎒", group: "essentials", amountNgn: 120000 },
      { id: "ye4", name: "Generator Fuel & PHCN", icon: "⛽", group: "essentials", amountNgn: 70000 },
      { id: "yg1", name: "Family Emergency Health Stash", icon: "🏥", group: "goals", amountNgn: 60000 },
      { id: "yl1", name: "Extended Family Black Tax", icon: "🤝", group: "lifestyle", amountNgn: 50000 },
      { id: "yl2", name: "Sunday Outings & Kids Fun", icon: "🍦", group: "lifestyle", amountNgn: 20000 },
    ],
  },
];

export function PlanModule() {
  const [selectedArchetype, setSelectedArchetype] = useState<PlanArchetype>("tech-bro");
  const [monthlyIncome, setMonthlyIncome] = useState<number>(1200000);
  const [envelopes, setEnvelopes] = useState<PlanCategoryEnvelope[]>(BLUEPRINT_TEMPLATES[0].envelopes);
  const [customCatName, setCustomCatName] = useState("");
  const [customCatAmount, setCustomCatAmount] = useState("");
  const [customCatGroup, setCustomCatGroup] = useState<"essentials" | "goals" | "lifestyle">("essentials");
  const [showAddModal, setShowAddModal] = useState(false);

  // Switch Archetype Template
  const handleSelectArchetype = (template: BlueprintTemplate) => {
    setSelectedArchetype(template.id);
    setMonthlyIncome(template.monthlyIncome);
    setEnvelopes(template.envelopes);
  };

  // Update specific envelope amount
  const handleUpdateEnvelope = (id: string, newAmount: number) => {
    setEnvelopes((prev) =>
      prev.map((env) => (env.id === id ? { ...env, amountNgn: Math.max(0, newAmount) } : env))
    );
  };

  // Add Custom Envelope
  const handleAddCustomEnvelope = () => {
    if (!customCatName.trim() || !customCatAmount) return;
    const catName = customCatName.trim();
    const newEnv: PlanCategoryEnvelope = {
      id: "cust-" + Math.random().toString(36).substring(2, 7),
      name: catName,
      icon: customCatGroup === "essentials" ? "🏷️" : customCatGroup === "goals" ? "🎯" : "🍹",
      group: customCatGroup,
      amountNgn: Number(customCatAmount),
    };
    setEnvelopes([...envelopes, newEnv]);
    if (customCatGroup === "goals") {
      triggerXpCelebration(10, `Allocated Goal: ${catName}`);
    }
    setCustomCatName("");
    setCustomCatAmount("");
    setShowAddModal(false);
  };

  // Delete envelope
  const handleDeleteEnvelope = (id: string) => {
    setEnvelopes(envelopes.filter((e) => e.id !== id));
  };

  // Total calculations
  const totalAllocated = envelopes.reduce((sum, e) => sum + (e.amountNgn || 0), 0);
  const remainingRoom = monthlyIncome - totalAllocated;
  const isZeroBalanced = remainingRoom === 0;
  const isOverBudget = remainingRoom < 0;

  // Breakdown by group
  const essentialsTotal = envelopes.filter((e) => e.group === "essentials").reduce((s, e) => s + e.amountNgn, 0);
  const goalsTotal = envelopes.filter((e) => e.group === "goals").reduce((s, e) => s + e.amountNgn, 0);
  const lifestyleTotal = envelopes.filter((e) => e.group === "lifestyle").reduce((s, e) => s + e.amountNgn, 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#03031d", // Deep Navy background framing
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      {/* 1. Module Header HUD */}
      <header
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "#03031d",
          padding: "16px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "6px",
              background: "#2563eb",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              fontWeight: 900,
            }}
          >
            📋
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#60a5fa", letterSpacing: "1.2px", textTransform: "uppercase" }}>
                MODULE I • THE BLUEPRINT ENGINE
              </span>
              <span style={{ fontSize: "10px", background: "#f0fdf4", color: "#166534", padding: "1px 6px", borderRadius: "3px", fontWeight: 800 }}>
                ZERO-BASED ALLOCATION
              </span>
            </div>
            <h1 style={{ fontSize: "18px", fontWeight: 750, color: "#ffffff", margin: "2px 0 0" }}>
              The Monthly Money Picture
            </h1>
          </div>
        </div>

        {/* Live Zero-Based Balancer Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "6px 14px", borderRadius: "6px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800, display: "block" }}>
              Total Inflow
            </span>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
              ₦{monthlyIncome.toLocaleString()}
            </div>
          </div>

          <div style={{ background: "rgba(255, 255, 255, 0.08)", padding: "6px 14px", borderRadius: "6px" }}>
            <span style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800, display: "block" }}>
              Total Assigned
            </span>
            <div style={{ fontSize: "13px", fontWeight: 800, color: "#ffffff" }}>
              ₦{totalAllocated.toLocaleString()}
            </div>
          </div>

          <div
            style={{
              background: isZeroBalanced ? "#16a34a" : isOverBudget ? "#dc2626" : "#f59e0b",
              color: "#ffffff",
              padding: "6px 14px",
              borderRadius: "6px",
            }}
          >
            <span style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: 800, display: "block" }}>
              {isZeroBalanced ? "Zero Balanced" : isOverBudget ? "Over Allocated" : "Unassigned Room"}
            </span>
            <div style={{ fontSize: "13px", fontWeight: 900 }}>
              ₦{Math.abs(remainingRoom).toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Archetype Blueprint Switcher Toolbar */}
      <div
        style={{
          background: "#03031d",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Nigerian Archetypes:
        </span>
        {BLUEPRINT_TEMPLATES.map((tpl) => {
          const isActive = tpl.id === selectedArchetype;

          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleSelectArchetype(tpl)}
              style={{
                padding: "8px 14px",
                borderRadius: "4px",
                border: isActive ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.16)",
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#03031d" : "#ffffff",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <span>{tpl.icon}</span>
              <span>{tpl.label} (₦{(tpl.monthlyIncome / 1000).toFixed(0)}k)</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Workspace Canvas (Predominantly White surfaces) */}
      <main style={{ flex: 1, background: "#f8fafc", padding: "20px 14px 80px", color: "#03031d" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          
          {/* Zero-Based Status Guardrail Banner */}
          <div
            style={{
              background: isZeroBalanced ? "#f0fdf4" : isOverBudget ? "#fef2f2" : "#fffbeb",
              border: isZeroBalanced ? "1px solid #bbf7d0" : isOverBudget ? "1px solid #fecaca" : "1px solid #fef08a",
              borderRadius: "8px",
              padding: "16px 22px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>
                {isZeroBalanced ? "🎉" : isOverBudget ? "⚠️" : "💡"}
              </span>
              <div>
                <h4
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    margin: 0,
                    color: isZeroBalanced ? "#166534" : isOverBudget ? "#991b1b" : "#854d0e",
                  }}
                >
                  {isZeroBalanced
                    ? "Perfect Zero-Based Blueprint Achieved!"
                    : isOverBudget
                    ? `Over-Budget Guardrail Alert: Exceeded by ₦${Math.abs(remainingRoom).toLocaleString()}`
                    : `Unallocated Cash Room: ₦${remainingRoom.toLocaleString()} Remaining`}
                </h4>
                <p style={{ fontSize: "12px", margin: "2px 0 0", color: isZeroBalanced ? "#15803d" : isOverBudget ? "#b91c1c" : "#a16207" }}>
                  {isZeroBalanced
                    ? "Every single Naira has an intentional assignment: Expenses + Goals + Buffer = ₦0 Remaining."
                    : isOverBudget
                    ? "You have budgeted more than your monthly cash inflows. Trim envelopes to restore zero-balance."
                    : "Every Naira needs a purpose. Assign this surplus to your Japa fund, NGX equities, or T-Bills!"}
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  padding: "8px 16px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 750,
                  color: "#03031d",
                  cursor: "pointer",
                }}
              >
                + Add Custom Envelope
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerXpCelebration(25, "Blueprint Budget Locked & Synced");
                  alert("🎉 Blueprint Saved! Synced to Track module (+25 XP awarded).");
                }}
                style={{
                  padding: "8px 18px",
                  background: "#03031d",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                SAVE BLUEPRINT (+25 XP) →
              </button>
            </div>
          </div>

          {/* Monthly Income Baseline Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "20px 24px",
              marginBottom: "24px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              boxShadow: "0 2px 8px rgba(3, 3, 29, 0.04)",
            }}
          >
            <div>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                BASELINE CASH INFLOW
              </span>
              <h3 style={{ fontSize: "18px", fontWeight: 750, color: "#03031d", margin: "2px 0 0" }}>
                Total Expected Monthly Income
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#03031d" }}>₦</span>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                style={{
                  width: "180px",
                  padding: "10px 14px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#03031d",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Three Core Category Envelope Sections */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            
            {/* 1. Essentials Section */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "22px 20px",
                boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                    01 • LIFE COMES FIRST
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 750, color: "#03031d", margin: "2px 0 0" }}>
                    Essentials & Bills
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
                    ₦{essentialsTotal.toLocaleString()}
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    {((essentialsTotal / monthlyIncome) * 100).toFixed(0)}% of income
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {envelopes.filter((e) => e.group === "essentials").map((env) => (
                  <div
                    key={env.id}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 750, color: "#03031d" }}>
                        {env.icon} {env.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEnvelope(env.id)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>₦</span>
                      <input
                        type="number"
                        value={env.amountNgn}
                        onChange={(e) => handleUpdateEnvelope(env.id, Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: 750,
                          color: "#03031d",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Goals & Wealth Section */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "22px 20px",
                boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
                    02 • KEEP THE PLAN
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 750, color: "#03031d", margin: "2px 0 0" }}>
                    Goals & Investments
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
                    ₦{goalsTotal.toLocaleString()}
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    {((goalsTotal / monthlyIncome) * 100).toFixed(0)}% of income
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {envelopes.filter((e) => e.group === "goals").map((env) => (
                  <div
                    key={env.id}
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "6px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 750, color: "#14532d" }}>
                        {env.icon} {env.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEnvelope(env.id)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#166534", fontWeight: 700 }}>₦</span>
                      <input
                        type="number"
                        value={env.amountNgn}
                        onChange={(e) => handleUpdateEnvelope(env.id, Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          border: "1px solid #86efac",
                          fontSize: "13px",
                          fontWeight: 750,
                          color: "#14532d",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Lifestyle & Buffer Section */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "22px 20px",
                boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>
                    03 • YOUR ROOM
                  </span>
                  <h3 style={{ fontSize: "17px", fontWeight: 750, color: "#03031d", margin: "2px 0 0" }}>
                    Lifestyle & Buffer
                  </h3>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
                    ₦{lifestyleTotal.toLocaleString()}
                  </div>
                  <span style={{ fontSize: "10px", color: "#64748b" }}>
                    {((lifestyleTotal / monthlyIncome) * 100).toFixed(0)}% of income
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {envelopes.filter((e) => e.group === "lifestyle").map((env) => (
                  <div
                    key={env.id}
                    style={{
                      background: "#fff7ed",
                      border: "1px solid #fed7aa",
                      borderRadius: "6px",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 750, color: "#7c2d12" }}>
                        {env.icon} {env.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteEnvelope(env.id)}
                        style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "12px" }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#9a3412", fontWeight: 700 }}>₦</span>
                      <input
                        type="number"
                        value={env.amountNgn}
                        onChange={(e) => handleUpdateEnvelope(env.id, Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "6px 10px",
                          borderRadius: "4px",
                          border: "1px solid #fdba74",
                          fontSize: "13px",
                          fontWeight: 750,
                          color: "#7c2d12",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Custom Envelope Modal */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 3, 29, 0.75)",
            backdropFilter: "blur(6px)",
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
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "28px",
              maxWidth: "420px",
              width: "100%",
              color: "#03031d",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>
              Add Custom Envelope
            </h3>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Envelope Name
              </label>
              <input
                type="text"
                placeholder="e.g. Gym & Protein Supplements"
                value={customCatName}
                onChange={(e) => setCustomCatName(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Monthly Allocation (₦)
              </label>
              <input
                type="number"
                placeholder="50000"
                value={customCatAmount}
                onChange={(e) => setCustomCatAmount(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Pillar Group
              </label>
              <select
                value={customCatGroup}
                onChange={(e) => setCustomCatGroup(e.target.value as any)}
                style={{ width: "100%", padding: "10px", borderRadius: "4px", border: "1px solid #cbd5e1" }}
              >
                <option value="essentials">01 • Essentials (Bills & Food)</option>
                <option value="goals">02 • Goals (Savings & Investments)</option>
                <option value="lifestyle">03 • Lifestyle (Buffer & Fun)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleAddCustomEnvelope}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#03031d",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                ADD TO BLUEPRINT
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: "12px 16px",
                  background: "#ffffff",
                  border: "1px solid #cbd5e1",
                  borderRadius: "4px",
                  fontSize: "13px",
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

