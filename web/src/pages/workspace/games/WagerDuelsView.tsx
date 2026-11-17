import { useState, useEffect } from "react";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface WagerDuelsViewProps {
  userBalanceXp: number;
  onAwardXp: (xp: number, label: string) => void;
}

interface OpponentProfile {
  id: string;
  name: string;
  team: string;
  avatar: string;
  streak: number;
}

const SAMPLE_OPPONENTS: OpponentProfile[] = [
  { id: "opp-1", name: "Babatunde Adeleke", team: "UNILAG Bankers", avatar: "👨🏾‍💼", streak: 14 },
  { id: "opp-2", name: "Amina Yusuf", team: "ABU Zaria FinTech", avatar: "👩🏾‍🎓", streak: 12 },
  { id: "opp-3", name: "Chidi Nnamdi", team: "LASU Mechanical", avatar: "👨🏾‍💻", streak: 9 },
  { id: "opp-4", name: "Funke Balogun", team: "YabaTech Designers", avatar: "👩🏾‍💼", streak: 16 },
];

const DUEL_QUESTIONS = [
  {
    q: "Which NGX financial metric measures how much profit a company returns relative to its current share price?",
    options: ["Dividend Yield", "Debt-to-Equity Ratio", "Current Ratio", "Beta Co-efficient"],
    correctIndex: 0,
    explanation: "Dividend Yield = (Annual Dividend per share / Current Share Price) × 100%.",
  },
  {
    q: "If the Central Bank of Nigeria (CBN) raises the Monetary Policy Rate (MPR) by 200 bps, what typically happens to Treasury Bill yields?",
    options: ["Yields decline sharply", "Yields rise to match rates", "Yields are abolished", "No impact whatsoever"],
    correctIndex: 1,
    explanation: "Higher policy rates push sovereign debt yields upward across 91-day, 182-day, and 364-day maturities.",
  },
  {
    q: "What is the primary difference between purchasing Dangote Cement corporate commercial paper vs. common shares?",
    options: [
      "Shares pay fixed coupons; paper gets dividends",
      "Paper represents short-term debt; shares represent equity ownership",
      "Both carry identical legal ownership rights",
      "Commercial paper gives shareholder voting rights at the AGM",
    ],
    correctIndex: 1,
    explanation: "Commercial paper is an unsecured short-term debt instrument; common shares represent fractional equity ownership.",
  },
];

