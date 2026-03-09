# ResumeIQ — AI-Powered Resume Matcher 🎯

> Final Year College Project | AI-Powered Resume Analysis, Scoring & Job Finder

![ResumeIQ Banner](https://img.shields.io/badge/ResumeIQ-AI%20Resume%20Matcher-00D9A3?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204-orange?style=flat-square)

---

## 🚀 What is ResumeIQ?

ResumeIQ is an all-in-one AI-powered platform that helps job seekers:

- 📊 **Score their resume** (0–100) with a detailed section breakdown
- ✨ **Get AI suggestions** to improve their resume for a specific role
- ✏️ **Edit their resume** with one-click AI fixes applied in real-time
- 🌐 **Find live job listings** fetched by AI from real companies
- 🔐 **Freemium model** — free tier + premium subscription

No more jumping between platforms. Everything in one place.

---

## ✨ Features

| Feature | Free | Premium |
|---------|------|---------|
| Resume upload (PDF, DOC, TXT) | ✅ | ✅ |
| AI Resume Score (0–100) | ✅ | ✅ |
| Section breakdown (5 categories) | ✅ | ✅ |
| AI improvement suggestions | ✅ (3) | ✅ (all) |
| Missing ATS keywords | ✅ | ✅ |
| Resume editor with AI fixes | ✅ | ✅ |
| Live job search | ✅ (3 searches) | ✅ (unlimited) |
| High-match job listings (88%+) | 🔒 | ✅ |
| Resume scans per month | 3 | Unlimited |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite 5
- **AI:** Anthropic Claude Sonnet (claude-sonnet-4-20250514)
- **Job Search:** Claude web_search tool (real-time job listings)
- **PDF Parsing:** Claude document API
- **Styling:** Inline CSS with custom design system
- **Fonts:** DM Sans + Syne (Google Fonts)

---

## 📁 Project Structure

```
resumeiq/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── JobCard.jsx       # Job listing card component
│   │   ├── ScoreRing.jsx     # Animated SVG score ring
│   │   └── SectionBar.jsx    # Progress bar for section scores
│   ├── pages/
│   │   └── LandingPage.jsx   # Marketing landing page
│   ├── api.js                # All Claude API calls
│   ├── constants.js          # Roles list and shared data
│   ├── fileUtils.js          # File reading + PDF extraction
│   ├── styles.js             # Shared style helpers
│   ├── App.jsx               # Main app with all tabs
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles
├── .env.example              # Environment variable template
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## ⚡ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/resumeiq.git
cd resumeiq
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Open `.env` and add your Anthropic API key:
```
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from: [https://console.anthropic.com/](https://console.anthropic.com/)

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Build for production
```bash
npm run build
```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_ANTHROPIC_API_KEY` | Your Anthropic Claude API key |

> ⚠️ **Never commit your `.env` file to GitHub.** It's already in `.gitignore`.

---

## 🎯 How It Works

### Resume Analysis
1. User pastes resume text or uploads a PDF/DOC file
2. PDF files are sent to Claude's document API for text extraction
3. Extracted text is analyzed by Claude Sonnet with a structured prompt
4. Returns JSON with score, grade, strengths, improvements, missing keywords

### Live Job Search
1. User selects a target role and clicks "Search Jobs"
2. Claude uses the `web_search` tool to find real job listings
3. Results are parsed and displayed with match percentages and apply links

### Resume Editor
1. After analysis, the resume loads into a rich text editor
2. AI suggestions appear in a sidebar panel
3. Users can apply individual fixes or use "AI Rewrite All"
4. A diff view shows exactly what changed

---

## 🗺️ Roadmap (Future Improvements)

- [ ] Firebase Auth (real authentication)
- [ ] Firestore (save resume history + analysis results)
- [ ] Stripe integration (real payment processing)
- [ ] Cover Letter Generator
- [ ] Interview Prep questions
- [ ] Mobile responsive design
- [ ] Score history chart (Recharts)

---

## 👨‍💻 Author

Built as a Final Year College Project.

---

## 📄 License

MIT License — feel free to use and modify.
