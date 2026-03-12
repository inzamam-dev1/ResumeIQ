// ─── ResumeIQ — AI API powered by Groq (100% Free) ───────────────────────────
// Get your FREE key at: https://console.groq.com → API Keys → Create
// No billing, no credit card — key starts with gsk_

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ── Core helper: send a prompt to Groq ───────────────────────────────────────
async function askGroq(prompt, maxTokens = 2048) {
  if (!GROQ_KEY) {
    throw new Error("Groq API key missing. Add VITE_GROQ_API_KEY to your .env file. Get a free key at https://console.groq.com");
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.error?.message || `HTTP ${res.status}`;
    console.error("Groq API error:", msg);
    throw new Error(`AI error: ${msg}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty response from AI");
  return text;
}

// ── Analyze resume ────────────────────────────────────────────────────────────
export async function analyzeResume(resumeText, role) {
  const raw = await askGroq(`
You are an expert resume reviewer. Analyze this resume for a "${role}" position.

Return ONLY a valid JSON object. No markdown fences, no explanation, no extra text. Start with { and end with }.

{
  "score": <integer 0-100>,
  "grade": "<A+ or A or B+ or B or C or D>",
  "summary": "<2 honest sentences about this resume>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>"],
  "keywords_missing": ["<keyword 1>", "<keyword 2>", "<keyword 3>", "<keyword 4>", "<keyword 5>"],
  "sections": {
    "experience": <integer 0-100>,
    "skills": <integer 0-100>,
    "education": <integer 0-100>,
    "formatting": <integer 0-100>,
    "impact": <integer 0-100>
  }
}

Resume:
${resumeText.substring(0, 3000)}
`, 1500);

  const clean = raw.replace(/```json|```/g, "").trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Could not parse AI response");
  return JSON.parse(match[0]);
}

// ── Fetch live jobs — tries 3 different free APIs ─────────────────────────────
export async function fetchLiveJobs(role) {

  // ── Try API 1: Remotive ───────────────────────────────────────────────────
  try {
    const searchMap = {
      "frontend developer": "frontend", "backend developer": "backend",
      "full stack developer": "full stack", "web developer": "web developer",
      "software engineer": "software engineer", "mobile developer": "mobile",
      "devops engineer": "devops", "data scientist": "data scientist",
      "machine learning engineer": "machine learning", "data engineer": "data engineer",
      "product manager": "product manager", "ui ux designer": "designer",
      "graphic designer": "graphic designer", "cybersecurity engineer": "security",
      "qa engineer": "qa", "blockchain developer": "blockchain", "game developer": "game",
    };
    const q = searchMap[role] || role;
    const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=8`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.jobs?.length > 0) {
        console.log("✅ Jobs from Remotive");
        return formatRemotive(data.jobs);
      }
    }
  } catch (e) { console.warn("Remotive failed:", e.message); }

  // ── Try API 2: Arbeitnow (European jobs, global remote) ───────────────────
  try {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?search=${encodeURIComponent(role)}`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.data?.length > 0) {
        console.log("✅ Jobs from Arbeitnow");
        return formatArbeitnow(data.data);
      }
    }
  } catch (e) { console.warn("Arbeitnow failed:", e.message); }

  // ── Fallback: AI generates realistic sample jobs ──────────────────────────
  console.warn("All job APIs failed — using AI-generated samples");
  return await generateFallbackJobs(role);
}

// ── Format Remotive jobs ──────────────────────────────────────────────────────
function formatRemotive(jobs) {
  return jobs.slice(0, 6).map((job, i) => ({
    id: i + 1,
    title: job.title,
    company: job.company_name,
    location: job.candidate_required_location || "Remote",
    salary: job.salary || "Competitive",
    type: job.job_type || "Full-time",
    logo: (job.company_name?.[0] || "?").toUpperCase(),
    color: getBrandColor(job.company_name),
    match: Math.min(98, 65 + Math.floor(Math.random() * 30)),
    tags: (job.tags || []).slice(0, 3).map(t => t.name || t),
    posted: timeAgo(job.publication_date),
    applyUrl: job.url,
  }));
}

// ── Format Arbeitnow jobs ─────────────────────────────────────────────────────
function formatArbeitnow(jobs) {
  return jobs.slice(0, 6).map((job, i) => ({
    id: i + 1,
    title: job.title,
    company: job.company_name,
    location: job.location || "Remote",
    salary: "Competitive",
    type: job.job_types?.[0] || "Full-time",
    logo: (job.company_name?.[0] || "?").toUpperCase(),
    color: getBrandColor(job.company_name),
    match: Math.min(98, 65 + Math.floor(Math.random() * 30)),
    tags: (job.tags || []).slice(0, 3),
    posted: timeAgo(job.created_at),
    applyUrl: job.url,
  }));
}

// ── AI-generated fallback jobs when APIs are offline ─────────────────────────
async function generateFallbackJobs(role) {
  const raw = await askGroq(`
Generate 6 realistic current job listings for "${role}" positions.
Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "title": "<job title>",
    "company": "<real tech company name>",
    "location": "<City or Remote>",
    "salary": "<realistic salary range in USD>",
    "tags": ["<skill1>", "<skill2>", "<skill3>"],
    "applyUrl": "https://www.linkedin.com/jobs"
  }
]
`, 1000);

  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("Could not generate jobs");

  const jobs = JSON.parse(match[0]);
  return jobs.slice(0, 6).map((job, i) => ({
    id: i + 1,
    title: job.title,
    company: job.company,
    location: job.location || "Remote",
    salary: job.salary || "Competitive",
    type: "Full-time",
    logo: (job.company?.[0] || "?").toUpperCase(),
    color: getBrandColor(job.company),
    match: Math.min(98, 65 + Math.floor(Math.random() * 30)),
    tags: job.tags || [],
    posted: `${Math.floor(Math.random() * 6) + 1}d ago`,
    applyUrl: job.applyUrl || "https://www.linkedin.com/jobs",
  }));
}

// ── AI rewrite resume ─────────────────────────────────────────────────────────
export async function aiRewriteResume(resumeText, role, suggestions, keywords) {
  const result = await askGroq(`
