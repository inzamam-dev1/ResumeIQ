# ResumeIQ — AI-Powered Resume Matcher 🎯

> Final Year College Project | AI-Powered Resume Analysis, Scoring & Job Finder

![ResumeIQ Banner](https://img.shields.io/badge/ResumeIQ-AI%20Resume%20Matcher-00D9A3?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![Groq AI](https://img.shields.io/badge/Groq-LLaMA%203.1-F55036?style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?style=flat-square&logo=firebase)

---

## 🚀 What is ResumeIQ?

ResumeIQ is an all-in-one AI-powered platform that helps job seekers:

- 📊 **Score their resume** (0–100) with a detailed section breakdown
- ✨ **Get AI suggestions** to improve their resume for a specific role
- ✏️ **Edit their resume** with one-click AI fixes applied in real-time
- 🌐 **Find live job listings** fetched from real job boards
- 🔐 **Real Firebase Auth** — email/password + Google OAuth
- 💎 **Freemium model** — free tier + premium subscription

No more jumping between platforms. Everything in one place.

---

## ✨ Features

| Feature | Free | Premium |
|---------|------|---------|
| Resume upload (PDF, DOC, TXT) | ✅ | ✅ |
| AI Resume Score (0–100) | ✅ | ✅ |
| Section breakdown (5 categories) | ✅ | ✅ |
| AI improvement suggestions | ✅ | ✅ |
| Missing ATS keywords | ✅ | ✅ |
| Resume editor with AI fixes | ✅ | ✅ |
| Live job search | ✅ (3 searches) | ✅ (unlimited) |
| High-match job listings (88%+) | 🔒 | ✅ |
| Resume scans per month | 3 | Unlimited |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite 5
- **AI:** Groq API (LLaMA 3.1 8B) — free, no billing required
- **Job Search:** Remotive API + Arbeitnow API (free, no key needed)
- **PDF Parsing:** PDF.js (client-side, no API needed)
- **Auth:** Firebase Authentication (email/password + Google OAuth)
- **Database:** Firebase Firestore (user profiles, plan management)
- **Styling:** CSS3 with mobile-first responsive design
- **Deployment:** Vercel (CI/CD)

---

## 📁 Project Structure
```
resumeiq/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── JobCard.jsx          # Job listing card
│   │   ├── ScoreRing.jsx        # Animated SVG score ring
│   │   └── SectionBar.jsx       # Section score progress bar
│   ├── context/
│   │   └── AuthContext.jsx      # Firebase auth state + helpers
│   ├── pages/
│   │   ├── AuthPage.jsx         # Login / Signup / Forgot password
│   │   └── LandingPage.jsx      # Marketing landing page
│   ├── api.js                   # Groq AI + job search API calls
│   ├── constants.js             # Roles list (17 roles)
│   ├── fileUtils.js             # PDF.js file extraction
│   ├── firebase.js              # Firebase app initialization
│   ├── styles.js                # Shared style helpers
│   ├── App.jsx                  # Main app with all tabs
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles + responsive
├── .env.example
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

Fill in your `.env` file:
```env
# Groq API — free at https://console.groq.com
VITE_GROQ_API_KEY=your_groq_api_key_here

# Firebase — from Firebase Console → Project Settings → Your Apps
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 5. Build for production
```bash
npm run build
```

---

## 🔑 Environment Variables

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `VITE_GROQ_API_KEY` | Groq AI API key (free) | [console.groq.com](https://console.groq.com) |
| `VITE_FIREBASE_API_KEY` | Firebase API key | Firebase Console |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Firebase Console |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | Firebase Console |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Firebase Console |

> ⚠️ **Never commit your `.env` file to GitHub.** It's already in `.gitignore`.

---

## 🎯 How It Works

### Resume Analysis
1. User pastes text or uploads PDF/DOC/TXT file
2. PDF files are extracted client-side using PDF.js
3. Text is analyzed by Groq LLaMA 3.1 with structured prompt engineering
4. Returns score, grade, strengths, improvements, missing ATS keywords

### Live Job Search
1. User selects a target role from 17 available roles
2. App queries Remotive API → falls back to Arbeitnow API
3. If both fail, Groq AI generates realistic sample listings
4. Results shown with match %, salary, tags, and direct apply links

### Resume Editor
1. After analysis, resume loads into a rich text editor
2. AI suggestions appear in a sidebar with one-click apply buttons
3. "AI Rewrite All" rewrites the entire resume applying all fixes
4. Diff view shows exactly what lines changed vs original

### Authentication
1. Email/password signup with Firebase Auth
2. Google OAuth with popup → redirect fallback
3. User plan (free/premium) stored in Firestore
4. Scan count tracked and enforced per month

---

## 📱 Responsive Design

- Mobile-first layout with bottom navigation bar on small screens
- All grids stack vertically on mobile
- Touch-friendly tap targets and buttons
- Tested on Chrome, Edge, and mobile browsers

---

## 🗺️ Roadmap

- [x] Firebase Auth (email + Google OAuth)
- [x] Firestore user profiles + plan management
- [x] PDF upload with PDF.js extraction
- [x] Mobile responsive design
- [x] Live job search with fallback APIs
- [x] Resume editor with diff view
- [ ] Stripe payment integration
- [ ] Cover Letter Generator
- [ ] Interview Prep questions
- [ ] Score history chart

---

## 🚀 Deployment

Deployed on **Vercel** with automatic CI/CD.

Every push to `main` triggers a new deployment automatically.

After deploying, add your Vercel domain to Firebase Console → Authentication → Authorized Domains.

---

## 👨‍💻 Author

Built as a Final Year College Project.

---

## 📄 License

MIT License — feel free to use and modify.
