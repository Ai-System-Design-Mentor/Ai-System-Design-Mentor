# 🧠 AI System Design Mentor

> An open-source, AI-powered mentor that guides engineers through system design interviews — with a live diagram canvas, Socratic AI chat, smart hints, and instant AI evaluation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Open Source](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/)

---

## 📖 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the App](#running-the-app)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## 📌 About the Project

**AI System Design Mentor** is an open-source tool that puts you in a real system design interview environment. Pick a problem (YouTube, Uber, WhatsApp, or your own custom system), draw your architecture on a live canvas, chat with an AI mentor that asks Socratic questions, get zero-latency algorithmic hints, and receive a detailed AI-evaluated score with a scoring breakdown — all in one place.

---

## ✨ Features

### 🎯 Design Problems
- **Preset problems** with real constraints: Design YouTube, Uber, WhatsApp, URL Shortener, Instagram, Twitter, Netflix, GitHub, Google Drive, Dropbox, IRCTC, and more
- **Custom problems** — type any system name and AI generates a full problem (requirements, constraints, hints, and a reference architecture) on the fly
- **MongoDB caching** — AI-generated problems are saved so future users get them instantly (zero AI calls on cache hit)

### 🖼️ Live Diagram Canvas
- Drag-and-drop architecture components (CDN, Load Balancer, Database, Cache, Queue, etc.)
- Draw connections/edges between components
- Export diagram as an image for submission

### 🤖 AI Mentor Chat (Pillar 3)
- Powered by **Google Gemini 2.5 Flash**
- Socratic mentoring style — never gives away the answer, asks leading questions
- Aware of your live canvas state: knows which components you've placed and which connections you've made
- Guided by problem-specific anti-patterns to steer you away from common mistakes
- Max 3-sentence responses — fast, direct, encouraging

### 💡 Smart Hints (Pillar 2 — Zero AI Cost)
- Algorithmic hint engine with **zero AI calls** — always instant, always free
- Compares your current diagram against the required critical components for that problem
- Uses component aliases (e.g. Redis → cache, Kafka → message queue) to avoid false negatives
- Returns targeted, human-readable hints pointing to the first missing critical component

### 📊 AI Evaluation (Pillar 1)
- Submit your completed diagram for a full FAANG-style evaluation
- **3-tier reference design resolution:**
  - Tier 1: In-memory preset (for standard problems like YouTube, Uber)
  - Tier 2: MongoDB cache (for previously AI-generated custom problems)
  - Tier 3: AI generates reference architecture on the fly, then saves to DB for future users
- Scores across: Scalability, Reliability, Completeness, Data Modeling, Communication Clarity
- Returns strengths, improvements, anti-patterns found, missing critical components, and edge-level diagram comparison

### 👤 Auth & User System
- Email + OTP-based registration (6-digit OTP, rate-limited)
- JWT authentication (7-day token, auto-logout after 24h idle)
- Google OAuth login
- GitHub OAuth login
- Forgot password via 3-step OTP flow
- User stats: total attempts, average score, best score, tracked weak areas

### 🔒 Security
- Helmet.js with Content Security Policy headers
- Rate limiting: 300 req/15min globally, 20 req/15min on auth routes, 30 msg/min per user on chat
- bcrypt password hashing (12 rounds)
- JWT with expiry validation on every protected route

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Vite 8 |
| Styling | CSS Modules, Framer Motion |
| AI Model | Google Gemini 2.5 Flash (`@google/genai`) |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT, Google OAuth (`google-auth-library`), GitHub OAuth |
| Email | Nodemailer (Gmail SMTP) |
| Frontend Deploy | Vercel |
| Backend Deploy | Any Node-compatible host (Railway, Render, Fly.io, etc.) |

---

## 🏗️ Architecture Overview

```
Frontend (React + Vite)          Backend (Express.js)           External Services
┌─────────────────────┐          ┌─────────────────────┐        ┌──────────────────┐
│  HomePage           │          │  /api/auth           │        │  MongoDB Atlas   │
│  WorkspacePage      │◄────────►│  /api/chat           │◄──────►│  (problems,      │
│  DashboardPage      │          │  /api/designs        │        │   users,         │
│  ProfilePage        │          │  /api/problems       │        │   attempts)      │
│  ResultPage         │          │  /api/users          │        └──────────────────┘
│  AuthPage           │          │  /api/health         │        ┌──────────────────┐
└─────────────────────┘          └─────────────────────┘◄──────►│ Gemini 2.5 Flash │
        │                                                        └──────────────────┘
   Vercel (SPA)               Railway / Render / Fly.io          ┌──────────────────┐
   vercel.json rewrite                                           │  Gmail SMTP      │
                                                                 │  (OTP emails)    │
                                                                 └──────────────────┘
```

