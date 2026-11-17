export function Brand() {
  return (
    <a className="brand" href="/" aria-label="JOSEPH AI home" style={{ display: "inline-flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "8px",
          background: "#24248f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "5px",
          boxShadow: "0 2px 8px rgba(36, 36, 143, 0.4)",
        }}
      >
        <img
          src="/brand/dove-transparent-white.png"
          alt="Joseph AI Dove"
          style={{ width: "28px", height: "28px", objectFit: "contain" }}
        />
      </div>
      <div>
        <span style={{ fontSize: "18px", fontWeight: 900, color: "#ffffff", letterSpacing: "0.5px", fontFamily: "Outfit, sans-serif" }}>
          JOSEPH <span style={{ color: "#60a5fa" }}>AI</span>
        </span>
        <span style={{ display: "block", fontSize: "9px", color: "#94a3b8", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
          Economic Operating System
        </span>
      </div>
    </a>
  );
}

