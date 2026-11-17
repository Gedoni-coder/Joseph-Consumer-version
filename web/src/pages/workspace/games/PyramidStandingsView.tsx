import { useState } from "react";
import { SAMPLE_LEAGUE_STANDINGS, type LeagueTeamStanding } from "./tournamentData";

export interface PyramidStandingsViewProps {
  userTeamId?: string;
  onJoinTransferMarket?: () => void;
}

export function PyramidStandingsView({
  userTeamId = "team-1",
  onJoinTransferMarket,
}: PyramidStandingsViewProps) {
  const [activeTab, setActiveTab] = useState<"standings" | "squad">("standings");
  const [standings] = useState<LeagueTeamStanding[]>(SAMPLE_LEAGUE_STANDINGS);

  const userTeam = standings.find((t) => t.id === userTeamId) || standings[0];

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        .pyramid-mobile-list {
          display: none;
        }
        .pyramid-desktop-table {
          display: block;
        }
        @media (max-width: 768px) {
          .pyramid-header-card {
            padding: 16px 14px !important;
            margin-bottom: 14px !important;
            gap: 12px !important;
          }
          .pyramid-header-card h2 {
            font-size: 19px !important;
          }
          .pyramid-tab-group {
            width: 100% !important;
            display: flex !important;
            gap: 6px !important;
          }
          .pyramid-tab-btn {
            flex: 1 !important;
            min-height: 44px !important;
            padding: 10px 12px !important;
            font-size: 13px !important;
          }
          .pyramid-desktop-table {
            display: none !important;
          }
          .pyramid-mobile-list {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            padding: 12px !important;
          }
          .pyramid-mobile-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 14px;
            box-shadow: 0 2px 8px rgba(3, 3, 29, 0.03);
            transition: all 0.15s ease;
          }
          .pyramid-mobile-card.is-user {
            background: #f0fdf4 !important;
            border-color: #86efac !important;
          }
          .pyramid-mobile-cutoff {
            background: #16a34a;
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-align: center;
            margin: 4px 0;
            box-shadow: 0 2px 8px rgba(22, 163, 74, 0.25);
          }
          .pyramid-roster-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
          .pyramid-roster-card {
            padding: 16px 14px !important;
          }
          .pyramid-transfer-btn {
            min-height: 48px !important;
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* 1. Header Banner */}
      <div
        className="pyramid-header-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "24px 28px",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1.2px",
              color: "#03031d",
              textTransform: "uppercase",
            }}
          >
            WEEK 1 BASE POOL • LAGOS STATE PREMIER LEAGUE
          </span>
          <h2
            style={{
              fontSize: "24px",
              fontWeight: 750,
              color: "#03031d",
              margin: "4px 0 0",
              letterSpacing: "-0.04em",
            }}
          >
            Institutional League Standings
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
            The top teams above the green qualification line (1,200 XP cut-off) qualify on Sunday midnight for the South-West Champions League.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="pyramid-tab-group" style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="pyramid-tab-btn"
            onClick={() => setActiveTab("standings")}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 800,
              background: activeTab === "standings" ? "#03031d" : "#f1f5f9",
              color: activeTab === "standings" ? "#ffffff" : "#64748b",
              border: "none",
              cursor: "pointer",
            }}
          >
            🏆 League Table
          </button>
          <button
            type="button"
            className="pyramid-tab-btn"
            onClick={() => setActiveTab("squad")}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 800,
              background: activeTab === "squad" ? "#03031d" : "#f1f5f9",
              color: activeTab === "squad" ? "#ffffff" : "#64748b",
              border: "none",
              cursor: "pointer",
            }}
          >
            🛡️ My Squad Roster
          </button>
        </div>
      </div>

      {/* 2. League Table View */}
      {activeTab === "standings" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          {/* Desktop Table View */}
          <div className="pyramid-desktop-table">
            <div
              style={{
                padding: "6px 14px",
                background: "#f1f5f9",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "11px",
                color: "#64748b",
                fontWeight: 700,
              }}
            >
              <span>State Division Table</span>
              <span>Official Institutional Rankings</span>
            </div>

            <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
              <div style={{ minWidth: "580px" }}>
                {/* Table Header */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "50px 1fr 140px 90px 120px",
                    padding: "14px 20px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>Rank</span>
                  <span>Team & Institution</span>
                  <span style={{ textAlign: "center" }}>Squad Roster</span>
                  <span style={{ textAlign: "center" }}>Streak</span>
                  <span style={{ textAlign: "right" }}>Weekly XP</span>
                </div>

                {/* Table Rows */}
                <div>
                  {standings.map((team, index) => {
                    const isUserTeam = team.id === userTeamId;
                    const isLastPromoted = index === 3; // 4th place is the cutoff border

                    return (
                      <div key={team.id}>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "50px 1fr 140px 90px 120px",
                            padding: "16px 20px",
                            alignItems: "center",
                            background: isUserTeam ? "#f0fdf4" : index % 2 === 0 ? "#ffffff" : "#fafafa",
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background 0.15s ease",
                          }}
                        >
                          {/* Rank */}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                fontSize: "13px",
                                fontWeight: 800,
                                color: index < 3 ? "#03031d" : "#64748b",
                              }}
                            >
                              {team.rank}
                            </span>
                            {index === 0 && <span style={{ fontSize: "12px" }}>👑</span>}
                          </div>

                          {/* Team & Institution */}
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "14px", fontWeight: 750, color: "#03031d" }}>
                                {team.name}
                              </span>
                              {isUserTeam && (
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: 800,
                                    background: "#03031d",
                                    color: "#ffffff",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    textTransform: "uppercase",
                                  }}
                                >
                                  YOUR TEAM
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "12px", color: "#64748b" }}>
                              {team.institutionOrCompany} • {team.state} State
                            </span>
                          </div>

                          {/* Members Count */}
                          <div style={{ textAlign: "center", fontSize: "12px", color: "#475569", fontWeight: 600 }}>
                            👥 {team.membersCount} / 5 Teammates
                          </div>

                          {/* Streak */}
                          <div style={{ textAlign: "center", fontSize: "12px", fontWeight: 750, color: "#ea580c" }}>
                            🔥 {team.streakDays}d
                          </div>

                          {/* Total Weekly XP */}
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
                              {team.totalWeeklyXp.toLocaleString()} XP
                            </div>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                color: team.isPromotionZone ? "#16a34a" : "#dc2626",
                              }}
                            >
                              {team.isPromotionZone ? "✓ Champions Zone" : "Relegation Zone"}
                            </span>
                          </div>
                        </div>

                        {/* Promotion Line Divider */}
                        {isLastPromoted && (
                          <div
                            style={{
                              background: "#16a34a",
                              color: "#ffffff",
                              padding: "6px 20px",
                              fontSize: "11px",
                              fontWeight: 800,
                              letterSpacing: "0.8px",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>▲ PROMOTION LINE: TOP TEAMS ADVANCE TO REGIONAL CHAMPIONS LEAGUE</span>
                            <span>CUT-OFF: 1,200 XP</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Native Card List */}
          <div className="pyramid-mobile-list">
            {standings.map((team, index) => {
              const isUserTeam = team.id === userTeamId;
              const isLastPromoted = index === 3;

              return (
                <div key={team.id}>
                  <div className={`pyramid-mobile-card ${isUserTeam ? "is-user" : ""}`}>
                    {/* Top Row: Rank & Name + Streak */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 850,
                            background: index === 0 ? "#fef08a" : "#03031d",
                            color: index === 0 ? "#854d0e" : "#ffffff",
                            padding: "3px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {index === 0 ? "👑 #1" : `#${team.rank}`}
                        </span>
                        <span style={{ fontSize: "14.5px", fontWeight: 800, color: "#03031d" }}>
                          {team.name}
                        </span>
                        {isUserTeam && (
                          <span
                            style={{
                              fontSize: "9px",
                              fontWeight: 800,
                              background: "#16a34a",
                              color: "#ffffff",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                            }}
                          >
                            YOU
                          </span>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          color: "#ea580c",
                          background: "#fff7ed",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          border: "1px solid #ffedd5",
                          flexShrink: 0,
                        }}
                      >
                        🔥 {team.streakDays}d
                      </span>
                    </div>

                    {/* Subtitle: Institution & State */}
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>
                      {team.institutionOrCompany} • {team.state} State
                    </div>

                    {/* Bottom Row: Squad Size + Total XP & Status Pill */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "10px",
                        borderTop: "1px solid #f1f5f9",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#475569", fontWeight: 650 }}>
                        👥 {team.membersCount}/5 Squad
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: team.isPromotionZone ? "#f0fdf4" : "#fef2f2",
                            color: team.isPromotionZone ? "#166534" : "#991b1b",
                            border: `1px solid ${team.isPromotionZone ? "#bbf7d0" : "#fecaca"}`,
                          }}
                        >
                          {team.isPromotionZone ? "✓ Promoted" : "Relegation"}
                        </span>
                        <span style={{ fontSize: "14px", fontWeight: 850, color: "#03031d" }}>
                          {team.totalWeeklyXp.toLocaleString()} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cutoff Line between Top 4 and lower */}
                  {isLastPromoted && (
                    <div className="pyramid-mobile-cutoff">
                      ▲ PROMOTION CUT-OFF: TOP 4 ADVANCE (1,200 XP)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Squad Roster Desk View */}
      {activeTab === "squad" && (
        <div className="pyramid-roster-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {/* Squad Members Card */}
          <div
            className="pyramid-roster-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px 28px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 750, color: "#03031d", margin: 0 }}>
                  {userTeam.name}
                </h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  {userTeam.institutionOrCompany} • Ranked #{userTeam.rank} in Lagos
                </span>
              </div>

              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #dcfce7",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#166534",
                }}
              >
                ⚡ {userTeam.totalWeeklyXp} Team XP
              </div>
            </div>

            {/* Teammates List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { name: "You (Player)", role: "Captain", xp: 390, streak: 14, avatar: "🧑🏾‍💻", isCaptain: true },
                { name: "Adebayo Salami", role: "Vice Captain", xp: 360, streak: 14, avatar: "👨🏾‍💼", isCaptain: false },
                { name: "Chioma Nwosu", role: "Portfolio Analyst", xp: 340, streak: 12, avatar: "👩🏾‍💼", isCaptain: false },
                { name: "Ibrahim Bello", role: "Macro Researcher", xp: 310, streak: 10, avatar: "👨🏾‍🎓", isCaptain: false },
                { name: "Fatima Aliyu", role: "Budget Strategist", xp: 280, streak: 9, avatar: "👩🏾‍💻", isCaptain: false },
              ].map((member, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: member.isCaptain ? "#f0f1f8" : "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{member.avatar}</span>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 750, color: "#03031d" }}>
                        {member.name} {member.isCaptain && <span style={{ color: "#2563eb", fontSize: "11px" }}>★ CAPTAIN</span>}
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        {member.role} • 🔥 {member.streak}d streak
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, color: "#03031d" }}>
                      +{member.xp} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Market Side Desk */}
          <div
            className="pyramid-roster-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px 20px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
              height: "fit-content",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
              WEEK 4 TRANSFER WINDOW
            </div>
            <h4 style={{ fontSize: "16px", fontWeight: 750, color: "#03031d", margin: "0 0 8px" }}>
              Transfer Market Open
            </h4>
            <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, margin: "0 0 16px" }}>
              Want to sign higher-XP free agents or transfer to another Nigerian institutional squad before the Champions League kickoff?
            </p>

            <button
              type="button"
              className="pyramid-transfer-btn"
              onClick={onJoinTransferMarket}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "#03031d",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              SEARCH TRANSFER MARKET 🔍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

