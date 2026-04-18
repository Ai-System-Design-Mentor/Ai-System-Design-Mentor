# Contributing to AI System Design Mentor

First off — thank you for taking the time to contribute! 🎉

This project is open source and contributions of all kinds are welcome: bug fixes, new features, new preset problems, documentation improvements, and design feedback.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Branching & Commit Convention](#branching--commit-convention)
- [Pull Request Process](#pull-request-process)
- [Adding a New Preset Problem](#adding-a-new-preset-problem)
- [Project Structure](#project-structure)

---

## Code of Conduct

This project follows a simple rule: **be kind and constructive**. We welcome contributors of all experience levels. Harassment or disrespectful behaviour will not be tolerated.

---

## How Can I Contribute?

### 🐛 Reporting Bugs
- Check [existing issues](../../issues) first to avoid duplicates
- Use the **Bug Report** issue template
- Include steps to reproduce, expected vs actual behavior, and screenshots if relevant

### 💡 Suggesting Features
- Open a [Feature Request](../../issues/new?template=feature_request.md) issue
- Describe the problem you're solving, not just the solution
- For large features, discuss in an issue before writing code

### 📝 Adding Preset Problems
The easiest way to contribute! See [Adding a New Preset Problem](#adding-a-new-preset-problem) below.

### 🔧 Code Contributions
- Look for issues tagged `good first issue` or `help wanted`
- Comment on the issue to let others know you're working on it

---

## Development Setup

**Prerequisites:** Node.js v18+, Git, MongoDB Atlas account, Gemini API key

```bash
# 1. Fork the repo, then clone your fork
git clone https://github.com/YOUR_USERNAME/ai-system-design-mentor.git
cd ai-system-design-mentor

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 3. Set up environment variables
# Copy the examples and fill in your own credentials
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 4. Start development servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` to `http://localhost:5001`.

---

## Branching & Commit Convention

**Branch names:**
```
feature/your-feature-name
fix/bug-description
docs/what-you-documented
problem/system-name        ← for new preset problems
```

**Commit messages** (follow [Conventional Commits](https://www.conventionalcommits.org/)):
```
feat: add Instagram preset problem
fix: hint engine missing redis alias
docs: update API reference in README
refactor: simplify aiClient queue logic
chore: update dependencies
```

---

## Pull Request Process

1. Make sure your branch is up to date with `main`
2. Test your changes locally — both backend and frontend
3. Fill out the PR template fully
4. Link the related issue in your PR description (`Closes #123`)
5. A maintainer will review your PR within a few days
6. Once approved, it will be squash-merged into `main`

**Before submitting, verify:**
- [ ] No `.env` files or secrets are committed
- [ ] `npm run lint` passes in the frontend
- [ ] The backend starts cleanly with `npm run dev`
- [ ] Your changes don't break existing routes or auth flow

---

## Adding a New Preset Problem

This is the most impactful contribution you can make — new problems benefit every user!

**Step 1:** Add the problem entry in `backend/data/constantProblem.js`:

```js
{
    slug: "your-system",           // kebab-case, unique
    title: "Design Your System",
    icon: "🔧",
    color: "#HEX",
    difficulty: "Easy" | "Medium" | "Hard",
    estimatedTime: 45,             // minutes
    tags: ["Tag1", "Tag2"],
    description: "2 sentence overview with real-world scale context.",
    requirements: [
        "Functional requirement 1",
        "Functional requirement 2",
    ],
    constraints: [
        "X million requests per day",
        "Response within Xms p99",
    ],
    hints: [
        "A Socratic question about the hardest part — don't give the answer",
    ],
    standardDesign: STANDARD_DESIGNS["your-system"],
}
```

**Step 2:** Add the reference architecture in `backend/data/standardDesigns.js`:

```js
"your-system": {
    summary: "2 sentence description of the ideal architecture.",
    components: [
        "Client", "API Gateway", "Load Balancer",
        // 8-12 ordered components
    ],
    criticalComponents: [
        // 4-6 must-have components — used by the hint engine
        "Load Balancer", "Cache", "Message Queue",
    ],
    expectedEdges: [
        "Client → API Gateway",
        "API Gateway → Load Balancer",
        // up to 12 critical connections
    ],
    antiPatterns: [
        "Calling the database directly from the client",
        // 3-5 common mistakes for this system type
    ],
    scalabilityDecisions: [
        "Horizontal scaling of stateless application servers",
        // 3-4 key decisions
    ],
    faultToleranceMechanisms: [
        "Database read replicas for failover",
        // 2-3 reliability mechanisms
    ],
    estimatedScale: {
        dau: "50M",
        requestsPerDay: "500M",
        storageNeeds: "10PB",
    },
}
```

**Step 3:** Add the system icon to `frontend/src/assets/` (PNG, ~64x64px recommended).

**Step 4:** Reference the icon in the problem card component if needed.

Open a PR with the title: `problem: add Design <System Name>`

---

## Project Structure (Quick Reference)

```
backend/
  controllers/   ← Route handlers (auth, chat, design, user)
  data/          ← Preset problems + standard designs (add yours here!)
  middleware/    ← JWT auth guard
  models/        ← Mongoose schemas (User, Attempt, Problem)
  routes/        ← Express routers
  utils/         ← Gemini AI client, email service

frontend/src/
  components/    ← Reusable UI (canvas, chat, navbar)
  context/       ← Auth, theme, auto-logout
  pages/         ← Full page views
  utils/         ← API helpers, constants
```

---

## Questions?

Open a [Discussion](../../discussions) or drop a comment on the relevant issue. We're happy to help!