You are an expert professional resume writer.

Rewrite the resume below for a "${role}" role by applying ALL of these improvements:
${suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Also naturally weave in these keywords: ${keywords.join(", ")}

Rules:
- Keep ALL real facts: dates, company names, job titles exactly as they are
- Do NOT invent any fake experience or achievements
- Use strong action verbs and measurable impact
- Return ONLY the rewritten resume text — nothing else

Resume:
${resumeText}
`, 3000);
  return result.trim();
}

// ── Apply single suggestion ───────────────────────────────────────────────────
export async function aiApplySuggestion(resumeText, suggestion) {
  const result = await askGroq(`
You are a precise resume editor.
Apply ONLY this one improvement: "${suggestion}"
Keep everything else exactly the same.
Return ONLY the updated resume text — no explanation.

Resume:
${resumeText}
`, 3000);
  return result.trim();
}

// ── PDF text extraction — handled by PDF.js in fileUtils.js ──────────────────
export async function extractPDFText(base64Data) {
  // This is handled client-side by PDF.js in fileUtils.js
  // This function exists only for compatibility — not called directly
  throw new Error("Use extractTextFromUpload from fileUtils.js for PDFs");
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getBrandColor(name = "") {
  const n = name.toLowerCase();
  if (n.includes("google"))    return "#4285F4";
  if (n.includes("microsoft")) return "#00A4EF";
  if (n.includes("amazon"))    return "#FF9900";
  if (n.includes("apple"))     return "#555555";
  if (n.includes("meta") || n.includes("facebook")) return "#0082FB";
  if (n.includes("netflix"))   return "#E50914";
  if (n.includes("stripe"))    return "#635BFF";
  if (n.includes("shopify"))   return "#96BF48";
  if (n.includes("github"))    return "#24292E";
  if (n.includes("gitlab"))    return "#FC6D26";
  if (n.includes("slack"))     return "#4A154B";
  if (n.includes("figma"))     return "#F24E1E";
  if (n.includes("vercel"))    return "#000000";
  const palette = ["#6366f1","#8b5cf6","#ec4899","#14b8a6","#f59e0b","#ef4444","#0ea5e9","#10b981"];
  return palette[(name.charCodeAt(0) || 0) % palette.length];
}

function timeAgo(dateStr) {
  if (!dateStr) return "Recently";
  const days = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 7)   return `${days}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
// ── Interview AI ──────────────────────────────────────────────────────────────
export async function sendInterviewMessage(messages, maxTokens = 1000) {
  if (!GROQ_KEY) throw new Error("Groq API key missing.");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export function buildInterviewSystemPrompt(role, mode, totalQuestions) {
  if (mode === "english") {
    return `You are a friendly English communication coach conducting a practice session.
Ask ONE question at a time. After each answer give feedback in this EXACT format:

FEEDBACK:
Score: X/10
✓ Good: [what they did well — grammar, vocabulary, fluency]
✗ Improve: [specific grammar or vocabulary issues]
💡 Better phrasing: [more natural/professional way to say it]

NEXT_QUESTION:
[your next question here]

Be encouraging and supportive. After ${totalQuestions} questions write SESSION_COMPLETE.
Start by greeting warmly and asking about their background.`;
  }

  return `You are a senior technical interviewer at a top tech company for a ${role} position.
Ask ONE technical question at a time. After each answer give feedback in this EXACT format:

FEEDBACK:
Score: X/10
✓ Good: [what they got right]
✗ Missing: [important points they missed]
💡 Better answer: [the ideal answer or key points]

NEXT_QUESTION:
[your next question here]

Be professional but encouraging. After ${totalQuestions} questions write SESSION_COMPLETE and give a full report.
Start by greeting and asking your first question.`;
}

export async function generateSessionReport(messages, role, mode) {
  const transcript = messages
    .filter(m => m.role !== "system")
    .map(m => `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`)
    .join("\n\n");

  return await askGroq(`
Based on this ${mode === "english" ? "English communication practice" : `${role} technical interview`} session, generate a performance report.

Return ONLY valid JSON, no markdown fences:
{
  "overallScore": <integer 0-100>,
  "grade": "<A+ or A or B+ or B or C or D>",
  "summary": "<2 honest sentences about overall performance>",
  "scores": {
    "technicalKnowledge": <0-100>,
    "communication": <0-100>,
    "problemSolving": <0-100>,
    "confidence": <0-100>
  },
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "studyTopics": ["<topic 1>", "<topic 2>", "<topic 3>"]
}

Transcript:
${transcript.substring(0, 3000)}
`, 1000);
}
