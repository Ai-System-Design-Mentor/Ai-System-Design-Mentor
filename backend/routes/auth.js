const express = require("express");
const router  = express.Router();
const {  registerRequest, registerVerify, registerResend,
    login, getMe,
    forgotPassword, verifyOTP, resetPassword, } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register-request", registerRequest); // Step 1: validate + send OTP
router.post("/register-verify",  registerVerify);  // Step 2: verify OTP → JWT
router.post("/register-resend",  registerResend);  // Resend OTP
router.post("/login",    login);
router.get("/me", protect, getMe);

router.post("/forgot-password", forgotPassword); // Step 1: send OTP
router.post("/verify-otp",      verifyOTP);      // Step 2: verify OTP → resetToken
router.post("/reset-password",  resetPassword);  // Step 3: set new password

module.exports = router;