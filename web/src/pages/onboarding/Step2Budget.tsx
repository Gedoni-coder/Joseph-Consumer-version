import { useState } from "react";
import { Brand } from "../../components/ui/Brand";
import { BUDGET_TEMPLATES, type BudgetTemplate } from "../../types/budget";

export type BudgetCategoryInput = {
  name: string;
  icon: string;
  limitNgn: number;
  isFlexible: boolean;
};

export type BudgetSetupData = {
  templateId: string;
  totalMonthlyBudget: number;
  categories: BudgetCategoryInput[];
};

export interface Step2BudgetProps {
  initialData?: Partial<BudgetSetupData>;
  onNext: (data: BudgetSetupData) => void;
  onBack: () => void;
}

export function Step2Budget({ initialData, onNext, onBack }: Step2BudgetProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    initialData?.templateId || "student"
  );

  const initialTemplate =
    BUDGET_TEMPLATES.find((t) => t.id === selectedTemplateId) || BUDGET_TEMPLATES[0];

  const [categories, setCategories] = useState<BudgetCategoryInput[]>(
    initialData?.categories ||
      initialTemplate.categories.map((c) => ({
        name: c.name,
        icon: c.icon,
        limitNgn: c.defaultLimitNgn,
        isFlexible: c.isFlexible,
      }))
  );

  const [newCatName, setNewCatName] = useState("");
  const [newCatLimit, setNewCatLimit] = useState("");
  const [newCatFlexible, setNewCatFlexible] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Switch template
  const handleSelectTemplate = (template: BudgetTemplate) => {
    setSelectedTemplateId(template.id);
    setCategories(
      template.categories.map((c) => ({
        name: c.name,
        icon: c.icon,
        limitNgn: c.defaultLimitNgn,
        isFlexible: c.isFlexible,
      }))
    );
  };

  // Update specific limit
  const handleUpdateLimit = (index: number, newLimit: number) => {
    const updated = [...categories];
    updated[index].limitNgn = Math.max(0, newLimit);
    setCategories(updated);
  };

  // Remove category
  const handleRemoveCategory = (index: number) => {
    if (categories.length <= 1) return;
    setCategories(categories.filter((_, i) => i !== index));
  };

  // Add custom category
  const handleAddCategory = () => {
    if (!newCatName.trim() || !newCatLimit) return;
    setCategories([
      ...categories,
      {
        name: newCatName.trim(),
        icon: "🏷️",
        limitNgn: Number(newCatLimit),
        isFlexible: newCatFlexible,
      },
    ]);
    setNewCatName("");
    setNewCatLimit("");
    setShowAddModal(false);
  };

  const totalMonthlyBudget = categories.reduce((sum, c) => sum + (c.limitNgn || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      templateId: selectedTemplateId,
      totalMonthlyBudget,
      categories,
    });
  };

  return (
    <div className="auth-layout" style={{ minHeight: "100vh" }}>
      {/* Brand & Value Side Panel */}
      <aside>
        <div>
          <Brand />
          <p className="eyebrow" style={{ marginTop: "16px" }}>
            SEASON KICKOFF • ONBOARDING STEP 2 OF 4
          </p>
          <h1 style={{ marginTop: "24px", lineHeight: "1.08" }}>
            The Blueprint Engine.
          </h1>
          <p style={{ marginTop: "20px", fontSize: "15px", lineHeight: "1.6" }}>
            Pick a ready-made budget blueprint tailored for your Nigerian lifestyle or customize every Naira limit.
          </p>
        </div>

        <div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>📋</span>
              <strong style={{ fontSize: "14px", color: "#fff" }}>
                +60 XP Planning Reward
              </strong>
            </div>
            <p style={{ fontSize: "12px", color: "#d2d5ec", margin: "8px 0 0" }}>
              Assigning every Naira a specific job sets your guardrails and immediately earns <strong>+60 XP</strong> towards your 350 XP weekly league target.
            </p>
          </div>
          <span style={{ display: "block", marginTop: "24px", fontSize: "11px", color: "#8a8ea8" }}>
            JOSEPH AI • NIGERIA (NGN)
          </span>
        </div>
      </aside>

      {/* Main Form Body */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
          
          {/* Stepper Header */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", color: "#2563eb", textTransform: "uppercase" }}>
                Screen 2 of 4
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Budget Template Hub
              </span>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: "flex", gap: "6px", height: "4px", width: "100%" }}>
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "99px" }} />
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#03031d", marginTop: "18px", letterSpacing: "-0.03em" }}>
              Choose your Blueprint
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              Select a preset template and customize your monthly spending limits.
            </p>
          </div>

          {/* Template Selection Hub */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "22px" }}>
            {BUDGET_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  style={{
                    padding: "12px 10px",
                    borderRadius: "10px",
                    border: isSelected ? "2px solid #03031d" : "1px solid #e2e8f0",
                    background: isSelected ? "#03031d" : "#f8fafc",
                    color: isSelected ? "#ffffff" : "#1e293b",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "84px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: "700" }}>{tpl.badge}</span>
                  <strong style={{ fontSize: "13px", fontWeight: "750", marginTop: "4px" }}>{tpl.name}</strong>
                </button>
              );
            })}
          </div>

          {/* Total Allocation Display */}
          <div
            style={{
              background: "#f1f5f9",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b" }}>
                Total Monthly Guardrail
              </span>
              <div style={{ fontSize: "24px", fontWeight: "800", color: "#03031d", letterSpacing: "-0.03em" }}>
                ₦{totalMonthlyBudget.toLocaleString()}
              </div>
            </div>
            <span style={{ fontSize: "12px", background: "#dcfce7", color: "#166534", fontWeight: "700", padding: "4px 10px", borderRadius: "99px" }}>
              {categories.length} Categories Assigned
            </span>
          </div>

          {/* Editable Categories List */}
          <form onSubmit={handleSubmit}>
            <div style={{ maxHeight: "310px", overflowY: "auto", paddingRight: "4px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
              {categories.map((cat, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: "20px" }}>{cat.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {cat.name}
                      </div>
                      <span style={{ fontSize: "10px", fontWeight: "600", color: cat.isFlexible ? "#2563eb" : "#64748b" }}>
                        {cat.isFlexible ? "Flexible • Weekly T4 Rule" : "Fixed Bill"}
                      </span>
                    </div>
                  </div>

                  {/* Limit Input */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ position: "relative", width: "120px" }}>
                      <span style={{ position: "absolute", left: "8px", top: "7px", fontSize: "12px", color: "#94a3b8", fontWeight: "700" }}>
                        ₦
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        value={cat.limitNgn}
                        onChange={(e) => handleUpdateLimit(idx, Number(e.target.value))}
                        style={{
                          width: "100%",
                          padding: "6px 8px 6px 22px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
                          fontWeight: "700",
                          color: "#03031d",
                          outline: "none",
                        }}
                      />
                    </div>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          fontSize: "16px",
                          padding: "2px",
                        }}
                        title="Remove category"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Category Trigger */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: 0,
                }}
              >
                <span>+</span> Add Custom Category
              </button>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                Limits can be adjusted later in PLAN module
              </span>
            </div>

            {/* Modal for adding custom category */}
            {showAddModal && (
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "750", color: "#03031d", marginBottom: "10px" }}>
                  Create New Category
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                  <input
                    type="text"
                    placeholder="Category Name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                  />
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: "8px", top: "8px", color: "#94a3b8", fontSize: "12px", fontWeight: "700" }}>₦</span>
                    <input
                      type="number"
                      placeholder="Limit in NGN"
                      value={newCatLimit}
                      onChange={(e) => setNewCatLimit(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px 8px 22px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "12px", color: "#475569", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={newCatFlexible}
                      onChange={(e) => setNewCatFlexible(e.target.checked)}
                    />
                    Flexible Category (Counts toward T4 Rule)
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      style={{
                        padding: "6px 14px",
                        background: "#03031d",
                        color: "#fff",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={onBack}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  color: "#334155",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                ← Back
              </button>
              <button
                type="submit"
                style={{
                  flex: 2,
                  padding: "14px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#03031d",
                  color: "#ffffff",
                  fontWeight: "750",
                  fontSize: "14px",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(3, 3, 29, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                Next: Tracking Preference <span>→</span>
              </button>
            </div>
          </form>

        </div>
      </section>
    </div>
  );
}