**AI Concurrency:** The backend uses an in-process queue (max 3 simultaneous Gemini calls) with exponential backoff on 429 errors and 30s call timeouts — safe for free-tier Gemini API usage.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account (free tier works)
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)
- A Gmail account for sending OTP emails (with App Password enabled)
- *(Optional)* Google OAuth Client ID and GitHub OAuth App credentials for social login

---

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/your-username/ai-system-design-mentor.git
cd ai-system-design-mentor
```

**2. Install backend dependencies**

```bash
cd backend
npm install
```

**3. Install frontend dependencies**

```bash
cd ../frontend
npm install
```

---

### Environment Variables

#### `backend/.env`

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/ai_mentor?retryWrites=true&w=majority

# Server
PORT=5001
NODE_ENV=development

# Auth
JWT_SECRET=your_strong_random_secret_here

# AI
GEMINI_API_KEY=your_gemini_api_key_here

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Email — Gmail SMTP with App Password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password

# Google OAuth
CLIENT_ID=your_google_oauth_client_id

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret
```

#### `frontend/.env.local`

```env
VITE_API_URL=http://localhost:5001/api
VITE_CLIENT_ID=your_google_oauth_client_id
VITE_GITHUB_CLIENT_ID=your_github_oauth_app_client_id
```

> ⚠️ **Never commit your `.env` files.** Both `.gitignore` files already exclude them.

**How to get each credential:**

| Key | Where to get it |
|---|---|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key |
| `MONGODB_URI` | MongoDB Atlas → Your Cluster → Connect → Drivers → Copy string |
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `EMAIL_PASS` | Google Account → Security → 2-Step Verification → App Passwords |
| `CLIENT_ID` (Google OAuth) | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → OAuth 2.0 Client IDs |
| `GITHUB_CLIENT_ID/SECRET` | GitHub → Settings → Developer settings → OAuth Apps → New OAuth App |

---

### Running the App

**Start the backend** (runs on port 5001):

```bash
cd backend
npm run dev        # development with nodemon (auto-restart)
# or
npm start          # production
```

**Start the frontend** (in a new terminal, runs on port 5173):

