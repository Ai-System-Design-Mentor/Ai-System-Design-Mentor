/**
 * chatController.js — Production-Ready, 3-Pillar Resilience
 *
 * PILLAR 1 — generateProblem: MongoDB global cache (DB-first, AI-last)
 * Slug checked in DB first → ZERO AI calls on cache hit
 * On miss: Gemini generates problem + standardDesign → saved to DB immediately
 *
 * PILLAR 2 — getHint: Zero-token algorithmic grading
 * NO AI CALL AT ALL.
 * Compares current diagram against required components.
 * Returns pre-written hint strings. Always instant, always free.
 *
 * PILLAR 3 — sendMessage: Interactive AI Mentor
 * Uses Gemini 2.5 Flash to act as a Socratic mentor.
 * Injects live canvas state and anti-patterns to guide the conversation.
 */

const rateLimit        = require("express-rate-limit");
const Problem          = require("../models/Problem");
const STANDARD_DESIGNS = require("../data/standardDesigns");
const { callForChat, callForProblem } = require("../utils/aiClient");

// ── Per-user rate limit on chat (AI calls cost money) ────────────────────────
exports.chatRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: { error: "Too many messages. Please wait a moment before sending again." },
});

// ── Helper: derive slug from any title ────────────────────────────────────────
// "Design Swiggy Food App" → "swiggy-food-app"
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

//POST /api/chat/generate-problem
exports.generateProblem = async (req, res) => {
  try {
    const { systemName } = req.body;
    if (!systemName?.trim()) {
      return res.status(400).json({ error: "System name is required." });
    }

    const slug = deriveProblemSlug(systemName);

    // ── Step 1: MongoDB cache check ───────────────────────────────────────
    const cached = await Problem.findOne({ slug }).lean();
    if (cached) {
      console.info(`[Chat] generateProblem: CACHE HIT for "${slug}" — 0 AI calls`);
      return res.json({
        problem: {
          description:  cached.description  || "",
          requirements: cached.requirements || [],
          constraints:  cached.constraints  || [],
          hints:        cached.hints        || [],
        },
        standardDesign: cached.standardDesign || null,
        _source: "db-cache",
        _slug:   slug,
      });
    }

    // ── Step 2: AI generation ─────────────────────────────────────────────
    console.info(`[Chat] generateProblem: CACHE MISS for "${slug}" — generating via Gemini`);

    const { text, provider } = await callForProblem({
      messages: [{
        role: "user",
        content: `You are a principal engineer at Google. Generate a complete system design interview problem for: "${systemName}".

Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "<clean title e.g. 'Design Swiggy'>",
  "description": "<2 sentence problem overview with real scale context>",
  "requirements": [
    "<functional requirement 1>",
    "<functional requirement 2>"
  ],
  "constraints": [
    "<scale constraint with real numbers e.g. X million orders/day>",
    "<latency constraint e.g. response within Xms>"
  ],
  "hints": [
    "<hint about the hardest architectural challenge — don't give the answer>"
  ],
  "standardDesign": {
    "summary": "<2 sentence description of the ideal production architecture>",
    "components": [
      "<ordered list of 8-12 key components a production system would have>"
    ],
    "criticalComponents": [
      "<4-6 components that are absolutely must-have — used for algorithmic hints>"
    ],
    "antiPatterns": [
      "<3-5 common mistakes engineers make for this type of system>"
    ],
    "scalabilityDecisions": [
      "<3-4 key architectural decisions that make it scalable>"
    ],
    "faultToleranceMechanisms": [
      "<2-3 reliability mechanisms the system should have>"
    ]
  }
}`,
      }],
    });

    // Parse AI response safely
    let generated;
    try {
      const clean = text
        .replace(/```json[\s\S]*?```|```[\s\S]*?```/g,
          (m) => m.replace(/```json?\n?/g, "").replace(/\n?```/g, ""))
        .trim();
      generated = JSON.parse(clean);
    } catch {
      const match = text.match(/\{[\s\S]+\}/);
      if (!match) throw new Error("AI returned invalid JSON for problem generation");
      generated = JSON.parse(match[0]);
    }

    // ── Step 3: Save to MongoDB
    try {
      await Problem.findOneAndUpdate(
        { slug },
        {
          $setOnInsert: {
            slug,
            title:         generated.title        || systemName,
            description:   generated.description  || "",
            requirements:  generated.requirements || [],
            constraints:   generated.constraints  || [],
            hints:         generated.hints        || [],
            standardDesign: generated.standardDesign || null,
            isCustom:      true,
            difficulty:    "Medium",
            estimatedTime: 45,
            tags:          ["Custom"],
          },
        },
        { upsert: true, new: true }
      );
      console.info(`[Chat] generateProblem: Saved "${slug}" to MongoDB — future users get cache`);
    } catch (saveErr) {
      if (saveErr.code !== 11000) {
        console.warn(`[Chat] generateProblem: Failed to save to DB:`, saveErr.message);
      }
    }

    res.json({
      problem: {
        description:  generated.description,
        requirements: generated.requirements,
        constraints:  generated.constraints,
        hints:        generated.hints,
      },
      standardDesign: generated.standardDesign || null,
      _source:   "ai-generated",
      _provider: provider,
      _slug:     slug,
    });

  } catch (err) {
    console.error("generateProblem:", err);
    res.status(500).json({ error: "Failed to generate problem. Please try again." });
  }
};


