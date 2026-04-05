require("dotenv").config();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client} = require("google-auth-library");

const client = new OAuth2Client(process.env.CLIENT_ID);

// Google Authentication
async function verify(token) {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: client,
    });

    const payload = ticket.getPayload();
    return payload;
}

const {
    sendRegistrationOTP,
    sendPasswordResetOTP,
    sendWelcomeEmail,
  } = require("../utils/emailService")

// creating the token
const sign = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });


// only provide essential user information
const publicUser = (u) => ({
    id: u._id,
    username: u.username,
    email: u.email,
    stats: u.stats,
    weakAreas: u.weakAreas,
    createdAt: u.createdAt,
});

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// POST /api/auth/register-request
exports.registerRequest = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username?.trim() || !email?.trim() || !password)
            return res.status(400).json({ error: "All fields are required." });
          if (username.trim().length < 3)
            return res.status(400).json({ error: "Username must be at least 3 characters." });
          if (password.length < 6)
            return res.status(400).json({ error: "Password must be at least 6 characters." });

        const emailLower = email.toLowerCase().trim();
            // Block if a verified account already exists with this email or username
        if (await User.findOne({ email: emailLower, isVerified: true }))
            return res.status(400).json({ error: "Email is already registered." });
          if (await User.findOne({ username: username.trim(), isVerified: true }))
            return res.status(400).json({ error: "Username is already taken." });

          const otp     = generateOTP();
          const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

     // Upsert: if there is an existing unverified pending record for this email,
    // update it. Otherwise create a new one.
    // This handles the case where the user re-registers before verifying.
    let pendingUser = await User.findOne({ email: emailLower, isVerified: false });
    if (pendingUser) {
        pendingUser.username       = username.trim();
        pendingUser.password       = password;        // re-hashed by pre-save hook
        pendingUser.regOTP         = otp;
        pendingUser.regOTPExpires  = expires;
        pendingUser.regOTPAttempts = 0;
        await pendingUser.save();
      } else {
        await User.create({
          username:       username.trim(),
          email:          emailLower,
          password,                      // hashed by pre-save hook
          isVerified:     false,
          regOTP:         otp,
          regOTPExpires:  expires,
          regOTPAttempts: 0,
        });
      }

      await sendRegistrationOTP(emailLower, otp, username.trim());


      res.json({
        message: `Verification code sent to ${emailLower}. Check your inbox (and spam folder).`,
        email:   emailLower,
      });
    } catch (err) {
      if (err.code === 11000)
        return res.status(400).json({ error: "Email or username already exists." });
      console.error("registerRequest:", err);
      res.status(500).json({ error: "Registration failed. Please try again." });
    }
};


// POST /api/auth/register-verify
exports.registerVerify = async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email?.trim() || !otp?.trim())
        return res.status(400).json({ error: "Email and verification code are required." });

      const user = await User.findOne({ email: email.toLowerCase().trim(), isVerified: false })
        .select("+regOTP +regOTPExpires +regOTPAttempts +password");

      if (!user)
        return res.status(400).json({ error: "No pending registration found. Please sign up again." });

      if (!user.regOTP || !user.regOTPExpires || user.regOTPExpires < Date.now())
        return res.status(400).json({ error: "Code has expired. Request a new one using Resend." });

      if ((user.regOTPAttempts || 0) >= 5)
        return res.status(429).json({ error: "Too many failed attempts. Please sign up again." });

      if (user.regOTP !== otp.trim()) {
        user.regOTPAttempts = (user.regOTPAttempts || 0) + 1;
        await user.save({ validateBeforeSave: false });
        const remaining = 5 - user.regOTPAttempts;
        return res.status(400).json({
          error: remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
            : "Too many failed attempts. Please sign up again.",
        });
      }


      user.isVerified     = true;
      user.regOTP         = undefined;
      user.regOTPExpires  = undefined;
      user.regOTPAttempts = 0;
      await user.save({ validateBeforeSave: false });

      sendWelcomeEmail(user.email, user.username).catch(() => {});

      res.status(201).json({
        token:   sign(user._id),
        user:    publicUser(user),
        message: "Email verified! Your account is ready.",
      });
    } catch (err) {
      console.error("registerVerify:", err);
      res.status(500).json({ error: "Verification failed. Please try again." });
    }
  };

  // POST /api/auth/register-resend
