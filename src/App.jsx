import { useState, useRef, useCallback } from "react";
import "./index.css";
import { ROLES } from "./constants.js";
import { S, FONTS } from "./styles.js";
import { analyzeResume, fetchLiveJobs, aiRewriteResume, aiApplySuggestion } from "./api.js";
import { extractTextFromUpload } from "./fileUtils.js";
import ScoreRing from "./components/ScoreRing.jsx";
import SectionBar from "./components/SectionBar.jsx";
import JobCard from "./components/JobCard.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const {
    user, plan, loading: authLoading, scansUsed,
    logout, canScan, incrementScanCount, upgradeToPremium, downgradeToFree,
  } = useAuth();

  const [page, setPage]           = useState("landing");
  const [activeTab, setActiveTab] = useState("analyze");

  // Resume
  const [inputMode, setInputMode]       = useState("text");
  const [resumeText, setResumeText]     = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragOver, setDragOver]         = useState(false);
  const [targetRole, setTargetRole]     = useState("software engineer");
  const [analysis, setAnalysis]         = useState(null);
  const [analyzing, setAnalyzing]       = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  // Editor
  const [editedResume, setEditedResume]             = useState("");
  const [originalResume, setOriginalResume]         = useState("");
  const [editorView, setEditorView]                 = useState("edit");
  const [applyingIdx, setApplyingIdx]               = useState(null);
  const [rewriting, setRewriting]                   = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState([]);
  const [copySuccess, setCopySuccess]               = useState(false);

  // Jobs
  const [jobs, setJobs]               = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError]     = useState("");
  const [jobsRole, setJobsRole]       = useState("software engineer");
  const [jobsFetched, setJobsFetched] = useState(false);

  const fileRef = useRef();

  const handleFileDrop = useCallback((file) => {
    if (!file) return;
    if (!file.name.match(/\.(pdf|txt|doc|docx)$/i)) {
      setAnalyzeError("Please upload PDF, TXT, or DOC/DOCX."); return;
    }
    setUploadedFile(file); setAnalyzeError("");
  }, []);

  const handleAnalyze = async () => {
    setAnalyzeError("");
    if (!canScan()) {
      setAnalyzeError("You've used all 3 free scans this month. Upgrade to Premium for unlimited.");
      return;
    }
    let text = "";
    if (inputMode === "file") {
      if (!uploadedFile) { setAnalyzeError("Please upload a resume file."); return; }
      setAnalyzing(true);
      try { text = await extractTextFromUpload(uploadedFile); }
      catch (e) { setAnalyzeError(e.message || "Failed to read file. Try pasting text."); setAnalyzing(false); return; }
    } else {
      text = resumeText.trim();
      if (!text) { setAnalyzeError("Please paste your resume text."); return; }
      setAnalyzing(true);
    }
    try {
      const result = await analyzeResume(text, targetRole);
      await incrementScanCount();
      setAnalysis(result);
      setEditedResume(text);
      setOriginalResume(text);
      setAppliedSuggestions([]);
      setActiveTab("results");
    } catch (e) { setAnalyzeError(e.message || "Analysis failed. Please try again."); }
    setAnalyzing(false);
  };

  const handleFetchJobs = async () => {
    setJobsLoading(true); setJobsError(""); setJobs([]);
    try {
      const result = await fetchLiveJobs(jobsRole);
      setJobs(result); setJobsFetched(true);
    } catch (e) { setJobsError(e.message || "Could not fetch jobs."); }
    setJobsLoading(false);
  };

  const roleLabel    = ROLES.find(r => r.value === targetRole)?.label || targetRole;
  const jobRoleLabel = ROLES.find(r => r.value === jobsRole)?.label   || jobsRole;

  // ── Spinner ───────────────────────────────────────────────────────────────
  const Spin = ({ dark } = {}) => (
    <span style={{ width: 13, height: 13, border: `2px solid ${dark ? "#000" : "#64748b"}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
  );

  // ── Bottom nav config ─────────────────────────────────────────────────────
  const NAV_TABS = [
    { id: "analyze",  icon: "🎯", label: "Analyze" },
    { id: "results",  icon: "📊", label: "Results" },
    { id: "editor",   icon: "✏️", label: "Editor" },
    { id: "jobs",     icon: "💼", label: "Jobs" },
    { id: "upgrade",  icon: plan === "premium" ? "⭐" : "🔓", label: plan === "premium" ? "Premium" : "Upgrade" },
  ];

  // ── Auth loading ──────────────────────────────────────────────────────────
  if (authLoading) return (
    <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <style>{FONTS}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1e293b", borderTopColor: "#00D9A3", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading ResumeIQ…</div>
      </div>
    </div>
  );

  // ── Auth page ─────────────────────────────────────────────────────────────
  if (!user && page === "auth") return (
    <AuthPage onSuccess={() => setPage("app")} onBack={() => setPage("landing")} />
  );

  // ── Landing page ──────────────────────────────────────────────────────────
  if (!user) return (
    <div style={S.root}>
      <style>{FONTS}</style>
      <nav className="landing-nav">
        <div className="top-nav-logo">ResumeIQ</div>
        <div className="nav-btns" style={{ display: "flex", gap: 8 }}>
          <button style={{ ...S.btn("ghost"), padding: "8px 16px", fontSize: 13 }} onClick={() => setPage("auth")}>Log in</button>
          <button style={{ ...S.btn(), padding: "8px 16px", fontSize: 13 }} onClick={() => setPage("auth")}>Get Started Free</button>
        </div>
      </nav>

      <div className="landing-hero">
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: "radial-gradient(ellipse,#00D9A318,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ ...S.chip(), display: "inline-block", marginBottom: 16 }}>✦ AI-Powered · Live Jobs · All-in-One</div>
        <h1>
          Score your resume. Get AI feedback.<br />
          <span style={{ background: "linear-gradient(135deg,#00D9A3,#0284c7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Find real jobs — all in one place.
          </span>
        </h1>
        <p>Upload or paste your resume, pick a role, and get an instant AI score + live job listings. No more switching platforms.</p>
        <div className="landing-hero-btns">
          <button style={{ ...S.btn(), padding: "13px 28px", fontSize: 15 }} onClick={() => setPage("auth")}>Analyze My Resume →</button>
          <button style={{ ...S.btn("ghost"), padding: "13px 28px", fontSize: 15 }} onClick={() => setPage("auth")}>Sign In</button>
        </div>
      </div>

      <div className="features-grid">
        {[
          { icon: "📎", title: "Upload or Paste",   desc: "PDF, DOC, TXT or paste text", free: true },
          { icon: "🎯", title: "AI Resume Score",   desc: "0–100 score + grade", free: true },
          { icon: "✨", title: "Smart Suggestions", desc: "Tailored for your role", free: true },
          { icon: "🌐", title: "Live Job Search",   desc: "Real listings by AI", free: "3 searches" },
          { icon: "✏️", title: "Resume Editor",     desc: "AI fixes one by one", free: true },
          { icon: "♾️", title: "Unlimited Scans",   desc: "No monthly limits", premium: true },
        ].map(f => (
          <div key={f.title} style={{ ...S.card, padding: 16, position: "relative" }}>
            {f.premium && <div style={{ position: "absolute", top: 10, right: 10, ...S.chip("#F59E0B"), fontSize: 9, padding: "2px 8px" }}>PRO</div>}
            <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{f.title}</div>
            <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>{f.desc}</div>
            {f.free && <div style={{ marginTop: 8, ...S.chip(), display: "inline-block", fontSize: 10, padding: "2px 8px" }}>{f.free === true ? "Free" : f.free}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  // ── MAIN APP ──────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <style>{FONTS}</style>

      {/* ── Top Nav ── */}
      <nav className="top-nav">
        <div className="top-nav-logo">ResumeIQ</div>

        {/* Desktop tabs */}
        <div className="top-nav-tabs">
          {NAV_TABS.map(({ id, icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: activeTab === id ? "#1e293b" : "transparent", color: activeTab === id ? "#f1f5f9" : "#64748b", transition: "all 0.15s", position: "relative" }}>
              {icon} {label}
              {id === "editor" && appliedSuggestions.length > 0 && <span style={{ position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#00D9A3" }} />}
            </button>
          ))}
        </div>

        {/* Desktop user info */}
        <div className="top-nav-user">
          {plan === "free" && <div style={{ ...S.chip("#64748b"), fontSize: 10 }}>{3 - Math.min(scansUsed, 3)} left</div>}
          <div style={{ ...S.chip(plan === "premium" ? "#F59E0B" : "#475569"), fontSize: 10 }}>{plan === "premium" ? "⭐ Pro" : "Free"}</div>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#00D9A3,#0284c7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#000" }}>
            {(user?.displayName || user?.email || "U")[0].toUpperCase()}
          </div>
          <button style={{ ...S.btn("ghost"), padding: "6px 12px", fontSize: 12 }} onClick={() => { logout(); setAnalysis(null); }}>Out</button>
        </div>
      </nav>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          {NAV_TABS.map(({ id, icon, label }) => (
            <button key={id} className={`bottom-nav-item ${activeTab === id ? "active" : ""}`} onClick={() => setActiveTab(id)}>
              {id === "editor" && appliedSuggestions.length > 0 && <span className="bottom-nav-dot" />}
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
          {/* Logout button on mobile */}
          <button className="bottom-nav-item" onClick={() => { logout(); setAnalysis(null); }}>
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Page content ── */}
      <div className="page-content">

        {/* ── ANALYZE TAB ─────────────────────────────────────────────────── */}
        {activeTab === "analyze" && (
          <div>
            <h1 style={{ fontFamily: "Syne,sans-serif", marginBottom: 4 }}>Analyze Resume</h1>
            <p style={{ color: "#64748b", fontSize: 14, marginBottom: 20 }}>Upload or paste your resume, pick a role, get an AI score.</p>

            <div className="analyze-grid">
              {/* Left: input */}
              <div>
                <div className="toggle-group">
                  {[["text", "✏️ Paste Text"], ["file", "📎 Upload File"]].map(([m, lbl]) => (
                    <button key={m} onClick={() => { setInputMode(m); setAnalyzeError(""); }}
                      style={{ padding: "8px 16px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: inputMode === m ? "#1e293b" : "transparent", color: inputMode === m ? "#f1f5f9" : "#64748b", transition: "all 0.15s" }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {inputMode === "text" ? (
                  <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} rows={14}
                    className="resume-textarea"
                    placeholder={"Paste your resume here...\n\n• Work experience with dates\n• Skills and technologies\n• Education\n• Summary"}
                    style={{ ...S.inp, fontFamily: "inherit", lineHeight: 1.65, fontSize: 13, minHeight: 280 }} />
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.files[0]); }}
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${dragOver ? "#00D9A3" : "#1e293b"}`, borderRadius: 14, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? "#00D9A308" : "#0f172a", transition: "all 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 200 }}>
                    <input ref={fileRef} type="file" accept=".pdf,.txt,.doc,.docx" style={{ display: "none" }} onChange={e => { if (e.target.files[0]) handleFileDrop(e.target.files[0]); }} />
                    {uploadedFile ? (
                      <>
                        <div style={{ fontSize: 34 }}>✅</div>
                        <div style={{ fontWeight: 700, color: "#00D9A3", fontSize: 14 }}>{uploadedFile.name}</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>{(uploadedFile.size / 1024).toFixed(1)} KB</div>
                        <button onClick={e => { e.stopPropagation(); setUploadedFile(null); }} style={{ ...S.btn("ghost"), padding: "5px 12px", fontSize: 11 }}>Remove</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 38 }}>📄</div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Drop resume here</div>
                        <div style={{ color: "#64748b", fontSize: 12 }}>PDF, DOC, DOCX, TXT</div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right: settings card */}
              <div style={S.card}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 7, letterSpacing: 1 }}>TARGET ROLE</label>
                <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ ...S.inp, marginBottom: 16 }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                </select>

                {analyzeError && <div style={{ background: "#EF444420", color: "#EF4444", padding: "10px 12px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>{analyzeError}</div>}

                <button style={{ ...S.btn(), width: "100%", padding: 13, fontSize: 15, opacity: analyzing ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  onClick={handleAnalyze} disabled={analyzing}>
                  {analyzing ? <><Spin dark />Analyzing…</> : "✦ Analyze Resume"}
                </button>

                {plan === "free" && (
                  <div style={{ marginTop: 12, padding: "10px 12px", background: "#F59E0B0e", border: "1px solid #F59E0B2a", borderRadius: 9, fontSize: 12, color: "#F59E0B" }}>
                    ⚡ {3 - Math.min(scansUsed, 3)} free scans left<br />
                    <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setActiveTab("upgrade")}>Upgrade for unlimited →</span>
                  </div>
                )}

                <div style={{ marginTop: 18, borderTop: "1px solid #1e293b", paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10, letterSpacing: 1 }}>YOU'LL GET</div>
                  {["AI score & grade", "5 section scores", "Improvements", "ATS keywords"].map(i => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6, fontSize: 12, color: "#64748b" }}>
                      <span style={{ color: "#00D9A3" }}>✓</span>{i}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS TAB ─────────────────────────────────────────────────── */}
        {activeTab === "results" && (
          <div>
            {!analysis ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
                <h2 style={{ fontFamily: "Syne,sans-serif", marginBottom: 8 }}>No analysis yet</h2>
                <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>Analyze your resume to see results here.</p>
                <button style={S.btn()} onClick={() => setActiveTab("analyze")}>Analyze Resume</button>
              </div>
            ) : (
              <div>
                <div className="result-header">
                  <div>
                    <h1 style={{ fontFamily: "Syne,sans-serif", marginBottom: 3 }}>Resume Results</h1>
                    <p style={{ color: "#64748b", fontSize: 13 }}>Role: <strong style={{ color: "#f1f5f9" }}>{roleLabel}</strong></p>
                  </div>
                  <div className="result-header-btns">
                    <button style={{ ...S.btn("ghost"), padding: "8px 14px", fontSize: 13 }} onClick={() => setActiveTab("analyze")}>Re-analyze</button>
                    <button style={{ ...S.btn("default"), background: "#1e293b", color: "#f1f5f9", padding: "8px 14px", fontSize: 13 }} onClick={() => setActiveTab("editor")}>✏️ Edit</button>
                    <button style={{ ...S.btn(), padding: "8px 14px", fontSize: 13 }} onClick={() => { setJobsRole(targetRole); setActiveTab("jobs"); }}>Jobs →</button>
                  </div>
                </div>

                <div className="results-top-grid">
                  <div style={{ ...S.card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
                    <div className="score-ring-wrap"><ScoreRing score={analysis.score} size={130} stroke={11} /></div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontFamily: "Syne,sans-serif", fontSize: 28, fontWeight: 800 }}>{analysis.grade}</div>
                      <div style={{ color: "#64748b", fontSize: 13 }}>Overall Grade</div>
                    </div>
                    <div style={{ background: "#1e293b", borderRadius: 9, padding: "10px 14px", width: "100%", fontSize: 12, color: "#94a3b8", lineHeight: 1.5, textAlign: "center" }}>{analysis.summary}</div>
                  </div>
                  <div style={{ ...S.card, padding: 20 }}>
                    <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Section Breakdown</div>
                    {Object.entries(analysis.sections).map(([k, v]) => <SectionBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} />)}
                  </div>
                </div>

                <div className="results-bottom-grid">
                  <div style={{ ...S.card, padding: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: "#00D9A3", fontSize: 13 }}>✓ Strengths</div>
                    {analysis.strengths.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "#94a3b8", alignItems: "flex-start" }}>
                        <span style={{ color: "#00D9A3", flexShrink: 0, marginTop: 2 }}>●</span>{s}
                      </div>
                    ))}
                  </div>
                  <div style={{ ...S.card, padding: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: "#F59E0B", fontSize: 13 }}>↑ Improvements</div>
                    {analysis.improvements.map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, fontSize: 13, color: "#94a3b8", alignItems: "flex-start" }}>
                        <span style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }}>●</span>{s}
                      </div>
                    ))}
                  </div>
                  <div style={{ ...S.card, padding: 18 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: "#EF4444", fontSize: 13 }}>⚠ Missing Keywords</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {analysis.keywords_missing.map(k => (
                        <span key={k} style={{ background: "#EF444420", color: "#EF4444", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{k}</span>
                      ))}
                    </div>
                    <div style={{ marginTop: 12, padding: 10, background: "#1e293b", borderRadius: 8, fontSize: 11, color: "#64748b" }}>
                      💡 Add these keywords for ATS filters.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR TAB ──────────────────────────────────────────────────── */}
        {activeTab === "editor" && (
          <div>
            {!analysis ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 44, marginBottom: 12 }}>✏️</div>
                <h2 style={{ fontFamily: "Syne,sans-serif", marginBottom: 8 }}>Analyze first</h2>
                <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>Run an analysis to unlock the resume editor.</p>
                <button style={S.btn()} onClick={() => setActiveTab("analyze")}>Analyze Resume</button>
              </div>
            ) : (
              <div>
                <div className="editor-header">
                  <div>
                    <h1 style={{ fontFamily: "Syne,sans-serif", marginBottom: 3 }}>Resume Editor</h1>
                    <p style={{ color: "#64748b", fontSize: 13 }}>
                      <strong style={{ color: appliedSuggestions.length > 0 ? "#00D9A3" : "#64748b" }}>{appliedSuggestions.length} change{appliedSuggestions.length !== 1 ? "s" : ""}</strong> applied
                    </p>
                  </div>
                  <div className="editor-header-btns">
                    <div style={{ display: "flex", background: "#0f172a", borderRadius: 9, padding: 3, border: "1px solid #1e293b" }}>
                      {[["edit", "✏️"], ["diff", "🔀"]].map(([v, lbl]) => (
                        <button key={v} onClick={() => setEditorView(v)} style={{ padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: editorView === v ? "#1e293b" : "transparent", color: editorView === v ? "#f1f5f9" : "#64748b" }}>{lbl}</button>
                      ))}
                    </div>
                    {appliedSuggestions.length > 0 && (
                      <button style={{ ...S.btn("ghost"), padding: "7px 12px", fontSize: 12, color: "#EF4444", borderColor: "#EF444433" }}
                        onClick={() => { setEditedResume(originalResume); setAppliedSuggestions([]); }}>↺ Reset</button>
                    )}
                    <button style={{ ...S.btn("ghost"), padding: "7px 12px", fontSize: 12 }}
                      onClick={() => { navigator.clipboard.writeText(editedResume); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}>
                      {copySuccess ? "✓" : "📋"}
                    </button>
                    <button style={{ ...S.btn("gold"), padding: "7px 12px", fontSize: 12, opacity: rewriting ? 0.7 : 1 }}
                      disabled={rewriting}
                      onClick={async () => {
                        setRewriting(true);
                        try {
                          const rewritten = await aiRewriteResume(editedResume, targetRole, analysis.improvements, analysis.keywords_missing);
                          setEditedResume(rewritten);
                          setAppliedSuggestions(analysis.improvements.map((_, i) => i));
                        } catch { }
                        setRewriting(false);
                      }}>
                      {rewriting ? <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Spin />…</span> : "✦ AI Rewrite"}
                    </button>
                  </div>
                </div>

                <div className="editor-grid">
                  {/* Editor / Diff */}
                  <div>
                    {editorView === "edit" ? (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>EDIT YOUR RESUME</div>
                        <textarea value={editedResume} onChange={e => setEditedResume(e.target.value)} rows={22}
                          style={{ ...S.inp, fontFamily: "'DM Mono','Courier New',monospace", lineHeight: 1.7, fontSize: 12, minHeight: 360 }} />
                        <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>{editedResume.length} chars · {editedResume.split("\n").length} lines</div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 8 }}>CHANGES</div>
                        <div style={{ ...S.card, fontFamily: "'DM Mono','Courier New',monospace", fontSize: 12, lineHeight: 1.8, maxHeight: 420, overflowY: "auto", padding: 16 }}>
                          {(() => {
                            const orig = originalResume.split("\n");
                            const edited = editedResume.split("\n");
                            const rows = [];
                            for (let i = 0; i < Math.max(orig.length, edited.length); i++) {
                              const o = orig[i] ?? "", e = edited[i] ?? "";
                              if (o === e) rows.push(<div key={i} style={{ color: "#64748b", padding: "1px 0" }}>{e || " "}</div>);
                              else if (!o) rows.push(<div key={i} style={{ background: "#00D9A318", color: "#00D9A3", padding: "2px 6px", borderRadius: 4 }}>+ {e}</div>);
                              else if (!e) rows.push(<div key={i} style={{ background: "#EF444418", color: "#EF4444", padding: "2px 6px", borderRadius: 4, textDecoration: "line-through" }}>- {o}</div>);
                              else {
                                rows.push(<div key={`r${i}`} style={{ background: "#EF444418", color: "#EF4444", padding: "2px 6px", borderRadius: 4, textDecoration: "line-through" }}>- {o}</div>);
                                rows.push(<div key={`a${i}`} style={{ background: "#00D9A318", color: "#00D9A3", padding: "2px 6px", borderRadius: 4 }}>+ {e}</div>);
                              }
                            }
                            return rows.length ? rows : <div style={{ color: "#475569", textAlign: "center", padding: 30 }}>No changes yet.</div>;
                          })()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestions panel */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ ...S.card, padding: 18 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#F59E0B", marginBottom: 12 }}>↑ AI Suggestions</div>
                      {analysis.improvements.map((s, i) => {
                        const applied = appliedSuggestions.includes(i);
                        const isApplying = applyingIdx === i;
                        return (
                          <div key={i} style={{ marginBottom: 10, padding: "10px 12px", background: applied ? "#00D9A308" : "#020617", border: `1px solid ${applied ? "#00D9A333" : "#1e293b"}`, borderRadius: 10 }}>
                            <div style={{ fontSize: 12, color: applied ? "#00D9A3" : "#94a3b8", marginBottom: applied ? 0 : 8, lineHeight: 1.5 }}>
                              {applied && "✓ "}{s}
                            </div>
                            {!applied && (
                              <button disabled={isApplying || rewriting}
                                style={{ ...S.btn("ghost"), padding: "5px 10px", fontSize: 11, width: "100%", opacity: isApplying ? 0.7 : 1 }}
                                onClick={async () => {
                                  setApplyingIdx(i);
                                  try {
                                    const updated = await aiApplySuggestion(editedResume, s);
                                    setEditedResume(updated);
                                    setAppliedSuggestions(prev => [...prev, i]);
                                  } catch { }
                                  setApplyingIdx(null);
                                }}>
                                {isApplying ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><Spin />Applying…</span> : "⚡ Apply fix"}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ ...S.card, padding: 18 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#EF4444", marginBottom: 10 }}>⚠ Keywords</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                        {analysis.keywords_missing.map(k => (
                          <span key={k} onClick={() => setEditedResume(prev => prev + "\n" + k)}
                            style={{ background: "#EF444420", color: "#EF4444", borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #EF444433" }}>
                            + {k}
                          </span>
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: "#475569" }}>Tap to append keyword</div>
                    </div>

                    <div style={{ ...S.card, background: "#00D9A308", border: "1px solid #00D9A322", padding: 18 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Re-score edits</div>
                      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 12 }}>Re-analyze your edited resume.</div>
                      <button style={{ ...S.btn(), width: "100%", padding: 10, fontSize: 13 }}
                        onClick={() => { setResumeText(editedResume); setInputMode("text"); setActiveTab("analyze"); }}>
                        ↻ Re-analyze
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── JOBS TAB ────────────────────────────────────────────────────── */}
        {activeTab === "jobs" && (
          <div>
            <div className="jobs-header">
              <div>
                <h1 style={{ fontFamily: "Syne,sans-serif", marginBottom: 3 }}>Live Jobs</h1>
                <p style={{ color: "#64748b", fontSize: 13 }}>Real listings — updated on demand</p>
              </div>
              <div className="jobs-controls">
                <select value={jobsRole} onChange={e => { setJobsRole(e.target.value); setJobsFetched(false); setJobs([]); }}
                  style={{ ...S.inp, width: "auto", padding: "9px 12px", fontSize: 13 }}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.icon} {r.label}</option>)}
                </select>
                <button style={{ ...S.btn(), padding: "10px 18px", opacity: jobsLoading ? 0.7 : 1 }} onClick={handleFetchJobs} disabled={jobsLoading}>
                  {jobsLoading ? <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Spin dark />…</span> : jobsFetched ? "🔄" : "🔍 Search"}
                </button>
              </div>
            </div>

            {plan === "free" && (
              <div className="free-notice" style={{ marginBottom: 14, padding: "12px 14px", background: "#F59E0B0e", border: "1px solid #F59E0B28", borderRadius: 11, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 13, color: "#F59E0B" }}>🔒 Premium jobs locked</div>
                <button style={{ ...S.btn("gold"), padding: "7px 14px", fontSize: 12, whiteSpace: "nowrap" }} onClick={() => setActiveTab("upgrade")}>Unlock →</button>
              </div>
            )}

            {jobsError && (
              <div style={{ background: "#EF444422", color: "#EF4444", padding: "12px 14px", borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
                {jobsError} <button onClick={handleFetchJobs} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", textDecoration: "underline", fontSize: 13 }}>Retry</button>
              </div>
            )}

            {!jobsFetched && !jobsLoading && !jobsError && (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 48, marginBottom: 12, animation: "pulse 2s ease infinite" }}>🌐</div>
                <h2 style={{ fontFamily: "Syne,sans-serif", marginBottom: 8 }}>Find Live Jobs</h2>
                <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>Select a role and tap Search to find current openings.</p>
                <button style={{ ...S.btn(), padding: "12px 24px", fontSize: 14 }} onClick={handleFetchJobs}>🔍 Search {jobRoleLabel} Jobs</button>
              </div>
            )}

            {jobsLoading && (
              <div style={{ textAlign: "center", padding: "50px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12, animation: "pulse 1.4s ease infinite" }}>🔍</div>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 17, marginBottom: 6 }}>Searching…</div>
                <div style={{ color: "#64748b", fontSize: 13 }}>Finding {jobRoleLabel} openings</div>
              </div>
            )}

            {!jobsLoading && jobs.length > 0 && (
              <>
                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                  <strong style={{ color: "#f1f5f9" }}>{jobs.length}</strong> jobs for <strong style={{ color: "#00D9A3" }}>{jobRoleLabel}</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {jobs.map(job => <JobCard key={job.id} job={job} isPremium={plan === "premium"} onUpgrade={() => setActiveTab("upgrade")} />)}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── UPGRADE TAB ─────────────────────────────────────────────────── */}
        {activeTab === "upgrade" && (
          <div>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h1 style={{ fontFamily: "Syne,sans-serif", marginBottom: 8 }}>{plan === "premium" ? "⭐ You're Premium" : "Upgrade to Premium"}</h1>
              <p style={{ color: "#64748b", fontSize: 14 }}>{plan === "premium" ? "All features unlocked." : "Everything to land your dream job."}</p>
            </div>

            {plan !== "premium" && (
              <div className="pricing-grid">
                {[
                  { name: "Free", price: "$0/mo", features: ["3 resume scans/month", "Basic score & grade", "AI suggestions", "3 job searches", "Resume editor"], cta: "Current Plan", disabled: true },
                  { name: "Premium", price: "$12/mo", gold: true, features: ["Unlimited scans", "Full AI + ATS analysis", "All suggestions", "Unlimited job searches", "Apply links unlocked"], cta: "Upgrade Now →", action: () => upgradeToPremium() },
                ].map(p => (
                  <div key={p.name} style={{ ...S.card, border: p.gold ? "1px solid #F59E0B55" : "1px solid #1e293b", position: "relative", overflow: "hidden" }}>
                    {p.gold && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#F59E0B,#EF4444)" }} />}
                    {p.gold && <div style={{ position: "absolute", top: 12, right: 12, ...S.chip("#F59E0B"), fontSize: 9, padding: "2px 8px" }}>BEST</div>}
                    <div style={{ fontFamily: "Syne,sans-serif", fontWeight: 800, fontSize: 19, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 26, fontWeight: 800, color: p.gold ? "#F59E0B" : "#64748b", marginBottom: 14 }}>{p.price}</div>
                    {p.features.map(f => (
                      <div key={f} style={{ display: "flex", gap: 7, marginBottom: 7, fontSize: 12, color: "#94a3b8" }}>
                        <span style={{ color: p.gold ? "#F59E0B" : "#475569", flexShrink: 0 }}>✓</span>{f}
                      </div>
                    ))}
                    <button disabled={p.disabled} onClick={p.action}
                      style={{ ...S.btn(p.gold ? "gold" : "ghost"), width: "100%", marginTop: 14, padding: 11, opacity: p.disabled ? 0.5 : 1, cursor: p.disabled ? "default" : "pointer", fontSize: 13 }}>
                      {p.cta}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* WhatsApp upgrade button */}
            {plan !== "premium" && (
              <div style={{ ...S.card, maxWidth: 500, margin: "0 auto 28px", textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>Ready to upgrade?</div>
                <div style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>Pay via UPI and get Premium within 1 hour</div>
                <a href="https://wa.me/?text=Hi, I want to upgrade to ResumeIQ Premium"
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-block", background: "#25D366", color: "#fff", padding: "11px 24px", borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  💬 WhatsApp to Upgrade
                </a>
                <div style={{ marginTop: 10, color: "#475569", fontSize: 11 }}>UPI · Google Pay · PhonePe accepted</div>
              </div>
            )}

            {plan === "premium" && (
              <div style={{ maxWidth: 420, margin: "0 auto 28px", ...S.card, textAlign: "center", border: "1px solid #F59E0B44" }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>⭐</div>
                <h2 style={{ fontFamily: "Syne,sans-serif", marginBottom: 8 }}>Premium Active</h2>
                <p style={{ color: "#64748b", marginBottom: 16, fontSize: 14 }}>All features unlocked.</p>
                <button style={{ ...S.btn("ghost"), color: "#EF4444", borderColor: "#EF444433", fontSize: 13 }} onClick={() => downgradeToFree()}>Downgrade to Free</button>
              </div>
            )}

            <div className="trust-grid">
              {[["🔒", "Secure", "SSL encrypted"], ["💸", "Cancel Anytime", "No contracts"], ["⚡", "Instant", "Activate immediately"]].map(([icon, title, desc]) => (
                <div key={title} style={{ textAlign: "center", padding: 14 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
                  <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
