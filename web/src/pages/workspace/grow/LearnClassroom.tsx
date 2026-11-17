import { useState } from "react";
import { type AcademyStage } from "./growData";
import { triggerXpCelebration } from "../../../components/XpBubbleEffect";

export interface LearnClassroomProps {
  stage: AcademyStage;
  instructor: "Joseph" | "Josephine";
  onProceedToPractice: () => void;
  onExit: () => void;
  onAwardXp: (xp: number, label: string) => void;
}

export type LearnPhase = 1 | 2 | 3 | 4 | 5;

export function LearnClassroom({
  stage,
  instructor: initialInstructor,
  onProceedToPractice,
  onExit,
  onAwardXp,
}: LearnClassroomProps) {
  const [currentPhase, setCurrentPhase] = useState<LearnPhase>(1);
  const [instructor, setInstructor] = useState<"Joseph" | "Josephine">(initialInstructor);

  // Phase 2 Interactive Store Simulator state
  const [simulatedBranches, setSimulatedBranches] = useState<number>(10);
  const baseStoreValue = 10000000; // ₦10M base store
  const totalShares = 1000;
  const currentStoreValue = baseStoreValue * simulatedBranches;
  const pricePerShare = currentStoreValue / totalShares;

  // Phase 4 Logic Test state
  const [selectedDemoOption, setSelectedDemoOption] = useState<"A" | "B" | null>(null);
  const [hasGraduated, setHasGraduated] = useState(false);

  // Coach avatar expression
  const [coachEmotion, setCoachEmotion] = useState<"friendly" | "explaining" | "approving" | "thinking">("friendly");

  const isJoseph = instructor === "Joseph";

  const PHASES_LIST: { num: LearnPhase; title: string; subtitle: string; icon: string }[] = [
    { num: 1, title: "The Hook", subtitle: "Breaking the Ice", icon: "🧊" },
    { num: 2, title: "The Analogy", subtitle: "The Big Store Model", icon: "🏪" },
    { num: 3, title: "Definitions", subtitle: "Core Financial Terms", icon: "📜" },
    { num: 4, title: "The 'Aha!' Check", subtitle: "Dangote Cement Logic", icon: "🎯" },
    { num: 5, title: "Graduation", subtitle: "Syllabus Wrap-Up & Notes", icon: "🎓" },
  ];

  const handleSelectPhase = (phase: LearnPhase) => {
    setCurrentPhase(phase);
    if (phase === 1) setCoachEmotion("friendly");
    else if (phase === 2 || phase === 3) setCoachEmotion("explaining");
    else if (phase === 4) setCoachEmotion("thinking");
    else if (phase === 5) {
      setCoachEmotion("approving");
      if (!hasGraduated) {
        setHasGraduated(true);
        onAwardXp(20, "Completed Full Theory Lecture");
        triggerXpCelebration(20, "Theory Lecture Mastered!");
      }
    }
  };

  const handleNextPhase = () => {
    if (currentPhase < 5) {
      handleSelectPhase((currentPhase + 1) as LearnPhase);
    } else {
      onProceedToPractice();
    }
  };

  const handlePrevPhase = () => {
    if (currentPhase > 1) {
      handleSelectPhase((currentPhase - 1) as LearnPhase);
    }
  };

  const handleOptionSelect = (opt: "A" | "B") => {
    setSelectedDemoOption(opt);
    if (opt === "A") {
      setCoachEmotion("approving");
      triggerXpCelebration(5, "Market Logic Verified");
    } else {
      setCoachEmotion("thinking");
    }
  };

  const activePhaseInfo = PHASES_LIST.find((p) => p.num === currentPhase)!;

  return (
    <div
      style={{
        height: "100%",
        maxHeight: "100%",
        background: "#ffffff",
        color: "#03031d",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // STRICT ZERO SCROLL: stable fitted view at all times
        fontFamily: '"Manrope Variable", -apple-system, sans-serif',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .classroom-top-bar {
            padding: 6px 12px !important;
            min-height: 42px !important;
          }
          .classroom-exit-btn-text {
            display: none !important;
          }
          .classroom-lesson-pill {
            display: none !important;
          }
          .classroom-story-bar {
            padding: 3px 12px 0 !important;
          }
          .smartboard-container {
            padding: 4px 6px 6px !important;
          }
          .smartboard-frame {
            border-width: 4px !important;
            border-radius: 10px !important;
          }
          .smartboard-bezel-top {
            height: 30px !important;
            min-height: 30px !important;
            padding: 0 10px !important;
          }
          .smartboard-inner-grid {
            grid-template-columns: 1fr !important;
            gap: 6px !important;
            padding: 8px 10px !important;
            overflow: hidden !important;
          }
          .smartboard-coach-col-desktop {
            display: none !important;
          }
          .smartboard-coach-mobile-strip {
            display: flex !important;
          }
          .smartboard-content-col {
            padding: 0 !important;
          }
          .smartboard-phase-h2 {
            font-size: 15px !important;
            margin: 0 0 6px !important;
            line-height: 1.25 !important;
          }
          .smartboard-phase-p {
            font-size: 11px !important;
            line-height: 1.35 !important;
            margin: 0 0 8px !important;
          }
          .smartboard-footer-bar {
            padding: 6px 12px !important;
            min-height: 48px !important;
          }
          .smartboard-footer-inner {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            justifyContent: space-between !important;
            gap: 6px !important;
          }
          .smartboard-phase-indicator {
            font-size: 11px !important;
          }
          .smartboard-footer-actions {
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .smartboard-footer-actions button {
            padding: 8px 12px !important;
            font-size: 11px !important;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* 1. TOP ZONE (EXCLUDED FROM THE BOARD AS SPECIFIED)                        */}
      {/* "← Exit to Roadmap | Joseph AI Dove JOSEPH ACADEMY | BEGINNER STAGE ... " */}
      {/* ========================================================================= */}
      <header
        className="classroom-top-bar"
        style={{
          flexShrink: 0,
          borderBottom: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "14px",
          zIndex: 10,
        }}
      >
        {/* Left: Exit to Roadmap & Brand Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#03031d",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 750,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.15s ease",
            }}
          >
            <span>←</span>
            <span className="classroom-exit-btn-text">Exit to Roadmap</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "#24248f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "3px",
              }}
            >
              <img
                src="/brand/dove-transparent-white.png"
                alt="Joseph AI Dove"
                style={{ width: "19px", height: "19px", objectFit: "contain" }}
              />
            </div>
            <span style={{ fontSize: "13px", fontWeight: 800, color: "#03031d", letterSpacing: "-0.02em" }}>
              JOSEPH ACADEMY
            </span>
          </div>
        </div>

        {/* Center: Stage Pill & Lesson Title */}
        <div className="classroom-lesson-pill" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              color: "#24248f",
              background: "#f0f2ff",
              padding: "3px 9px",
              borderRadius: "4px",
            }}
          >
            {stage.title.toUpperCase()}
          </span>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 650 }}>
            Lesson 1: What is a Share & How the Market Operates
          </span>
        </div>

        {/* Right: Beats Counter */}
        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
          {currentPhase} of 5 Beats
        </div>
      </header>

      {/* Segmented Story Progress Bar (Instagram / WhatsApp status dashes) */}
      <div
        className="classroom-story-bar"
        style={{
          flexShrink: 0,
          width: "100%",
          padding: "5px 24px 0",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "8px",
          }}
        >
          {PHASES_LIST.map((p) => {
            const isCompleted = p.num < currentPhase;
            const isActive = p.num === currentPhase;

            return (
              <button
                key={p.num}
                type="button"
                onClick={() => handleSelectPhase(p.num)}
                title={`Phase ${p.num}: ${p.title}`}
                style={{
                  height: "4px",
                  borderRadius: "99px",
                  background: isCompleted ? "#16a34a" : isActive ? "#24248f" : "#e2e8f0",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.2s ease",
                  boxShadow: isActive ? "0 0 6px rgba(36, 36, 143, 0.45)" : "none",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MIDDLE ZONE: THE ENTIRE MIDDLE AREA COVERED BY THE GREY SMART BOARD   */}
      {/* ========================================================================= */}
      <div
        className="smartboard-container"
        style={{
          flex: "1 1 0%",
          minHeight: 0,
          padding: "6px 20px 8px",
          display: "flex",
          flexDirection: "column",
          maxWidth: "1280px",
          width: "100%",
          margin: "0 auto",
          overflow: "hidden",
        }}
      >
        <div
          className="smartboard-frame"
          style={{
            flex: "1 1 0%",
            minHeight: 0,
            width: "100%",
            background: "#1e293b", // Slate Grey Smart Board Canvas
            border: "6px solid #0f172a", // Dark aluminium bezel
            borderRadius: "14px",
            boxShadow: "0 14px 34px rgba(15, 23, 42, 0.22), 0 2px 6px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* A. Smart Board Top Bezel (JOSEPH AI SMART BOARD • INTERACTIVE 4K | SLIDE X OF 5 | NGX CURRICULUM) */}
          <div
            className="smartboard-bezel-top"
            style={{
              height: "36px",
              minHeight: "36px",
              flexShrink: 0,
              background: "#0f172a",
              padding: "0 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #334155",
            }}
          >
            {/* Left Bezel Dots & Status */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", letterSpacing: "1px", marginLeft: "4px" }}>
                JOSEPH AI SMART BOARD • INTERACTIVE 4K
              </span>
            </div>

            {/* Right Bezel Slide Counter & Curriculum */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 800 }}>
                SLIDE {currentPhase} OF 5
              </span>
              <span style={{ fontSize: "9px", background: "#334155", color: "#f8fafc", padding: "1px 6px", borderRadius: "3px", fontWeight: 700 }}>
                NGX CURRICULUM
              </span>
            </div>
          </div>

          {/* B. Smart Board Body */}
          <div
            className="smartboard-inner-grid"
            style={{
              flex: "1 1 0%",
              minHeight: 0,
              display: "grid",
              gridTemplateColumns: "250px 1fr",
              gap: "20px",
              padding: "12px 20px",
              alignItems: "stretch",
              overflow: "hidden",
            }}
          >
            {/* ---------------------------------------------------- */}
            {/* DESKTOP LEFT COLUMN: STANDING CUTOUT & PROMPTER      */}
            {/* ---------------------------------------------------- */}
            <div
              className="smartboard-coach-col-desktop"
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                minHeight: 0,
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                overflow: "hidden",
              }}
            >
              {/* Phase Inscription Header Badge */}
              <div
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.75)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  padding: "5px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: "8.5px", fontWeight: 800, color: "#94a3b8", letterSpacing: "0.8px", textTransform: "uppercase" }}>
                    Lesson 1 Lecture Modules
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: 800, color: "#ffffff", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>{activePhaseInfo.icon}</span>
                    <span>Phase {activePhaseInfo.num}: {activePhaseInfo.title}</span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "8.5px",
                    fontWeight: 800,
                    background: "#16a34a",
                    color: "#ffffff",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    letterSpacing: "0.5px",
                  }}
                >
                  ACTIVE
                </span>
              </div>

              {/* Character Cutout Standing Inside the Board Beside the Content */}
              <div
                style={{
                  flex: "1 1 0%",
                  minHeight: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={isJoseph ? "/brand/joseph-cutout.png" : "/brand/josephine-cutout.png"}
                  alt={`Coach ${instructor}`}
                  style={{
                    maxHeight: "100%",
                    maxWidth: "100%",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    display: "block",
                    filter: "drop-shadow(0 10px 14px rgba(0, 0, 0, 0.45))",
                    transition: "all 0.2s ease",
                  }}
                />
              </div>

              {/* Coach Live Explaining Bubble */}
              <div
                style={{
                  width: "100%",
                  background: "#0f172a",
                  border: "1.5px solid #38bdf8",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.35)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8" }}>
                    Coach {instructor}
                  </span>
                  <span style={{ fontSize: "8.5px", background: "rgba(74, 222, 128, 0.15)", color: "#4ade80", padding: "1px 5px", borderRadius: "3px", fontWeight: 800 }}>
                    {coachEmotion === "approving" ? "🎉 APPROVING" : coachEmotion === "explaining" ? "💡 EXPLAINING" : coachEmotion === "thinking" ? "🤔 EVALUATING" : "👋 TEACHING"}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "11px", color: "#e2e8f0", lineHeight: 1.35, fontWeight: 600 }}>
                  {currentPhase === 1 && "“Chuks, look at the smart board. Today we start from absolute zero!”"}
                  {currentPhase === 2 && "“Slide the branches on the board and see how value multiplies.”"}
                  {currentPhase === 3 && "“Here are the three official definitions. Master them!”"}
                  {currentPhase === 4 && "“Quick check time! Test your market logic on the board.”"}
                  {currentPhase === 5 && "“Oya, lecture done! You now speak the language of the market.”"}
                </p>
              </div>

              {/* Coach Gender Switch Button */}
              <button
                type="button"
                onClick={() => setInstructor((prev) => (prev === "Joseph" ? "Josephine" : "Joseph"))}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "7px",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#ffffff",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                <img
                  src={isJoseph ? "/brand/josephine-avatar.png" : "/brand/joseph-avatar.png"}
                  alt="Switch coach"
                  style={{
                    width: "17px",
                    height: "17px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid #38bdf8",
                  }}
                />
                <span>Switch coach: Coach {isJoseph ? "Josephine" : "Joseph"} ⇄</span>
              </button>
            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT COLUMN: THE BOARD CONTENT (FULLY FITTED)       */}
            {/* ---------------------------------------------------- */}
            <div
              className="smartboard-content-col"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                height: "100%",
                minHeight: 0,
                overflow: "hidden",
                color: "#ffffff",
              }}
            >
              {/* Mobile-Only Talking Head Coach Banner */}
              <div
                className="smartboard-coach-mobile-strip"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "10px",
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  padding: "6px 10px",
                  marginBottom: "8px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#24248f",
                    border: "2px solid #38bdf8",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={isJoseph ? "/brand/joseph-avatar.png" : "/brand/josephine-avatar.png"}
                    alt={`Coach ${instructor}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8" }}>
                      Coach {instructor}
                    </span>
                    <button
                      type="button"
                      onClick={() => setInstructor((prev) => (prev === "Joseph" ? "Josephine" : "Joseph"))}
                      style={{
                        background: "#1e293b",
                        border: "1px solid #38bdf8",
                        borderRadius: "4px",
                        color: "#ffffff",
                        fontSize: "9px",
                        fontWeight: 800,
                        padding: "2px 6px",
                        cursor: "pointer",
                      }}
                    >
                      ⇄ Coach {isJoseph ? "Josephine" : "Joseph"}
                    </button>
                  </div>
                  <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#e2e8f0", lineHeight: 1.3, whiteSpace: "normal" }}>
                    {currentPhase === 1 && "“Chuks, look at the smart board. Today we start from absolute zero!”"}
                    {currentPhase === 2 && "“Slide the branches on the board and see how value multiplies.”"}
                    {currentPhase === 3 && "“Here are the three official definitions. Master them!”"}
                    {currentPhase === 4 && "“Quick check time! Test your market logic on the board.”"}
                    {currentPhase === 5 && "“Oya, lecture done! You now speak the language of the market.”"}
                  </p>
                </div>
              </div>

              {/* PHASE 1: THE HOOK */}
              {currentPhase === 1 && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "3px" }}>
                    FOUNDATIONAL QUESTION
                  </div>
                  <h2 className="smartboard-phase-h2" style={{ fontSize: "19px", fontWeight: 800, color: "#ffffff", margin: "0 0 10px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
                    "Why do 90% of Nigerians lose money in the market, while smart investors compound wealth?"
                  </h2>

                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "9px 12px",
                      marginBottom: "10px",
                    }}
                  >
                    <p className="smartboard-phase-p" style={{ margin: 0, fontSize: "12px", color: "#e2e8f0", lineHeight: 1.45, fontStyle: "italic" }}>
                      "Chuks, let's be honest. Have you ever wondered how people buy stocks on the Nigerian Exchange, and why some people make money while others watch their cash disappear? Today, we start from absolute zero. No grammar. Let's talk about what a 'Share' actually is."
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div style={{ background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#f87171", marginBottom: "2px" }}>
                        ❌ The Costly Nigerian Mistake
                      </div>
                      <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.3 }}>
                        Gambling on WhatsApp rumors or treating stocks like lotto.
                      </div>
                    </div>

                    <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "6px", padding: "8px 10px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: "#4ade80", marginBottom: "2px" }}>
                        ✅ The Joseph AI Truth
                      </div>
                      <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: 1.3 }}>
                        You are purchasing fractional equity in real physical companies.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 2: THE VISUAL ANALOGY (THE REQUESTED CENTERPIECE) */}
              {currentPhase === 2 && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
                    THE VISUAL ANALOGY
                  </div>
                  <h3 className="smartboard-phase-h2" style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                    The "Big Store" Neighborhood Supermarket Model
                  </h3>

                  <p className="smartboard-phase-p" style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.4, margin: "0 0 8px" }}>
                    Imagine your favorite supermarket in Lagos wants to open more branches across Ikeja and Lekki, but they lack cash. What do they do? They divide the entire business into <strong>1,000 equal pieces called shares</strong> and sell them to the public.
                  </p>

                  {/* Interactive Supermarket Expansion Simulator */}
                  <div
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.14)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "10.5px", fontWeight: 800, color: "#38bdf8" }}>
                        SUPERMARKET EXPANSION SIMULATOR
                      </span>
                      <span style={{ fontSize: "11.5px", fontWeight: 800, color: "#4ade80" }}>
                        {simulatedBranches} {simulatedBranches === 1 ? "Branch" : "Branches"} in Lagos
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={simulatedBranches}
                      onChange={(e) => setSimulatedBranches(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#4ade80", cursor: "pointer", marginBottom: "8px" }}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "rgba(0,0,0,0.35)", padding: "7px 10px", borderRadius: "6px" }}>
                        <span style={{ fontSize: "9px", color: "#94a3b8", display: "block", marginBottom: "1px" }}>
                          TOTAL COMPANY VALUATION
                        </span>
                        <strong style={{ fontSize: "14px", color: "#ffffff" }}>
                          ₦{(currentStoreValue).toLocaleString()}
                        </strong>
                      </div>

                      <div style={{ background: "rgba(0,0,0,0.35)", padding: "7px 10px", borderRadius: "6px", border: "1px solid rgba(74, 222, 128, 0.35)" }}>
                        <span style={{ fontSize: "9px", color: "#4ade80", display: "block", marginBottom: "1px" }}>
                          YOUR 1 SHARE VALUE
                        </span>
                        <strong style={{ fontSize: "14px", color: "#4ade80" }}>
                          ₦{(pricePerShare).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 3: DEFINITIONS */}
              {currentPhase === 3 && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
                    CORE FINANCIAL GLOSSARY
                  </div>
                  <h3 className="smartboard-phase-h2" style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
                    Put Proper Names to Things (Speak Like a Market Player)
                  </h3>

                  <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                    <div style={{ background: "rgba(255, 255, 255, 0.06)", borderLeft: "4px solid #38bdf8", padding: "6px 10px", borderRadius: "4px" }}>
                      <strong style={{ fontSize: "11.5px", color: "#38bdf8", display: "block" }}>
                        1. What is a Stock / Share?
                      </strong>
                      <span style={{ fontSize: "11px", color: "#e2e8f0", lineHeight: 1.35 }}>
                        A legal unit of ownership in a registered corporation. When you buy one, you own a literal microscopic piece of that business.
                      </span>
                    </div>

                    <div style={{ background: "rgba(255, 255, 255, 0.06)", borderLeft: "4px solid #4ade80", padding: "6px 10px", borderRadius: "4px" }}>
                      <strong style={{ fontSize: "11.5px", color: "#4ade80", display: "block" }}>
                        2. What is a Dividend?
                      </strong>
                      <span style={{ fontSize: "11px", color: "#e2e8f0", lineHeight: 1.35 }}>
                        When the company profits at year-end, they share a portion directly with you in cash as a reward for being an owner.
                      </span>
                    </div>

                    <div style={{ background: "rgba(255, 255, 255, 0.06)", borderLeft: "4px solid #f59e0b", padding: "6px 10px", borderRadius: "4px" }}>
                      <strong style={{ fontSize: "11.5px", color: "#f59e0b", display: "block" }}>
                        3. What is the NGX (Nigerian Exchange)?
                      </strong>
                      <span style={{ fontSize: "11px", color: "#e2e8f0", lineHeight: 1.35 }}>
                        The digital marketplace where buyers and sellers trade shares safely under SEC regulation every weekday (10:00 AM – 2:30 PM).
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PHASE 4: THE 'AHA!' CHECK */}
              {currentPhase === 4 && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "2px" }}>
                    LOGICAL MARKET CHECK
                  </div>
                  <h3 className="smartboard-phase-h2" style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                    Dangote Cement Factory Logic
                  </h3>

                  <p className="smartboard-phase-p" style={{ fontSize: "11.5px", color: "#cbd5e1", lineHeight: 1.35, margin: "0 0 8px" }}>
                    "If Dangote Cement builds five new factories and sells millions of bags across Africa, what happens to the value of your piece in that company?"
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => handleOptionSelect("A")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "6px",
                        border: selectedDemoOption === "A" ? "2px solid #4ade80" : "1px solid rgba(255, 255, 255, 0.2)",
                        background: selectedDemoOption === "A" ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.06)",
                        color: "#ffffff",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Option A: It goes UP because the underlying business is growing.</span>
                      {selectedDemoOption === "A" && <span style={{ color: "#4ade80", fontWeight: 900 }}>✓ CORRECT</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOptionSelect("B")}
                      style={{
                        padding: "9px 12px",
                        borderRadius: "6px",
                        border: selectedDemoOption === "B" ? "2px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.2)",
                        background: selectedDemoOption === "B" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.06)",
                        color: "#ffffff",
                        fontSize: "11.5px",
                        fontWeight: 700,
                        textAlign: "left",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>Option B: It disappears completely.</span>
                      {selectedDemoOption === "B" && <span style={{ color: "#f87171", fontWeight: 900 }}>✕ INCORRECT</span>}
                    </button>
                  </div>

                  {selectedDemoOption === "A" && (
                    <div style={{ marginTop: "8px", padding: "6px 10px", background: "rgba(34, 197, 94, 0.15)", borderRadius: "6px", border: "1px solid #4ade80" }}>
                      <span style={{ fontSize: "10.5px", color: "#4ade80", fontWeight: 800 }}>
                        Coach {instructor} gives an approving nod:
                      </span>
                      <span style={{ fontSize: "11px", color: "#ffffff", marginLeft: "4px" }}>
                        "Exactly. Business growth equals asset growth. That is the entire foundation of equity investing."
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* PHASE 5: GRADUATION & SUMMARY */}
              {currentPhase === 5 && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                    <span style={{ fontSize: "15px" }}>🎓</span>
                    <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#4ade80", textTransform: "uppercase", letterSpacing: "1px" }}>
                      LECTURE COMPLETED • +20 XP AWARDED
                    </span>
                  </div>

                  <h3 className="smartboard-phase-h2" style={{ fontSize: "18px", fontWeight: 800, color: "#ffffff", margin: "0 0 5px", letterSpacing: "-0.02em" }}>
                    Lesson 1 Theory Mastered!
                  </h3>

                  <p className="smartboard-phase-p" style={{ fontSize: "11.5px", color: "#cbd5e1", lineHeight: 1.35, margin: "0 0 8px" }}>
                    "Oya, that is lesson one done. You now know the definitions, the terms, and how the market works—no economics degree required."
                  </p>

                  {/* Pocket Cheat Sheet */}
                  <div style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "6px", padding: "8px 12px" }}>
                    <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.8px", display: "block", marginBottom: "5px" }}>
                      📋 POCKET SUMMARY:
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "11px" }}>
                      <div style={{ color: "#e2e8f0" }}>• <strong>Shares:</strong> Legal micro-ownership</div>
                      <div style={{ color: "#e2e8f0" }}>• <strong>Dividends:</strong> Direct profit cash reward</div>
                      <div style={{ color: "#e2e8f0" }}>• <strong>NGX:</strong> Safe SEC-regulated market</div>
                      <div style={{ color: "#e2e8f0" }}>• <strong>Growth:</strong> Profits drive share value</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* C. Smart Board Bottom Metallic Pen Tray */}
          <div
            style={{
              height: "8px",
              minHeight: "8px",
              flexShrink: 0,
              background: "#0f172a",
              borderTop: "1.5px solid #334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "14px",
            }}
          >
            <div style={{ width: "32px", height: "3px", background: "#ef4444", borderRadius: "2px" }} />
            <div style={{ width: "32px", height: "3px", background: "#38bdf8", borderRadius: "2px" }} />
            <div style={{ width: "32px", height: "3px", background: "#4ade80", borderRadius: "2px" }} />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM ZONE (EXCLUDED FROM THE BOARD AS SPECIFIED)                     */}
      {/* "← PREVIOUS | Phase X of 5 | NEXT BEAT → | 🎯 TAKE PRACTICE DRILL "       */}
      {/* ========================================================================= */}
      <footer
        className="smartboard-footer-bar"
        style={{
          flexShrink: 0,
          borderTop: "1px solid #e2e8f0",
          background: "#ffffff",
          padding: "8px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 -2px 10px rgba(3, 3, 29, 0.04)",
          zIndex: 10,
        }}
      >
        <div
          className="smartboard-footer-inner"
          style={{
            maxWidth: "1180px",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "14px",
          }}
        >
          {/* Left: Previous Button */}
          <button
            type="button"
            disabled={currentPhase === 1}
            onClick={handlePrevPhase}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: currentPhase === 1 ? "#f1f5f9" : "#ffffff",
              color: currentPhase === 1 ? "#94a3b8" : "#24248f",
              border: currentPhase === 1 ? "1px solid #e2e8f0" : "1.5px solid #cbd5e1",
              fontSize: "12px",
              fontWeight: 800,
              cursor: currentPhase === 1 ? "not-allowed" : "pointer",
              transition: "all 0.12s ease",
            }}
          >
            ← PREVIOUS
          </button>

          {/* Center: Stage Indicator */}
          <div className="smartboard-phase-indicator" style={{ fontSize: "12px", color: "#64748b", fontWeight: 700 }}>
            Phase {currentPhase} of 5: <span style={{ color: "#03031d", fontWeight: 800 }}>{activePhaseInfo.title}</span>
          </div>

          {/* Right Action Group: NEXT BEAT & TAKE PRACTICE DRILL */}
          <div className="smartboard-footer-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {currentPhase < 5 && (
              <button
                type="button"
                onClick={handleNextPhase}
                style={{
                  padding: "9px 20px",
                  borderRadius: "6px",
                  background: "#24248f",
                  color: "#ffffff",
                  border: "none",
                  fontSize: "12px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "0 3px 0 #11115c",
                  transition: "all 0.12s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>NEXT BEAT</span>
                <span>→</span>
              </button>
            )}

            {/* TAKE PRACTICE DRILL BUTTON */}
            <button
              type="button"
              onClick={onProceedToPractice}
              style={{
                padding: "9px 20px",
                borderRadius: "6px",
                background: "#16a34a",
                color: "#ffffff",
                border: "none",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 3px 0 #15803d",
                transition: "all 0.12s ease",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>🎯 PRACTICE (+40 XP)</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
