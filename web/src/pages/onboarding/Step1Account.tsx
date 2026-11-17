import { useState, type FormEvent } from "react";
import { Brand } from "../../components/ui/Brand";

export type AccountFormData = {
  firstName: string;
  lastName: string;
  age: number | "";
  email: string;
  phone: string;
  password: string;
};

export interface Step1AccountProps {
  initialData?: Partial<AccountFormData>;
  onNext: (data: AccountFormData) => void;
  onBackToLogin?: () => void;
}

export function Step1Account({ initialData, onNext, onBackToLogin }: Step1AccountProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    age: initialData?.age ?? "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    password: initialData?.password || "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation checks
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("Please enter your full first and last name.");
      return;
    }

    if (formData.age === "" || Number(formData.age) < 16) {
      setError("You must be at least 16 years old to compete in the financial league.");
      return;
    }

    if (!formData.email.includes("@") || !formData.email.includes(".")) {
      setError("Please enter a valid email address.");
      return;
    }

    // Nigerian phone format check (+234 or 070/080/081/090/091)
    const cleanedPhone = formData.phone.replace(/[\s-]/g, "");
    if (!/^(?:\+?234|0)[789][01]\d{8}$/.test(cleanedPhone)) {
      setError("Please enter a valid Nigerian mobile number (e.g. 08012345678 or +2348012345678).");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    onNext(formData);
  };

  return (
    <div className="auth-layout" style={{ minHeight: "100vh" }}>
      {/* Brand & Value Side Panel */}
      <aside>
        <div>
          <Brand />
          <p className="eyebrow" style={{ marginTop: "16px" }}>
            SEASON KICKOFF • ONBOARDING STEP 1 OF 4
          </p>
          <h1 style={{ marginTop: "24px", lineHeight: "1.08" }}>
            Create your Player Profile.
          </h1>
          <p style={{ marginTop: "20px", fontSize: "15px", lineHeight: "1.6" }}>
            Your player account tracks your weekly consistency streak, unlocks the NGX Market Simulator, and qualifies your team for the Champions League pyramid.
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
              <span style={{ fontSize: "20px" }}>⚽</span>
              <strong style={{ fontSize: "14px", color: "#fff" }}>
                Multiplayer Financial Tournament
              </strong>
            </div>
            <p style={{ fontSize: "12px", color: "#d2d5ec", margin: "8px 0 0" }}>
              Reach 350 XP weekly or lead your 5-person squad to 1,200 XP to advance from the State Premier League to the Regional Champions League.
            </p>
          </div>
          <span style={{ display: "block", marginTop: "24px", fontSize: "11px", color: "#8a8ea8" }}>
            JOSEPH AI • NIGERIA (NGN)
          </span>
        </div>
      </aside>

      {/* Account Creation Form */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div className="auth-form" style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>
          
          {/* Stepper Header */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.2px", color: "#2563eb", textTransform: "uppercase" }}>
                Screen 1 of 4
              </span>
            </div>
            
            {/* Step Progress Bar */}
            <div style={{ display: "flex", gap: "6px", height: "4px", width: "100%" }}>
              <div style={{ flex: 1, background: "#03031d", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "99px" }} />
              <div style={{ flex: 1, background: "#e2e8f0", borderRadius: "99px" }} />
            </div>

            <h2 style={{ fontSize: "32px", fontWeight: "800", color: "#03031d", marginTop: "20px", letterSpacing: "-0.03em" }}>
              Join the League
            </h2>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              Enter your basic player information to get started.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#b91c1c",
                borderRadius: "8px",
                padding: "12px 14px",
                fontSize: "13px",
                fontWeight: "600",
                marginBottom: "20px",
              }}
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Name Fields Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  First Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tolu"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#03031d",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adeniyi"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#03031d",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Age & Mobile Row */}
            <div style={{ display: "grid", gridTemplateColumns: "90px 1fr", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                  Age
                </label>
                <input
                  type="number"
                  min="16"
                  max="120"
                  required
                  placeholder="24"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value === "" ? "" : Number(e.target.value) })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#03031d",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Phone Number
                  </label>
                  <span style={{ fontSize: "10px", color: "#2563eb", fontWeight: "700" }}>
                    📲 For WhatsApp Duels
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="0801 234 5678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    color: "#03031d",
                    fontWeight: "600",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="tolu@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  color: "#03031d",
                  fontWeight: "600",
                  outline: "none",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#64748b",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  color: "#03031d",
                  fontWeight: "600",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginTop: "4px" }}>
                Must be at least 8 characters with numbers or symbols.
              </span>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="button"
              style={{
                width: "100%",
                padding: "14px 20px",
                background: "#03031d",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "15px",
                cursor: "pointer",
                marginTop: "10px",
                boxShadow: "0 4px 14px rgba(3, 3, 29, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              Next: Budgeting Setup <span>→</span>
            </button>
          </form>

          {/* Switch to Login */}
          <div style={{ marginTop: "24px", textAlign: "center", fontSize: "13px", color: "#64748b" }}>
            Already have an active squad?{" "}
            <button
              type="button"
              onClick={onBackToLogin}
              style={{
                background: "none",
                border: "none",
                color: "#03031d",
                fontWeight: "700",
                cursor: "pointer",
                textDecoration: "underline",
                padding: 0,
              }}
            >
              Sign in to pick up where you left off
            </button>
          </div>

        </div>
      </section>
    </div>
  );
}

