import { useState } from "react";

export type TournamentTier = "premier" | "champions" | "worldcup";

export interface TournamentTierNavProps {
  currentTier: TournamentTier;
  onSelectTier: (tier: TournamentTier) => void;
  userTeamRank: number;
  userTeamXp: number;
}

export function TournamentCalendarBar({
  currentTier,
  onSelectTier,
  userTeamRank,
  userTeamXp,
}: TournamentTierNavProps) {
  // Qualification criteria check:
  // Premier League: Always unlocked for state base pool
  // Champions League: Unlocked if rank <= 4 and XP >= 1200
  const isChampionsQualified = userTeamRank <= 4 && userTeamXp >= 1200;
  // World Cup: Unlocked if won Champions League
  const isWorldCupQualified = false;

  const [activeTierView, setActiveTierView] = useState<TournamentTier>(currentTier);

  const TIERS = [
    {
      id: "premier" as TournamentTier,
      weekNumber: "WEEK 1",
      title: "Premier League",
      scope: "State-Level Base Pool (Lagos State)",
      isUnlocked: true,
      statusBadge: "ACTIVE DIVISION • UNLOCKED",
      qualificationText: "Top 4 Teams qualify for Regional Champions League (1,200 XP Cut-off)",
      icon: "⚽",
    },
    {
      id: "champions" as TournamentTier,
      weekNumber: "WEEK 2",
      title: "Champions League",
      scope: "Regional Phase (South-West Zone)",
      isUnlocked: isChampionsQualified,
      statusBadge: isChampionsQualified ? "QUALIFIED • UNLOCKS SUNDAY" : "LOCKED 🔒",
      qualificationText: "Regional Winners advance to the National World Cup Finale",
      icon: "🏆",
    },
    {
      id: "worldcup" as TournamentTier,
      weekNumber: "WEEK 3",
      title: "World Cup",
      scope: "National Finale (Top 32 National Squads)",
      isUnlocked: isWorldCupQualified,
      statusBadge: isWorldCupQualified ? "UNLOCKED" : "LOCKED 🔒",
      qualificationText: "Requires winning the Regional Champions League to enter",
      icon: "🌍",
    },
  ];

  return (
    <div
      className="tournament-bar-container"
      style={{
        background: "#03031d",
        borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
        padding: "20px 28px 16px",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .tournament-bar-container {
            padding: 14px 14px 12px !important;
          }
          .tournament-bar-header {
            margin-bottom: 12px !important;
            gap: 8px !important;
          }
          .tournament-bar-header h2 {
            font-size: 17px !important;
          }
          .tournament-bar-track {
            display: flex !important;
            flex-direction: column !important;
            overflow-x: visible !important;
            gap: 8px !important;
            padding-bottom: 0 !important;
          }
          .tournament-tier-card {
            min-width: 0 !important;
            max-width: none !important;
            width: 100% !important;
            padding: 12px 14px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
        {/* Eyebrow & Status Row */}
        <div className="tournament-bar-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "#24248f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
                boxShadow: "0 2px 8px rgba(36, 36, 143, 0.4)",
              }}
            >
              <img
                src="/brand/dove-transparent-white.png"
                alt="Joseph AI Dove"
                style={{ width: "26px", height: "26px", objectFit: "contain" }}
              />
            </div>
            <div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "1.2px",
                  color: "#60a5fa",
                  textTransform: "uppercase",
                }}
              >
                STAGE-BY-STAGE PROMOTIONAL PYRAMID • SEASON 1
              </span>
              <h2 style={{ fontSize: "20px", fontWeight: 750, color: "#ffffff", margin: "2px 0 0", letterSpacing: "-0.04em" }}>
                The Tournament Promotion Ladder
              </h2>
            </div>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.16)",
              borderRadius: "4px",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "12px" }}>⏱️</span>
            <span style={{ fontSize: "11px", color: "#fef08a", fontWeight: 750 }}>
              Sunday Midnight Cut-off • Qualification Evaluated Live
            </span>
          </div>
        </div>

        {/* 3 Horizontal Tournament Tabs: Premier League, Champions League, World Cup */}
        <div
          className="tournament-bar-track"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "14px",
          }}
        >
          {TIERS.map((tier) => {
            const isSelected = tier.id === activeTierView;

            return (
              <div
                key={tier.id}
                className="tournament-tier-card"
                onClick={() => {
                  setActiveTierView(tier.id);
                  onSelectTier(tier.id);
                }}
                style={{
                  background: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.05)",
                  border: isSelected
                    ? "2px solid #ffffff"
                    : tier.isUnlocked
                    ? "1px solid rgba(255, 255, 255, 0.2)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "8px",
                  padding: "16px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  color: isSelected ? "#03031d" : "#ffffff",
                  boxShadow: isSelected ? "0 6px 20px rgba(0, 0, 0, 0.3)" : "none",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        letterSpacing: "0.8px",
                        textTransform: "uppercase",
                        color: isSelected ? "#2563eb" : "#93c5fd",
                      }}
                    >
                      {tier.weekNumber}
                    </span>

                    <span
                      style={{
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        borderRadius: "3px",
                        textTransform: "uppercase",
                        background: isSelected
                          ? tier.isUnlocked ? "#dcfce7" : "#f1f5f9"
                          : tier.isUnlocked ? "rgba(22, 163, 74, 0.3)" : "rgba(255, 255, 255, 0.1)",
                        color: isSelected
                          ? tier.isUnlocked ? "#15803d" : "#64748b"
                          : tier.isUnlocked ? "#4ade80" : "#94a3b8",
                      }}
                    >
                      {tier.statusBadge}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{tier.icon}</span>
                    <h3
                      style={{
                        fontSize: "17px",
                        fontWeight: 800,
                        margin: 0,
                        letterSpacing: "-0.03em",
                        color: isSelected ? "#03031d" : "#ffffff",
                      }}
                    >
                      {tier.title}
                    </h3>
                  </div>

                  <p
                    style={{
                      fontSize: "11px",
                      margin: "6px 0 0",
                      color: isSelected ? "#64748b" : "#94a3b8",
                      lineHeight: 1.4,
                    }}
                  >
                    {tier.scope}
                  </p>
                </div>

                <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: isSelected ? "1px solid #f1f5f9" : "1px solid rgba(255, 255, 255, 0.08)" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: isSelected ? (tier.isUnlocked ? "#15803d" : "#64748b") : (tier.isUnlocked ? "#86efac" : "#64748b"),
                    }}
                  >
                    {tier.qualificationText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
