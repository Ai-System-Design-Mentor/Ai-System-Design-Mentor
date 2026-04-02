import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../utils/Api";
import "./AuthPage.css";

/**
 * AuthPage — 6 modes in one page:
 *   "login"          Email + password → JWT
 *   "register"       Step 1: fill details → POST /auth/register-request → OTP email
 *   "register-otp"   Step 2: enter OTP → POST /auth/register-verify → logged in
 *   "forgot"         Step 1: enter email → POST /auth/forgot-password → OTP email
 *   "forgot-otp"     Step 2: enter OTP → POST /auth/verify-otp → resetToken
 *   "reset"          Step 3: new password → POST /auth/reset-password → done
 */
export default function AuthPage() {
    const [mode, setMode] = useState("login");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Shared fields
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [pwScore, setPwScore] = useState(0);

    // OTP (shared for register-otp and forgot-otp)
    const [otp, setOtp] = useState("");

    // Forgot password
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [resetToken, setResetToken] = useState("");

    const { login: ctxLogin, updateUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    // ── Helpers ───────────────────────────────────────────────────────────────
    function goTo(m) {
        setMode(m); setError(""); setSuccess(""); setOtp("");
        setPassword(""); setConfirm(""); setNewPw(""); setConfirmPw("");
        setResetToken(""); setPwScore(0);
    }

    function scorePassword(v) {
        let s = 0;
        if (v.length >= 6) s++;
        if (v.length >= 10) s++;
        if (/[A-Z]/.test(v)) s++;
        if (/[0-9]/.test(v)) s++;
        if (/[^A-Za-z0-9]/.test(v)) s++;
        setPwScore(s);
    }

    const STRENGTHS = [
        { label: "Weak", color: "#ef4444" },
        { label: "Fair", color: "#f97316" },
        { label: "Good", color: "#eab308" },
        { label: "Strong", color: "#22c55e" },
        { label: "Very Strong", color: "#22c55e" },
    ];
    const sw = STRENGTHS[Math.min(pwScore - 1, 4)];

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    async function handleLogin(e) {
        e.preventDefault();
        if (!email || !password) return setError("Please fill in all fields.");
        setError(""); setLoading(true);
        try {
            await ctxLogin(email.trim(), password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message || "Invalid email or password.");
        }
        setLoading(false);
    }

    // ── REGISTER step 1 ───────────────────────────────────────────────────────
    async function handleRegisterRequest(e) {
        e.preventDefault();
        if (!username.trim() || !email.trim() || !password) return setError("All fields are required.");
        if (username.trim().length < 3) return setError("Username must be at least 3 characters.");
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        if (password !== confirm) return setError("Passwords do not match.");
        setError(""); setLoading(true);
        try {
            const { message } = await authApi.registerRequest(username.trim(), email.trim(), password);
            setSuccess(message);
            setMode("register-otp");
        } catch (err) {
            setError(err.message || "Registration failed. Please try again.");
        }
        setLoading(false);
    }

    // ── REGISTER step 2 — verify OTP ──────────────────────────────────────────
    async function handleRegisterVerify(e) {
        e.preventDefault();
        if (otp.length < 6) return setError("Please enter the full 6-digit code.");
        setError(""); setLoading(true);
        try {
            const { token, user, message } = await authApi.registerVerify(email.trim(), otp.trim());
            localStorage.setItem("token", token);
            updateUser(user);
            setSuccess(message || "Account created!");
            setTimeout(() => navigate("/", { replace: true }), 700);
        } catch (err) {
            setError(err.message || "Invalid code. Please try again.");
        }
        setLoading(false);
    }

    async function handleRegisterResend() {
        setError(""); setSuccess(""); setLoading(true);
        try {
            const { message } = await authApi.registerResend(email.trim());
            setSuccess(message); setOtp("");
        } catch (err) { setError(err.message || "Could not resend code."); }
        setLoading(false);
    }

    // ── FORGOT step 1 — send reset OTP ────────────────────────────────────────
    async function handleForgotRequest(e) {
        e.preventDefault();
        if (!email.trim()) return setError("Email is required.");
        setError(""); setLoading(true);
        try {
            const { message } = await authApi.forgotPassword(email.trim());
            setSuccess(message);
            setMode("forgot-otp");
        } catch (err) {
            setError(err.message || "Could not send reset code.");
        }
        setLoading(false);
    }

    // ── FORGOT step 2 — verify reset OTP ─────────────────────────────────────
    async function handleForgotVerify(e) {
        e.preventDefault();
        if (otp.length < 6) return setError("Please enter the full 6-digit code.");
        setError(""); setLoading(true);
        try {
            const { resetToken: tok, message } = await authApi.verifyResetOTP(email.trim(), otp.trim());
            setResetToken(tok);
            setSuccess(message || "Code verified!");
            setMode("reset");
        } catch (err) {
            setError(err.message || "Invalid code. Please try again.");
        }
        setLoading(false);
    }

    async function handleForgotResend() {
        setError(""); setSuccess(""); setLoading(true);
        try {
            const { message } = await authApi.forgotPassword(email.trim());
            setSuccess(message); setOtp("");
        } catch (err) { setError(err.message || "Could not resend code."); }
        setLoading(false);
    }

    // ── FORGOT step 3 — set new password ─────────────────────────────────────
    async function handleResetPassword(e) {
        e.preventDefault();
        if (!newPw || newPw.length < 6) return setError("Password must be at least 6 characters.");
        if (newPw !== confirmPw) return setError("Passwords do not match.");
        setError(""); setLoading(true);
        try {
            const { message } = await authApi.resetPassword(resetToken, newPw);
            setSuccess(message || "Password updated!");
            setTimeout(() => goTo("login"), 1500);
        } catch (err) {
            setError(err.message || "Password reset failed. Please try again.");
        }
        setLoading(false);
    }

    // ── Header copy per mode ──────────────────────────────────────────────────
    const HDR = {
        login: ["Welcome back", "Sign in to continue your system design practice"],
        register: ["Create account", "Join engineers practising system design with AI"],
        "register-otp": ["Verify your email", `Enter the 6-digit code sent to ${email}`],
        forgot: ["Forgot password", "We'll send a reset code to your email"],
        "forgot-otp": ["Enter reset code", `Check your inbox at ${email}`],
        reset: ["Set new password", "Choose a strong password for your account"],
    };
    const [title, sub] = HDR[mode] || HDR.login;

    return (
        <div className="authContainer">

            {/* ── LEFT PANEL ──────────────────────────────── */}
            <div className="leftPanel">
                <div className="gridBg" />
                <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
                    <svg width="280" height="350" style={{ margin: "0 auto", display: "block" }}>
                        <defs>
                            <marker id="arr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
                                <polygon points="0 0,7 2.5,0 5" fill="rgba(59,130,246,0.6)" />
                            </marker>
                        </defs>
                        {[
                            { x1: 140, y1: 44, x2: 140, y2: 80, c: "rgba(59,130,246,0.35)" },
                            { x1: 110, y1: 120, x2: 72, y2: 155, c: "rgba(124,58,237,0.35)" },
                            { x1: 170, y1: 120, x2: 208, y2: 155, c: "rgba(59,130,246,0.35)" },
                            { x1: 72, y1: 198, x2: 72, y2: 228, c: "rgba(239,68,68,0.35)" },
                        ].map((l, i) => <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={l.c} strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arr)" />)}
                        {[
                            { x: 110, y: 4, e: "👤", lb: "Client", bg: "rgba(59,130,246,0.12)", bc: "rgba(59,130,246,0.4)", lc: "#93c5fd" },
                            { x: 90, y: 82, e: "⚖️", lb: "Load Balancer", bg: "rgba(124,58,237,0.12)", bc: "rgba(124,58,237,0.4)", lc: "#c4b5fd" },
                            { x: 32, y: 158, e: "🖥️", lb: "Server", bg: "rgba(34,197,94,0.1)", bc: "rgba(34,197,94,0.35)", lc: "#86efac" },
                            { x: 168, y: 158, e: "⚡", lb: "Cache", bg: "rgba(234,179,8,0.1)", bc: "rgba(234,179,8,0.35)", lc: "#fde047" },
                            { x: 32, y: 230, e: "🗄️", lb: "Database", bg: "rgba(239,68,68,0.1)", bc: "rgba(239,68,68,0.35)", lc: "#fca5a5" },
                        ].map((n, i) => (
                            <motion.g key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 2 + i * 0.3, repeat: Infinity }}>
                                <rect x={n.x} y={n.y} width="60" height="50" rx="10" fill={n.bg} stroke={n.bc} strokeWidth="1.5" />
                                <text x={n.x + 30} y={n.y + 28} textAnchor="middle" fontSize="20">{n.e}</text>
                                <text x={n.x + 30} y={n.y + 64} textAnchor="middle" fontSize="9" fill={n.lc} fontWeight="600">{n.lb}</text>
                            </motion.g>
                        ))}
                    </svg>
                    <p style={{ fontSize: 12, color: "#4B5563", marginTop: 8, textTransform: "uppercase", letterSpacing: "1px", fontWeight: 600 }}>
                        Build · Connect · Evaluate
                    </p>
                </div>
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                        { icon: "🏗️", bg: "rgba(59,130,246,0.15)", title: "Interactive Canvas", desc: "Drag & drop components visually" },
                        { icon: "🤖", bg: "rgba(124,58,237,0.15)", title: "Real-time AI Mentor", desc: "Get hints without the answer" },
                        { icon: "📊", bg: "rgba(34,197,94,0.12)", title: "Scored Evaluations", desc: "Detailed feedback across 5 dimensions" },
                    ].map(({ icon, bg, title: t, desc }) => (
                        <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{t}</div>
                                <div style={{ fontSize: 12, color: "#64748B" }}>{desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── RIGHT PANEL ─────────────────────────────── */}
            <div className="rightPanel">
                <div className="glow" />
                <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>

                    {/* Header */}
                    <div style={{ marginBottom: 28 }}>
                        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.8px", marginBottom: 8 }}>{title}</h1>
                        <p style={{ fontSize: 14, color: "#64748B" }}>{sub}</p>
                    </div>

                    {/* Login / Register tab switcher */}
                    {(mode === "login" || mode === "register") && (
                        <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
                            {["login", "register"].map((m) => (
                                <button key={m} onClick={() => goTo(m)} style={{ flex: 1, border: "none", borderRadius: 7, padding: "9px", fontFamily: "var(--font-main)", fontSize: 14, cursor: "pointer", transition: "all 0.2s", background: mode === m ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "transparent", color: mode === m ? "#fff" : "#64748B", fontWeight: mode === m ? 600 : 400, boxShadow: mode === m ? "0 2px 12px rgba(37,99,235,0.3)" : "none" }}>
                                    {m === "login" ? "Sign In" : "Sign Up"}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Back link for sub-modes */}
                    {["register-otp", "forgot", "forgot-otp", "reset"].includes(mode) && (
                        <button onClick={() => goTo(mode === "register-otp" ? "register" : mode === "reset" ? "login" : "login")}
                            style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-main)", marginBottom: 16, padding: 0 }}>
                            ← Back
                        </button>
                    )}

                    {/* Banners */}
                    {error && <Banner type="error" text={error} />}
                    {success && <Banner type="success" text={success} />}

                    {/* ══ LOGIN ══════════════════════════════════════════ */}
                    {mode === "login" && (
                        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <Field label="Email Address" icon="✉️" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            <Field label="Password" icon="🔐" type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                                rightEl={<Eye show={showPw} toggle={() => setShowPw(s => !s)} />} />
                            <span onClick={() => { goTo("forgot"); }} style={{ color: "var(--accent)", fontSize: 12, cursor: "pointer", textAlign: "right" }}>
                                Forgot Password →
                            </span>
                            <Btn loading={loading} label="Sign In →" pending="Signing in…" />
                            <SwitchHint mode="login" onSwitch={() => goTo("register")} />
                        </form>
                    )}

                    {/* ══ REGISTER STEP 1 ════════════════════════════════ */}
                    {mode === "register" && (
                        <form onSubmit={handleRegisterRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <Field label="Username" icon="👤" type="text" placeholder="e.g. karan_dev" value={username} onChange={e => setUsername(e.target.value)} />
                            <Field label="Email Address" icon="✉️" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            <div>
                                <Field label="Password" icon="🔐" type={showPw ? "text" : "password"} placeholder="••••••••" value={password}
                                    onChange={e => { setPassword(e.target.value); scorePassword(e.target.value); }}
                                    rightEl={<Eye show={showPw} toggle={() => setShowPw(s => !s)} />} />
                                {password && <StrengthBar score={pwScore} sw={sw} />}
                            </div>
                            <Field label="Confirm Password" icon="🔒" type="password" placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
                            <Btn loading={loading} label="Send Verification Code →" pending="Sending…" />
                            <SwitchHint mode="register" onSwitch={() => goTo("login")} />
                            <p style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#4B5563", lineHeight: 1.6 }}>
                                By signing up you agree to our <span style={{ color: "#3b82f6", cursor: "pointer" }}>Terms</span> and <span style={{ color: "#3b82f6", cursor: "pointer" }}>Privacy Policy</span>.
                            </p>
                        </form>
                    )}

                    {/* ══ REGISTER STEP 2 — verify OTP ══════════════════ */}
                    {mode === "register-otp" && (
                        <form onSubmit={handleRegisterVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <EmailBadge email={email} label="Code sent to" />
                            <OTPBox value={otp} onChange={setOtp} />
                            <Btn loading={loading} label="Verify & Create Account ✓" pending="Verifying…" disabled={otp.length < 6} />
                            <ResendLink onResend={handleRegisterResend} loading={loading} />
                        </form>
                    )}

                    {/* ══ FORGOT STEP 1 — enter email ════════════════════ */}
                    {mode === "forgot" && (
                        <form onSubmit={handleForgotRequest} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <Field label="Your Email Address" icon="✉️" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                            <Btn loading={loading} label="Send Reset Code →" pending="Sending…" />
                            <p style={{ textAlign: "center", fontSize: 13, color: "#64748B" }}>
                                Remembered it?{" "}
                                <button type="button" onClick={() => goTo("login")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-main)", fontSize: 13 }}>Sign in</button>
                            </p>
                        </form>
                    )}

                    {/* ══ FORGOT STEP 2 — verify reset OTP ══════════════ */}
                    {mode === "forgot-otp" && (
                        <form onSubmit={handleForgotVerify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <EmailBadge email={email} label="Reset code sent to" />
                            <OTPBox value={otp} onChange={setOtp} />
                            <Btn loading={loading} label="Verify Code →" pending="Verifying…" disabled={otp.length < 6} />
                            <ResendLink onResend={handleForgotResend} loading={loading} />
                        </form>
                    )}

                    {/* ══ FORGOT STEP 3 — new password ══════════════════ */}
                    {mode === "reset" && (
                        <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                                <Field label="New Password" icon="🔑" type={showPw ? "text" : "password"} placeholder="Minimum 6 characters" value={newPw}
                                    onChange={e => { setNewPw(e.target.value); scorePassword(e.target.value); }}
                                    rightEl={<Eye show={showPw} toggle={() => setShowPw(s => !s)} />} />
                                {newPw && <StrengthBar score={pwScore} sw={sw} />}
                            </div>
                            <Field label="Confirm New Password" icon="🔒" type="password" placeholder="••••••••" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} />
                            {confirmPw && (
                                <div style={{ fontSize: 12, fontWeight: 500, color: newPw === confirmPw ? "#22c55e" : "#ef4444" }}>
                                    {newPw === confirmPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                                </div>
                            )}
                            <Btn loading={loading} label="Update Password ✓" pending="Updating…"
                                disabled={!newPw || newPw !== confirmPw || newPw.length < 6} />
                        </form>
                    )}

                    {/* Social buttons — only on login/register */}
                    {(mode === "login" || mode === "register") && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                <span style={{ fontSize: 12, color: "#4B5563" }}>or continue with</span>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[{ icon: "🌐", label: "Google" }, { icon: "💻", label: "GitHub" }].map(({ icon, label }) => (
                                    <button key={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "11px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-main)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                                        <span style={{ fontSize: 16 }}>{icon}</span> {label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

/* ── Reusable sub-components ─────────────────────────────────────────────── */

function Field({ label, icon, type, placeholder, value, onChange, rightEl }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
            <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4, pointerEvents: "none" }}>{icon}</span>
                <input type={type} placeholder={placeholder} value={value} onChange={onChange}
                    style={{ width: "100%", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-main)", fontSize: 14, padding: "12px 14px 12px 42px", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.background = "rgba(37,99,235,0.08)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-card)"; e.target.style.boxShadow = "none"; }} />
                {rightEl}
            </div>
        </div>
    );
}

function OTPBox({ value, onChange }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.5px" }}>6-Digit Code</label>
            <input type="text" inputMode="numeric" placeholder="123456" value={value} maxLength={6} autoFocus
                onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={{ width: "100%", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "monospace", fontSize: 28, fontWeight: 700, letterSpacing: 12, textAlign: "center", padding: "14px", outline: "none", transition: "all 0.2s", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }} />
            <div style={{ textAlign: "center", fontSize: 11, color: "#64748B", marginTop: 6 }}>Expires in 10 minutes</div>
        </div>
    );
}

function Btn({ loading, label, pending, disabled }) {
    return (
        <button type="submit" disabled={loading || disabled}
            style={{ width: "100%", padding: "13px", border: "none", borderRadius: 10, marginTop: 4, background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", fontFamily: "var(--font-main)", fontSize: 15, fontWeight: 700, cursor: (loading || disabled) ? "not-allowed" : "pointer", opacity: (loading || disabled) ? 0.65 : 1, boxShadow: "0 4px 20px rgba(37,99,235,0.3)", transition: "all 0.2s" }}>
            {loading ? <span style={{ opacity: 0.8 }}>{pending}</span> : label}
        </button>
    );
}

function Eye({ show, toggle }) {
    return (
        <button type="button" onClick={toggle}
            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 14, padding: 4 }}>
            {show ? "🙈" : "👁"}
        </button>
    );
}

function StrengthBar({ score, sw }) {
    return (
        <div style={{ marginTop: 6 }}>
            <div style={{ height: 3, background: "var(--bg-card)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(score, 5) * 20}%`, background: sw?.color || "#ef4444", transition: "width 0.3s,background 0.3s" }} />
            </div>
            <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: sw?.color || "#ef4444" }}>{sw?.label}</div>
        </div>
    );
}

function EmailBadge({ email, label }) {
    return (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#64748B" }}>
            📧 {label} <strong style={{ color: "var(--text)" }}>{email}</strong>
        </div>
    );
}

function ResendLink({ onResend, loading }) {
    return (
        <div style={{ display: "flex", justifyContent: "center" }}>
            <button type="button" onClick={onResend} disabled={loading}
                style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-main)" }}>
                Didn't receive it? Resend code
            </button>
        </div>
    );
}

function Banner({ type, text }) {
    const ok = type === "success";
    return (
        <div style={{ background: ok ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${ok ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: 9, padding: "10px 14px", fontSize: 13, color: ok ? "#86efac" : "#fca5a5", fontWeight: 500, marginBottom: 16 }}>
            {ok ? "✅" : "⚠️"} {text}
        </div>
    );
}

function SwitchHint({ mode, onSwitch }) {
    return (
        <p style={{ textAlign: "center", marginTop: 4, fontSize: 13, color: "#64748B" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button type="button" onClick={onSwitch} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-main)", fontSize: 13 }}>
                {mode === "login" ? "Sign up free →" : "Sign in"}
            </button>
        </p>
    );
}