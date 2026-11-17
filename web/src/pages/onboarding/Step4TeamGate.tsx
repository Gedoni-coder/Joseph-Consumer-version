import { useState } from "react";
import { Brand } from "../../components/ui/Brand";
import { TOP_EUROPEAN_CLUBS, type Team } from "../../types/tournament";

export type TeamChoiceData = {
  mode: "found" | "join";
  teamName: string;
  clubName: string;
  departmentOrRole: string;
  institution: string;
  locationState: string;
  referralLink: string;
};

export interface Step4TeamGateProps {
  userState?: string;
  userName?: string;
  onComplete: (data: TeamChoiceData) => void;
  onBack: () => void;
}

const PRE_EXISTING_TEAMS: Partial<Team>[] = [
  {
    id: "team-1",
    name: "Arsenal, Engineering, FUTO",
    clubName: "Arsenal",
    departmentOrRole: "Engineering",
    institution: "FUTO",
    state: "Imo",
    totalWeeklyXp: 980,
    members: Array(3).fill({ name: "Teammate" } as any),
  },
  {
    id: "team-2",
    name: "Real Madrid, Product Team, Paystack",
    clubName: "Real Madrid",
    departmentOrRole: "Product Team",
    institution: "Paystack",
    state: "Lagos",
    totalWeeklyXp: 1140,
    members: Array(4).fill({ name: "Teammate" } as any),
  },
  {
    id: "team-3",
    name: "Man City, Finance, OAU",
    clubName: "Manchester City",
    departmentOrRole: "Finance",
    institution: "OAU",
    state: "Osun",
    totalWeeklyXp: 820,
    members: Array(2).fill({ name: "Teammate" } as any),
  },
  {
    id: "team-4",
    name: "Barcelona, Medicine, UI",
    clubName: "Barcelona",
    departmentOrRole: "Medicine",
    institution: "University of Ibadan",
    state: "Oyo",
    totalWeeklyXp: 1050,
    members: Array(4).fill({ name: "Teammate" } as any),
  },
  {
    id: "team-5",
    name: "Liverpool, Marketing, Flutterwave",
    clubName: "Liverpool",
    departmentOrRole: "Marketing",
    institution: "Flutterwave",
    state: "Lagos",
    totalWeeklyXp: 740,
    members: Array(3).fill({ name: "Teammate" } as any),
  },
];

