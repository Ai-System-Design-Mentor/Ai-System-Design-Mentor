# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Timer mode for timed mock interviews
- Diagram export to PDF
- Leaderboard per problem
- Community problem submissions

---

## [1.0.0] — 2026-04-06 — Initial Open Source Release 🎉

### Added
- **AI Mentor Chat** — Google Gemini 2.5 Flash powered Socratic mentor with live canvas awareness
- **Algorithmic Hint Engine** — Zero AI-call hint system using component alias matching
- **AI Evaluation** — 3-tier design evaluation (preset → MongoDB cache → AI generation) with full scoring breakdown
- **Live Diagram Canvas** — Drag-and-drop architecture components with edge drawing
- **Preset Problems** — YouTube, Uber, WhatsApp, Instagram, Twitter, Netflix, GitHub, Google Drive, Dropbox, URL Shortener, IRCTC
- **Custom Problems** — Type any system name; AI generates requirements, constraints, hints, and reference architecture on the fly
- **MongoDB Caching** — AI-generated problems cached in DB so future users get them instantly
- **Auth System** — Email + OTP registration, JWT auth (7-day), Google OAuth, GitHub OAuth
- **Forgot Password** — 3-step OTP-based password reset via email
- **User Stats** — Total attempts, average score, best score, tracked weak areas
- **Auto Logout** — 24-hour idle session timeout
- **Security** — Helmet.js CSP, rate limiting, bcrypt (12 rounds), JWT validation
- **Concurrency Queue** — Max 3 simultaneous Gemini API calls with exponential backoff on 429s
- **Health Endpoint** — `/api/health` for deployment monitoring
- **Vercel Deploy** — Frontend SPA rewrite config included
