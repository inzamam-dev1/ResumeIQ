// ─── Shared style helpers ─────────────────────────────────────────────────────
export const S = {
  root: {
    minHeight: "100vh",
    background: "#020617",
    color: "#f1f5f9",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  btn: (v = "primary") => ({
    padding: "10px 22px",
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
    transition: "all 0.15s",
    ...(v === "primary"
      ? { background: "linear-gradient(135deg,#00D9A3,#0284c7)", color: "#000" }
      : v === "ghost"
      ? { background: "transparent", color: "#94a3b8", border: "1px solid #1e293b" }
      : v === "gold"
      ? { background: "linear-gradient(135deg,#F59E0B,#EF4444)", color: "#000" }
      : { background: "#1e293b", color: "#f1f5f9" }),
  }),
  inp: {
    width: "100%",
    padding: "11px 13px",
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 10,
    color: "#f1f5f9",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  card: {
    background: "#0f172a",
    border: "1px solid #1e293b",
    borderRadius: 16,
    padding: 24,
  },
  chip: (c = "#00D9A3") => ({
    background: `${c}22`,
    color: c,
    borderRadius: 20,
    padding: "4px 12px",
    fontSize: 12,
    fontWeight: 600,
  }),
};

export const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&family=Syne:wght@700;800&display=swap');`;
