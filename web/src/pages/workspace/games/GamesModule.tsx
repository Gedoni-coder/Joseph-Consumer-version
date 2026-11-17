import { useState } from "react";
import { TournamentCalendarBar, type TournamentTier } from "./TournamentCalendarBar";
import { WagerDuelsView } from "./WagerDuelsView";
import { MultiplayerArenaView } from "./MultiplayerArenaView";
import { TeamVsTeamView } from "./TeamVsTeamView";
import { PyramidStandingsView } from "./PyramidStandingsView";
import { BallonDorShowcaseView } from "./BallonDorShowcaseView";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export type GamesTab = "duels" | "arena" | "team" | "standings" | "ballondor";

export function GamesModule() {
  const [selectedTournamentTier, setSelectedTournamentTier] = useState<TournamentTier>("premier");
  const [activeTab, setActiveTab] = useState<GamesTab>("duels");

  // Player & Team Live Stats
  const [userWeeklyXp, setUserWeeklyXp] = useState(390);
  const [teamWeeklyXp, setTeamWeeklyXp] = useState(1680);
  const teamRank = 1;
  const streakDays = 14;

  const handleAwardXp = (xp: number, label: string) => {
    setUserWeeklyXp((prev) => prev + xp);
    setTeamWeeklyXp((prev) => prev + xp);
    triggerXpCelebration(xp, label);
  };

  const TABS: { id: GamesTab; name: string; icon: string; badge?: string }[] = [
    { id: "duels", name: "1v1 Wager Duels", icon: "⚔️", badge: "Stakes" },
    { id: "arena", name: "Multiplayer Arena", icon: "👥", badge: "Live" },
    { id: "team", name: "Team vs Team", icon: "🛡️", badge: "Schedule match" },
    { id: "standings", name: "League Standings & Squad", icon: "🏆", badge: "#1 Lagos" },
    { id: "ballondor", name: "Ballon d'Or", icon: "🏅", badge: "Every 2 Mos" },
  ];

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
      <style>{`
        @media (max-width: 768px) {
          .games-header {
            padding: 10px 14px !important;
            gap: 10px !important;
          }
          .games-title-h1 {
            font-size: 15px !important;
          }
          .games-stats-wrap {
            gap: 6px !important;
            width: 100% !important;
            justify-content: space-between !important;
          }
          .games-stats-badge {
            padding: 4px 8px !important;
            flex: 1 !important;
            justify-content: center !important;
          }
          .games-nav {
            padding: 8px 10px !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 6px !important;
            overflow-x: visible !important;
            white-space: normal !important;
          }
          .games-nav-btn {
            padding: 9px 8px !important;
            font-size: 11.5px !important;
            min-height: 44px !important;
            justify-content: center !important;
            text-align: center !important;
            flex-shrink: 1 !important;
            white-space: normal !important;
          }
          .games-nav-btn:last-child {
            grid-column: span 2 !important;
          }
          .games-canvas {
            padding: 14px 10px 80px !important;
          }
        }
      `}</style>

      {/* 1. Header Status HUD */}
      <header
        className="games-header"
        style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          background: "#03031d",
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          position: "sticky",
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
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
            🎮
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#60a5fa", letterSpacing: "1px", textTransform: "uppercase" }}>
                MODULE V • THE ARENA & TOURNAMENTS
              </span>
              <span style={{ fontSize: "10px", background: "#fef3c7", color: "#92400e", padding: "1px 6px", borderRadius: "3px", fontWeight: 800 }}>
                SEASON 1
              </span>
            </div>
            <h1 className="games-title-h1" style={{ fontSize: "18px", fontWeight: 750, color: "#ffffff", margin: "2px 0 0" }}>
              Multiplayer Financial Championship
            </h1>
          </div>
        </div>

        {/* User Running Stats Badges */}
        <div className="games-stats-wrap" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            className="games-stats-badge"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "6px",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🔥</span>
            <div>
              <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>Streak</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>{streakDays} Days</div>
            </div>
          </div>

          <div
            className="games-stats-badge"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "6px",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "14px" }}>⚡</span>
            <div>
              <div style={{ fontSize: "9px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>Weekly XP</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#4ade80" }}>{userWeeklyXp} XP</div>
            </div>
          </div>

          <div
            className="games-stats-badge"
            style={{
              background: "rgba(37, 99, 235, 0.2)",
              border: "1px solid rgba(59, 130, 246, 0.4)",
              borderRadius: "6px",
              padding: "6px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "14px" }}>🛡️</span>
            <div>
              <div style={{ fontSize: "9px", color: "#93c5fd", textTransform: "uppercase", fontWeight: 800 }}>Team XP</div>
              <div style={{ fontSize: "12px", fontWeight: 800, color: "#ffffff" }}>{teamWeeklyXp} XP</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. TOP SECTION: PREMIER LEAGUE, CHAMPIONS LEAGUE, WORLD CUP (AT THE VERY TOP) */}
      <TournamentCalendarBar
        currentTier={selectedTournamentTier}
        onSelectTier={(tier) => setSelectedTournamentTier(tier)}
        userTeamRank={teamRank}
        userTeamXp={teamWeeklyXp}
      />

      {/* 3. DIRECTLY BELOW: GAME MODES NAVIGATION TABS */}
      <nav
        className="games-nav"
        style={{
          background: "#03031d",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 14px",
          display: "flex",
          justifyContent: "flex-start",
          gap: "8px",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          whiteSpace: "nowrap",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              className="games-nav-btn"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 800,
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#03031d" : "#ffffff",
                border: isActive ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.18)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.15s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    padding: "2px 5px",
                    borderRadius: "3px",
                    background: isActive ? "#03031d" : "rgba(255, 255, 255, 0.2)",
                    color: isActive ? "#ffffff" : "#cbd5e1",
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. MAIN ARENA CONTENT CANVAS (Predominantly White surfaces) */}
      <main className="games-canvas" style={{ flex: 1, background: "#f8fafc", padding: "20px 14px 80px", color: "#03031d" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>
          {/* Sub-View Router */}
          {activeTab === "duels" && (
            <WagerDuelsView
              userBalanceXp={userWeeklyXp}
              onAwardXp={handleAwardXp}
            />
          )}

          {activeTab === "arena" && (
            <MultiplayerArenaView
              userBalanceXp={userWeeklyXp}
              onAwardXp={handleAwardXp}
            />
          )}

          {activeTab === "team" && (
            <TeamVsTeamView />
          )}

          {activeTab === "standings" && (
            <PyramidStandingsView
              userTeamId="team-1"
              onJoinTransferMarket={() => alert("Transfer Market opens at Sunday midnight before Regional Week 2 kickoff!")}
            />
          )}

          {activeTab === "ballondor" && (
            <BallonDorShowcaseView
              userStreakDays={streakDays}
              userQuizAccuracy={92}
              userSimulationRoi={18.5}
            />
          )}
        </div>
      </main>
    </div>
  );
}