//  POST /api/chat/hint
exports.getHint = async (req, res) => {
  try {
    const { problemSlug, currentDiagram } = req.body;

    const nodeTypes = (currentDiagram?.nodes || []).map((n) => n.type.toLowerCase());

    let criticalComponents = [];

    if (problemSlug) {
      const problem = await Problem.findOne({ slug: problemSlug })
        .select("standardDesign.criticalComponents")
        .lean();

      if (problem?.standardDesign?.criticalComponents?.length) {
        criticalComponents = problem.standardDesign.criticalComponents;
      } else if (STANDARD_DESIGNS[problemSlug]?.criticalComponents) {
        criticalComponents = STANDARD_DESIGNS[problemSlug].criticalComponents;
      }
    }

    // Find the first missing critical component
    // Aliases: maps common node names users type → canonical component keywords
    const COMPONENT_ALIASES = {
        "redis":         ["distributed cache", "cache"],
        "memcached":     ["distributed cache", "cache"],
        "kafka":         ["message queue", "queue", "pub-sub", "event bus"],
        "rabbitmq":      ["message queue", "queue"],
        "sqs":           ["message queue", "queue"],
        "s3":            ["object storage", "blob storage"],
        "cassandra":     ["nosql db", "nosql", "message store"],
        "dynamodb":      ["nosql db", "nosql"],
        "mongodb":       ["nosql db", "nosql"],
        "postgres":      ["relational db", "database", "db"],
        "postgresql":    ["relational db", "database"],
        "mysql":         ["relational db", "database"],
        "elasticsearch": ["search service", "search"],
        "nginx":         ["load balancer"],
        "haproxy":       ["load balancer"],
        "cloudfront":    ["cdn"],
        "websocket":     ["websocket gateway", "gateway service"],
        "jwt":           ["auth service"],
        "oauth":         ["auth service"],
      };

    // Resolve node type to all its possible canonical names (including aliases)
    function resolveNodeNames(nodeType) {
        const lower = nodeType.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
        const names = [lower];
        for (const [alias, targets] of Object.entries(COMPONENT_ALIASES)) {
          if (lower.includes(alias)) names.push(...targets);
        }
        return names;
    }

    const resolvedNodeNames = nodeTypes.flatMap(resolveNodeNames);

    const missing = criticalComponents.filter((required) => {
        const reqLower  = required.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
        const reqWords  = reqLower.split(" ");
        // Match if any resolved node name covers any word of the required component
        return !resolvedNodeNames.some((resolved) =>
          reqWords.some((word) => word.length > 2 && resolved.includes(word)) ||
          resolved.split(" ").some((word) => word.length > 2 && reqLower.includes(word))
        );
    });

    if (missing.length > 0) {
      const missingComponent = missing[0];
      const key = missingComponent.toLowerCase();
      let hint;

      if (key.includes("cdn"))
        hint = `Your architecture might be missing a **CDN**. Think about users in different countries — how would someone in Tokyo get your content fast without hitting your origin server every time?`;
      else if (key.includes("cache") || key.includes("redis"))
        hint = `It looks like your design might be missing a **${missingComponent}**. What data gets read far more often than it gets written? Adding a cache layer there could reduce database load.`;
      else if (key.includes("load balancer") || key.includes("load"))
        hint = `A **${missingComponent}** might be missing. If you have multiple server instances, what directs traffic between them?`;
      else if (key.includes("queue") || key.includes("kafka") || key.includes("broker"))
        hint = `Think about whether your design needs a **${missingComponent}**. What happens when one service sends requests faster than another can process them?`;
      else if (key.includes("database") || key.includes("db"))
        hint = `Your design might be missing a **${missingComponent}**. Where does your persistent data live?`;
      else if (key.includes("api gateway") || key.includes("gateway"))
        hint = `An **API Gateway** might be missing. How do clients know which microservice to call?`;
      else if (key.includes("monitor") || key.includes("logging"))
        hint = `Consider adding **${missingComponent}**. How would you know your system is unhealthy at 3am?`;
      else if (key.includes("storage") || key.includes("s3") || key.includes("object"))
        hint = `Your design might be missing **${missingComponent}**. Where do large files like images, videos, or documents actually live?`;
      else
        hint = `It looks like your architecture might be missing a crucial component: **${missingComponent}**. Consider what problem it solves and where it fits.`;

      return res.json({
        hint,
        missingComponent,
        totalMissing: missing.length,
        _source:  "algorithmic",
        _aiCalls: 0,
      });
    }

    // Nothing missing — return encouraging push-forward message
    const encouragements = [
      "Your component coverage looks solid! Now think about the data flows — how does data move between these components step by step?",
      "Good coverage of core components! Now think about failure scenarios — which single component failing would bring down the whole system?",
      "Your architecture is coming together well! Consider the data model — what does your primary database schema look like?",
    ];

    return res.json({
      hint: encouragements[Math.floor(Math.random() * encouragements.length)],
      missingComponent: null,
      totalMissing:     0,
      _source:  "algorithmic",
      _aiCalls: 0,
    });

  } catch (err) {
    console.error("getHint:", err);
    res.status(500).json({ error: "Could not generate hint. Please try again." });
  }
};

