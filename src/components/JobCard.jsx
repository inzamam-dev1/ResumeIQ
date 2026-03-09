export default function JobCard({ job, isPremium, onUpgrade }) {
  const locked = !isPremium && job.match >= 88;

  return (
    <div
      style={{
        background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14,
        padding: "18px 20px", position: "relative", overflow: "hidden", transition: "all 0.2s"
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#334155"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.transform = "none"; }}
    >
      {locked && (
        <div style={{
          position: "absolute", inset: 0, background: "rgba(2,6,23,0.9)", zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 10, borderRadius: 14, backdropFilter: "blur(3px)"
        }}>
          <span style={{ fontSize: 28 }}>🔒</span>
          <span style={{ color: "#F59E0B", fontSize: 13, fontWeight: 700 }}>Premium · High Match Job</span>
          <button
            onClick={onUpgrade}
            style={{
              background: "linear-gradient(135deg,#F59E0B,#EF4444)", border: "none",
              borderRadius: 8, color: "#000", padding: "9px 22px", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}
          >
            Unlock Premium →
          </button>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12, background: job.color || "#334155",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 18, flexShrink: 0,
          boxShadow: `0 0 18px ${job.color || "#334155"}44`
        }}>
          {job.logo}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{job.title}</div>
              <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>{job.company} · {job.location}</div>
            </div>
            <div style={{
              background: job.match >= 85 ? "#00D9A322" : "#F59E0B22",
              color: job.match >= 85 ? "#00D9A3" : "#F59E0B",
              borderRadius: 20, padding: "3px 11px", fontSize: 12, fontWeight: 700, flexShrink: 0
            }}>
              {job.match}% match
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {(job.tags || []).map(t => (
              <span key={t} style={{ background: "#1e293b", color: "#94a3b8", borderRadius: 6, padding: "2px 8px", fontSize: 11 }}>
                {t}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
            <span style={{ color: "#00D9A3", fontWeight: 700, fontSize: 14 }}>{job.salary}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: "#475569", fontSize: 11 }}>{job.posted}</span>
              {!locked && (
                <a
                  href={job.applyUrl || "https://www.linkedin.com/jobs"}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: "#1e293b", color: "#00D9A3", borderRadius: 7, padding: "5px 13px",
                    fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid #00D9A333"
                  }}
                >
                  Apply →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
