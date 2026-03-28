require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const helmet    = require("helmet"); // to provide security  
const mongoose   = require("mongoose");
const rateLimit  = require("express-rate-limit");
const { getQueueStats }  = require("./utils/aiClient");
const authRoutes    = require("./routes/auth");
const problemRoutes = require("./routes/problems");
const userRoutes    = require("./routes/users");
const designRoutes  = require("./routes/designs");
const chatRoutes    = require("./routes/chat");

const app=express();


//Security Headers  
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc:  ["'self'"],
    styleSrc:   ["'self'", "'unsafe-inline'"],
    imgSrc:     ["'self'", "data:", "https:"], // "data:" is required for Base64 diagram images!
    connectSrc: ["'self'"],
  },
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// coonect with frontend 
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));


//  Global rate limiter 
app.use(rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many requests. Please slow down." },
}));

// Stricter limiter for auth routes (prevent brute force) 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { error: "Too many auth attempts. Please wait 15 minutes." },
});

//Routes 
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/designs",  designRoutes);
app.use("/api/chat",     chatRoutes);



// Health check 
app.get("/api/health", async (_req, res) => {
  const ai = getQueueStats(); // Pulled from your new Gemini aiClient.js
  
  let customProblems = 0;
  try {
    const Problem = require("./models/Problem");
    customProblems = await Problem.countDocuments({ isCustom: true });
  } catch {}

  res.json({
    status: "ok",
    time:   new Date().toISOString(),
    env:    process.env.NODE_ENV || "development",
    pillars: {
      "1_db_cache":         { customProblemsCached: customProblems },
      "2_zero_token_hints": { aiCalls: 0 },
      "3_ai_mentor":        { 
          fastModel: ai.fastModel, 
          smartModel: ai.smartModel, 
          geminiEnabled: ai.geminiEnabled, 
          activeConnections: ai.active 
      },
    }
  });
});

//  404 + global error handler
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// connect to mongoDb
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
      console.log(`Server running → http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });