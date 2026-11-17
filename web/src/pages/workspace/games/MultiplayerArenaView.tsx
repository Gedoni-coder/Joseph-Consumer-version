import { useState, useEffect } from "react";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface MultiplayerArenaViewProps {
  userBalanceXp: number;
  onAwardXp: (xp: number, label: string) => void;
}

interface LobbyPlayer {
  id: string;
  name: string;
  team: string;
  avatar: string;
  score: number;
  isUser?: boolean;
}

const ARENA_QUESTIONS = [
  {
    q: "If Dangote Cement declares a ₦30 dividend per share and the stock is trading at ₦600, what is the dividend yield?",
    options: ["5.0%", "20.0%", "2.5%", "15.0%"],
    correctIndex: 0,
    explanation: "₦30 / ₦600 = 5.0% annualized cash return per share.",
  },
  {
    q: "Why do investors rush to Nigerian 364-day Treasury Bills when inflation is elevated above 30%?",
    options: [
      "To lock in risk-free sovereign coupon yield and preserve capital",
      "Because T-Bills grant corporate voting rights",
      "Because T-Bills can be converted into physical gold",
      "T-Bills are exempt from all currency fluctuations",
    ],
    correctIndex: 0,
    explanation: "Treasury Bills are 100% sovereign-backed, offering guaranteed yield with zero default risk.",
  },
  {
    q: "In zero-based budgeting, what should your remaining unallocated balance equal at month-end?",
    options: ["Exactly ₦0", "At least ₦50,000", "10% of gross earnings", "Any negative amount"],
    correctIndex: 0,
    explanation: "Every single Naira must have a specific designated assignment (Expenses + Savings + Investment = Total Income).",
  },
];

