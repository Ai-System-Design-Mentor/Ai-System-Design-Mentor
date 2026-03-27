const express = require("express");
const router  = express.Router();
const { sendMessage, getHint, generateProblem, chatRateLimit } = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

router.post("/",                 protect, chatRateLimit, sendMessage);
router.post("/hint",             protect, chatRateLimit, getHint);
router.post("/generate-problem", protect, chatRateLimit, generateProblem);

module.exports = router;