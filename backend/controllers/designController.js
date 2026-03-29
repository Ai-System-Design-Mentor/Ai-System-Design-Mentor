const Attempt               = require("../models/Attempt");
const Problem               = require("../models/Problem");
const User                  = require("../models/User");
const STANDARD_DESIGNS      = require("../data/standardDesigns");
const { callForEvaluation, callForProblem } = require("../utils/aiClient");

// ─── POST /api/designs/submit ──────────────────────────────────────────────
exports.submitDesign = async (req, res) => {
  try {
    const {
      problemSlug,
      problemTitle,
      isCustomProblem,
      diagramData,
      textExplanation,
      timeTaken,
      diagramImage,       // base64 screenshot from frontend (html-to-image)
    } = req.body;

    if (!problemTitle?.trim())
      return res.status(400).json({ error: "Problem title is required." });
    if (!diagramData?.nodes?.length || diagramData.nodes.length < 2)
      return res.status(400).json({ error: "Please add at least 2 components to your diagram." });

    // Build human-readable diagram description for the prompt
    const nodeList = diagramData.nodes.map((n) => n.type).join(", ");
    const edgeList = diagramData.edges
      .map((e) => {
        const f = diagramData.nodes.find((n) => n.id === e.from)?.type || e.from;
        const t = diagramData.nodes.find((n) => n.id === e.to)?.type   || e.to;
        return `${f} → ${t}`;
      })
      .join("; ");

    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: RESOLVE REFERENCE DESIGN
    //  TIER 1 — In-memory STANDARD_DESIGNS (preset problems)
    //  TIER 2 — MongoDB (catches previously AI-generated and cached problems)
    //  TIER 3 — AI generates + saves to MongoDB for next user
    // ─────────────────────────────────────────────────────────────────────
    let standardDesign = null;
    let matchInfo      = null;
    let dbProblem      = null;

    // TIER 1: In-memory preset
    if (!isCustomProblem && problemSlug && STANDARD_DESIGNS[problemSlug]) {
      standardDesign = STANDARD_DESIGNS[problemSlug];
      matchInfo = { tier: 1, source: "preset-memory", slug: problemSlug };
      console.info(`[Design] TIER 1: "${problemTitle}" → in-memory preset standard design`);
    }

    // TIER 2: MongoDB lookup
    if (!standardDesign) {
      const lookupSlug = problemSlug || deriveProblemSlug(problemTitle);
      dbProblem = await Problem.findOne({ slug: lookupSlug }).lean();
      if (dbProblem?.standardDesign?.criticalComponents?.length) {
        standardDesign = dbProblem.standardDesign;
        matchInfo = { tier: 2, source: "db-cache", slug: lookupSlug };
        console.info(`[Design] TIER 2: "${problemTitle}" → found in MongoDB (slug: "${lookupSlug}")`);
      }
    }

    // TIER 3: AI generates reference + saves
    if (!standardDesign) {
      const derivedSlug = problemSlug || deriveProblemSlug(problemTitle);
      console.info(`[Design] TIER 3: "${problemTitle}" → not in DB, generating via AI...`);
      try {
        const generatedDesign = await generateStandardDesignViaAI(problemTitle);
        if (generatedDesign) {
          standardDesign = generatedDesign;
          matchInfo = { tier: 3, source: "ai-generated" };
          try {
            await Problem.findOneAndUpdate(
              { slug: derivedSlug },
              {
                $setOnInsert: {
                  slug:           derivedSlug,
                  title:          problemTitle,
                  description:    generatedDesign.summary || "",
                  standardDesign: generatedDesign,
                  isCustom:       true,
                  difficulty:     "Medium",
                  estimatedTime:  45,
                  tags:           ["Custom"],
                },
              },
              { upsert: true, new: true }
            );
            console.info(`[Design] TIER 3: Saved "${derivedSlug}" to MongoDB — next user gets it free`);
          } catch (saveErr) {
            if (saveErr.code !== 11000) {
              console.warn(`[Design] TIER 3: Failed to save to MongoDB:`, saveErr.message);
            }
          }
        }
      } catch (aiErr) {
        console.warn(`[Design] TIER 3: AI reference generation failed: ${aiErr.message}`);
        matchInfo = { tier: 3, source: "failed" };
      }
    }

    // ── Build evaluation prompt ────────────────────────────────────────────
    const prompt = buildEvaluationPrompt({
      problemTitle,
      nodeList,
      edgeList,
      textExplanation,
      standardDesign,
      matchInfo,
    });

    // ── Call AI for evaluation ─────────────────────────────────────────────
    const result = await callForEvaluation({
      messages: [{ role: "user", content: prompt }],
    });

    // ── Parse JSON response safely ─────────────────────────────────────────
    let evaluation;
    const rawText = result.text;   // FIX: was "message.text" — variable is "result"
    try {
      const clean = rawText
        .replace(/```json[\s\S]*?```|```[\s\S]*?```/g,
          (m) => m.replace(/```json?\n?/g, "").replace(/\n?```/g, ""))
        .trim();
      evaluation = JSON.parse(clean);
    } catch {
      const match = rawText.match(/\{[\s\S]+\}/);
      if (!match) {
        return res.status(500).json({
          error: "AI returned an unexpected format. Please try submitting again.",
        });
      }
      evaluation = JSON.parse(match[0]);
    }

    // ── Persist attempt ────────────────────────────────────────────────────
    const attempt = await Attempt.create({
      user:             req.user._id,
      problem:          dbProblem?._id || undefined,
      problemTitle,
      isCustomProblem:  !!isCustomProblem,
      diagramData,
      diagramImage:     diagramImage || "",
      textExplanation:  textExplanation || "",
      score:            evaluation.score,
      summary:          evaluation.summary,
      strengths:        evaluation.strengths                    || [],
      improvements:     evaluation.improvements                 || [],
      weakAreas:        evaluation.weakAreas                    || [],
      referenceComponents:       evaluation.referenceComponents        || [],
      missingCriticalComponents: evaluation.missingCriticalComponents  || [],
      antiPatternsFound:         evaluation.antiPatternsFound          || [],
      scoringBreakdown:          evaluation.scoringBreakdown           || {},
      comparisonWithStandard:    evaluation.comparisonWithStandard     || null,
      timeTaken: timeTaken || 0,
      status:    "evaluated",
    });

    // ── Update user stats ──────────────────────────────────────────────────
    const userDoc = await User.findById(req.user._id);
    // 1. Update weak areas IN MEMORY first (if any exist)
    if (evaluation.weakAreas?.length) {
      userDoc.weakAreas = [...new Set([
        ...evaluation.weakAreas,
        ...(userDoc.weakAreas || []),
      ])].slice(0, 5);
    }!
    await userDoc.updateStats(evaluation.score);
    // 3. We don't need to re-fetch! userDoc now holds the perfectly updated data.
    const updatedStats = {
      stats:     userDoc.stats,
      weakAreas: userDoc.weakAreas,
    };
    res.status(201).json({
      attemptId:    attempt._id,
      evaluation,
      updatedStats,    // FIX: included so frontend can refresh stats immediately
      _matchInfo:   matchInfo,
      _provider:    result.provider,   // FIX: was "message.provider" — variable is "result"
    });

  } catch (err) {
    console.error("submitDesign:", err);
    if (err?.status === 429) {
      return res.status(429).json({
        error: "AI service is busy. Please wait 30 seconds and try again.",
        retryAfter: 30,
      });
    }
    res.status(500).json({ error: "Evaluation failed. Please try again." });
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function deriveProblemSlug(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/^(design|build|create|make)\s+/i, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function generateStandardDesignViaAI(systemName) {
  const { text } = await callForProblem({
    messages: [{
      role: "user",
      content: `You are a principal engineer at Google.
Generate the industry-standard reference architecture for: "${systemName}".

Think about what a well-funded company would actually build in production.
Consider: core components, scalability, reliability, and common pitfalls.

Return ONLY valid JSON (no markdown, no extra text):
{
  "summary": "<2 sentence description of the ideal architecture and its scale>",
  "components": [
    "<component 1 — ordered from client to backend to storage>",
    "<component 2>",
    "<up to 12 components total>"
  ],
  "criticalComponents": [
    "<4-6 components that are absolutely must-have for this system>"
  ],
  "antiPatterns": [
    "<3-5 common mistakes engineers make for this type of system>"
  ],
  "scalabilityDecisions": [
    "<3-4 key architectural decisions that make this system scale>"
  ],
  "faultToleranceMechanisms": [
    "<2-3 reliability mechanisms the production system should have>"
  ]
}`,
    }],
  });

  const clean = text
    .replace(/```json[\s\S]*?```|```[\s\S]*?```/g,
      (m) => m.replace(/```json?\n?/g, "").replace(/\n?```/g, ""))
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]+\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}

function buildEvaluationPrompt({ problemTitle, nodeList, edgeList, textExplanation, standardDesign, matchInfo }) {
  let refSection;

  if (standardDesign?.components?.length) {
    const sourceLabel =
      matchInfo?.tier === 1 ? "STORED PRESET — industry standard design" :
      matchInfo?.tier === 2 ? "MONGODB CACHE — previously generated and stored" :
      matchInfo?.tier === 3 ? "AI-GENERATED — just created and saved to DB for future users" :
      "REFERENCE DESIGN";

    refSection = `## REFERENCE DESIGN (${sourceLabel})

Summary: ${standardDesign.summary || ""}

Expected components (in order):
${(standardDesign.components || []).slice(0, 14).map((c, i) => `  ${i + 1}. ${c}`).join("\n")}

Critical must-have components: ${(standardDesign.criticalComponents || []).join(", ")}

Anti-patterns to detect and penalise:
${(standardDesign.antiPatterns || []).slice(0, 5).map((a) => `  • ${a}`).join("\n")}

Scalability decisions to reward if present:
${(standardDesign.scalabilityDecisions || []).slice(0, 4).map((d) => `  • ${d}`).join("\n")}

INSTRUCTIONS:
- Compare the user's design directly against this reference.
- Penalise every missing critical component.
- Detect and call out any anti-patterns found in the user's design.
- Reward design decisions that align with the scalability list.
- The comparisonWithStandard section MUST reflect this comparison.`;
  } else {
    refSection = `## NO REFERENCE AVAILABLE
Evaluate "${problemTitle}" based on general distributed systems principles.`;
  }

  return `You are a principal software engineer at FAANG conducting a system design interview.

${refSection}

## USER'S SUBMITTED DESIGN
Problem: "${problemTitle}"
Components placed on diagram: ${nodeList}
Connections drawn: ${edgeList || "none specified"}
User's written explanation: ${textExplanation || "none provided"}

## SCORING RUBRIC (1–10)
9–10  Hire immediately. Near-identical to industry standard with strong reasoning.
7–8   Strong candidate. Core components correct, minor gaps.
5–6   Average. Basics present but missing key scalability or reliability components.
3–4   Below average. Major architectural gaps or anti-patterns present.
1–2   Not ready. Fundamental distributed systems misunderstandings.

Be DIRECT and HONEST. Real interviewers do not give inflated scores.

Return ONLY valid JSON. No markdown. No text before or after the JSON. Keep values concise.

{
  "score": <float 1.0-10.0>,
  "summary": "<2-3 sentence honest interviewer assessment>",
  "strengths": ["<specific strength>", "<specific strength>", "<specific strength>"],
  "improvements": ["<actionable improvement>", "<improvement>", "<improvement>"],
  "weakAreas": ["<weak area category>", "<weak area category>"],
  "referenceComponents": ["<c1>", "<c2>", "<c3>", "<c4>", "<c5>", "<c6>"],
  "missingCriticalComponents": ["<missing component if any>"],
  "antiPatternsFound": ["<anti-pattern found in user design if any>"],
  "scoringBreakdown": {
    "scalability": <1-10>,
    "reliability": <1-10>,
    "completeness": <1-10>,
    "dataModeling": <1-10>,
    "communicationClarity": <1-10>
  },
  "comparisonWithStandard": {
    "matchedComponents": ["<component user got right>"],
    "missingFromUser": ["<standard component not in user design>"],
    "userHadExtra": ["<user component not in standard but valid>"],
    "verdict": "<one sentence: how close to the reference standard>"
  }
}`;
}

// ─── GET /api/designs/history ──────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const attempts = await Attempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-diagramData");
    res.json({ attempts });
  } catch {
    res.status(500).json({ error: "Failed to load history." });
  }
};

// ─── GET /api/designs/:id ──────────────────────────────────────────────────
exports.getAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.id, user: req.user._id });
    if (!attempt) return res.status(404).json({ error: "Attempt not found." });
    res.json({ attempt });
  } catch {
    res.status(500).json({ error: "Failed to load attempt." });
  }
};