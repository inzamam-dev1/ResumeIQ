import { S } from "../styles.js";

export default function LandingPage({ onLogin, onSignup }) {
  return (
    <div style={S.root}>
      {/* Nav */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 36px", borderBottom: "1px solid #0f172a" }}>
        <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, background: "linear-gradient(135deg,#00D9A3,#0284c7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ResumeIQ
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.btn("ghost")} onClick={onLogin}>Log in</button>
          <button style={S.btn()} onClick={onSignup}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "90px 20px 60px", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse,#00D9A318,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ ...S.chip(), display: "inline-block", marginBottom: 20 }}>✦ AI-Powered · Live Jobs · All-in-One</div>
        <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "clamp(34px,6vw,66px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 20px", maxWidth: 800, marginInline: "auto" }}>
          Score your resume. Get AI feedback.<br />
          <span style={{ background: "linear-gradient(135deg,#00D9A3,#0284c7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Find real jobs — all in one place.
          </span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 17, maxWidth: 500, marginInline: "auto", lineHeight: 1.65, marginBottom: 40 }}>
          Upload or paste your resume, pick a role, and get an instant AI score + live job listings. No more switching platforms.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button style={{ ...S.btn(), padding: "14px 32px", fontSize: 16 }} onClick={onSignup}>Analyze My Resume →</button>
          <button style={S.btn("ghost")} onClick={onLogin}>Sign In</button>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 16, maxWidth: 980, margin: "40px auto 80px", padding: "0 24px" }}>
        {[
          { icon: "📎", title: "Upload or Paste",    desc: "PDF, DOC, TXT upload or paste directly — both work", free: true },
          { icon: "🎯", title: "AI Resume Score",    desc: "Instant 0–100 score with section breakdown + grade", free: true },
          { icon: "✨", title: "Smart Suggestions",  desc: "AI-tailored improvements for your exact target role", free: true },
          { icon: "🌐", title: "Live Job Search",    desc: "Real job listings fetched by AI from top companies", free: "3 searches" },
          { icon: "🔍", title: "ATS Keyword Check",  desc: "See exactly which keywords you're missing for ATS", premium: true },
          { icon: "♾️", title: "Unlimited Scans",    desc: "Test as many resume versions as you need", premium: true },
        ].map(f => (
          <div key={f.title} style={{ ...S.card, position: "relative" }}>
            {f.premium && <div style={{ position: "absolute", top: 14, right: 14, ...S.chip("#F59E0B"), fontSize: 10 }}>PREMIUM</div>}
            <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{f.title}</div>
            <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>{f.desc}</div>
            {f.free && <div style={{ marginTop: 10, ...S.chip(), display: "inline-block", fontSize: 11 }}>{f.free === true ? "Free" : f.free}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
