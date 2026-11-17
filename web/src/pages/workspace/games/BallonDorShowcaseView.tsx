import { useState } from "react";
import { BALLON_DOR_CONTENDERS, type BallonDorContender } from "./tournamentData";

export interface BallonDorShowcaseViewProps {
  userStreakDays?: number;
  userQuizAccuracy?: number;
  userSimulationRoi?: number;
}

export function BallonDorShowcaseView({
  userStreakDays = 14,
  userQuizAccuracy = 92,
  userSimulationRoi = 18.5,
}: BallonDorShowcaseViewProps) {
  const [contenders] = useState<BallonDorContender[]>(BALLON_DOR_CONTENDERS);
  const [selectedContender, setSelectedContender] = useState<BallonDorContender>(contenders[0]);

  // Compute user composite score: 40% streak + 30% accuracy + 30% alpha
  // Normalized: streak / 60 * 40, accuracy / 100 * 30, roi / 30 * 30
  const streakScore = Math.min(40, (userStreakDays / 60) * 40);
  const quizScore = (userQuizAccuracy / 100) * 30;
  const roiScore = Math.min(30, (userSimulationRoi / 30) * 30);
  const userCompositeScore = (streakScore + quizScore + roiScore).toFixed(1);

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        .ballon-mobile-contenders {
          display: none;
        }
        .ballon-desktop-contenders {
          display: block;
        }
        .ballon-pillars-unified {
          display: none;
        }
        @media (max-width: 768px) {
          .ballon-header-card {
            padding: 16px 14px !important;
            margin-bottom: 14px !important;
            gap: 12px !important;
          }
          .ballon-header-card h2 {
            font-size: 20px !important;
          }
          .ballon-trophy-widget {
            width: 100% !important;
            padding: 12px 16px !important;
          }
          .ballon-pillars-track {
            display: none !important;
          }
          .ballon-pillars-unified {
            display: block !important;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px 14px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(3, 3, 29, 0.04);
          }
          .ballon-desktop-contenders {
            display: none !important;
          }
          .ballon-mobile-contenders {
            display: flex !important;
            flex-direction: column !important;
          }
          .ballon-mobile-card {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            cursor: pointer;
            transition: all 0.15s ease;
          }
          .ballon-dossier-card {
            padding: 16px 14px !important;
          }
        }
      `}</style>

      {/* 1. Header Trophy Card (Clean White card with Gold & Navy accents) */}
      <div
        className="ballon-header-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "28px 32px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: "600px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "1.2px",
                background: "#fef3c7",
                color: "#92400e",
                padding: "3px 8px",
                borderRadius: "4px",
                textTransform: "uppercase",
              }}
            >
              BI-MONTHLY PRESTIGE HONOR • AWARDED EVERY 2 MONTHS
            </span>
            <span style={{ fontSize: "12px", color: "#64748b" }}>• Next Gala in 18 Days</span>
          </div>

          <h2
            style={{
              fontSize: "26px",
              fontWeight: 750,
              color: "#03031d",
              margin: "4px 0 8px",
              letterSpacing: "-0.04em",
            }}
          >
            The Nigerian Financial Ballon d'Or ⚽🏆
          </h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.55 }}>
            The ultimate individual accolade awarded every two months to Nigeria's most disciplined and astute financial player. Evaluated strictly by deterministic algorithm across streaks, quiz accuracy, and simulation alpha.
          </p>
        </div>

        {/* Golden Trophy Visual Widget */}
        <div
          className="ballon-trophy-widget"
          style={{
            background: "linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)",
            border: "2px solid #eab308",
            borderRadius: "12px",
            padding: "18px 24px",
            textAlign: "center",
            boxShadow: "0 6px 20px rgba(234, 179, 8, 0.15)",
          }}
        >
          <div style={{ fontSize: "40px", lineHeight: 1, marginBottom: "6px" }}>⚽👑</div>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#854d0e", textTransform: "uppercase" }}>
            Current #1 Favorite
          </span>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#03031d", marginTop: "2px" }}>
            {contenders[0].name.split(" ")[0]}
          </div>
          <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
            {contenders[0].compositeScore} Pts
          </span>
        </div>
      </div>

      {/* 2. Three Pillars Ranking Algorithm Breakdown */}
      <div
        className="ballon-pillars-track"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
          marginBottom: "28px",
        }}
      >
        {/* Pillar 1: Streak */}
        <div
          className="ballon-pillar-card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#ea580c", textTransform: "uppercase" }}>
              PILLAR 1 (40% WEIGHT)
            </span>
            <span style={{ fontSize: "18px" }}>🔥</span>
          </div>
          <h4 style={{ fontSize: "16px", fontWeight: 750, color: "#03031d", margin: "0 0 6px" }}>
            Daily Consistency Streak
          </h4>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>
            Tracks un-broken daily logins and transaction tracking over the 60-day cycle.
          </p>
          <div style={{ fontSize: "12px", fontWeight: 750, color: "#03031d" }}>
            Your Streak: <span style={{ color: "#ea580c" }}>{userStreakDays} Days</span> ({streakScore.toFixed(1)}/40 pts)
          </div>
        </div>

        {/* Pillar 2: Quiz Accuracy */}
        <div
          className="ballon-pillar-card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
              PILLAR 2 (30% WEIGHT)
            </span>
            <span style={{ fontSize: "18px" }}>🎯</span>
          </div>
          <h4 style={{ fontSize: "16px", fontWeight: 750, color: "#03031d", margin: "0 0 6px" }}>
            Academy Quiz Accuracy
          </h4>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>
            Mastery score in quick-fire drills, dividend yield calculations, and T-Bill comparisons.
          </p>
          <div style={{ fontSize: "12px", fontWeight: 750, color: "#03031d" }}>
            Your Accuracy: <span style={{ color: "#2563eb" }}>{userQuizAccuracy}%</span> ({quizScore.toFixed(1)}/30 pts)
          </div>
        </div>

        {/* Pillar 3: Simulation ROI */}
        <div
          className="ballon-pillar-card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "20px",
            boxShadow: "0 2px 8px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase" }}>
              PILLAR 3 (30% WEIGHT)
            </span>
            <span style={{ fontSize: "18px" }}>📈</span>
          </div>
          <h4 style={{ fontSize: "16px", fontWeight: 750, color: "#03031d", margin: "0 0 6px" }}>
            NGX Simulation Alpha
          </h4>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>
            Net simulated capital gains across diverse equities and sovereign debt holdings.
          </p>
          <div style={{ fontSize: "12px", fontWeight: 750, color: "#03031d" }}>
            Your Alpha: <span style={{ color: "#16a34a" }}>+{userSimulationRoi}%</span> ({roiScore.toFixed(1)}/30 pts)
          </div>
        </div>
      </div>

      {/* Mobile Unified 3-Pillar Balance Gauge */}
      <div className="ballon-pillars-unified">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#854d0e", letterSpacing: "1px", textTransform: "uppercase" }}>
              EVALUATION PILLARS (3-PART ALGORITHM)
            </span>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d", marginTop: "2px" }}>
              Your Composite Score: <span style={{ color: "#16a34a" }}>{userCompositeScore}</span> / 100
            </div>
          </div>
          <span style={{ fontSize: "20px" }}>⚖️</span>
        </div>

        {/* Row 1: Consistency Streak (40%) */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 750, color: "#03031d" }}>🔥 1. Consistency Streak (40%)</span>
            <span style={{ fontWeight: 800, color: "#ea580c" }}>{userStreakDays}d ({streakScore.toFixed(1)}/40 pts)</span>
          </div>
          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(streakScore / 40) * 100}%`, background: "#ea580c", borderRadius: "3px" }} />
          </div>
        </div>

        {/* Row 2: Quiz Accuracy (30%) */}
        <div style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 750, color: "#03031d" }}>🎯 2. Academy Accuracy (30%)</span>
            <span style={{ fontWeight: 800, color: "#2563eb" }}>{userQuizAccuracy}% ({quizScore.toFixed(1)}/30 pts)</span>
          </div>
          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(quizScore / 30) * 100}%`, background: "#2563eb", borderRadius: "3px" }} />
          </div>
        </div>

        {/* Row 3: Simulation ROI (30%) */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 750, color: "#03031d" }}>📈 3. NGX Simulation Alpha (30%)</span>
            <span style={{ fontWeight: 800, color: "#16a34a" }}>+{userSimulationRoi}% ({roiScore.toFixed(1)}/30 pts)</span>
          </div>
          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(roiScore / 30) * 100}%`, background: "#16a34a", borderRadius: "3px" }} />
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Leaderboard vs Contender Deep Dive */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        {/* Contenders Table */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div
            style={{
              padding: "16px 20px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#03031d", textTransform: "uppercase" }}>
              Bi-Monthly Race Leaderboard (Top 5 Contenders)
            </span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              Cycle Ends in 18d
            </span>
          </div>

          {/* Desktop Contenders Table */}
          <div className="ballon-desktop-contenders">
            {contenders.map((contender) => {
              const isSelected = contender.rank === selectedContender.rank;

              return (
                <div
                  key={contender.rank}
                  onClick={() => setSelectedContender(contender)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr 100px 90px",
                    padding: "16px 20px",
                    alignItems: "center",
                    borderBottom: "1px solid #f1f5f9",
                    background: isSelected ? "#f0f1f8" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#03031d" }}>
                      {contender.rank}.
                    </span>
                    {contender.rank === 1 && <span>👑</span>}
                  </div>

                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 750, color: "#03031d" }}>
                      {contender.name}
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {contender.teamName} • {contender.state}
                    </span>
                  </div>

                  <div style={{ textAlign: "center", fontSize: "11px", color: "#475569" }}>
                    🔥 {contender.consistencyStreakDays}d streak
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
                      {contender.compositeScore}
                    </div>
                    <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: 700 }}>
                      +{contender.simulationRoiPercent}% ROI
                    </span>
                  </div>
                </div>
              );
            })}

            {/* User Row Highlight */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 100px 90px",
                padding: "16px 20px",
                alignItems: "center",
                background: "#f0fdf4",
                borderTop: "2px solid #16a34a",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#16a34a" }}>
                #18
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 800, color: "#03031d" }}>
                  You (Player)
                </div>
                <span style={{ fontSize: "11px", color: "#166534" }}>
                  Chelsea FC, Computer Science • Lagos
                </span>
              </div>
              <div style={{ textAlign: "center", fontSize: "11px", color: "#166534" }}>
                🔥 {userStreakDays}d streak
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#15803d" }}>
                  {userCompositeScore}
                </div>
                <span style={{ fontSize: "10px", color: "#15803d", fontWeight: 700 }}>
                  +{userSimulationRoi}% ROI
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Contenders Card List */}
          <div className="ballon-mobile-contenders">
            {contenders.map((contender) => {
              const isSelected = contender.rank === selectedContender.rank;

              return (
                <div
                  key={contender.rank}
                  className="ballon-mobile-card"
                  onClick={() => setSelectedContender(contender)}
                  style={{
                    background: isSelected ? "#f0f1f8" : "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          background: contender.rank === 1 ? "#fef08a" : "#03031d",
                          color: contender.rank === 1 ? "#854d0e" : "#ffffff",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        {contender.rank === 1 ? "👑 #1" : `#${contender.rank}`}
                      </span>
                      <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#03031d" }}>
                        {contender.name}
                      </span>
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 850, color: "#03031d" }}>
                      {contender.compositeScore} pts
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#64748b" }}>
                    <span>{contender.teamName} • {contender.state}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span style={{ color: "#ea580c", fontWeight: 700 }}>🔥 {contender.consistencyStreakDays}d</span>
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>+{contender.simulationRoiPercent}% ROI</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile User Highlight Card */}
            <div
              className="ballon-mobile-card"
              style={{
                background: "#f0fdf4",
                borderTop: "2px solid #16a34a",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      background: "#16a34a",
                      color: "#ffffff",
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    #18
                  </span>
                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#03031d" }}>
                    You (Player)
                  </span>
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 850, color: "#15803d" }}>
                  {userCompositeScore} pts
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#166534" }}>
                <span>Chelsea FC, Computer Science • Lagos</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span style={{ fontWeight: 700 }}>🔥 {userStreakDays}d</span>
                  <span style={{ fontWeight: 700 }}>+{userSimulationRoi}% ROI</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Contender Dossier Card */}
        <div
          className="ballon-dossier-card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "24px 20px",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
            height: "fit-content",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "#f0f1f8",
                border: "2px solid #03031d",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                margin: "0 auto 8px",
              }}
            >
              {selectedContender.avatar}
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 750, color: "#03031d", margin: "0 0 2px" }}>
              {selectedContender.name}
            </h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              {selectedContender.teamName}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Rank Position:</span>
              <strong style={{ fontSize: "12px", color: "#03031d" }}>#{selectedContender.rank} in Nigeria</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Consistency Streak:</span>
              <strong style={{ fontSize: "12px", color: "#ea580c" }}>{selectedContender.consistencyStreakDays} Days</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Quiz Accuracy:</span>
              <strong style={{ fontSize: "12px", color: "#2563eb" }}>{selectedContender.quizAccuracyPercent}%</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "4px" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>Simulation ROI:</span>
              <strong style={{ fontSize: "12px", color: "#16a34a" }}>+{selectedContender.simulationRoiPercent}%</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#fefce8", border: "1px solid #fef08a", borderRadius: "4px" }}>
              <span style={{ fontSize: "12px", color: "#854d0e", fontWeight: 700 }}>Ballon d'Or Score:</span>
              <strong style={{ fontSize: "13px", color: "#854d0e" }}>{selectedContender.compositeScore} / 100</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

