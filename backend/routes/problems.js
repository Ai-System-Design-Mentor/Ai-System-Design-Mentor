const express = require("express");
const router  = express.Router();
const Problem = require("../models/Problem");

// GET /api/problems  — public
router.get("/", async (_req, res) => {
  try {
    const problems = await Problem.find({ isCustom: false }) // only show the seeded design problems
      .select("-standardDesign") // don't expose the full reference to the client
      .sort({ difficulty: 1 }); // easy -->hard
    res.json({ problems });
  } catch (err) {
    console.error("problems list:", err);
    res.status(500).json({ error: "Failed to load problems." });
  }
});
// GET /api/problems/:slug  — public (includes hints, excludes full standard design)
// for getting the particular problem
router.get("/:slug", async (req, res) => {
  try {
    const problem = await Problem.findOne({ slug: req.params.slug })
      .select("slug title difficulty estimatedTime tags description requirements constraints hints standardDesign.summary standardDesign.components"); // helps to provide hint to the user or that design
    if (!problem) return res.status(404).json({ error: "Problem not found." });
    res.json({ problem });
  } catch (err) {
    console.error("problem by slug:", err);
    res.status(500).json({ error: "Failed to load problem." });
  }
});

module.exports = router;