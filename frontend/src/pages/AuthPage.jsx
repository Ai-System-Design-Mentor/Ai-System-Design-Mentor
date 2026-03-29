import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";
import { authApi } from "../utils/Api";

export default function AuthPage() {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [pwStrength, setPwStrength] = useState(0);

    const [cpEmail, setCpEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPw, setConfirmNewPw] = useState("");
    const [msg, setMsg] = useState("");

    const { login, register, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const set = (field) => (e) => {
        setForm((f) => ({ ...f, [field]: e.target.value }));
        if (field === "password") checkStrength(e.target.value);
        setError("");
    };

    function checkStrength(val) {
        let score = 0;
        if (val.length >= 6) score++;
        if (val.length >= 10) score++;
        if (/[A-Z]/.test(val)) score++;
        if (/[0-9]/.test(val)) score++;
        if (/[^A-Za-z0-9]/.test(val)) score++;
        setPwStrength(score);
    }

    function validate() {
        if (!form.email || !form.password)
            return "Please fill in all fields.";
        if (!/\S+@\S+\.\S+/.test(form.email))
            return "Please enter a valid email address.";
        if (form.password.length < 6)
            return "Password must be at least 6 characters.";
        if (mode === "register") {
            if (!form.username || form.username.length < 3)
                return "Username must be at least 3 characters.";
            if (form.password !== form.confirm)
                return "Passwords do not match.";
        }
        return null;
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (mode === "changePassword") {
            const err = validate();
            if (err) { setError(err); return; }
        }
        setError("");
        setLoading(true);
        try {
            if (mode === "login") {
                await login(form.email, form.password);
                navigate(from, { replace: true });
            } else {
                await register(form.username, form.email, form.password);
                setTimeout(() => {switchMode("login")}, 500);
            }
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        }
        setLoading(false);
    }

    function switchMode(m) {
        setMode(m);
        setError("");
        setMsg("");
        setForm({ username: "", email: "", password: "", confirm: "" });
        setPwStrength(0);
        setCpEmail("");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPw("");
    }

    const handleChangePassword = async () => {
        setMsg("");

        if (user && cpEmail && cpEmail !== user.email) {
            setMsg("❌ Email does not match your account.");
            return;
        }
        if (!currentPassword || !newPassword || !confirmNewPw) {
            setMsg("❌ Please fill in all password fields.");
            return;
        }
        if (newPassword.length < 6) {
            setMsg("❌ New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmNewPw) {
            setMsg("❌ Passwords do not match.");
            return;
        }

        try {
            await authApi.forgotPassword(cpEmail, currentPassword, newPassword);
            setMsg("✅ Password updated successfully!");
            setTimeout(() => switchMode("login"), 1500);
        } catch (error) {
            setMsg("❌ " + error.message);
        }
    };

    const strengthLevels = [
        { label: "Weak", color: "#ef4444" },
        { label: "Fair", color: "#f97316" },
        { label: "Good", color: "#eab308" },
        { label: "Strong", color: "#22c55e" },
        { label: "Very Strong", color: "#22c55e" },
    ];
    const strength = strengthLevels[Math.min(pwStrength - 1, 4)];

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
                            { x1: 140, y1: 44, x2: 140, y2: 80, color: "rgba(59,130,246,0.35)" },
                            { x1: 110, y1: 120, x2: 72, y2: 155, color: "rgba(124,58,237,0.35)" },
                            { x1: 170, y1: 120, x2: 208, y2: 155, color: "rgba(59,130,246,0.35)" },
                            { x1: 72, y1: 198, x2: 72, y2: 228, color: "rgba(239,68,68,0.35)" },
                        ].map((l, i) => (
                            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                                stroke={l.color} strokeWidth="1.5" strokeDasharray="4,3"
                                markerEnd="url(#arr)" />
                        ))}

                        {[
                            { x: 110, y: 4, emoji: "👤", label: "Client", bg: "rgba(59,130,246,0.12)", bc: "rgba(59,130,246,0.4)", lc: "#93c5fd" },
                            { x: 90, y: 82, emoji: "⚖️", label: "Load Balancer", bg: "rgba(124,58,237,0.12)", bc: "rgba(124,58,237,0.4)", lc: "#c4b5fd" },
                            { x: 32, y: 158, emoji: "🖥️", label: "Server", bg: "rgba(34,197,94,0.1)", bc: "rgba(34,197,94,0.35)", lc: "#86efac" },
                            { x: 168, y: 158, emoji: "⚡", label: "Cache", bg: "rgba(234,179,8,0.1)", bc: "rgba(234,179,8,0.35)", lc: "#fde047" },
                            { x: 32, y: 230, emoji: "🗄️", label: "Database", bg: "rgba(239,68,68,0.1)", bc: "rgba(239,68,68,0.35)", lc: "#fca5a5" },
                        ].map((n, i) => (
                            <motion.g key={i}
                                animate={{ y: [0, -6, 0] }}
                                transition={{ duration: 2 + i * 0.3, repeat: Infinity }}>
                                <rect x={n.x} y={n.y} width="60" height="50" rx="10" fill={n.bg} stroke={n.bc} strokeWidth="1.5" />
                                <text x={n.x + 30} y={n.y + 28} textAnchor="middle" fontSize="20">{n.emoji}</text>
                                <text x={n.x + 30} y={n.y + 64} textAnchor="middle" fontSize="9" fill={n.lc} fontWeight="600">{n.label}</text>
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
                    ].map(({ icon, bg, title, desc }) => (
                        <div key={title} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{icon}</div>
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{title}</div>
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
                        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.8px", marginBottom: 8 }}>
                            {mode === "changePassword" ? "Forgot Password"
                                : mode === "login" ? "Welcome back"
                                    : "Create account"}
                        </h1>
                        <p style={{ fontSize: 14, color: "#64748B" }}>
                            {mode === "changePassword"
                                ? "Reset your password to regain access"
                                : mode === "login"
                                    ? "Sign in to continue your system design practice"
                                    : "Join engineers practicing system design with AI"}
                        </p>
                    </div>

                    {/* Mode switch — only for login/register */}
                    {(mode === "login" || mode === "register") && (
                        <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
                            {["login", "register"].map((m) => (
                                <button key={m} onClick={() => switchMode(m)} style={{
                                    flex: 1, border: "none", borderRadius: 7, padding: "9px",
                                    fontFamily: "var(--font-main)", fontSize: 14, cursor: "pointer",
                                    transition: "all 0.2s",
                                    background: mode === m ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "transparent",
                                    color: mode === m ? "#fff" : "#64748B",
                                    fontWeight: mode === m ? 600 : 400,
                                    boxShadow: mode === m ? "0 2px 12px rgba(37,99,235,0.3)" : "none",
                                }}>
                                    {m === "login" ? "Sign In" : "Sign Up"}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 9, padding: "10px 14px", fontSize: 13, color: "#fca5a5", fontWeight: 500, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* ── CHANGE PASSWORD FORM ─────────────────── */}
                    {mode === "changePassword" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                            <InputField label="Your Email" icon="✉️" type="email"
                                placeholder="you@example.com" value={cpEmail}
                                onChange={(e) => setCpEmail(e.target.value)} />

                            <InputField label="Current Password" icon="🔒"
                                type={showPw ? "text" : "password"} placeholder="••••••••"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                rightEl={
                                    <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 14, padding: 4 }}>
                                        {showPw ? "🙈" : "👁"}
                                    </button>
                                }
                            />

                            <InputField label="New Password" icon="🔑"
                                type="password" placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} />

                            <InputField label="Confirm New Password" icon="🔑"
                                type="password" placeholder="••••••••"
                                value={confirmNewPw}
                                onChange={(e) => setConfirmNewPw(e.target.value)} />

                            {/* ✅ msg shown in UI */}
                            {msg && (
                                <p style={{ fontSize: 13, fontWeight: 500, color: msg.startsWith("✅") ? "#22c55e" : "#fca5a5" }}>
                                    {msg}
                                </p>
                            )}

                            <button type="button" onClick={handleChangePassword} style={{ width: "100%", padding: "13px", border: "none", borderRadius: 10, background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", fontFamily: "var(--font-main)", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.3)", transition: "all 0.2s" }}>
                                Update Password →
                            </button>

                            <p style={{ textAlign: "center", fontSize: 13, color: "#64748B" }}>
                                Remember your password?{" "}
                                <button onClick={() => switchMode("login")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-main)", fontSize: 13 }}>
                                    Sign in
                                </button>
                            </p>
                        </div>
                    )}

                    {/* ── LOGIN / REGISTER FORM ────────────────── */}
                    {(mode === "login" || mode === "register") && (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                            {mode === "register" && (
                                <InputField label="Username" icon="👤" type="text"
                                    placeholder="e.g. karan_dev" value={form.username}
                                    onChange={set("username")} />
                            )}

                            <InputField label="Email Address" icon="✉️" type="email"
                                placeholder="you@example.com" value={form.email}
                                onChange={set("email")} />

                            <div>
                                <InputField label="Password" icon="🔐"
                                    type={showPw ? "text" : "password"} placeholder="••••••••"
                                    value={form.password} onChange={set("password")}
                                    rightEl={
                                        <button type="button" onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 14, padding: 4 }}>
                                            {showPw ? "🙈" : "👁"}
                                        </button>
                                    }
                                />

                                {mode === "register" && form.password && (
                                    <div style={{ marginTop: 6 }}>
                                        <div style={{ height: 3, background: "var(--bg-card)", borderRadius: 2, overflow: "hidden" }}>
                                            <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(pwStrength, 5) * 20}%`, background: strength?.color || "#ef4444", transition: "width 0.3s, background 0.3s" }} />
                                        </div>
                                        <div style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: strength?.color || "#ef4444" }}>
                                            {strength?.label}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {mode === "register" && (
                                <InputField label="Confirm Password" icon="🔒"
                                    type="password" placeholder="••••••••"
                                    value={form.confirm} onChange={set("confirm")} />
                            )}

                            {/* Forgot password — only on login */}
                            {mode === "login" && (
                                <span onClick={() => switchMode("changePassword")}
                                    style={{ color: "var(--accent)", fontSize: 12, cursor: "pointer", textAlign: "right" }}>
                                    Forgot Password →
                                </span>
                            )}

                            <button type="submit" disabled={loading} style={{ width: "100%", padding: "13px", border: "none", borderRadius: 10, marginTop: 4, background: "linear-gradient(135deg,#2563EB,#1D4ED8)", color: "#fff", fontFamily: "var(--font-main)", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.65 : 1, boxShadow: "0 4px 20px rgba(37,99,235,0.3)", transition: "all 0.2s" }}>
                                {loading ? <span style={{ opacity: 0.8 }}>Please wait…</span>
                                    : mode === "login" ? "Sign In →" : "Create Account →"}
                            </button>
                        </form>
                    )}

                    {/* Divider + OAuth — hide on changePassword */}
                    {mode !== "changePassword" && (
                        <>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                                <span style={{ fontSize: 12, color: "#4B5563" }}>or continue with</span>
                                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[{ icon: "🌐", label: "Google" }, { icon: "💻", label: "GitHub" }].map(({ icon, label }) => (
                                    <button key={label} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, padding: "11px", borderRadius: 10, border: "1.5px solid var(--border)", background: "var(--bg-card)", color: "var(--text)", fontFamily: "var(--font-main)", fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.18s" }}>
                                        <span style={{ fontSize: 16 }}>{icon}</span> {label}
                                    </button>
                                ))}
                            </div>

                            <p style={{ textAlign: "center", marginTop: 22, fontSize: 13, color: "#64748B" }}>
                                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                                <button onClick={() => switchMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-main)", fontSize: 13 }}>
                                    {mode === "login" ? "Sign up free →" : "Sign in"}
                                </button>
                            </p>

                            {mode === "register" && (
                                <p style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: "#4B5563", lineHeight: 1.6 }}>
                                    By creating an account you agree to our{" "}
                                    <span style={{ color: "#3b82f6", cursor: "pointer" }}>Terms of Service</span>
                                    {" "}and{" "}
                                    <span style={{ color: "#3b82f6", cursor: "pointer" }}>Privacy Policy</span>.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── Reusable Input Field ─────────────────────────── */
function InputField({ label, icon, type, placeholder, value, onChange, rightEl }) {
    return (
        <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {label}
            </label>
            <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4, pointerEvents: "none" }}>
                    {icon}
                </span>
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    style={{ width: "100%", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-main)", fontSize: 14, padding: "12px 14px 12px 42px", outline: "none", transition: "all 0.2s" }}
                    onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.background = "rgba(37,99,235,0.08)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                    onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-card)"; e.target.style.boxShadow = "none"; }}
                />
                {rightEl}
            </div>
        </div>
    );
}