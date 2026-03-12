import { useState, useRef, useEffect } from "react";
import { S } from "../styles.js";
import { sendInterviewMessage, buildInterviewSystemPrompt, generateSessionReport } from "../api.js";

const INTERVIEW_ROLES = [
  { value: "frontend developer",        label: "Frontend Developer",   icon: "🖥️" },
  { value: "backend developer",         label: "Backend Developer",    icon: "⚙️" },
  { value: "full stack developer",      label: "Full Stack Developer", icon: "🔀" },
  { value: "software engineer",         label: "Software Engineer",    icon: "💻" },
  { value: "data scientist",            label: "Data Scientist",       icon: "📊" },
  { value: "machine learning engineer", label: "ML / AI Engineer",     icon: "🤖" },
  { value: "devops engineer",           label: "DevOps Engineer",      icon: "☁️" },
  { value: "product manager",           label: "Product Manager",      icon: "📋" },
  { value: "ui ux designer",            label: "UI/UX Designer",       icon: "🎨" },
];

const TOTAL_QUESTIONS = 5;

function MiniScoreRing({ score, size = 90 }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#00D9A3" : score >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e293b" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease", strokeLinecap: "round" }}/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fill: color,
          fontSize: size * 0.24, fontWeight: 800, fontFamily: "inherit" }}>
        {score}
      </text>
    </svg>
  );
}

function ScoreBar({ label, value }) {
  const color = value >= 80 ? "#00D9A3" : value >= 60 ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>
        <span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 4, height: 6, overflow: "hidden" }}>
        <div style={{ width: `${value}%`, background: `linear-gradient(90deg,${color}88,${color})`,
          height: "100%", borderRadius: 4, transition: "width 1s ease" }}/>
      </div>
    </div>
  );
}

function parseAIMessage(text) {
  const feedbackMatch = text.match(/FEEDBACK:([\s\S]*?)(?:NEXT_QUESTION:|SESSION_COMPLETE|$)/i);
  const questionMatch = text.match(/NEXT_QUESTION:([\s\S]*?)(?:FEEDBACK:|$)/i);
  const isComplete = /SESSION_COMPLETE/i.test(text);
  return {
    feedback: feedbackMatch ? feedbackMatch[1].trim() : null,
    nextQuestion: questionMatch ? questionMatch[1].trim() : null,
    isComplete,
    raw: text,
  };
}

function extractScore(feedbackText) {
  if (!feedbackText) return null;
  const match = feedbackText.match(/Score:\s*(\d+)\s*\/\s*10/i);
  return match ? parseInt(match[1]) : null;
}