// PILLAR 3 — POST /api/chat
exports.sendMessage = async (req, res) => {
  try {
    const {
      message,
      problemTitle,
      problemSlug,
      conversationHistory,
      currentDiagram,
    } = req.body;

    if (!message?.trim())
      return res.status(400).json({ error: "Message is required." });
    if (message.length > 600)
      return res.status(400).json({ error: "Message too long (max 600 chars)." });

    // Load anti-patterns from DB to guide the mentor
    let antiPatterns = [];
    if (problemSlug) {
      const problem = await Problem.findOne({ slug: problemSlug })
        .select("standardDesign.antiPatterns")
        .lean();
      if (problem?.standardDesign?.antiPatterns?.length) {
        antiPatterns = problem.standardDesign.antiPatterns;
      } else if (STANDARD_DESIGNS[problemSlug]?.antiPatterns) {
        antiPatterns = STANDARD_DESIGNS[problemSlug].antiPatterns;
      }
    }

    const antiPatternGuide = antiPatterns.length
      ? `\nKnown anti-patterns to steer user away from (use leading questions, don't reveal directly):\n${
          antiPatterns.slice(0, 4).map((a, i) => `${i + 1}. ${a}`).join("\n")
        }`
      : "";

    const canvasCtx = currentDiagram?.nodes?.length
      ? `\nUser's current diagram: ${currentDiagram.nodes.map((n) => n.type).join(", ")}.` +
        (currentDiagram.edges?.length
          ? ` Connections: ${currentDiagram.edges.map((e) => {
              const f = currentDiagram.nodes.find((n) => n.id === e.from)?.type || "?";
              const t = currentDiagram.nodes.find((n) => n.id === e.to)?.type   || "?";
              return `${f}→${t}`;
            }).join(", ")}.`
          : " No connections yet.")
      : "\nUser's diagram is empty.";

    const systemPrompt = `You are a senior staff engineer at Google mentoring a junior engineer in a system design interview.

PROBLEM: "${problemTitle || "general system design"}"
${canvasCtx}
${antiPatternGuide}

STRICT RULES — NEVER BREAK THESE:
1. NEVER give the complete solution or list all the components the user should add.
2. Ask ONE Socratic question per response: "What happens when X fails?", "How does this scale to 10M users?"
3. You MAY explain concepts freely (e.g. "What is a CDN?", "How does consistent hashing work?").
4. If the user is heading toward an anti-pattern, ask a leading question so they discover it themselves.
5. Acknowledge good decisions already visible in their diagram.
6. MAX 3 sentences per response. Be warm, encouraging, and direct.`;

    // Format conversation history strictly for aiClient
    const chatMessages = (conversationHistory || [])
      .slice(-12)
      .filter((m) => m.role === "user" || m.role === "ai" || m.role === "assistant")
      .map((m) => ({
        role:    (m.role === "ai" || m.role === "assistant") ? "assistant" : "user",
        content: m.text || m.content,
      }));

    chatMessages.push({ role: "user", content: message.trim() });

    try {
      const result = await callForChat({
        system:   systemPrompt,
        messages: chatMessages,
      });

      res.json({
        reply:     result.text,
        _provider: result.provider,
      });

    } catch (chatErr) {
      console.error("[Chat] sendMessage: AI generation failed:", chatErr.message);
      return res.status(503).json({
        error: "Your mentor is currently busy. Please try again in a few seconds.",
        retryAfter: 10,
      });
    }

  } catch (err) {
    console.error("sendMessage:", err);
    res.status(500).json({ error: "AI mentor unavailable. Please try again." });
  }
};