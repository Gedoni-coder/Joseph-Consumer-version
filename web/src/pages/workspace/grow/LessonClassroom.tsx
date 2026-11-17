import { useState } from "react";
import { type AcademyStage, type TermTile } from "./growData";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface LessonClassroomProps {
  stage: AcademyStage;
  instructor: "Joseph" | "Josephine";
  hearts: number;
  onLoseHeart: () => void;
  onCompleteLesson: (earnedXp: number) => void;
  onBackToMap: () => void;
}

export function LessonClassroom({
  stage,
  instructor,
  hearts,
  onLoseHeart,
  onCompleteLesson,
  onBackToMap,
}: LessonClassroomProps) {
  const questions = stage.questions;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Selection state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [assembledTiles, setAssembledTiles] = useState<TermTile[]>([]);

  // Validation State: 'unanswered' | 'correct' | 'incorrect'
  const [evaluationState, setEvaluationState] = useState<"unanswered" | "correct" | "incorrect">("unanswered");
  const [avatarEmotion, setAvatarEmotion] = useState<"neutral" | "happy" | "thinking" | "celebrating" | "concerned">("neutral");

  const currentQ = questions[currentQuestionIndex] || questions[0];
  const progressPercent = Math.round(((currentQuestionIndex) / questions.length) * 100);

  const canCheck =
    evaluationState === "unanswered" &&
    (currentQ.type === "multiple-choice"
      ? selectedOptionId !== null
      : assembledTiles.length > 0);

  // Handle Term Tile Tap
  const handleTileClick = (tile: TermTile) => {
    if (evaluationState !== "unanswered") return;
    if (assembledTiles.find((t) => t.id === tile.id)) {
      setAssembledTiles(assembledTiles.filter((t) => t.id !== tile.id));
    } else {
      setAssembledTiles([...assembledTiles, tile]);
    }
  };

  // Evaluate Answer
  const handleCheckAnswer = () => {
    if (currentQ.type === "multiple-choice") {
      const isCorrect = selectedOptionId === currentQ.correctOptionId;
      if (isCorrect) {
        setEvaluationState("correct");
        setAvatarEmotion("celebrating");
        triggerXpCelebration(12, "Quick-Fire Correct Answer");
      } else {
        setEvaluationState("incorrect");
        setAvatarEmotion("concerned");
        onLoseHeart();
      }
    } else {
      const assembledWords = assembledTiles.map((t) => t.word);
      const isCorrect =
        currentQ.correctSentence &&
        assembledWords.length === currentQ.correctSentence.length &&
        assembledWords.every((w, i) => w === currentQ.correctSentence![i]);

      if (isCorrect) {
        setEvaluationState("correct");
        setAvatarEmotion("celebrating");
        triggerXpCelebration(12, "Quick-Fire Correct Answer");
      } else {
        setEvaluationState("incorrect");
        setAvatarEmotion("concerned");
        onLoseHeart();
      }
    }
  };

  // Move to Next Question or Finish
  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOptionId(null);
      setAssembledTiles([]);
      setEvaluationState("unanswered");
      setAvatarEmotion("neutral");
    } else {
      onCompleteLesson(stage.xpReward);
    }
  };

  const isJoseph = instructor === "Joseph";

  return (
    <div
      className="lesson-root-container"
      style={{
        maxWidth: "720px",
        margin: "0 auto",
        padding: "24px 20px 140px",
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .lesson-root-container {
            padding: 12px 14px 130px !important;
          }
          .lesson-instructor-card {
            padding: 12px 14px !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .lesson-instructor-avatar {
            width: 48px !important;
            height: 48px !important;
          }
          .lesson-footer-inner {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .lesson-footer-action-btn {
            width: 100% !important;
            padding: 12px 20px !important;
            text-align: center !important;
          }
        }
      `}</style>
      {/* 1. Header Progress & Controls */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <button
            type="button"
            onClick={onBackToMap}
            style={{
              background: "transparent",
              border: "none",
              color: "#64748b",
              fontSize: "12px",
              fontWeight: 750,
              cursor: "pointer",
              padding: 0,
            }}
          >
            ✕ Exit Lesson
          </button>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#03031d", letterSpacing: "1px", textTransform: "uppercase" }}>
            {stage.title} • QUESTION {currentQuestionIndex + 1} OF {questions.length}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 750, color: "#dc2626" }}>
            {hearts} ❤️ Buffer
          </span>
        </div>

        {/* Sleek Progress Bar */}
        <div
          style={{
            height: "6px",
            background: "#e2e8f0",
            borderRadius: "99px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "#16a34a",
              borderRadius: "99px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* 2. Stylized Instructor Presence Card (Crisp White Card with Navy Border) */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "18px 20px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 2px 10px rgba(3, 3, 29, 0.04)",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "#24248f",
            border: "2.5px solid #24248f",
            flexShrink: 0,
            position: "relative",
            boxShadow: "0 2px 8px rgba(36, 36, 143, 0.25)",
            overflow: "hidden",
          }}
        >
          <img
            src={isJoseph ? "/brand/joseph-avatar.png" : "/brand/josephine-avatar.png"}
            alt={`Coach ${instructor}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <span
            style={{
              position: "absolute",
              bottom: "1px",
              right: "1px",
              fontSize: "11px",
              background: "#ffffff",
              borderRadius: "50%",
              padding: "2px",
              border: "1px solid #cbd5e1",
              lineHeight: 1,
            }}
          >
            {avatarEmotion === "celebrating" ? "🎉" : avatarEmotion === "concerned" ? "🤔" : "💡"}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#03031d" }}>
              Coach {instructor}
            </span>
            <span style={{ fontSize: "10px", color: "#24248f", background: "#ebebfa", padding: "1px 6px", borderRadius: "3px", fontWeight: 750, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Financial Mentor
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#334155",
              lineHeight: "1.5",
              fontWeight: 500,
            }}
          >
            "{currentQ.tutorBanter}"
          </p>
        </div>
      </div>

      {/* 3. Question Prompt Title */}
      <div style={{ marginBottom: "22px" }}>
        <h2
          style={{
            fontSize: "21px",
            fontWeight: "750",
            color: "#03031d",
            margin: "0 0 6px",
            lineHeight: "1.35",
            letterSpacing: "-0.04em",
          }}
        >
          {currentQ.prompt}
        </h2>
      </div>

      {/* 4. Interactive Modules: Quick-Fire Scenarios OR Word Builder */}
      {currentQ.type === "multiple-choice" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {currentQ.options?.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const isCorrectAnswer = opt.id === currentQ.correctOptionId;
            let cardBg = isSelected ? "#f0f2ff" : "#ffffff";
            let cardBorder = isSelected ? "2px solid #24248f" : "2px solid #e2e8f0";
            let cardShadow = isSelected ? "0 4px 0 #24248f" : "0 3px 0 #e2e8f0";

            if (evaluationState === "correct" && isCorrectAnswer) {
              cardBg = "#f0fdf4";
              cardBorder = "2px solid #16a34a";
              cardShadow = "0 4px 0 #15803d";
            } else if (evaluationState === "incorrect" && isSelected) {
              cardBg = "#fef2f2";
              cardBorder = "2px solid #dc2626";
              cardShadow = "0 4px 0 #b91c1c";
            }

            return (
              <button
                key={opt.id}
                type="button"
                disabled={evaluationState !== "unanswered"}
                onClick={() => setSelectedOptionId(opt.id)}
                style={{
                  background: cardBg,
                  border: cardBorder,
                  borderRadius: "10px",
                  padding: "16px 20px",
                  textAlign: "left",
                  cursor: evaluationState === "unanswered" ? "pointer" : "default",
                  transition: "all 0.12s ease",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  boxShadow: cardShadow,
                  transform: isSelected ? "translateY(-1px)" : "none",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    border: isSelected ? "2px solid #24248f" : "1.5px solid #cbd5e1",
                    background: isSelected ? "#24248f" : "#ffffff",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 900,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  {isSelected ? "✓" : ""}
                </div>

                <div>
                  <div style={{ fontSize: "14px", fontWeight: "750", color: "#03031d", lineHeight: "1.4" }}>
                    {opt.text}
                  </div>
                  {opt.subtext && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      {opt.subtext}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Word & Term Builder Interactive Bubble Tiles */}
      {currentQ.type === "term-builder" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Drop Arena */}
          <div
            style={{
              minHeight: "100px",
              background: "#f8fafc",
              border: "2px dashed #cbd5e1",
              borderRadius: "10px",
              padding: "18px",
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              alignItems: "center",
              alignContent: "center",
            }}
          >
            {assembledTiles.length === 0 ? (
              <span style={{ fontSize: "13px", color: "#64748b", margin: "auto" }}>
                Tap the terms below to build the correct definition in order...
              </span>
            ) : (
              assembledTiles.map((tile) => (
                <button
                  key={tile.id}
                  type="button"
                  onClick={() => handleTileClick(tile)}
                  style={{
                    background: "#24248f",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "9px 16px",
                    fontSize: "13px",
                    fontWeight: "750",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 3px 0 #11115c",
                  }}
                >
                  <span>{tile.word}</span>
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>✕</span>
                </button>
              ))
            )}
          </div>

          {/* Available Word Bubble Tiles */}
          <div>
            <span style={{ fontSize: "11px", fontWeight: 750, color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "10px" }}>
              AVAILABLE FINANCIAL TERMS
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {currentQ.availableTiles?.map((tile) => {
                const isUsed = assembledTiles.some((t) => t.id === tile.id);
                return (
                  <button
                    key={tile.id}
                    type="button"
                    disabled={isUsed || evaluationState !== "unanswered"}
                    onClick={() => handleTileClick(tile)}
                    style={{
                      background: isUsed ? "#f1f5f9" : "#ffffff",
                      color: isUsed ? "#94a3b8" : "#03031d",
                      border: isUsed ? "1px dashed #cbd5e1" : "2px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "9px 18px",
                      fontSize: "13px",
                      fontWeight: "750",
                      cursor: isUsed ? "default" : "pointer",
                      transition: "all 0.12s ease",
                      boxShadow: isUsed ? "none" : "0 3px 0 #cbd5e1",
                      opacity: isUsed ? 0.5 : 1,
                    }}
                  >
                    {tile.word}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5. Anchored Bottom Action Bar with Glowing "CHECK" / "CONTINUE" */}
      <footer
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: evaluationState === "correct" ? "#f0fdf4" : evaluationState === "incorrect" ? "#fef2f2" : "#ffffff",
          borderTop: evaluationState === "correct" ? "2px solid #86efac" : evaluationState === "incorrect" ? "2px solid #fca5a5" : "1px solid #e2e8f0",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 60,
          boxShadow: "0 -4px 18px rgba(3, 3, 29, 0.08)",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            maxWidth: "720px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {evaluationState === "unanswered" ? (
            <>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                Select your answer to proceed
              </div>
              <button
                type="button"
                disabled={!canCheck}
                onClick={handleCheckAnswer}
                style={{
                  background: canCheck ? "#24248f" : "#e2e8f0",
                  color: canCheck ? "#ffffff" : "#94a3b8",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 34px",
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  cursor: canCheck ? "pointer" : "not-allowed",
                  boxShadow: canCheck ? "0 4px 0 #11115c" : "none",
                  transition: "all 0.12s ease",
                }}
              >
                CHECK
              </button>
            </>
          ) : (
            <>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: evaluationState === "correct" ? "#16a34a" : "#dc2626",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    {evaluationState === "correct" ? "✓" : "✕"}
                  </span>
                  <strong style={{ fontSize: "15px", color: evaluationState === "correct" ? "#15803d" : "#b91c1c" }}>
                    {evaluationState === "correct" ? "Excellent! +12 XP" : "Not quite, keep learning!"}
                  </strong>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#475569", maxWidth: "460px" }}>
                  {currentQ.explanation}
                </p>
              </div>

              <button
                type="button"
                onClick={handleNextQuestion}
                style={{
                  background: evaluationState === "correct" ? "#16a34a" : "#dc2626",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "14px 32px",
                  fontSize: "13px",
                  fontWeight: "800",
                  letterSpacing: "0.5px",
                  cursor: "pointer",
                  boxShadow: evaluationState === "correct" ? "0 4px 0 #15803d" : "0 4px 0 #991b1b",
                  transition: "all 0.12s ease",
                }}
              >
                CONTINUE →
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