export default function InterviewTab({ plan, onUpgrade }) {
  const [screen, setScreen]   = useState("setup");
  const [mode, setMode]       = useState("technical");
  const [selectedRole, setSelectedRole] = useState("software engineer");
  const [messages, setMessages]         = useState([]);
  const [chatDisplay, setChatDisplay]   = useState([]);
  const [userInput, setUserInput]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [scores, setScores]             = useState([]);
  const [report, setReport]             = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const [voiceSupported] = useState(
    () => "webkitSpeechRecognition" in window || "SpeechRecognition" in window
  );
  const [ttsSupported] = useState(() => "speechSynthesis" in window);

  const recognitionRef = useRef(null);
  const chatEndRef     = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatDisplay]);

  const speak = (text) => {
    if (!voiceEnabled || !ttsSupported) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[✓✗💡🎤]/g, "").replace(/\*/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend   = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart  = () => setIsListening(true);
    recognition.onend    = () => setIsListening(false);
    recognition.onerror  = () => setIsListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setUserInput(prev => prev ? prev + " " + transcript : transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startInterview = async () => {
    setLoading(true);
    setQuestionCount(0);
    setScores([]);
    setChatDisplay([]);
    const systemPrompt  = buildInterviewSystemPrompt(selectedRole, mode, TOTAL_QUESTIONS);
    const initialMessages = [{ role: "system", content: systemPrompt }];
    try {
      const response = await sendInterviewMessage(initialMessages);
      const parsed   = parseAIMessage(response);
      const firstMsg = parsed.nextQuestion || parsed.raw;
      const updated  = [...initialMessages, { role: "assistant", content: response }];
      setMessages(updated);
      setChatDisplay([{ role: "ai", content: firstMsg, type: "question", questionNum: 1 }]);
      setQuestionCount(1);
      setScreen("interview");
      speak(firstMsg);
    } catch (e) { alert("Failed to start: " + e.message); }
    setLoading(false);
  };

  const sendAnswer = async () => {
    const answer = userInput.trim();
    if (!answer || loading) return;
    setUserInput("");
    setLoading(true);
    setChatDisplay(prev => [...prev, { role: "user", content: answer }]);
    const updated = [...messages, { role: "user", content: answer }];
    try {
      const response = await sendInterviewMessage(updated, 1200);
      const parsed   = parseAIMessage(response);
      const all      = [...updated, { role: "assistant", content: response }];
      setMessages(all);

      if (parsed.feedback) {
        const score = extractScore(parsed.feedback);
        if (score !== null) setScores(prev => [...prev, score]);
        setChatDisplay(prev => [...prev, { role: "ai", content: parsed.feedback, type: "feedback" }]);
        speak(parsed.feedback);
      }

      if (parsed.isComplete || questionCount >= TOTAL_QUESTIONS) {
        setScreen("report");
        setReportLoading(true);
        try {
          const raw   = await generateSessionReport(all, selectedRole, mode);
          const clean = raw.replace(/```json|```/g, "").trim();
          const match = clean.match(/\{[\s\S]*\}/);
          if (match) setReport(JSON.parse(match[0]));
        } catch { }
        setReportLoading(false);
      } else if (parsed.nextQuestion) {
        const nextQ = questionCount + 1;
        setQuestionCount(nextQ);
        setChatDisplay(prev => [...prev, {
          role: "ai", content: parsed.nextQuestion, type: "question", questionNum: nextQ,
        }]);
        speak(parsed.nextQuestion);
      }
    } catch {
      setChatDisplay(prev => [...prev, { role: "ai", content: "Something went wrong. Try again.", type: "error" }]);
    }
    setLoading(false);
  };

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10)
    : 0;

  const Spin = () => (
    <span style={{ width: 13, height: 13, border: "2px solid #64748b",
      borderTopColor: "transparent", borderRadius: "50%",
      display: "inline-block", animation: "spin 0.8s linear infinite" }}/>
  );

  // ── SETUP ────────────────────────────────────────────────────────────────────
  if (screen === "setup") return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>🎤</div>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 26, marginBottom: 6 }}>AI Mock Interview</h1>
        <p style={{ color: "#64748b", fontSize: 14, maxWidth: 420, marginInline: "auto" }}>
          Practice with a real AI interviewer. Get instant scores, feedback, and a full session report.
        </p>
      </div>

      {/* Mode */}
      <div style={{ maxWidth: 540, margin: "0 auto 22px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>PRACTICE MODE</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { id: "technical", icon: "💻", title: "Technical Interview",      desc: "Role-specific questions with detailed feedback" },
            { id: "english",   icon: "🗣️", title: "English Communication",   desc: "Improve fluency, grammar & vocabulary" },
          ].map(m => (
            <div key={m.id} onClick={() => setMode(m.id)} style={{
              ...S.card, cursor: "pointer", padding: 16, transition: "all 0.2s",
              border: `1px solid ${mode === m.id ? "#00D9A3" : "#1e293b"}`,
              background: mode === m.id ? "#00D9A308" : "#0f172a",
            }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.title}</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>{m.desc}</div>
              {mode === m.id && <div style={{ marginTop: 8, ...S.chip(), fontSize: 10, display: "inline-block" }}>Selected ✓</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Role picker */}
      {mode === "technical" && (
        <div style={{ maxWidth: 540, margin: "0 auto 22px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: 1, marginBottom: 10 }}>TARGET ROLE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {INTERVIEW_ROLES.map(r => (
              <div key={r.value} onClick={() => setSelectedRole(r.value)} style={{
                padding: "10px 8px", borderRadius: 10, textAlign: "center", cursor: "pointer", transition: "all 0.15s",
                border: `1px solid ${selectedRole === r.value ? "#00D9A3" : "#1e293b"}`,
                background: selectedRole === r.value ? "#00D9A308" : "#0f172a",
              }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{r.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: selectedRole === r.value ? "#00D9A3" : "#94a3b8" }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice toggle */}
      <div style={{ maxWidth: 540, margin: "0 auto 24px" }}>
        <div style={{ ...S.card, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>🔊 Voice Mode</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>
              {voiceSupported
                ? "AI reads questions aloud · Speak your answers"
                : "Not supported — use Chrome or Edge"}
            </div>
          </div>
          {voiceSupported && (
            <div onClick={() => setVoiceEnabled(!voiceEnabled)} style={{
              width: 44, height: 24, borderRadius: 12, cursor: "pointer",
              background: voiceEnabled ? "#00D9A3" : "#1e293b",
              position: "relative", transition: "background 0.2s", flexShrink: 0,
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3, transition: "left 0.2s",
                left: voiceEnabled ? 23 : 3,
              }}/>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ maxWidth: 540, margin: "0 auto 24px", padding: "12px 16px", background: "#F59E0B0e", border: "1px solid #F59E0B28", borderRadius: 10, display: "flex", gap: 20, flexWrap: "wrap" }}>
        {[["❓", `${TOTAL_QUESTIONS} questions`], ["📊", "Score per answer"], ["📋", "Full report"]].map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#F59E0B" }}>
            {icon} {text}
          </div>
        ))}
      </div>

      {/* Start */}
      <div style={{ textAlign: "center" }}>
        <button style={{ ...S.btn(), padding: "13px 36px", fontSize: 15, opacity: loading ? 0.7 : 1, display: "inline-flex", alignItems: "center", gap: 8 }}
          onClick={startInterview} disabled={loading}>
          {loading ? <><Spin/>Starting…</> : "🎤 Start Interview"}
        </button>
        <div style={{ marginTop: 10, color: "#475569", fontSize: 12 }}>Free: 3 sessions/month · Premium: unlimited</div>
      </div>
    </div>
  );

  // ── INTERVIEW ─────────────────────────────────────────────────────────────────
  if (screen === "interview") return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 20, marginBottom: 2 }}>
            {mode === "english" ? "🗣️ English Practice" : `💻 ${INTERVIEW_ROLES.find(r => r.value === selectedRole)?.label}`}
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>Question {Math.min(questionCount, TOTAL_QUESTIONS)} of {TOTAL_QUESTIONS}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Progress dots */}
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", transition: "background 0.3s",
                background: i < questionCount ? "#00D9A3" : "#1e293b" }}/>
            ))}
          </div>
          {scores.length > 0 && (
            <div style={{ ...S.chip(avgScore >= 70 ? "#00D9A3" : "#F59E0B"), fontSize: 11 }}>
              Avg {avgScore}/100
            </div>
          )}
          {isSpeaking && <div style={{ ...S.chip("#0284c7"), fontSize: 10 }}>🔊 Speaking…</div>}
          <button style={{ ...S.btn("ghost"), padding: "6px 12px", fontSize: 12 }}
            onClick={() => { window.speechSynthesis?.cancel(); setScreen("setup"); }}>
            End
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: "#1e293b", borderRadius: 4, height: 4, marginBottom: 18, overflow: "hidden" }}>
        <div style={{ width: `${(questionCount / TOTAL_QUESTIONS) * 100}%`, height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg,#00D9A3,#0284c7)", transition: "width 0.5s ease" }}/>
      </div>

      {/* Chat */}
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14,
        padding: 16, minHeight: 320, maxHeight: 400, overflowY: "auto",
        marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>

        {chatDisplay.map((msg, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start",
            flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              background: msg.role === "user" ? "linear-gradient(135deg,#00D9A3,#0284c7)"
                : msg.type === "feedback" ? "#F59E0B22" : "#1e293b",
              border: msg.type === "feedback" ? "1px solid #F59E0B44" : "none",
            }}>
              {msg.role === "user" ? "👤" : msg.type === "feedback" ? "📊" : "🤖"}
            </div>
            <div style={{
              maxWidth: "78%", padding: "11px 13px", fontSize: 13, lineHeight: 1.6, color: "#f1f5f9",
              borderRadius: msg.role === "user" ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
              background: msg.role === "user" ? "#00D9A310"
                : msg.type === "feedback" ? "#F59E0B08" : "#1e293b",
              border: msg.role === "user" ? "1px solid #00D9A330"
                : msg.type === "feedback" ? "1px solid #F59E0B30" : "1px solid #334155",
            }}>
              {msg.type === "question" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00D9A3", letterSpacing: 1, marginBottom: 5 }}>
                  QUESTION {msg.questionNum}
                </div>
              )}
              {msg.type === "feedback" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#F59E0B", letterSpacing: 1, marginBottom: 5 }}>
                  FEEDBACK
                </div>
              )}
              {msg.type === "feedback" ? (
                <div>
                  {msg.content.split("\n").map((line, li) => (
                    <div key={li} style={{ marginBottom: line.trim() ? 3 : 1,
                      color: /^Score:/i.test(line) ? "#f1f5f9"
                        : line.startsWith("✓") ? "#00D9A3"
                        : line.startsWith("✗") ? "#EF4444"
                        : line.startsWith("💡") ? "#F59E0B" : "#94a3b8",
                      fontWeight: /^Score:/i.test(line) ? 700 : 400,
                    }}>
                      {line}
                    </div>
                  ))}
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1e293b",
              display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
            <div style={{ padding: "10px 14px", background: "#1e293b", borderRadius: "4px 14px 14px 14px",
              border: "1px solid #334155", display: "flex", gap: 4, alignItems: "center" }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#64748b",
                  animation: "pulse 1.2s ease infinite", animationDelay: `${i*0.2}s` }}/>
              ))}
            </div>
          </div>
        )}
        <div ref={chatEndRef}/>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
            placeholder={isListening ? "🎤 Listening… speak now" : "Type your answer… (Enter to send)"}
            rows={3}
            disabled={loading}
            style={{ ...S.inp, fontFamily: "inherit", lineHeight: 1.6, fontSize: 13,
              paddingRight: voiceEnabled ? 48 : 14, resize: "none",
              border: isListening ? "1px solid #00D9A3" : "1px solid #1e293b",
              background: isListening ? "#00D9A308" : "#0f172a" }}
          />
          {voiceSupported && voiceEnabled && (
            <button onClick={isListening ? stopListening : startListening}
              style={{ position: "absolute", right: 10, bottom: 10, width: 30, height: 30,
                borderRadius: "50%", border: "none", cursor: "pointer",
                background: isListening ? "#EF4444" : "#1e293b",
                fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                animation: isListening ? "pulse 1s ease infinite" : "none" }}>
              {isListening ? "⏹️" : "🎤"}
            </button>
          )}
        </div>
        <button onClick={sendAnswer} disabled={loading || !userInput.trim()}
          style={{ ...S.btn(), padding: "12px 18px", fontSize: 14, height: 48, flexShrink: 0,
            opacity: loading || !userInput.trim() ? 0.5 : 1 }}>
          {loading ? <Spin/> : "Send →"}
        </button>
      </div>
      <div style={{ marginTop: 6, fontSize: 11, color: "#475569", textAlign: "center" }}>
        Enter to send · Shift+Enter for new line {voiceEnabled && "· 🎤 tap mic to speak"}
      </div>
    </div>
  );

  // ── REPORT ────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🎉</div>
        <h1 style={{ fontFamily: "Syne,sans-serif", fontSize: 24, marginBottom: 4 }}>Interview Complete!</h1>
        <p style={{ color: "#64748b", fontSize: 13 }}>
          {mode === "english" ? "English Communication Practice"
            : `${INTERVIEW_ROLES.find(r => r.value === selectedRole)?.label} Interview`}
        </p>
      </div>

      {reportLoading ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ width: 38, height: 38, border: "3px solid #1e293b", borderTopColor: "#00D9A3",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }}/>
          <div style={{ color: "#64748b", fontSize: 14 }}>Generating your report…</div>
        </div>
      ) : report ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <div style={{ ...S.card, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 18 }}>
              <MiniScoreRing score={report.overallScore}/>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "Syne,sans-serif", fontSize: 24, fontWeight: 800 }}>{report.grade}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>Overall Grade</div>
              </div>
              <div style={{ background: "#1e293b", borderRadius: 8, padding: "9px 12px", width: "100%",
                fontSize: 12, color: "#94a3b8", lineHeight: 1.5, textAlign: "center" }}>
                {report.summary}
              </div>
            </div>
            <div style={{ ...S.card, padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Breakdown</div>
              <ScoreBar label="Technical Knowledge" value={report.scores?.technicalKnowledge || 0}/>
              <ScoreBar label="Communication"       value={report.scores?.communication || 0}/>
              <ScoreBar label="Problem Solving"     value={report.scores?.problemSolving || 0}/>
              <ScoreBar label="Confidence"          value={report.scores?.confidence || 0}/>
            </div>
          </div>

          {scores.length > 0 && (
            <div style={{ ...S.card, padding: 16, marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Per-Question Scores</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {scores.map((s, i) => {
                  const c = s >= 8 ? "#00D9A3" : s >= 6 ? "#F59E0B" : "#EF4444";
                  return (
                    <div key={i} style={{ textAlign: "center", padding: "8px 12px",
                      background: `${c}11`, border: `1px solid ${c}33`, borderRadius: 9 }}>
                      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3 }}>Q{i+1}</div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: c }}>{s}/10</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ ...S.card, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#00D9A3", marginBottom: 10 }}>✓ Strengths</div>
              {(report.strengths || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, fontSize: 13, color: "#94a3b8" }}>
                  <span style={{ color: "#00D9A3", flexShrink: 0 }}>●</span>{s}
                </div>
              ))}
            </div>
            <div style={{ ...S.card, padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#F59E0B", marginBottom: 10 }}>↑ Improve</div>
              {(report.improvements || []).map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, fontSize: 13, color: "#94a3b8" }}>
                  <span style={{ color: "#F59E0B", flexShrink: 0 }}>●</span>{s}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...S.card, padding: 16, marginBottom: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0284c7", marginBottom: 10 }}>📚 Study These</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(report.studyTopics || []).map(t => (
                <span key={t} style={{ background: "#0284c720", color: "#0284c7",
                  borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...S.card, textAlign: "center", padding: 28, marginBottom: 22 }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📊</div>
          <div style={{ color: "#64748b", fontSize: 14 }}>Report could not be generated.</div>
        </div>
      )}

      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button style={{ ...S.btn(), padding: "11px 26px" }}
          onClick={() => { setScreen("setup"); setReport(null); setMessages([]); setChatDisplay([]); setScores([]); }}>
          🔄 Practice Again
        </button>
        <button style={{ ...S.btn("ghost"), padding: "11px 26px" }} onClick={() => window.print()}>
          📄 Save Report
        </button>
      </div>
    </div>
  );
}