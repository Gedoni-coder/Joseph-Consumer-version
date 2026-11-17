import { useState } from "react";
import { Brand } from "../../components/ui/Brand";

export type TrackingTier = "manual" | "automated";

export type TrackingPreferenceData = {
  tier: TrackingTier;
  monthlyCostNgn: number;
  openBankingEligible: boolean;
};

export interface Step3TrackGateProps {
  initialTier?: TrackingTier;
  onNext: (data: TrackingPreferenceData) => void;
  onBack: () => void;
}

export function Step3TrackGate({ initialTier = "automated", onNext, onBack }: Step3TrackGateProps) {
  const [selectedTier, setSelectedTier] = useState<TrackingTier>(initialTier);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({
      tier: selectedTier,
      monthlyCostNgn: selectedTier === "automated" ? 1000 : 0,
      openBankingEligible: selectedTier === "automated",
    });
  };

  return (
    <div className="auth-layout" style={{ minHeight: "100vh" }}>
      {/* Brand & Value Side Panel */}
      <aside>
        <div>
          <Brand />
          <p className="eyebrow" style={{ marginTop: "16px" }}>
            SEASON KICKOFF • ONBOARDING STEP 3 OF 4
          </p>
          <h1 style={{ marginTop: "24px", lineHeight: "1.08" }}>
            The Tracking Gateway.
          </h1>
          <p style={{ marginTop: "20px", fontSize: "15px", lineHeight: "1.6" }}>
            Decide how you feed your daily ledger. High-discipline manual entry or background Open Banking automation.
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
              <span style={{ fontSize: "20px" }}>⚡</span>
              <strong style={{ fontSize: "14px", color: "#fff" }}>
                1.25x Track Booster
              </strong>
            </div>
            <p style={{ fontSize: "12px", color: "#d2d5ec", margin: "8px 0 0" }}>
              Automated members earn a <strong>1.25x booster</strong> on all daily and weekly tracking points (T1—T5), while maintaining fair equity across all tournament leagues.
            </p>
          </div>
          <span style={{ display: "block", marginTop: "24px", fontSize: "11px", color: "#8a8ea8" }}>
            JOSEPH AI • NIGERIA (NGN)
          </span>
        </div>
      </aside>

      {/* Main Form Body */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: "540px", margin: "0 auto" }}>
          
          {/* Stepper Header */}
          <div style={{ marginBottom: "26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", color: "#2563eb", textTransform: "uppercase" }}>
                Screen 3 of 4
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Tracking Preference
              </span>
            </div>

            {/* Step Progress Bar */}
            <div style={{ display: "flex", gap: "6px", height: "4px", width: "100%" }}>
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "99px" }} />
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#03031d", marginTop: "18px", letterSpacing: "-0.03em" }}>
              Select Tracking Mode
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              How do you want to keep your daily consistency streak alive?
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Option A: Manual Tracking (Free) */}
            <div
              onClick={() => setSelectedTier("manual")}
              style={{
                border: selectedTier === "manual" ? "2px solid #03031d" : "1px solid #cbd5e1",
                background: selectedTier === "manual" ? "#f8fafc" : "#ffffff",
                borderRadius: "12px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    name="tier"
                    checked={selectedTier === "manual"}
                    onChange={() => setSelectedTier("manual")}
                    style={{ accentColor: "#03031d", cursor: "pointer" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#03031d", margin: 0 }}>
                      Manual Tracking
                    </h3>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                      Free Starter Plan
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#03031d" }}>
                  ₦0 / mo
                </span>
              </div>

              {/* Warning Callout Box */}
              <div
                style={{
                  marginTop: "14px",
                  background: "#fffbeb",
                  border: "1px solid #fef3c7",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "12px",
                  color: "#92400e",
                  lineHeight: "1.5",
                  fontWeight: "600",
                }}
              >
                ⚠️ <strong>Manual Mode:</strong> You must log into the app and input every single expenditure yourself to keep your streak and earn consistency points.
              </div>
            </div>

            {/* Option B: Automatic Tracking (Premium Tier) */}
            <div
              onClick={() => setSelectedTier("automated")}
              style={{
                border: selectedTier === "automated" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                background: selectedTier === "automated" ? "#eff6ff" : "#ffffff",
                borderRadius: "12px",
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
              }}
            >
              <div style={{ position: "absolute", top: "-10px", right: "18px", background: "#2563eb", color: "#ffffff", fontSize: "10px", fontWeight: "800", textTransform: "uppercase", padding: "2px 10px", borderRadius: "99px", letterSpacing: "0.5px" }}>
                🏆 Most Popular & Unlocked by Team Action
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="radio"
                    name="tier"
                    checked={selectedTier === "automated"}
                    onChange={() => setSelectedTier("automated")}
                    style={{ accentColor: "#2563eb", cursor: "pointer" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#03031d", margin: 0 }}>
                      Automatic Tracking
                    </h3>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb" }}>
                      Premium Tier
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "16px", fontWeight: "800", color: "#03031d" }}>
                    ₦1,000
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>
                    {" "}/ mo
                  </span>
                </div>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  background: "#ffffff",
                  border: "1px solid #bfdbfe",
                  borderRadius: "8px",
                  padding: "12px 14px",
                  fontSize: "12px",
                  color: "#1e3a8a",
                  lineHeight: "1.5",
                  fontWeight: "600",
                }}
              >
                ⚡ <strong>Automation Mode:</strong> Securely sync your bank accounts via Open Banking, unlock your proactive WhatsApp AI Financial Companion, and earn effortless background execution points.
              </div>

              <div style={{ marginTop: "12px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px", fontSize: "11px", color: "#3b82f6", fontWeight: "600" }}>
                <div>✓ 1.25x Track Booster XP</div>
                <div>✓ WhatsApp AI Companion</div>
                <div>✓ Open Banking Sync</div>
                <div>✓ Elite Cash Tournaments</div>
              </div>
            </div>

            {/* Note on Free Trial */}
            <div style={{ textAlign: "center", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px", fontSize: "12px", color: "#475569", fontWeight: "600" }}>
              🎁 <strong>Zero day-one payment required:</strong> On the next screen, you can unlock a <strong>1-Month Free Premium Trial</strong> by simply founding or joining a Team!
            </div>

            {/* Stepper Navigation Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
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
                Next: Unlock 1-Month Free Trial <span>→</span>
              </button>
            </div>
          </form>

        </div>
      </section>
    </div>
  );
}

