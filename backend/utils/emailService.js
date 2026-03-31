/**
 * emailService.js
 *
 * Sends emails using Nodemailer.
 * Configured for Gmail (free) — swap to Mailgun/SendGrid for production.
 *
 * Setup for Gmail:
 *   1. Enable 2FA on your Google account
 *   2. Go to: myaccount.google.com → Security → App Passwords
 *   3. Generate a 16-character App Password
 *   4. Set EMAIL_USER and EMAIL_PASS in .env
 */

const nodemailer = require("nodemailer");

// Create transporter (lazy — only when first email is sent)
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || "smtp.gmail.com",
    port:   parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}


// ── Send OTP for registration (email verification)
async function sendRegistrationOTP(email, otp, username) {
  if (!process.env.EMAIL_USER) {
    // Email not configured — log OTP to console for local dev
    console.info(`[DEV] Registration OTP for ${email}: ${otp}`);
    return;
  }

  const transporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 32px 40px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; font-weight: 700; }
    .header p  { color: rgba(255,255,255,0.82); font-size: 13px; margin: 8px 0 0; }
    .body { padding: 36px 40px; }
    .body p { color: #374151; font-size: 15px; line-height: 1.65; margin: 0 0 16px; }
    .otp-box { background: #F0FFF4; border: 2px dashed #22C55E; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 38px; font-weight: 800; color: #16A34A; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .otp-note { font-size: 13px; color: #64748B; margin-top: 8px; }
    .warning { background: #FFF7ED; border-left: 3px solid #F97316; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400E; margin: 20px 0; }
    .footer { background: #F8FAFC; padding: 20px 40px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ AI  System Design Mentor</h1>
      <p>Verify Your Email Address</p>
    </div>
    <div class="body">
      <p>Hi <strong>${username}</strong>,</p>
      <p>Welcome! Use the code below to verify your email and complete your registration:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-note">This code expires in <strong>10 minutes</strong></div>
      </div>
      <div class="warning">
        ⚠️ If you didn't create an account, please ignore this email.
      </div>
      <p style="color:#94A3B8;font-size:13px">Never share this code with anyone.</p>
    </div>
    <div class="footer">
      AI System Design Mentor · This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'AI  System Design Mentor <noreply@aidesignmentor.com>',
    to:      email,
    subject: `${otp} — Verify your AI  System Design Mentor account`,
    html,
    text: `Your verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
  });
}

// ── Send OTP for password reset ───────────────────────────────────────────────
async function sendPasswordResetOTP(email, otp, username) {
  const transporter = getTransporter();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #2563EB, #7C3AED); padding: 32px 40px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; font-weight: 700; }
    .header p  { color: rgba(255,255,255,0.82); font-size: 13px; margin: 8px 0 0; }
    .body { padding: 36px 40px; }
    .body p { color: #374151; font-size: 15px; line-height: 1.65; margin: 0 0 16px; }
    .otp-box { background: #F0F6FF; border: 2px dashed #2563EB; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 38px; font-weight: 800; color: #2563EB; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .otp-note { font-size: 13px; color: #64748B; margin-top: 8px; }
    .warning { background: #FFF7ED; border-left: 3px solid #F97316; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400E; margin: 20px 0; }
    .footer { background: #F8FAFC; padding: 20px 40px; text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #E2E8F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏗️ AI  System Design Mentor</h1>
      <p>Password Reset Request</p>
    </div>
    <div class="body">
      <p>Hi <strong>${username}</strong>,</p>
      <p>We received a request to reset your password. Use the OTP below to continue:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <div class="otp-note">This code expires in <strong>10 minutes</strong></div>
      </div>
      <div class="warning">
        ⚠️ If you didn't request this, please ignore this email. Your account is safe.
      </div>
      <p style="color:#94A3B8;font-size:13px">For security, never share this code with anyone.</p>
    </div>
    <div class="footer">
      AI System Design Mentor · This is an automated message, please do not reply.
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || "AI System  Design Mentor <noreply@aidesignmentor.com>",
    to:      email,
    subject: `${otp} — Your Password Reset Code`,
    html,
    text: `Your AI System Design Mentor password reset code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`,
  });
}

// Send welcome email on registration
async function sendWelcomeEmail(email, username) {
  // Skip if email not configured — welcome email is optional
  if (!process.env.EMAIL_USER) return;

  const transporter = getTransporter();

  await transporter.sendMail({
    from:    process.env.EMAIL_FROM || "AI Design Mentor <noreply@aidesignmentor.com>",
    to:      email,
    subject: `Welcome to AI Design Mentor, ${username}! 🏗️`,
    html: `
<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:32px">
  <h2 style="color:#2563EB">Welcome, ${username}! 🎉</h2>
  <p style="color:#374151;line-height:1.65">
    You're now ready to practice system design interviews like a FAANG engineer.
  </p>
  <p style="color:#374151;line-height:1.65">
    Start with an easy problem like <strong>Design URL Shortener</strong> to get familiar
    with the canvas, then work your way up to <strong>Design YouTube</strong> or
    <strong>Design Uber</strong>.
  </p>
  <p style="color:#64748B;font-size:13px;margin-top:24px">Happy designing! 🚀</p>
</div>`,
  }).catch(() => {}); // Non-critical — don't block registration on email failure
}

module.exports = { sendRegistrationOTP, sendPasswordResetOTP, sendWelcomeEmail };