export function WagerDuelsView({ userBalanceXp, onAwardXp }: WagerDuelsViewProps) {
  const [stakeAmount, setStakeAmount] = useState<10 | 25 | 50>(25);

  // Wager State: 'idle' | 'searching' | 'playing' | 'result'
  const [wagerState, setWagerState] = useState<"idle" | "searching" | "playing" | "result">("idle");
  const [matchedOpponent, setMatchedOpponent] = useState<OpponentProfile>(SAMPLE_OPPONENTS[0]);

  // WhatsApp Challenge Side state
  const [friendPhone, setFriendPhone] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  // In-Game Countdown Timer (15s per question, just like Multiplayer Arena)
  const [countdown, setCountdown] = useState(15);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userSelectedOption, setUserSelectedOption] = useState<number | null>(null);

  // Scores
  const [userScore, setUserScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);

  // Matchmaking search effect
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (wagerState === "searching") {
      timer = setTimeout(() => {
        const randomOpp = SAMPLE_OPPONENTS[Math.floor(Math.random() * SAMPLE_OPPONENTS.length)];
        setMatchedOpponent(randomOpp);
        setWagerState("playing");
        setCountdown(15);
        setCurrentQuestionIndex(0);
        setUserSelectedOption(null);
        setUserScore(0);
        setOpponentScore(0);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [wagerState]);

  // Question Timer
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (wagerState === "playing" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (wagerState === "playing" && countdown === 0) {
      handleAdvanceDuelQuestion();
    }
    return () => clearTimeout(timer);
  }, [wagerState, countdown]);

  // Start Instant Match (Main action)
  const handleStartInstantDuel = () => {
    if (userBalanceXp < stakeAmount) {
      alert(`Insufficient XP balance! You need at least ${stakeAmount} XP to enter this wager.`);
      return;
    }
    setWagerState("searching");
  };

  // WhatsApp Side Action
  const handleCreateWhatsAppChallenge = () => {
    const matchId = "duel-" + Math.random().toString(36).substring(2, 7);
    const duelUrl = `https://josephai.online/duel?match=${matchId}&stake=${stakeAmount}`;
    const text = encodeURIComponent(
      `Yo! ⚽💸 I just put ${stakeAmount} XP on the line on JOSEPH AI. Think you can beat me on Nigerian stocks and T-Bills? Tap here to accept my 1v1 Wager Duel: ${duelUrl}`
    );

    const targetUrl = friendPhone.trim()
      ? `https://api.whatsapp.com/send?phone=${friendPhone.replace(/\s+/g, "")}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;

    window.open(targetUrl, "_blank");
  };

  const handleCopyDuelLink = () => {
    const matchId = "duel-" + Math.random().toString(36).substring(2, 7);
    navigator.clipboard.writeText(`https://josephai.online/duel?match=${matchId}&stake=${stakeAmount}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Handle Option Selection
  const handleSelectOption = (index: number) => {
    if (userSelectedOption !== null) return;
    setUserSelectedOption(index);

    const q = DUEL_QUESTIONS[currentQuestionIndex];
    const isCorrect = index === q.correctIndex;
    const opponentCorrect = Math.random() > 0.35;

    if (isCorrect) {
      triggerXpCelebration(25, "1v1 Duel Quick Strike!");
    }

    const nextUser = isCorrect ? userScore + 50 : userScore;
    const nextOpp = opponentCorrect ? opponentScore + 50 : opponentScore;

    setUserScore(nextUser);
    setOpponentScore(nextOpp);
  };

  // Advance to Next Question or Showdown Result
  const handleAdvanceDuelQuestion = () => {
    if (currentQuestionIndex + 1 < DUEL_QUESTIONS.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCountdown(15);
      setUserSelectedOption(null);
    } else {
      // Duel Complete -> Result
      setWagerState("result");
      if (userScore > opponentScore) {
        onAwardXp(stakeAmount * 2, `1v1 Wager Duel Victory vs ${matchedOpponent.name}!`);
      } else if (userScore < opponentScore) {
        onAwardXp(-stakeAmount, `1v1 Wager Duel Defeat vs ${matchedOpponent.name}.`);
      }
    }
  };

  const currentQ = DUEL_QUESTIONS[currentQuestionIndex];

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
          .wager-header-card {
            padding: 16px 14px !important;
            margin-bottom: 16px !important;
            gap: 12px !important;
          }
          .wager-header-h2 {
            font-size: 20px !important;
          }
          .wager-stake-chips {
            width: 100% !important;
            justifyContent: space-between !important;
          }
          .wager-idle-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .wager-idle-card {
            padding: 24px 16px !important;
          }
          .wager-playing-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }
          .wager-question-box {
            padding: 18px 14px !important;
          }
          .wager-option-btn {
            padding: 12px 14px !important;
            font-size: 12.5px !important;
            min-height: 48px !important;
          }
          .wager-cta-btn {
            width: 100% !important;
            min-height: 48px !important;
          }
        }
      `}</style>

      {/* 1. Stable Header Card (Matches Multiplayer Arena Structure) */}
      <div
        className="wager-header-card"
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
            PEER-TO-PEER MARKET ARENA • 1v1 HEAD-TO-HEAD
          </span>
          <h2
            className="wager-header-h2"
            style={{
              fontSize: "24px",
              fontWeight: 750,
              color: "#03031d",
              margin: "4px 0 0",
              letterSpacing: "-0.04em",
            }}
          >
            1v1 Wager Duel Arena ⚔️
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0" }}>
            Challenge an active contender across Nigeria or challenge friends via WhatsApp. Winner takes the full XP pot.
          </p>
        </div>

        {/* Stake Selector Chips on Header */}
        <div className="wager-stake-chips" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {([10, 25, 50] as const).map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={wagerState !== "idle"}
              onClick={() => setStakeAmount(amount)}
              style={{
                padding: "8px 14px",
                borderRadius: "4px",
                border: stakeAmount === amount ? "2px solid #03031d" : "1px solid #cbd5e1",
                background: stakeAmount === amount ? "#03031d" : "#ffffff",
                color: stakeAmount === amount ? "#ffffff" : "#03031d",
                fontSize: "12px",
                fontWeight: 800,
                cursor: wagerState !== "idle" ? "default" : "pointer",
                transition: "all 0.15s ease",
              }}
            >
              ⚡ {amount} XP
            </button>
          ))}
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #dcfce7",
              borderRadius: "4px",
              padding: "8px 14px",
              textAlign: "right",
            }}
          >
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#166534", textTransform: "uppercase" }}>
              Winner Pot
            </span>
            <div style={{ fontSize: "15px", fontWeight: 800, color: "#15803d" }}>
              +{stakeAmount * 2} XP
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Stable Display Based on State */}

      {/* IDLE STATE: Grounded Main 1v1 Action with WhatsApp Side Desk */}
      {wagerState === "idle" && (
        <div className="wager-idle-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Main Action: Set 1v1 Instantly */}
          <div
            className="wager-idle-card"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "40px 30px",
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
                margin: "0 auto 16px",
              }}
            >
              ⚔️
            </div>
            <h3 style={{ fontSize: "22px", fontWeight: 750, color: "#03031d", margin: "0 0 8px" }}>
              Ready for an Instant 1v1 Duel?
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b", maxWidth: "420px", margin: "0 auto 24px", lineHeight: 1.5 }}>
              Match instantly with another Nigerian contender staking <strong>{stakeAmount} XP</strong>. Answer 3 rapid-fire questions to take the <strong>+{stakeAmount * 2} XP</strong> winner pot!
            </p>

            <button
              type="button"
              className="wager-cta-btn"
              onClick={handleStartInstantDuel}
              style={{
                background: "#24248f",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "16px 36px",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: "0.5px",
                boxShadow: "0 4px 0 #11115c",
                transition: "all 0.12s ease",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <img
                src="/brand/dove-transparent-white.png"
                alt=""
                style={{ width: "20px", height: "20px", objectFit: "contain" }}
              />
              <span>SET 1v1 INSTANTLY ⚔️</span>
            </button>
          </div>

          {/* Side Alternative: WhatsApp Desk */}
          <aside
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "24px 20px",
              boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px" }}>💬</span>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "1px" }}>
                SIDE ALTERNATIVE
              </span>
            </div>

            <h4 style={{ fontSize: "16px", fontWeight: 750, color: "#03031d", margin: "0 0 8px" }}>
              Set Duel via WhatsApp
            </h4>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
              Send an instant challenge link directly to your WhatsApp friends or groups:
            </p>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "10px", fontWeight: 750, color: "#03031d", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                Friend's Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="08012345678"
                value={friendPhone}
                onChange={(e) => setFriendPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "4px",
                  border: "1px solid #cbd5e1",
                  fontSize: "13px",
                  fontWeight: 650,
                  color: "#03031d",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleCreateWhatsAppChallenge}
              style={{
                width: "100%",
                padding: "11px 16px",
                background: "#25d366",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "8px",
              }}
            >
              <span>💬</span> Send WhatsApp Wager
            </button>

            <button
              type="button"
              onClick={handleCopyDuelLink}
              style={{
                width: "100%",
                padding: "9px 14px",
                background: "#f8fafc",
                color: "#03031d",
                border: "1px solid #cbd5e1",
                borderRadius: "4px",
                fontSize: "11px",
                fontWeight: 750,
                cursor: "pointer",
              }}
            >
              {copiedLink ? "✓ Link Copied!" : "📋 Copy Direct Duel Link"}
            </button>
          </aside>
        </div>
      )}

      {/* SEARCHING RADAR STATE: Stable On-Page Matchmaking Screen */}
      {wagerState === "searching" && (
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
            Scanning Nigerian 1v1 Queue for {stakeAmount} XP Challenger...
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Matching with active contenders from Lagos, Ibadan, and Abuja. Kickoff in 2 seconds.
          </p>
        </div>
      )}

      {/* PLAYING STATE: Stable On-Page 2-Column Duel Arena (Exact Structure as Multiplayer Arena) */}
      {wagerState === "playing" && (
        <div className="wager-playing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          {/* Main Question Box */}
          <div
            className="wager-question-box"
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
                ROUND {currentQuestionIndex + 1} OF {DUEL_QUESTIONS.length} • 1v1 SHOWDOWN
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
                    className="wager-option-btn"
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
                  Financial Logic Breakdown
                </div>
                <div style={{ fontSize: "12px", color: "#475569" }}>
                  {currentQ.explanation}
                </div>
              </div>
            )}
          </div>

          {/* Stable Right Column: Live 1v1 Scoreboard Desk */}
          <div
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
              Live 1v1 Scoreboard
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* You */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "6px",
                  background: "#f0f1f8",
                  border: "1px solid #03031d",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🧑🏾‍💻</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#03031d" }}>You (Player)</div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>Chelsea FC • Lagos</div>
                  </div>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#03031d" }}>{userScore} pts</span>
              </div>

              <div style={{ textAlign: "center", fontSize: "11px", fontWeight: 800, color: "#94a3b8" }}>
                VS
              </div>

              {/* Matched Opponent */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "6px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "20px" }}>{matchedOpponent.avatar}</span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 750, color: "#03031d" }}>{matchedOpponent.name}</div>
                    <div style={{ fontSize: "10px", color: "#64748b" }}>{matchedOpponent.team}</div>
                  </div>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 900, color: "#03031d" }}>{opponentScore} pts</span>
              </div>
            </div>

            {/* Wager Pot Indicator */}
            <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                Wager Pot at Stake
              </span>
              <div style={{ fontSize: "18px", fontWeight: 900, color: "#16a34a", marginTop: "2px" }}>
                +{stakeAmount * 2} XP Pool
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULT STATE: Stable On-Page Victory/Defeat Presentation */}
      {wagerState === "result" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "40px 30px",
            textAlign: "center",
            boxShadow: "0 4px 14px rgba(3, 3, 29, 0.04)",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "8px" }}>
            {userScore > opponentScore ? "🏆 👑" : userScore < opponentScore ? "💔" : "🤝"}
          </div>

          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "1.2px",
              color: userScore > opponentScore ? "#16a34a" : "#dc2626",
              textTransform: "uppercase",
            }}
          >
            1v1 WAGER DUEL COMPLETE
          </span>

          <h2 style={{ fontSize: "26px", fontWeight: 750, color: "#03031d", margin: "6px 0 10px" }}>
            {userScore > opponentScore
              ? "Wager Victory!"
              : userScore < opponentScore
              ? "Defeated in Wager"
              : "Honorable Draw"}
          </h2>

          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>
            Final Match Score: You ({userScore} pts) vs {matchedOpponent.name} ({opponentScore} pts)
          </p>

          <div
            style={{
              display: "inline-block",
              padding: "12px 24px",
              borderRadius: "6px",
              background: userScore > opponentScore ? "#f0fdf4" : "#fef2f2",
              border: userScore > opponentScore ? "1px solid #bbf7d0" : "1px solid #fecaca",
              color: userScore > opponentScore ? "#15803d" : "#b91c1c",
              fontSize: "16px",
              fontWeight: 800,
              marginBottom: "28px",
            }}
          >
            {userScore > opponentScore
              ? `Won +${stakeAmount} XP from the Wager Pot!`
              : userScore < opponentScore
              ? `Lost -${stakeAmount} XP to challenger.`
              : "Stakes returned to both wallets."}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setWagerState("idle")}
              style={{
                background: "#03031d",
                color: "#ffffff",
                border: "none",
                borderRadius: "4px",
                padding: "12px 32px",
                fontSize: "13px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              PLAY ANOTHER 1v1 DUEL ⚔️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
