import { useState } from "react";
import { TopStatusHud } from "./TopStatusHud";
import { ProgressionMap } from "./ProgressionMap";
import { LearnClassroom } from "./LearnClassroom";
import { LessonClassroom } from "./LessonClassroom";
import { MarketSimulator } from "./MarketSimulator";
import { ACADEMY_STAGES, type AcademyStage } from "./growData";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export function GrowModule() {
  const [stages, setStages] = useState<AcademyStage[]>(ACADEMY_STAGES);
  const [selectedStageId, setSelectedStageId] = useState<string>("beginner");
  const [activeLessonStage, setActiveLessonStage] = useState<AcademyStage | null>(null);
  const [lessonMode, setLessonMode] = useState<"learn" | "practice">("learn");

  // Active View: 'academy' | 'simulator'
  const [activeView, setActiveView] = useState<"academy" | "simulator">("academy");
  const [isSimulatorUnlocked, setIsSimulatorUnlocked] = useState(false);

  // Player Stats
  const [streakDays, setStreakDays] = useState(5);
  const [currentXp, setCurrentXp] = useState(185);
  const targetXp = 200; // Weekly 200 XP Benchmark
  const [hearts, setHearts] = useState(5);
  const [instructor, setInstructor] = useState<"Joseph" | "Josephine">("Joseph");

  // Success Celebration Modal
  const [completedStageData, setCompletedStageData] = useState<{
    title: string;
    earnedXp: number;
  } | null>(null);

  const handleLoseHeart = () => {
    setHearts((prev) => Math.max(0, prev - 1));
  };

  const handleAwardXp = (xp: number, label: string) => {
    setCurrentXp((prev) => prev + xp);
    triggerXpCelebration(xp, label);
  };

  const handleCompleteLesson = (earnedXp: number) => {
    if (!activeLessonStage) return;

    // Trigger non-disruptive floating bubbles
    triggerXpCelebration(earnedXp, `Completed ${activeLessonStage.title}`);

    // Unlock subsequent stages
    const updatedStages = stages.map((s) => {
      if (s.id === activeLessonStage.id) {
        return {
          ...s,
          status: "completed" as const,
        };
      }
      if (s.id === "intermediate" && activeLessonStage.id === "beginner") {
        return {
          ...s,
          status: "active" as const,
        };
      }
      if (s.id === "professional" && activeLessonStage.id === "intermediate") {
        return {
          ...s,
          status: "active" as const,
        };
      }
      return s;
    });

    setStages(updatedStages);
    setCurrentXp((prev) => prev + earnedXp);
    setStreakDays((prev) => prev + 1);
    setIsSimulatorUnlocked(true);
    setCompletedStageData({
      title: activeLessonStage.title,
      earnedXp,
    });
    setActiveLessonStage(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#03031d",
        color: "#03031d",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .grow-nav-wrap {
            padding: 8px 12px !important;
            gap: 8px !important;
          }
          .grow-nav-btn {
            flex: 1 !important;
            padding: 10px 10px !important;
            font-size: 11.5px !important;
            justify-content: center !important;
            min-height: 44px !important;
          }
        }
      `}</style>

      {/* 1. White & Navy Status HUD */}
      <TopStatusHud
        streakDays={streakDays}
        currentXp={currentXp}
        targetXp={targetXp}
        hearts={hearts}
        maxHearts={5}
        instructor={instructor}
        onToggleInstructor={() =>
          setInstructor((prev) => (prev === "Joseph" ? "Josephine" : "Joseph"))
        }
        showBack={activeLessonStage !== null}
        onBackToMap={() => setActiveLessonStage(null)}
      />

      {/* 2. Sub-Navigation Tabs: Academy Stages vs. NGX Simulator */}
      {!activeLessonStage && (
        <div
          className="grow-nav-wrap"
          style={{
            background: "#03031d",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="grow-nav-btn"
            onClick={() => setActiveView("academy")}
            style={{
              padding: "8px 18px",
              borderRadius: "4px",
              border: activeView === "academy" ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
              background: activeView === "academy" ? "#ffffff" : "transparent",
              color: activeView === "academy" ? "#03031d" : "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>🎓</span> Academy Path (3 Stages)
          </button>

          <button
            type="button"
            className="grow-nav-btn"
            onClick={() => setActiveView("simulator")}
            style={{
              padding: "8px 18px",
              borderRadius: "4px",
              border: activeView === "simulator" ? "2px solid #ffffff" : "1px solid rgba(255, 255, 255, 0.2)",
              background: activeView === "simulator" ? "#ffffff" : "transparent",
              color: activeView === "simulator" ? "#03031d" : "#ffffff",
              fontSize: "12px",
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "all 0.15s ease",
            }}
          >
            <span>📈</span> NGX Simulator
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "3px",
                background: isSimulatorUnlocked ? "#16a34a" : "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                fontWeight: 800,
              }}
            >
              {isSimulatorUnlocked ? "OPEN" : "UNLOCKED"}
            </span>
          </button>
        </div>
      )}

      {/* 3. Main Workspace Canvas */}
      <main style={{ flex: 1, position: "relative" }}>
        {activeLessonStage ? (
          lessonMode === "learn" ? (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 1000,
                background: "#ffffff",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden", // Non-scrolling strictly for the classroom
              }}
            >
              <LearnClassroom
                stage={activeLessonStage}
                instructor={instructor}
                onProceedToPractice={() => setLessonMode("practice")}
                onExit={() => setActiveLessonStage(null)}
                onAwardXp={handleAwardXp}
              />
            </div>
          ) : (
            <div style={{ background: "#f8fafc", minHeight: "100%", padding: "16px 0 32px" }}>
              {/* Quick switch between Practice and Learn */}
              <div
                style={{
                  maxWidth: "720px",
                  margin: "0 auto 16px",
                  padding: "0 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setLessonMode("learn")}
                    style={{
                      background: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 750,
                      color: "#475569",
                      cursor: "pointer",
                    }}
                  >
                    📖 Review Learn Theory
                  </button>
                  <span
                    style={{
                      background: "#03031d",
                      border: "1px solid #03031d",
                      borderRadius: "4px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      fontWeight: 800,
                      color: "#ffffff",
                    }}
                  >
                    🎯 Active Practice Drills
                  </span>
                </div>
              </div>

              <LessonClassroom
                stage={activeLessonStage}
                instructor={instructor}
                hearts={hearts}
                onLoseHeart={handleLoseHeart}
                onCompleteLesson={handleCompleteLesson}
                onBackToMap={() => setActiveLessonStage(null)}
              />
            </div>
          )
        ) : activeView === "simulator" ? (
          <div style={{ background: "#f8fafc", minHeight: "100%", padding: "20px 0" }}>
            <MarketSimulator
              onAwardXp={handleAwardXp}
              onBackToAcademy={() => setActiveView("academy")}
            />
          </div>
        ) : (
          <div style={{ background: "#f8fafc", minHeight: "100%", padding: "20px 0" }}>
            <ProgressionMap
              stages={stages}
              selectedStageId={selectedStageId}
              onSelectStage={(stage) => setSelectedStageId(stage.id)}
              onStartLesson={(stage, mode) => {
                setActiveLessonStage(stage);
                setLessonMode(mode || "learn");
              }}
            />
          </div>
        )}
      </main>

      {/* 4. Lesson Completion / NGX Simulator Unlock Modal */}
      {completedStageData && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(3, 3, 29, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "36px 30px",
              maxWidth: "460px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 14px 44px rgba(3, 3, 29, 0.35)",
              position: "relative",
            }}
          >
            <div style={{ fontSize: "44px", marginBottom: "12px" }}>🏆</div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "1.2px",
                color: "#16a34a",
                textTransform: "uppercase",
              }}
            >
              STAGE LESSON MASTERED
            </span>
            <h2
              style={{
                fontSize: "22px",
                fontWeight: 750,
                color: "#03031d",
                margin: "8px 0 10px",
                letterSpacing: "-0.04em",
              }}
            >
              {completedStageData.title}
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#64748b",
                lineHeight: 1.6,
                margin: "0 0 20px",
              }}
            >
              You earned{" "}
              <strong style={{ color: "#03031d" }}>
                +{completedStageData.earnedXp} XP
              </strong>{" "}
              towards your Lagos Premier League standing.
            </p>

            {/* Simulator Unlock Callout */}
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "6px",
                padding: "16px",
                marginBottom: "24px",
                textAlign: "left",
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "24px" }}>🔓</span>
              <div>
                <strong style={{ fontSize: "13px", color: "#16a34a", display: "block" }}>
                  NGX Market Simulator Unlocked
                </strong>
                <span style={{ fontSize: "12px", color: "#475569", lineHeight: 1.4, display: "block" }}>
                  Today's trading session is open. Deploy your virtual capital across the 4 portfolio archetypes.
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setCompletedStageData(null);
                  setActiveView("simulator");
                }}
                style={{
                  width: "100%",
                  background: "#03031d",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                }}
              >
                ENTER NGX TRADING FLOOR →
              </button>

              <button
                type="button"
                onClick={() => setCompletedStageData(null)}
                style={{
                  width: "100%",
                  background: "transparent",
                  color: "#64748b",
                  border: "none",
                  padding: "10px",
                  fontSize: "12px",
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                Return to Academy Path
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
