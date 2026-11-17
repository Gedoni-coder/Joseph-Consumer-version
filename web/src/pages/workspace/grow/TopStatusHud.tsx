export interface TopStatusHudProps {
  streakDays: number;
  currentXp: number;
  targetXp: number;
  hearts: number;
  maxHearts?: number;
  instructor: "Joseph" | "Josephine";
  onToggleInstructor: () => void;
  onBackToMap?: () => void;
  showBack?: boolean;
}

export function TopStatusHud({
  streakDays,
  currentXp,
  targetXp,
  hearts,
  maxHearts = 5,
  instructor,
  onToggleInstructor,
  onBackToMap,
  showBack = false,
}: TopStatusHudProps) {
  const xpPercent = Math.min(100, Math.round((currentXp / targetXp) * 100));

  return (
    <header
      className="top-hud-header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        padding: "10px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
        boxShadow: "0 1px 3px rgba(3, 3, 29, 0.05)",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .top-hud-header {
            padding: 8px 10px !important;
            flex-wrap: nowrap !important;
            gap: 6px !important;
          }
          .top-hud-subtitle {
            display: none !important;
          }
          .top-hud-official-badge {
            display: none !important;
          }
          .top-hud-brand-text {
            font-size: 12px !important;
          }
          .top-hud-counters {
            gap: 4px !important;
            flex-wrap: nowrap !important;
          }
          .top-hud-pill {
            padding: 4px 7px !important;
          }
          .top-hud-text-long {
            display: none !important;
          }
          .top-hud-coach-name {
            display: none !important;
          }
          .top-hud-coach-btn {
            padding: 4px 6px !important;
            gap: 4px !important;
          }
        }
      `}</style>

      {/* Left: Brand Identity */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        {showBack ? (
          <button
            type="button"
            onClick={onBackToMap}
            style={{
              background: "#03031d",
              border: "none",
              color: "#ffffff",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 750,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>←</span> Academy Stages
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "#24248f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px",
                boxShadow: "0 2px 6px rgba(36, 36, 143, 0.35)",
                flexShrink: 0,
              }}
            >
              <img
                src="/brand/dove-transparent-white.png"
                alt="Joseph AI Dove"
                style={{ width: "22px", height: "22px", objectFit: "contain" }}
              />
            </div>
            <div>
              <div
                className="top-hud-brand-text"
                style={{
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#03031d",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>JOSEPH ACADEMY</span>
                <span
                  className="top-hud-official-badge"
                  style={{
                    fontSize: "9px",
                    background: "#e8ebff",
                    color: "#24248f",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 800,
                  }}
                >
                  OFFICIAL
                </span>
              </div>
              <span
                className="top-hud-subtitle"
                style={{
                  fontSize: "9px",
                  fontWeight: 750,
                  color: "#64748b",
                  letterSpacing: "0.8px",
                  textTransform: "uppercase",
                }}
              >
                Wealth Progression Ladder • Nigeria
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Center / Right: Status Counters */}
      <div className="top-hud-counters" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        
        {/* 1. Daily Consistency Streak */}
        <div
          className="top-hud-pill"
          title="Daily Learning Consistency Streak"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            background: "#fffbeb",
            border: "1px solid #fef3c7",
            padding: "5px 10px",
            borderRadius: "4px",
          }}
        >
          <span style={{ fontSize: "13px", color: "#f59e0b" }}>🔥</span>
          <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#92400e" }}>
            {streakDays} <span className="top-hud-text-long" style={{ fontSize: "9px", fontWeight: 700, color: "#b45309" }}>DAYS</span>
          </span>
        </div>

        {/* 2. Weekly Tournament XP Score */}
        <div
          className="top-hud-pill"
          title="Weekly XP Progress towards League Promotion"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#f0fdf4",
            border: "1px solid #dcfce7",
            padding: "5px 11px",
            borderRadius: "4px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 800 }}>⚡</span>
          <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#15803d" }}>
            {currentXp} <span className="top-hud-text-long" style={{ fontSize: "10px", color: "#4ade80", fontWeight: 600 }}>/ {targetXp} XP</span>
          </span>
          {/* Subtle Progress Bar (hidden on narrow screens) */}
          <div
            className="top-hud-text-long"
            style={{
              width: "40px",
              height: "4px",
              background: "#bbf7d0",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${xpPercent}%`,
                height: "100%",
                background: "#16a34a",
                borderRadius: "2px",
              }}
            />
          </div>
        </div>

        {/* 3. Mistake Buffer Hearts */}
        <div
          className="top-hud-pill"
          title="Mistake Buffer for Active Lessons"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#fef2f2",
            border: "1px solid #fee2e2",
            padding: "5px 10px",
            borderRadius: "4px",
          }}
        >
          <span style={{ fontSize: "12px" }}>❤️</span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#b91c1c",
            }}
          >
            {hearts}/{maxHearts}
          </span>
        </div>

        {/* 4. Instructor Persona Selector */}
        <button
          className="top-hud-coach-btn"
          type="button"
          onClick={onToggleInstructor}
          title={`Switch Financial Tutor (Current: ${instructor})`}
          style={{
            background: "#24248f",
            border: "none",
            padding: "4px 10px 4px 5px",
            borderRadius: "6px",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: 750,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
            boxShadow: "0 2px 0 #11115c",
          }}
        >
          <img
            src={instructor === "Joseph" ? "/brand/joseph-avatar.png" : "/brand/josephine-avatar.png"}
            alt={instructor}
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "1px solid #ffffff",
              boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
            }}
          />
          <span className="top-hud-coach-name">Coach {instructor}</span>
          <span style={{ fontSize: "10px", color: "#b8b8ff" }}>⇄</span>
        </button>

      </div>
    </header>
  );
}