export function Step4TeamGate({
  userState = "Lagos",
  userName = "Player",
  onComplete,
  onBack,
}: Step4TeamGateProps) {
  const [activeTab, setActiveTab] = useState<"found" | "join">("found");

  // Found Team Fields
  const [selectedClub, setSelectedClub] = useState(TOP_EUROPEAN_CLUBS[2]); // Default Chelsea
  const [departmentOrRole, setDepartmentOrRole] = useState("Computer Science");
  const [institution, setInstitution] = useState("UNILAG");
  const [locationState, setLocationState] = useState(userState);

  // Transfer Market Search
  const [searchQuery, setSearchQuery] = useState("");

  const fullTeamName = `${selectedClub}, ${departmentOrRole}, ${institution}`;
  const inviteToken = "jph-" + Math.random().toString(36).substring(2, 8);
  const referralLink = `https://josephai.online/join?team=${inviteToken}`;

  const whatsappMessage = encodeURIComponent(
    `I (${userName}) just founded my financial team ${fullTeamName} on JOSEPH AI! 🏆 We are kicking off in the ${locationState} Premier League this week. If you want to auto-track your money, learn to trade, and help us qualify for the Champions League, tap the link to sign for my team now! ⚽💸 ${referralLink}`
  );

  const handleLaunchWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${whatsappMessage}`, "_blank");
    onComplete({
      mode: "found",
      teamName: fullTeamName,
      clubName: selectedClub,
      departmentOrRole,
      institution,
      locationState,
      referralLink,
    });
  };

  const handleJoinExisting = (team: Partial<Team>) => {
    onComplete({
      mode: "join",
      teamName: team.name || "",
      clubName: team.clubName || "",
      departmentOrRole: team.departmentOrRole || "",
      institution: team.institution || "",
      locationState: team.state || userState,
      referralLink: `https://josephai.online/join?team=${team.id}`,
    });
  };

  const filteredTeams = PRE_EXISTING_TEAMS.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.name?.toLowerCase().includes(q) ||
      t.institution?.toLowerCase().includes(q) ||
      t.state?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="auth-layout" style={{ minHeight: "100vh" }}>
      {/* Brand & Value Side Panel */}
      <aside>
        <div>
          <Brand />
          <p className="eyebrow" style={{ marginTop: "16px" }}>
            SEASON KICKOFF • ONBOARDING STEP 4 OF 4
          </p>
          <h1 style={{ marginTop: "24px", lineHeight: "1.08" }}>
            The Mandatory Team Gate.
          </h1>
          <p style={{ marginTop: "20px", fontSize: "15px", lineHeight: "1.6" }}>
            Every player competes as part of a 5-person squad representing their school, workplace, or city.
          </p>
        </div>

        <div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "12px",
              padding: "18px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "20px" }}>🎁</span>
              <strong style={{ fontSize: "14px", color: "#fff" }}>
                1-Month Free Premium Trial
              </strong>
            </div>
            <p style={{ fontSize: "12px", color: "#d2d5ec", margin: "8px 0 0" }}>
              Unlock 30 days of automated Open Banking sync, WhatsApp AI companion, and 1.25x Track Boosters immediately upon founding or joining your Team.
            </p>
          </div>
          <span style={{ display: "block", marginTop: "24px", fontSize: "11px", color: "#8a8ea8" }}>
            JOSEPH AI • NIGERIA (NGN)
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
          
          {/* Stepper Header */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", color: "#2563eb", textTransform: "uppercase" }}>
                Screen 4 of 4
              </span>
              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
                Team Gate & Trial Activation
              </span>
            </div>

            {/* Step Progress Bar - Full */}
            <div style={{ display: "flex", gap: "6px", height: "4px", width: "100%" }}>
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#2563eb", borderRadius: "99px" }} />
            </div>

            <h2 style={{ fontSize: "28px", fontWeight: "800", color: "#03031d", marginTop: "18px", letterSpacing: "-0.03em" }}>
              Claim your Squad
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              Found a brand new franchise or sign for an active team in the transfer market.
            </p>
          </div>

          {/* Toggle Tab between Option A and Option B */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#f1f5f9", padding: "4px", borderRadius: "10px", marginBottom: "20px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("found")}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "found" ? "#03031d" : "transparent",
                color: activeTab === "found" ? "#ffffff" : "#475569",
                fontWeight: "750",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Option A: Found a Team 🏆
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("join")}
              style={{
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: activeTab === "join" ? "#03031d" : "transparent",
                color: activeTab === "join" ? "#ffffff" : "#475569",
                fontWeight: "750",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Option B: Transfer Market 🔍
            </button>
          </div>

          {/* OPTION A: FOUND A TEAM */}
          {activeTab === "found" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "750", textTransform: "uppercase", color: "#1e293b", marginBottom: "6px" }}>
                  1. Select European Top Flight Club Name
                </label>
                <select
                  value={selectedClub}
                  onChange={(e) => setSelectedClub(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: "700",
                    color: "#03031d",
                    background: "#fff",
                    outline: "none",
                  }}
                >
                  {TOP_EUROPEAN_CLUBS.map((club) => (
                    <option key={club} value={club}>
                      {club}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "750", textTransform: "uppercase", color: "#1e293b", marginBottom: "6px" }}>
                    2. Department / Role
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={departmentOrRole}
                    onChange={(e) => setDepartmentOrRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: "750", textTransform: "uppercase", color: "#1e293b", marginBottom: "6px" }}>
                    3. Institution / Company
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. UNILAG or Paystack"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "11px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "13px",
                      fontWeight: "600",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "750", textTransform: "uppercase", color: "#1e293b", marginBottom: "6px" }}>
                  4. State League Pool
                </label>
                <select
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#03031d",
                  }}
                >
                  {["Lagos", "Abuja FCT", "Rivers", "Oyo", "Ogun", "Enugu", "Delta", "Kaduna", "Kano", "Edo"].map((s) => (
                    <option key={s} value={s}>
                      {s} Premier League
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Preview Card */}
              <div
                style={{
                  background: "#03031d",
                  color: "#ffffff",
                  borderRadius: "10px",
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: "6px",
                }}
              >
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "750", letterSpacing: "1px", color: "#93c5fd", textTransform: "uppercase" }}>
                    OFFICIAL REGISTERED TEAM IDENTITY
                  </span>
                  <div style={{ fontSize: "16px", fontWeight: "800", marginTop: "2px" }}>
                    "{fullTeamName}"
                  </div>
                </div>
                <span style={{ fontSize: "22px" }}>🛡️</span>
              </div>

              {/* WhatsApp Launch CTA */}
              <button
                type="button"
                onClick={handleLaunchWhatsApp}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "750",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 4px 14px rgba(22, 163, 74, 0.3)",
                  marginTop: "8px",
                }}
              >
                <span>📲</span> Found Team & Share to WhatsApp Status <span>→</span>
              </button>

              <p style={{ fontSize: "11px", color: "#64748b", textAlign: "center", margin: 0 }}>
                Your 30-day Premium trial begins immediately when your first teammate signs up through your link!
              </p>
            </div>
          )}

          {/* OPTION B: SEARCH TRANSFER MARKET */}
          {activeTab === "join" && (
            <div>
              <div style={{ marginBottom: "14px" }}>
                <input
                  type="text"
                  placeholder="Filter by school (UNILAG, FUTO), company, or state..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                {filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      background: "#ffffff",
                      borderRadius: "8px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "750", color: "#03031d" }}>
                        {team.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                        📍 {team.state} Pool • ⚡ {team.totalWeeklyXp} XP • 👥 {team.members?.length || 1}/5 Members
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJoinExisting(team)}
                      style={{
                        padding: "8px 14px",
                        background: "#03031d",
                        color: "#fff",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      Sign for Team ⚽
                    </button>
                  </div>
                ))}
              </div>

              <p style={{ fontSize: "11px", color: "#64748b", textAlign: "center" }}>
                Joining an existing active squad immediately activates your 30-Day Free Premium trial!
              </p>
            </div>
          )}

          {/* Back button */}
          <div style={{ marginTop: "18px" }}>
            <button
              type="button"
              onClick={onBack}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                background: "transparent",
                color: "#64748b",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Back to Tracking Preference
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}

