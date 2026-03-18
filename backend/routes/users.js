const express = require("express");
const router  = express.Router();
const { getProfile, updateProfile, updatePassword } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

// only  do if the user is login  
router.get("/profile",    protect, getProfile);
router.patch("/profile",  protect, updateProfile);
router.patch("/password", protect, updatePassword);

module.exports = router;