```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

**Verify the backend is healthy:**

```
GET http://localhost:5001/api/health
```

You should see a JSON response confirming DB connection, Gemini API status, and queue stats.

**Build frontend for production:**

```bash
cd frontend
npm run build      # outputs to frontend/dist/
npm run preview    # preview the production build locally
```

---

## 📁 Project Structure

```
ai-system-design-mentor/
│
├── backend/
│   ├── controllers/
│   │   ├── authController.js      # Register (OTP flow), login, Google/GitHub OAuth, password reset
│   │   ├── chatController.js      # AI mentor chat, algorithmic hints, problem generation + caching
│   │   ├── designController.js    # Design submission, 3-tier evaluation, attempt history
│   │   └── userController.js      # User profile & stats
│   │
│   ├── data/
│   │   ├── constantProblem.js     # Seed data for preset problems (YouTube, Uber, WhatsApp, etc.)
│   │   └── standardDesigns.js     # In-memory reference architectures for preset problems
│   │
│   ├── middleware/
│   │   └── auth.js                # JWT Bearer token protect middleware
│   │
│   ├── models/
│   │   ├── User.js                # User schema (stats, weakAreas, OTP fields, bcrypt hooks)
│   │   ├── Attempt.js             # Design attempt schema (diagram nodes/edges, AI evaluation, scoring)
│   │   └── Problem.js             # Problem schema (description, requirements, standardDesign cache)
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── designs.js
│   │   ├── problems.js
│   │   └── users.js
│   │
│   ├── utils/
│   │   ├── aiClient.js            # Gemini 2.5 Flash wrapper — concurrency queue, retry, timeout
│   │   └── emailService.js        # Nodemailer OTP/welcome email sender
│   │
│   ├── server.js                  # Express app — middleware, routes, MongoDB connection
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── falcon.svg
│   │
│   ├── src/
│   │   ├── assets/                # Problem icons (YouTube, Uber, WhatsApp, Netflix, etc.)
│   │   │
│   │   ├── components/
│   │   │   ├── AIMentorChat.jsx   # Chat sidebar with conversation history
│   │   │   ├── DiagramCanvas.jsx  # Drag-and-drop architecture diagram canvas
│   │   │   ├── Navbar.jsx         # Top navigation bar
│   │   │   ├── ProblemCard.jsx    # Problem selection card component
│   │   │   └── ProtectedRoute.jsx # Auth guard — redirects to /login if unauthenticated
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Global auth state (JWT token, user object)
│   │   │   ├── AutoLogOut.jsx     # 24h idle auto-logout hook (react-idle-timer)
│   │   │   └── ThemeContext.jsx   # Light/dark theme context
│   │   │
│   │   ├── pages/
│   │   │   ├── HomePage.jsx       # Problem selection grid + custom problem input
│   │   │   ├── WorkspacePage.jsx  # Main workspace — canvas + AI chat + hint button
│   │   │   ├── DashboardPage.jsx  # Attempt history, scores, stats overview
│   │   │   ├── ProfilePage.jsx    # User profile, weak areas, account settings
│   │   │   ├── ResultPage.jsx     # Full evaluation result — scores, breakdown, comparison
│   │   │   └── AuthPage.jsx       # Login / Register / OTP verification / Forgot password
│   │   │
│   │   ├── utils/
│   │   │   ├── Api.jsx            # API call helpers (fetch wrappers with auth headers)
│   │   │   └── constants.jsx      # App-wide constants
│   │   │
│   │   ├── App.jsx                # Route definitions (React Router v7)
│   │   └── main.jsx               # React entry point
│   │
│   ├── vite.config.js             # Vite config — /api proxy to port 5001 in dev
│   ├── vercel.json                # SPA rewrite rule for Vercel (all routes → index.html)
│   └── package.json
```

---

## 📡 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| POST | `/register-request` | Validate fields + send OTP to email | No |
| POST | `/register-verify` | Verify OTP → create account + return JWT | No |
| POST | `/register-resend` | Resend registration OTP | No |
| POST | `/login` | Email + password login → JWT | No |
| POST | `/google` | Google OAuth login → JWT | No |
| POST | `/github` | GitHub OAuth login → JWT | No |
| GET | `/me` | Get current authenticated user | ✅ |
| POST | `/forgot-password` | Send password reset OTP to email | No |
| POST | `/verify-otp` | Verify OTP → return reset token | No |
| POST | `/reset-password` | Set new password using reset token | No |

### Chat — `/api/chat`

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| POST | `/` | Send message to Gemini AI mentor | ✅ |
| POST | `/hint` | Get algorithmic hint (zero AI calls) | ✅ |
| POST | `/generate-problem` | Generate custom problem via AI + cache to DB | ✅ |

### Designs — `/api/designs`

| Method | Endpoint | Description | Protected |
|---|---|---|---|
| POST | `/submit` | Submit diagram + explanation for AI evaluation | ✅ |
| GET | `/history` | Get user's last 50 evaluated attempts | ✅ |
| GET | `/:id` | Get a specific attempt with full evaluation details | ✅ |

### Health

```
GET /api/health
→ { status, time, env, pillars: { db_cache, ai_mentor: { fastModel, smartModel, geminiEnabled, activeConnections } } }
```

---

## 🤝 Contributing

All contributions are welcome — bug reports, feature ideas, code, documentation improvements, and new preset problems.

**Steps to contribute:**

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: description of your change"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

For major changes, please open an issue first so we can discuss before you build.

**Want to add a new preset problem?** Add your entry to `backend/data/constantProblem.js` and its reference architecture to `backend/data/standardDesigns.js` — that's all it takes.

---

## 🗺️ Roadmap

- [x] AI mentor chat with live canvas awareness
- [x] Zero-cost algorithmic hint engine
- [x] 3-tier AI evaluation with scoring breakdown
- [x] MongoDB problem caching
- [x] Google & GitHub OAuth
- [x] OTP email verification + password reset
- [x] User stats & weak area tracking
- [x] Auto-logout after 24h idle
- [ ] Timer mode (timed mock interview)
- [ ] Diagram export to PDF
- [ ] Community problem submissions
- [ ] Leaderboard per problem
- [ ] Diagram templates for common patterns (microservices, event-driven, etc.)
- [ ] Admin panel for seeding new preset problems

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for more information.

---

<p align="center">Built for engineers who want to get better at system design — one diagram at a time.</p>
