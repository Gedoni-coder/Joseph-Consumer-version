import { type AcademyStage } from "./growData";

export interface ProgressionMapProps {
  stages: AcademyStage[];
  selectedStageId: string;
  onSelectStage: (stage: AcademyStage) => void;
  onStartLesson: (stage: AcademyStage, initialMode?: "learn" | "practice") => void;
}

export function ProgressionMap({
  stages,
  selectedStageId,
  onSelectStage,
  onStartLesson,
}: ProgressionMapProps) {
  const activeStage = stages.find((s) => s.id === selectedStageId) || stages[0];

  return (
    <div
      className="progression-map-container"
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "36px 20px 80px",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .progression-map-container {
            padding: 14px 12px 60px !important;
          }
          .progression-header-banner {
            padding: 16px 14px !important;
            margin-bottom: 16px !important;
            gap: 12px !important;
          }
          .progression-header-h2 {
            font-size: 19px !important;
          }
          .progression-header-desc {
            font-size: 12px !important;
          }
          .progression-summary-pill {
            width: 100% !important;
            justifyContent: space-between !important;
          }
          .progression-stages-grid {
            gap: 12px !important;
            margin-bottom: 20px !important;
          }
          .progression-stage-card {
            padding: 16px 14px !important;
            min-height: auto !important;
          }
          .progression-stage-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .progression-stage-actions button {
            padding: 11px 8px !important;
            font-size: 12px !important;
          }
          .progression-syllabus-card {
            padding: 16px 14px !important;
          }
          .progression-syllabus-actions {
            flex-direction: column !important;
            gap: 8px !important;
          }
          .progression-syllabus-actions button {
            width: 100% !important;
            padding: 12px 14px !important;
          }
        }
      `}</style>

      {/* Intro Header Banner (Predominantly White card with Navy Accent) */}
      <div
        className="progression-header-banner"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "26px 30px",
          marginBottom: "32px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1, minWidth: "260px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "8px",
              background: "#24248f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px",
              boxShadow: "0 4px 12px rgba(36, 36, 143, 0.35)",
              flexShrink: 0,
            }}
          >
            <img
              src="/brand/dove-transparent-white.png"
              alt="Joseph AI Dove"
              style={{ width: "34px", height: "34px", objectFit: "contain" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "1.2px",
                  color: "#24248f",
                  textTransform: "uppercase",
                  background: "#ebebfa",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                THE ACADEMY ROADMAP • 3 TIERS
              </span>
              <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                Coach Joseph & Josephine
              </span>
            </div>
            <h2
              className="progression-header-h2"
              style={{
                fontSize: "24px",
                fontWeight: 750,
                color: "#03031d",
                margin: "0 0 6px",
                letterSpacing: "-0.04em",
              }}
            >
              The Wealth Progression Path
            </h2>
            <p
              className="progression-header-desc"
              style={{
                fontSize: "13px",
                color: "#64748b",
                margin: 0,
                lineHeight: 1.5,
                maxWidth: "540px",
              }}
            >
              A three-stage ladder engineered from foundational financial concepts to endless live market intelligence. Complete daily lessons to unlock the NGX Market Simulator.
            </p>
          </div>
        </div>

        {/* Quick Summary Pill with Instructor Portraits */}
        <div className="progression-summary-pill" style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img
              src="/brand/joseph-avatar.png"
              alt="Coach Joseph"
              title="Coach Joseph"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                zIndex: 2,
              }}
            />
            <img
              src="/brand/josephine-avatar.png"
              alt="Coach Josephine"
              title="Coach Josephine"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #ffffff",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                marginLeft: "-12px",
                zIndex: 1,
              }}
            />
          </div>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "6px",
              padding: "8px 14px",
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: "9px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              TOTAL REWARD
            </span>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#03031d", marginTop: "1px" }}>
              200 XP / Week
            </div>
            <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700 }}>
              50% of League Promotion
            </span>
          </div>
        </div>
      </div>

      {/* 3-Stage Cards Grid (Responsive auto-fit) */}
      <div
        className="progression-stages-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "18px",
          marginBottom: "32px",
        }}
      >
        {stages.map((stage) => {
          const isSelected = stage.id === selectedStageId;
          const isActive = stage.status === "active";
          const isCompleted = stage.status === "completed";
          const isLocked = stage.status === "locked";

          return (
            <div
              key={stage.id}
              className="progression-stage-card"
              onClick={() => onSelectStage(stage)}
              style={{
                background: "#ffffff",
                border: isSelected
                  ? "2px solid #03031d"
                  : isCompleted
                  ? "1px solid #cbd5e1"
                  : "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "22px 20px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected
                  ? "0 8px 24px rgba(3, 3, 29, 0.12)"
                  : "0 2px 8px rgba(3, 3, 29, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "260px",
                position: "relative",
              }}
            >
              {/* Header inside card */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "6px",
                      background: isCompleted ? "#03031d" : isActive ? "#f0fdf4" : "#f1f5f9",
                      color: isCompleted ? "#ffffff" : "#03031d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "15px",
                      fontWeight: 800,
                    }}
                  >
                    {isCompleted ? "✓" : stage.stepNumber}
                  </div>

                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 800,
                      padding: "3px 8px",
                      borderRadius: "4px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      background: isCompleted
                        ? "#fef3c7"
                        : isActive
                        ? "#dcfce7"
                        : "#f1f5f9",
                      color: isCompleted
                        ? "#92400e"
                        : isActive
                        ? "#15803d"
                        : "#64748b",
                    }}
                  >
                    {isCompleted ? "Completed" : isActive ? "Active" : "Locked"}
                  </span>
                </div>

                <div style={{ fontSize: "10.5px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px" }}>
                  STAGE {stage.stepNumber} • {stage.nature}
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 750,
                    color: "#03031d",
                    margin: "4px 0 6px",
                    letterSpacing: "-0.03em",
                  }}
                >
                  {stage.title}
                </h3>
                <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, margin: 0 }}>
                  {stage.subtitle}
                </p>
              </div>

              {/* Bottom Info inside Card */}
              <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                    Stage Reward:
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#03031d" }}>
                    +{stage.xpReward} XP
                  </span>
                </div>

                <div className="progression-stage-actions" style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLocked) onStartLesson(stage, "learn");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: isLocked ? "#f1f5f9" : isSelected ? "#03031d" : "#ffffff",
                      color: isLocked ? "#94a3b8" : isSelected ? "#ffffff" : "#03031d",
                      border: isLocked ? "1px solid #e2e8f0" : "1.5px solid #03031d",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.4px",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {isLocked ? "LOCKED 🔒" : "📖 LEARN"}
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isLocked) onStartLesson(stage, "practice");
                    }}
                    style={{
                      flex: 1,
                      padding: "10px 8px",
                      background: isLocked ? "#f1f5f9" : "#ffffff",
                      color: isLocked ? "#94a3b8" : "#16a34a",
                      border: isLocked ? "1px solid #e2e8f0" : "1.5px solid #16a34a",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 800,
                      letterSpacing: "0.4px",
                      cursor: isLocked ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    🎯 PRACTICE
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail Syllabus Card */}
      <div
        className="progression-syllabus-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "24px 28px",
          boxShadow: "0 2px 8px rgba(3, 3, 29, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              STAGE {activeStage.stepNumber} SYLLABUS & DRILLS
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 750, color: "#03031d", margin: "2px 0 0", letterSpacing: "-0.04em" }}>
              {activeStage.title}: {activeStage.category}
            </h3>
          </div>

          <div className="progression-syllabus-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap", width: "100%", maxWidth: "600px" }}>
            <button
              type="button"
              onClick={() => onStartLesson(activeStage, "learn")}
              style={{
                flex: "1 1 200px",
                padding: "12px 18px",
                background: "#24248f",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                cursor: "pointer",
                boxShadow: "0 3px 0 #11115c",
                transition: "all 0.12s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>📖 START INTERACTIVE LESSON (LEARN)</span>
              <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => onStartLesson(activeStage, "practice")}
              style={{
                flex: "1 1 200px",
                padding: "12px 18px",
                background: "#16a34a",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.5px",
                cursor: "pointer",
                boxShadow: "0 3px 0 #15803d",
                transition: "all 0.12s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>🎯 TAKE PRACTICE DRILL</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
