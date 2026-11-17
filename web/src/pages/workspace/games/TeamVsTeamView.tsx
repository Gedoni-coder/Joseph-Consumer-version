import { useState } from "react";
import { SAMPLE_LEAGUE_STANDINGS, type LeagueTeamStanding } from "./tournamentData";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface TeamMatchFixture {
  id: string;
  opponentTeam: LeagueTeamStanding;
  scheduledTime: string;
  stakeXp: number;
  status: "proposed" | "confirmed" | "completed";
  reminderSet: boolean;
  userSquadScore?: number;
  opponentSquadScore?: number;
}

export function TeamVsTeamView() {
  const userTeam = SAMPLE_LEAGUE_STANDINGS[0]; // Chelsea FC, UNILAG
  const rivalTeams = SAMPLE_LEAGUE_STANDINGS.slice(1); // Arsenal FC, Real Madrid, Man City, etc.

  const [selectedRivalId, setSelectedRivalId] = useState<string>(rivalTeams[0].id);
  const [mobileTab, setMobileTab] = useState<"challenge" | "schedule">("challenge");
  const [proposedMatch, setProposedMatch] = useState<TeamMatchFixture | null>(null);
  const [matchSchedule, setMatchSchedule] = useState<TeamMatchFixture[]>([
    {
      id: "match-001",
      opponentTeam: rivalTeams[0], // Arsenal FC, Mechanical Eng. (LASU)
      scheduledTime: "Saturday, 8:00 PM WAT",
      stakeXp: 150,
      status: "confirmed",
      reminderSet: true,
    },
  ]);

  // Live Simulation state
  const [activeLiveMatch, setActiveLiveMatch] = useState<TeamMatchFixture | null>(null);
  const [liveRound, setLiveRound] = useState(1);
  const [myTeamScore, setMyTeamScore] = useState(0);
  const [rivalTeamScore, setRivalTeamScore] = useState(0);
  const [matchOver, setMatchOver] = useState(false);

  // Trigger "Set Match"
  const handleSetMatch = () => {
    const rival = rivalTeams.find((r) => r.id === selectedRivalId) || rivalTeams[0];
    const newProposal: TeamMatchFixture = {
      id: "prop-" + Math.random().toString(36).substring(2, 7),
      opponentTeam: rival,
      scheduledTime: "Tomorrow at 7:00 PM WAT",
      stakeXp: 150,
      status: "proposed",
      reminderSet: false,
    };
    setProposedMatch(newProposal);
    setMobileTab("schedule");
  };

  // Captain clicks "Accept"
  const handleAcceptMatch = () => {
    if (!proposedMatch) return;
    const confirmedMatch: TeamMatchFixture = {
      ...proposedMatch,
      status: "confirmed",
      reminderSet: true,
    };
    setMatchSchedule([confirmedMatch, ...matchSchedule]);
    setProposedMatch(null);
    alert(
      `✅ Match Confirmed!\n\nFixture: ${userTeam.name} vs ${confirmedMatch.opponentTeam.name}\nTime: ${confirmedMatch.scheduledTime}\nStake: +${confirmedMatch.stakeXp} Team XP\n\n🔔 Match Reminder is set! Your 4 teammates have been notified.`
    );
  };

  // Captain clicks "Decline"
  const handleDeclineMatch = () => {
    setProposedMatch(null);
  };

  // Send WhatsApp Match Alert to Squad
  const handleShareWhatsAppMatch = (match: TeamMatchFixture) => {
    const text = encodeURIComponent(
      `🚨 JOSEPH AI SQUAD FIXTURE ALERT! ⚽💸\n\nOur squad *${userTeam.name}* is scheduled to play *${match.opponentTeam.name}* on *${match.scheduledTime}*!\nStake: ${match.stakeXp} Team XP on the line.\n\nAll 5 squad members must check in to defend our #1 Lagos ranking: https://josephai.online/team-match?id=${match.id}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  // Start Live 5v5 Simulation
  const handleStartLiveDerby = (match: TeamMatchFixture) => {
    setActiveLiveMatch(match);
    setLiveRound(1);
    setMyTeamScore(0);
    setRivalTeamScore(0);
    setMatchOver(false);
  };

  const handleAnswerDerbyQuestion = (isCorrect: boolean) => {
    const myGained = isCorrect ? 1 : 0;
    const rivalGained = Math.random() > 0.4 ? 1 : 0;
    const newMyScore = myTeamScore + myGained;
    const newRivalScore = rivalTeamScore + rivalGained;

    setMyTeamScore(newMyScore);
    setRivalTeamScore(newRivalScore);

    if (isCorrect) {
      triggerXpCelebration(25, "Squad Derby Goal Scored! ⚽");
    }

    if (liveRound < 3) {
      setLiveRound((prev) => prev + 1);
    } else {
      setMatchOver(true);
      if (newMyScore > newRivalScore && activeLiveMatch) {
        triggerXpCelebration(activeLiveMatch.stakeXp, "Derby Victory Champions! 🏆");
      }
    }
  };

  return (
    <div
      style={{
        maxWidth: "1080px",
        margin: "0 auto",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        .tvt-mobile-tab-switch {
          display: none;
        }
        @media (max-width: 768px) {
          .tvt-header-card {
            padding: 16px 14px !important;
            margin-bottom: 14px !important;
            gap: 12px !important;
          }
          .tvt-header-card h2 {
            font-size: 19px !important;
          }
          .tvt-squad-badge {
            width: 100% !important;
            text-align: left !important;
            padding: 10px 14px !important;
          }
          .tvt-mobile-tab-switch {
            display: flex !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
            background: #f1f5f9;
            padding: 4px;
            border-radius: 8px;
          }
          .tvt-mobile-tab-btn {
            flex: 1;
            padding: 10px 12px;
            border-radius: 6px;
            border: none;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .tvt-hub-grid {
            display: block !important;
          }
          .tvt-col-challenge {
            padding: 16px 14px !important;
            margin-bottom: 16px !important;
          }
          .tvt-col-schedule {
            gap: 14px !important;
          }
          .tvt-col-challenge.tvt-hidden-mobile,
          .tvt-col-schedule.tvt-hidden-mobile {
            display: none !important;
          }
          .tvt-rival-card {
            min-height: 48px !important;
            padding: 10px 12px !important;
          }
          .tvt-submit-btn {
            min-height: 48px !important;
            font-size: 13px !important;
          }
          .tvt-fixture-card {
            padding: 14px !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .tvt-fixture-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .tvt-fixture-actions button {
            min-height: 44px !important;
            justify-content: center !important;
          }
          .tvt-modal-overlay {
            padding: 12px !important;
          }
          .tvt-modal-box {
            padding: 20px 16px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
          .tvt-modal-actions {
            flex-direction: column !important;
          }
          .tvt-modal-actions button {
            width: 100% !important;
            min-height: 48px !important;
          }
        }
      `}</style>

      {/* 1. Header Banner (Clean White card with Navy accents) */}
      <div
        className="tvt-header-card"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "26px 30px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "1.2px",
                background: "#03031d",
                color: "#ffffff",
                padding: "2px 6px",
                borderRadius: "3px",
                textTransform: "uppercase",
              }}
            >
              5v5 FULL SQUAD CLASH
            </span>
            <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 700 }}>
              • Schedule & Matchmaking Matrix
            </span>
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: 750, color: "#03031d", margin: "2px 0 4px", letterSpacing: "-0.04em" }}>
            Team vs Team Showdown 🛡️⚡
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0, maxWidth: "600px" }}>
            Full squads compete head-to-head. Pick an opponent, set a match time, accept the challenge, and receive automatic reminder alerts before kickoff.
          </p>
        </div>

        {/* Your Active Squad Card */}
        <div
          className="tvt-squad-badge"
          style={{
            background: "#f0f1f8",
            border: "1px solid #cbd5e1",
            borderRadius: "6px",
            padding: "12px 18px",
            textAlign: "right",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#475569", textTransform: "uppercase" }}>
            YOUR SQUAD (CAPTAIN VIEW)
          </span>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d", marginTop: "2px" }}>
            {userTeam.name}
          </div>
          <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
            Rank #1 in Lagos • 1,680 XP
          </span>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="tvt-mobile-tab-switch">
        <button
          type="button"
          className="tvt-mobile-tab-btn"
          style={{
            background: mobileTab === "challenge" ? "#03031d" : "transparent",
            color: mobileTab === "challenge" ? "#ffffff" : "#64748b",
          }}
          onClick={() => setMobileTab("challenge")}
        >
          ⚔️ Challenge Rivals
        </button>
        <button
          type="button"
          className="tvt-mobile-tab-btn"
          style={{
            background: mobileTab === "schedule" ? "#03031d" : "transparent",
            color: mobileTab === "schedule" ? "#ffffff" : "#64748b",
          }}
          onClick={() => setMobileTab("schedule")}
        >
          📅 Fixtures ({matchSchedule.length}) {proposedMatch && "• 🔔 1"}
        </button>
      </div>

      {/* 2. Main Two-Column Hub: Set Match Form vs. Scheduled Fixtures */}
      <div
        className="tvt-hub-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "24px", alignItems: "start" }}
      >
        {/* Left Column: Set Match Dispatch Desk */}
        <div
          className={`tvt-col-challenge ${mobileTab !== "challenge" ? "tvt-hidden-mobile" : ""}`}
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase", letterSpacing: "1px" }}>
            CHALLENGE AN OPPONENT SQUAD
          </span>
          <h3 style={{ fontSize: "18px", fontWeight: 750, color: "#03031d", margin: "4px 0 14px" }}>
            Set a Match Fixture
          </h3>

          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 18px", lineHeight: 1.5 }}>
            Select an institutional rival from the Lagos State Premier League to arrange an official 5v5 fixture:
          </p>

          {/* Opponent Selection List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {rivalTeams.map((team) => {
              const isSelected = team.id === selectedRivalId;

              return (
                <div
                  key={team.id}
                  className="tvt-rival-card"
                  onClick={() => setSelectedRivalId(team.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "6px",
                    background: isSelected ? "#f0f1f8" : "#ffffff",
                    border: isSelected ? "2px solid #03031d" : "1px solid #e2e8f0",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 750, color: "#03031d" }}>
                      {team.name}
                    </div>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>
                      {team.institutionOrCompany} • Rank #{team.rank}
                    </span>
                  </div>

                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#03031d" }}>
                    {team.totalWeeklyXp} XP
                  </span>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="tvt-submit-btn"
            onClick={handleSetMatch}
            style={{
              width: "100%",
              padding: "13px 20px",
              background: "#03031d",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 12px rgba(3, 3, 29, 0.2)",
            }}
          >
            SET MATCH WITH RIVAL →
          </button>
        </div>

        {/* Right Column: Active Schedule Calendar & Proposals */}
        <div
          className={`tvt-col-schedule ${mobileTab !== "schedule" ? "tvt-hidden-mobile" : ""}`}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* System Match Proposal Alert (Accept / Decline) */}
          {proposedMatch && (
            <div
              style={{
                background: "#fefce8",
                border: "2px solid #eab308",
                borderRadius: "8px",
                padding: "24px",
                boxShadow: "0 6px 20px rgba(234, 179, 8, 0.15)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#854d0e", textTransform: "uppercase", letterSpacing: "1px" }}>
                  OFFICIAL FIXTURE PROPOSAL GENERATED
                </span>
                <span style={{ fontSize: "11px", color: "#a16207", fontWeight: 750 }}>
                  Awaiting Captain Confirmation
                </span>
              </div>

              <h4 style={{ fontSize: "18px", fontWeight: 750, color: "#03031d", margin: "0 0 8px" }}>
                {userTeam.name} vs {proposedMatch.opponentTeam.name}
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
                <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #fef08a" }}>
                  <span style={{ fontSize: "10px", color: "#854d0e", textTransform: "uppercase", fontWeight: 750 }}>
                    Proposed Match Time
                  </span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#03031d", marginTop: "2px" }}>
                    ⏱️ {proposedMatch.scheduledTime}
                  </div>
                </div>

                <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #fef08a" }}>
                  <span style={{ fontSize: "10px", color: "#854d0e", textTransform: "uppercase", fontWeight: 750 }}>
                    Team XP Stakes
                  </span>
                  <div style={{ fontSize: "13px", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>
                    ⚡ +{proposedMatch.stakeXp} Team XP
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleAcceptMatch}
                  style={{
                    flex: 1,
                    padding: "12px 18px",
                    background: "#16a34a",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ✓ ACCEPT MATCH & SET REMINDER
                </button>

                <button
                  type="button"
                  onClick={handleDeclineMatch}
                  style={{
                    padding: "12px 18px",
                    background: "#ffffff",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    borderRadius: "4px",
                    fontSize: "13px",
                    fontWeight: 750,
                    cursor: "pointer",
                  }}
                >
                  DECLINE
                </button>
              </div>
            </div>
          )}

          {/* Confirmed Match Schedule List */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px 28px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#03031d", textTransform: "uppercase" }}>
                Confirmed Match Schedules & Fixtures ({matchSchedule.length})
              </span>
              <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 700 }}>
                ● Active Calendar
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {matchSchedule.map((fixture) => (
                <div
                  key={fixture.id}
                  className="tvt-fixture-card"
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "18px 20px",
                    background: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
                        {userTeam.name} vs {fixture.opponentTeam.name}
                      </span>
                      {fixture.reminderSet && (
                        <span style={{ fontSize: "10px", background: "#f0fdf4", color: "#16a34a", padding: "2px 6px", borderRadius: "3px", fontWeight: 800 }}>
                          🔔 REMINDER SET
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      📅 <strong>{fixture.scheduledTime}</strong> • Stake: +{fixture.stakeXp} Team XP
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="tvt-fixture-actions" style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppMatch(fixture)}
                      style={{
                        padding: "8px 14px",
                        background: "#25d366",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>💬</span> Alert Squad
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartLiveDerby(fixture)}
                      style={{
                        padding: "8px 14px",
                        background: "#03031d",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      START LIVE DERBY ⚽
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Live 5v5 Derby Showdown Modal */}
      {activeLiveMatch && (
        <div
          className="tvt-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 3, 29, 0.8)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            className="tvt-modal-box"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "32px",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 10px 40px rgba(3, 3, 29, 0.3)",
              fontFamily: '"Manrope Variable", -apple-system, sans-serif',
            }}
          >
            {/* Scoreboard Header */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                LIVE 5v5 FINANCIAL DERBY • ROUND {liveRound} OF 3
              </span>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#03031d", margin: "6px 0 12px" }}>
                {userTeam.name} vs {activeLiveMatch.opponentTeam.name}
              </h3>

              {/* Big Score Counter */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "24px",
                  fontSize: "36px",
                  fontWeight: 900,
                  color: "#03031d",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Your Squad</div>
                  <div>{myTeamScore}</div>
                </div>
                <div style={{ color: "#94a3b8" }}>:</div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>Rival Squad</div>
                  <div>{rivalTeamScore}</div>
                </div>
              </div>
            </div>

            {!matchOver ? (
              <div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    padding: "16px 20px",
                    marginBottom: "20px",
                  }}
                >
                  <p style={{ margin: "0 0 6px", fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                    Squad Drill Question:
                  </p>
                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#03031d", lineHeight: 1.5 }}>
                    {liveRound === 1 && "Which government security is sovereign-backed with zero legal default risk in Nigeria?"}
                    {liveRound === 2 && "If Zenith Bank shares trade at ₦40 with a ₦4 dividend, what is the dividend yield?"}
                    {liveRound === 3 && "Does expanding Dangote Cement factories increase or dissolve shareholder asset value?"}
                  </p>
                </div>

                <div className="tvt-modal-actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleAnswerDerbyQuestion(true)}
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
                    ✓ Correct Financial Logic (+Goal)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAnswerDerbyQuestion(false)}
                    style={{
                      padding: "12px 20px",
                      background: "#f1f5f9",
                      color: "#64748b",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Missed Logic
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "40px", marginBottom: "8px" }}>
                  {myTeamScore > rivalTeamScore ? "🏆" : myTeamScore < rivalTeamScore ? "💔" : "🤝"}
                </div>
                <h4 style={{ fontSize: "20px", fontWeight: 800, color: "#03031d", margin: "0 0 6px" }}>
                  {myTeamScore > rivalTeamScore ? "Derby Victory!" : myTeamScore < rivalTeamScore ? "Derby Defeat" : "Honorable Draw"}
                </h4>
                <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 20px" }}>
                  {myTeamScore > rivalTeamScore
                    ? `Congratulations! Your squad won +${activeLiveMatch.stakeXp} Team XP!`
                    : "Good battle! Refine your tactics for the next scheduled derby."}
                </p>

                <button
                  type="button"
                  onClick={() => setActiveLiveMatch(null)}
                  style={{
                    background: "#03031d",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "14px 28px",
                    fontSize: "13px",
                    fontWeight: 800,
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  CLOSE DERBY & RETURN TO SCHEDULE
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

