/**
 * aiClient.js — Gemini-only AI client
 *
 * Uses Google Gemini exclusively via the new @google/genai SDK.
 *
 * Models:
 * gemini-2.5-flash  chat + hints + problem gen + evaluation
 *
 * Resilience:
 * - Exponential backoff fallback for 429s and Timeouts
 * - Concurrency queue: max 3 simultaneous calls (conservative for free tier)
 * - Per-call timeout protection
 */

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Using the active 2.5 generation models
const MODELS = {
  FAST:  "gemini-2.5-flash",
  SMART: "gemini-2.5-flash"
};

// Concurrency queue — conservative limit for free tier
const MAX_CONCURRENT = 3;
let active = 0;
const waitQueue = [];

function acquireSlot() {
  return new Promise((resolve) => {
    if (active < MAX_CONCURRENT) { active++; resolve(); }
    else waitQueue.push(resolve);
  });
}

function releaseSlot() {
  active--;
  if (waitQueue.length > 0) { active++; waitQueue.shift()(); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Core generateContent call for single-turn requests (Evaluation & Problem Gen)
async function geminiGenerate(modelName, prompt, options = {}) {
  const { maxRetries = 3, timeoutMs = 30000 } = options;

  await acquireSlot();
  let released = false;

  function safeRelease() {
    if (!released) {
      released = true;
      releaseSlot();
    }
  }

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
          }),
          new Promise((_, rej) =>
            setTimeout(() => rej(new Error("TIMEOUT")), timeoutMs)
          ),
        ]);

        safeRelease();
        return result.text;

      } catch (err) {
        const is429 = err?.status === 429;
        const isTimeout = err.message === "TIMEOUT";

        if ((is429 || isTimeout) && attempt < maxRetries) {
          const wait = Math.min(Math.pow(2, attempt) * 2000, 10000);
          console.warn(`[aiClient] retrying (${attempt}) in ${wait}ms`);
          await sleep(wait);
          continue;
        }

        throw err;
      }
    }
    throw new Error(`Gemini "${modelName}" failed after ${maxRetries} attempts`);
  } finally {
    safeRelease();
  }
}

// Chat with conversation history for multi-turn conversational replies
async function geminiChat(modelName, systemInstruction, messages, options = {}) {
  const { maxRetries = 3, timeoutMs = 30000 } = options;

  await acquireSlot();
  let released = false;
  
  function safeRelease() { 
    if (!released) { released = true; releaseSlot(); } 
  }

  // Convert array of messages to the new SDK's history format
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const config = { temperature: 0.8 };
  if (systemInstruction) {
    config.systemInstruction = systemInstruction;
  }

  try {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: config
          }),
          new Promise((_, rej) => setTimeout(() => rej(new Error("TIMEOUT")), timeoutMs)),
        ]);
        
        safeRelease();
        return result.text;
        
      } catch (err) {
        const is429 = err?.status === 429;
        const isTimeout = err.message === "TIMEOUT";
        
        if ((is429 || isTimeout) && attempt < maxRetries) {
          const wait = Math.min(Math.pow(2, attempt) * 2000, 10000);
          console.warn(`[aiClient] Chat 429/Timeout — waiting ${wait}ms before retry`);
          await sleep(wait);
          continue;
        }
        throw err;
      }
    }
    throw new Error(`Gemini Chat failed after ${maxRetries} attempts`);
  } finally {
    safeRelease();
  }
}



async function callForChat({ system, messages }) {
  // Uses the multi-turn function to maintain history context properly
  const text = await geminiChat(MODELS.FAST, system, messages);
  return { text, provider: "gemini" };
}

async function callForEvaluation({ messages }) {
  // Pulls the latest prompt for single-turn evaluation
  const prompt = messages[messages.length - 1].content;
  const text = await geminiGenerate(MODELS.SMART, prompt, {
    maxRetries: 3,
    timeoutMs: 45000,
  });
  return { text, provider: "gemini" };
}

async function callForProblem({ messages }) {
  const prompt = messages[messages.length - 1].content;
  const text = await geminiGenerate(MODELS.SMART, prompt, {
    maxRetries: 3,
    timeoutMs: 30000,
  });
  return { text, provider: "gemini" };
}

// Health endpoint stats
function getQueueStats() {
  return {
    active,
    queued:        waitQueue.length,
    max:           MAX_CONCURRENT,
    fastModel:     MODELS.FAST,
    smartModel:    MODELS.SMART,
    geminiEnabled: !!process.env.GEMINI_API_KEY,
    claudeEnabled: false,
  };
}

module.exports = { callForChat, callForEvaluation, callForProblem, getQueueStats };