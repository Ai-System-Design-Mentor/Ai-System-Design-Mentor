const express = require("express");
const router  = express.Router();
const { submitDesign, getHistory, getAttempt } = require("../controllers/designController");
const { protect } = require("../middleware/auth");

router.post("/submit",  protect, submitDesign);
router.get("/history",  protect, getHistory);
router.get("/:id",      protect, getAttempt);

module.exports = router;