exports.registerResend = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email?.trim())
        return res.status(400).json({ error: "Email is required." });

      const user = await User.findOne({ email: email.toLowerCase().trim(), isVerified: false })
        .select("+regOTP +regOTPExpires +regOTPAttempts");

      if (!user)
        return res.status(400).json({ error: "No pending registration found for this email." });

      const otp    = generateOTP();
      user.regOTP         = otp;
      user.regOTPExpires  = new Date(Date.now() + 10 * 60 * 1000);
      user.regOTPAttempts = 0;
      await user.save({ validateBeforeSave: false });

      await sendRegistrationOTP(user.email, otp, user.username);
      res.json({ message: "New verification code sent." });
    } catch (err) {
      console.error("registerResend:", err);
      res.status(500).json({ error: "Could not resend code. Please try again." });
    }
  };


// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        const user = await User.findOne({
            email:      email.toLowerCase().trim(),
            isVerified: true,
          }).select("+password");
        if (!user) {
            return res.status(404).json({ error: "Account does not exist. Please register first." });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: "Incorrect password." });
        }

        res.json({ token: sign(user._id), user: publicUser(user) });
    } catch (err) {
        console.error("login:", err);
        res.status(500).json({ error: "Login failed. Please try again." });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
      if (!email?.trim())
        return res.status(400).json({ error: "Email is required." });

      const SAFE_MSG = "If that email is registered, a reset code has been sent.";

      const user = await User.findOne({ email: email.toLowerCase().trim(), isVerified: true })
        .select("+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts +passwordResetLockedUntil");

      if (!user) return res.json({ message: SAFE_MSG });

      const otp = generateOTP();
      user.passwordResetOTP         = otp;
      user.passwordResetOTPExpires  = new Date(Date.now() + 10 * 60 * 1000);
      user.passwordResetAttempts    = 0;
      user.passwordResetLockedUntil = undefined;
      await user.save({ validateBeforeSave: false });

      await sendPasswordResetOTP(user.email, otp, user.username);
      res.json({ message: SAFE_MSG });
    } catch (err) {
      console.error("forgotPassword:", err);
      res.status(500).json({ error: "Could not send reset code. Please try again." });
    }
  };

  exports.verifyOTP = async (req, res) => {
    try {
      const { email, otp } = req.body;
      if (!email || !otp)
        return res.status(400).json({ error: "Email and code are required." });

      const user = await User.findOne({ email: email.toLowerCase().trim(), isVerified: true })
        .select("+passwordResetOTP +passwordResetOTPExpires +passwordResetAttempts +passwordResetLockedUntil");

      if (!user)
        return res.status(400).json({ error: "Invalid code." });

      if (user.passwordResetLockedUntil && user.passwordResetLockedUntil > Date.now()) {
        const waitMin = Math.ceil((user.passwordResetLockedUntil - Date.now()) / 60000);
        return res.status(429).json({
          error: `Too many failed attempts. Try again in ${waitMin} minute${waitMin !== 1 ? "s" : ""}.`,
        });
      }

      if (!user.passwordResetOTP || user.passwordResetOTPExpires < Date.now())
        return res.status(400).json({ error: "Code has expired. Please request a new one." });

      if (user.passwordResetOTP !== otp.trim()) {
        user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
        if (user.passwordResetAttempts >= 5) {
          user.passwordResetLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
          user.passwordResetOTP = undefined;
        }
        await user.save({ validateBeforeSave: false });
        const remaining = Math.max(0, 5 - user.passwordResetAttempts);
        return res.status(400).json({
          error: remaining > 0
            ? `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
            : "Too many failed attempts. Account locked for 15 minutes.",
        });
      }

      const resetToken = jwt.sign(
        { id: user._id, purpose: "password-reset" },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );

      user.passwordResetOTP         = undefined;
      user.passwordResetOTPExpires  = undefined;
      user.passwordResetAttempts    = 0;
      user.passwordResetLockedUntil = undefined;
      await user.save({ validateBeforeSave: false });

      res.json({ resetToken, message: "Code verified. You may now set a new password." });
    } catch (err) {
      console.error("verifyOTP:", err);
      res.status(500).json({ error: "Verification failed. Please try again." });
    }
  };

  exports.resetPassword = async (req, res) => {
    try {
      const { resetToken, newPassword } = req.body;
      if (!resetToken || !newPassword)
        return res.status(400).json({ error: "Token and new password are required." });
      if (newPassword.length < 6)
        return res.status(400).json({ error: "Password must be at least 6 characters." });

      let decoded;
      try {
        decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      } catch {
        return res.status(400).json({ error: "Reset link expired. Please request a new code." });
      }

      if (decoded.purpose !== "password-reset")
        return res.status(400).json({ error: "Invalid token." });

      const user = await User.findById(decoded.id).select("+password");
      if (!user)
        return res.status(400).json({ error: "User not found." });

      user.password = newPassword;
      await user.save();

      res.json({ message: "Password updated. You can now log in." });
    } catch (err) {
      console.error("resetPassword:", err);
      res.status(500).json({ error: "Password reset failed. Please try again." });
    }
  };

  // POST /api/auth/google
exports.googleLogin = async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      // verify token from Google
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID,
      });

      const payload = ticket.getPayload();

      const { email, name, picture } = payload;

      // 🔍 check if user exists
      let user = await User.findOne({ email });

      if (!user) {
        // 🆕 create new user
        user = await User.create({
          email,
          username: name,
          password: Math.random().toString(36), // dummy password
          isVerified: true,
        });
      }

      // 🎟️ generate JWT
      res.json({
        token: sign(user._id),
        user: publicUser(user),
      });

    } catch (err) {
      console.error("googleLogin:", err);
      res.status(401).json({ error: "Invalid Google token" });
    }
  };

  // POST /api/auth/github
exports.githubLogin = async (req, res) => {
  try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "No code provided" });

      // 1. Exchange code for Access Token
      const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
          },
          body: JSON.stringify({
              client_id: process.env.GITHUB_CLIENT_ID,
              client_secret: process.env.GITHUB_CLIENT_SECRET,
              code,
          }),
      });
      
      const tokenData = await tokenResponse.json();
      if (tokenData.error) return res.status(400).json({ error: "GitHub authorization failed" });

      const accessToken = tokenData.access_token;
      if (!accessToken) {
        console.error("GitHub Token Error Data:", tokenData);
        return res.status(400).json({ error: "Failed to get access token from GitHub." });
    }

      // 2. Fetch User Profile from GitHub
      const userResponse = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${accessToken}` },
      });
      const githubUser = await userResponse.json();

      // 3. Fetch User Emails (GitHub hides emails by default, so we need a separate request)
      const emailResponse = await fetch("https://api.github.com/user/emails", {
          headers: { Authorization: `Bearer ${accessToken}` },
      });
      const emails = await emailResponse.json();
      if (!Array.isArray(emails)) {
        console.error("GitHub Emails Error:", emails);
        return res.status(400).json({ error: "Could not fetch emails from GitHub." });
    }
      
      // Find the primary, verified email
      const primaryEmailObj = emails.find((e) => e.primary && e.verified);
      if (!primaryEmailObj) {
          return res.status(400).json({ error: "No verified email found on your GitHub account" });
      }
      
      const email = primaryEmailObj.email.toLowerCase();

      // 4. Find or Create User in MongoDB
      let user = await User.findOne({ email });

      if (!user) {
          // Create a new user (bypass standard password/OTP since GitHub verified them)
          user = await User.create({
              username: githubUser.login || `user_${Date.now()}`,
              email: email,
              password: crypto.randomBytes(16).toString("hex"), // Random secure password they will never use
              isVerified: true, // Auto-verify since GitHub verified the email
          });
      } else if (!user.isVerified) {
          // If they started registering manually but switched to GitHub, verify them!
          user.isVerified = true;
          await user.save();
      }

      // 5. Send back JWT
      res.json({ token: sign(user._id), user: publicUser(user) });

  } catch (err) {
      console.error("GitHub Login Error:", err);
      res.status(500).json({ error: "Server error during GitHub authentication." });
  }
};


// GET /api/auth/me
exports.getMe = (req, res) => res.json({ user: publicUser(req.user) });