export function MultiplayerArenaView({ onAwardXp }: MultiplayerArenaViewProps) {
  // Arena State: 'idle' | 'searching' | 'playing' | 'podium'
  const [arenaState, setArenaState] = useState<"idle" | "searching" | "playing" | "podium">("idle");
  const [countdown, setCountdown] = useState(15);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userSelectedOption, setUserSelectedOption] = useState<number | null>(null);

  // Players in live lobby
  const [players, setPlayers] = useState<LobbyPlayer[]>([
    { id: "me", name: "You (Player)", team: "Chelsea FC, Computer Science", avatar: "🧑🏾‍💻", score: 0, isUser: true },
    { id: "p1", name: "Chinedu Okafor", team: "UNILAG Bankers", avatar: "👨🏾‍💼", score: 0 },
    { id: "p2", name: "Zainab Ahmed", team: "ABU Zaria FinTech", avatar: "👩🏾‍🎓", score: 0 },
    { id: "p3", name: "Femi Adeleke", team: "LASU Mech Eng.", avatar: "👨🏾‍🔧", score: 0 },
  ]);

  // Matchmaking Simulation
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (arenaState === "searching") {
      timer = setTimeout(() => {
        setArenaState("playing");
        setCountdown(15);
        setCurrentQuestionIndex(0);
        setUserSelectedOption(null);
        setPlayers([
          { id: "me", name: "You (Player)", team: "Chelsea FC, Computer Science", avatar: "🧑🏾‍💻", score: 0, isUser: true },
          { id: "p1", name: "Chinedu Okafor", team: "UNILAG Bankers", avatar: "👨🏾‍💼", score: 0 },
          { id: "p2", name: "Zainab Ahmed", team: "ABU Zaria FinTech", avatar: "👩🏾‍🎓", score: 0 },
          { id: "p3", name: "Femi Adeleke", team: "LASU Mech Eng.", avatar: "👨🏾‍🔧", score: 0 },
        ]);
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [arenaState]);

  // Question Timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (arenaState === "playing" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (arenaState === "playing" && countdown === 0) {
      handleAdvanceQuestion();
    }
    return () => clearTimeout(timer);
  }, [arenaState, countdown]);

  const handleStartMatchmaking = () => {
    setArenaState("searching");
  };

  const handleSelectOption = (index: number) => {
    if (userSelectedOption !== null) return;
    setUserSelectedOption(index);

    const q = ARENA_QUESTIONS[currentQuestionIndex];
    const isCorrect = index === q.correctIndex;
    const speedBonus = countdown > 8 ? 20 : 10;
    const gainedPoints = isCorrect ? 50 + speedBonus : 0;

    if (isCorrect) {
      triggerXpCelebration(gainedPoints, `Speed Answer (+${speedBonus} Speed Bonus)`);
    }

    // Simulate opponent scores
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.isUser) {
          return { ...p, score: p.score + gainedPoints };
        }
        const oppGained = Math.random() > 0.35 ? 50 + Math.floor(Math.random() * 20) : 0;
        return { ...p, score: p.score + oppGained };
      })
    );
  };

  const handleAdvanceQuestion = () => {
    if (currentQuestionIndex + 1 < ARENA_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCountdown(15);
      setUserSelectedOption(null);
    } else {
      // Game Over -> Podium
      setArenaState("podium");
      const sorted = [...players].sort((a, b) => b.score - a.score);
      const userRank = sorted.findIndex((p) => p.isUser) + 1;
      const award = userRank === 1 ? 50 : userRank === 2 ? 30 : userRank === 3 ? 15 : 5;
      onAwardXp(award, `Multiplayer Arena Finish (${userRank} place)`);
      triggerXpCelebration(award, `Multiplayer Arena Rank #${userRank}`);
    }
  };

  const currentQ = ARENA_QUESTIONS[currentQuestionIndex];
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .arena-header-card {
            padding: 16px 14px !important;
            margin-bottom: 14px !important;
            gap: 12px !important;
          }
          .arena-header-card h2 {
            font-size: 19px !important;
          }
          .arena-idle-box {
            padding: 28px 16px !important;
          }
          .arena-cta-btn {
            width: 100% !important;
            padding: 14px 18px !important;
            min-height: 48px !important;
          }
          .arena-playing-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .arena-question-box {
            padding: 18px 14px !important;
          }
          .arena-question-text {
            font-size: 15px !important;
            margin-bottom: 14px !important;
          }
          .arena-option-btn {
            padding: 12px 14px !important;
            min-height: 48px !important;
            font-size: 12.5px !important;
          }
          .arena-podium-card {
            padding: 24px 14px !important;
          }
          .arena-podium-grid {
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 6px !important;
          }
          .arena-podium-pedestal {
            padding: 14px 6px !important;
          }
          .arena-podium-btn {
            width: 100% !important;
            min-height: 48px !important;
          }
          .arena-live-leaderboard {
            padding: 14px !important;
          }
        }
      `}</style>

      {/* 1. Arena Header Card */}
      <div
        className="arena-header-card"
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
            REAL-TIME MULTIPLAYER • SPEED TRADING ARENA
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
            4-Player Rapid Financial Clash
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
            Compete live against players from rival Nigerian teams in 15-second blitz rounds. Fast answers earn 2x multiplier XP.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #dcfce7",
              borderRadius: "6px",
              padding: "8px 14px",
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
              1st Place Prize
            </span>
            <div style={{ fontSize: "16px", fontWeight: 800, color: "#15803d" }}>
              +50 XP
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Area Based on State */}
      {arenaState === "idle" && (
        <div
          className="arena-idle-box"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "50px 30px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#f0f1f8",
              border: "2px solid #03031d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              margin: "0 auto 20px",
            }}
          >
            ⚡
          </div>
          <h3 style={{ fontSize: "22px", fontWeight: 750, color: "#03031d", margin: "0 0 8px" }}>
            Ready for a Live Financial Showdown?
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "480px", margin: "0 auto 24px", lineHeight: 1.5 }}>
            You will be placed in a live 4-player lobby with players from Lagos, Abuja, and Ibadan. Answer 3 high-speed financial drill questions.
          </p>

          <button
            type="button"
            className="arena-cta-btn"
            onClick={handleStartMatchmaking}
            style={{
              background: "#03031d",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "14px 32px",
              fontSize: "14px",
              fontWeight: 800,
              cursor: "pointer",
              letterSpacing: "0.5px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.2)",
              transition: "transform 0.15s ease",
            }}
          >
            FIND 4-PLAYER MATCH 🚀
          </button>
        </div>
      )}

      {/* 3. Matchmaking Searching Screen */}
      {arenaState === "searching" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "60px 30px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              border: "4px solid #e2e8f0",
              borderTopColor: "#03031d",
              margin: "0 auto 20px",
              animation: "spin 1s linear infinite",
            }}
          />
          <h3 style={{ fontSize: "20px", fontWeight: 750, color: "#03031d", margin: "0 0 6px" }}>
            Scanning Nigerian Universities & Hubs...
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Matching with players from UNILAG, LASU, and ABU Zaria. Kickoff in 2 seconds.
          </p>
        </div>
      )}

      {/* 4. Live Playing Arena */}
      {arenaState === "playing" && (
        <div className="arena-playing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Main Question Box */}
          <div
            className="arena-question-box"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "28px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                ROUND {currentQuestionIndex + 1} OF {ARENA_QUESTIONS.length}
              </span>

              {/* 15s Countdown Pill */}
              <div
                style={{
                  background: countdown <= 5 ? "#fef2f2" : "#f8fafc",
                  border: countdown <= 5 ? "1px solid #fecaca" : "1px solid #e2e8f0",
                  color: countdown <= 5 ? "#dc2626" : "#03031d",
                  borderRadius: "6px",
                  padding: "4px 12px",
                  fontSize: "14px",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>⏱️</span>
                <span>{countdown}s remaining</span>
              </div>
            </div>

            <h3
              className="arena-question-text"
              style={{
                fontSize: "18px",
                fontWeight: 750,
                color: "#03031d",
                margin: "0 0 20px",
                lineHeight: 1.4,
              }}
            >
              {currentQ.q}
            </h3>

            {/* Multiple Choice Options */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = userSelectedOption === idx;
                const isCorrect = idx === currentQ.correctIndex;

                let bg = "#ffffff";
                let border = "1px solid #e2e8f0";
                let textColor = "#03031d";

                if (userSelectedOption !== null) {
                  if (isCorrect) {
                    bg = "#f0fdf4";
                    border = "2px solid #16a34a";
                    textColor = "#15803d";
                  } else if (isSelected) {
                    bg = "#fef2f2";
                    border = "2px solid #dc2626";
                    textColor = "#b91c1c";
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className="arena-option-btn"
                    disabled={userSelectedOption !== null}
                    onClick={() => handleSelectOption(idx)}
                    style={{
                      background: bg,
                      border: border,
                      borderRadius: "6px",
                      padding: "14px 18px",
                      textAlign: "left",
                      fontSize: "13px",
                      fontWeight: 650,
                      color: textColor,
                      cursor: userSelectedOption !== null ? "default" : "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{opt}</span>
                    {userSelectedOption !== null && isCorrect && <span style={{ color: "#16a34a", fontWeight: 800 }}>✓ Correct</span>}
                    {userSelectedOption !== null && isSelected && !isCorrect && <span style={{ color: "#dc2626", fontWeight: 800 }}>✕ Missed</span>}
                  </button>
                );
              })}
            </div>

            {userSelectedOption !== null && (
              <div
                style={{
                  marginTop: "18px",
                  padding: "12px 16px",
                  background: "#f8fafc",
                  borderRadius: "6px",
                  borderLeft: "3px solid #03031d",
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#03031d", textTransform: "uppercase", marginBottom: "2px" }}>
                  Financial Breakdown
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  {currentQ.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Live Leaderboard Desk */}
          <div
            className="arena-live-leaderboard"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "20px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
              height: "fit-content",
            }}
          >
            <div style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "14px" }}>
              Live Match Standings
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {sortedPlayers.map((p, idx) => (
                <div
                  key={p.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    background: p.isUser ? "#f0f1f8" : "#f8fafc",
                    border: p.isUser ? "1px solid #03031d" : "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 800, color: "#03031d", width: "16px" }}>
                      {idx + 1}.
                    </span>
                    <span style={{ fontSize: "16px" }}>{p.avatar}</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 750, color: "#03031d" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b" }}>
                        {p.team}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#03031d" }}>
                    {p.score} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Podium Awards Screen */}
      {arenaState === "podium" && (
        <div
          className="arena-podium-card"
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "40px 30px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "1.2px", color: "#16a34a", textTransform: "uppercase" }}>
            MATCH COMPLETE • EXP EARNED
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: 750, color: "#03031d", margin: "6px 0 20px" }}>
            The Arena Podium
          </h2>

          <div
            className="arena-podium-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              maxWidth: "600px",
              margin: "0 auto 30px",
              alignItems: "end",
            }}
          >
            {/* 2nd Place */}
            <div
              className="arena-podium-pedestal"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "20px 14px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>🥈</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#03031d", wordBreak: "break-word" }}>
                {sortedPlayers[1]?.name}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0" }}>
                {sortedPlayers[1]?.score} pts
              </div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#15803d" }}>+30 XP</span>
            </div>

            {/* 1st Place */}
            <div
              className="arena-podium-pedestal"
              style={{
                background: "#fefce8",
                border: "2px solid #eab308",
                borderRadius: "8px",
                padding: "26px 16px",
                transform: "translateY(-8px)",
                boxShadow: "0 6px 20px rgba(234, 179, 8, 0.2)",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "6px" }}>👑 🥇</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#03031d", wordBreak: "break-word" }}>
                {sortedPlayers[0]?.name}
              </div>
              <div style={{ fontSize: "12px", color: "#854d0e", margin: "4px 0" }}>
                {sortedPlayers[0]?.score} pts
              </div>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#15803d" }}>+50 XP</span>
            </div>

            {/* 3rd Place */}
            <div
              className="arena-podium-pedestal"
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px 12px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>🥉</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#03031d", wordBreak: "break-word" }}>
                {sortedPlayers[2]?.name}
              </div>
              <div style={{ fontSize: "11px", color: "#64748b", margin: "4px 0" }}>
                {sortedPlayers[2]?.score} pts
              </div>
              <span style={{ fontSize: "11px", fontWeight: 800, color: "#15803d" }}>+15 XP</span>
            </div>
          </div>

          <button
            type="button"
            className="arena-podium-btn"
            onClick={() => setArenaState("idle")}
            style={{
              background: "#03031d",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "14px 28px",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            PLAY ANOTHER ROUND →
          </button>
        </div>
      )}
    </div>
  );
}
