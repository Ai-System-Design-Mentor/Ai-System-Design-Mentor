import React from "react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersApi } from "../utils/Api";
import "./Dashboard.css"

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [attempts, setAttempts] = useState([]);

    useEffect(() => {
        usersApi.getProfile().then(({ attempts: a }) => setAttempts(a || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const chartData = attempts.slice(-10);
    const W = 460, H = 110, P = 20;
    const minS = 0, maxS = 10;
    const tx = (i) => P + (i / Math.max(chartData.length - 1, 1)) * (W - 2 * P);
    const ty = (sc) => H - P - ((sc - minS) / (maxS - minS)) * (H - 2 * P);
    const linePath = chartData.map((a, i) => `${i === 0 ? "M" : "L"}${tx(i)},${ty(a.score)}`).join(" ");
    const areaPath = chartData.length > 1
        ? `${linePath} L${tx(chartData.length - 1)},${H - P} L${tx(0)},${H - P} Z`
        : "";

    if (loading) return (
        <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <span className="spin" style={{ fontSize: 38, display: "block", marginBottom: 14 }}>⚙️</span>
                <p style={{ color: "var(--text-muted)" }}>Loading dashboard…</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <div className="dashboard_container">
                <h2 className="dashboard_title">Welcome Back, {user.username}!👋</h2>
                <h4 className="dashboard_para">Your System design journey at a glance</h4>

                <div className="dashboard_stats">
                    <div className="dashboardstats stats1">
                        <h4 className="stats_title">🏆 Problems Solved</h4>
                        <span className="stats_score">{user.stats.totalAttempts}</span>
                        <h4 className="stats_base">Total Attemps</h4>
                    </div>
                    <div className="dashboardstats stats2">
                        <h4 className="stats_title">📈 Avg. Score</h4>
                        <span className="stats_score">{user.stats.averageScore}</span>
                        <h4 className="stats_base">Out of 10</h4>
                    </div>
                    <div className="dashboardstats stats3">
                        <h4 className="stats_title">⭐ Best Score</h4>
                        <span className="stats_score">{user.stats.bestScore}</span>
                        <h4 className="stats_base">Personal Best</h4>
                    </div>
                </div>

                <div className="progress_skills ">
                    <div className="progress dashboard_border">
                        <h4 className="progress_overview">Progess Overview</h4>
                        <h6 style={{ fontSize1: 12, color: "#888", marginBottom: 16, fontWeight: 200 }}>Score trend accross your last attemps</h6>

                        <div className="chart_graph">
                            {chartData.length === 0 ? (
                                <text x="230" y="70" textAnchor="middle" fill="#64748b">
                                    No attempts yet — <a style={{ color: "#7C3AED", fontSize: 13, textDecoration: "none" }} href="/">start practicing! →</a>
                                </text>
                            ) : (
                                <>
                                    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                                        <defs>
                                            <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                                                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        {/* Grid lines */}
                                        {[0, 2, 4, 6, 8, 10].map((v) => (
                                            <line key={v} x1={P} y1={ty(v)} x2={W - P} y2={ty(v)}
                                                stroke="var(--border)" strokeWidth="1" />
                                        ))}
                                        {/* Area fill */}
                                        {areaPath && <path className="path" d={areaPath} fill="url(#aGrad)" />}
                                        {/* Line */}
                                        {linePath && (
                                            <path d={linePath} fill="none" stroke="#2563EB"
                                                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                        )}
                                        {/* Data points */}
                                        {chartData.map((a, i) => (
                                            <circle key={i} cx={tx(i)} cy={ty(a.score)} r="4.5"
                                                fill="white" stroke="#2563EB" strokeWidth="2.5" />
                                        ))}
                                    </svg>

                                </>
                            )}
                        </div>

                        <div className="progressLower">
                            <h6 style={{ fontSize1: 12, color: "#888", fontWeight: 200 }}>Attemps Number</h6>
                            <h6 style={{ fontSize1: 12, color: "#888", fontWeight: 200 }}>Best Score : <span style={{ color: "green", fontWeight: 300 }}>{user.stats.bestScore}</span></h6>
                        </div>
                    </div>
                    <div className="skills dashboard_border">
                        <h4 className="progress_overview">Skills BreakDown</h4>
                        {[
                            { name: "Load Balancing", score: 8.2, emoji: "⚖️", col: "#22C55E" },
                            { name: "API Design", score: 7.8, emoji: "🚪", col: "#3B82F6" },
                            { name: "Caching Strategy", score: 6.1, emoji: "⚡", col: "#F97316" },
                            { name: "DB Sharding", score: 5.2, emoji: "🗄️", col: "#EF4444" },
                        ].map((sk) => (
                            <div key={sk.name} style={{ marginTop: 25, marginBottom: 14 }}>
                                <div className="skills_comp">
                                    <span style={{ fontSize: 13, fontWeight: 500 }}>{sk.emoji} {sk.name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: sk.col }}>{sk.score}/10</span>
                                </div>
                                <div style={{ height: 6, background: "var(--text-faint)", borderRadius: 3, overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${sk.score * 10}%`, background: sk.col, borderRadius: 3, transition: "width 1.2s ease" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="history dashboard_border" >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>Recent Attempts</div>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{user.stats.totalAttempts} total</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {[...attempts].reverse().slice(0, 6).map((a, i) => {
                            const sc = parseFloat(a.score) || 0;
                            const col = sc >= 8 ? "#22C55E" : sc >= 6 ? "#F97316" : "#EF4444";
                            return (
                                <div key={i}
                                    onClick={() => a._id && navigate(`/result/${a._id}`)}
                                    style={{
                                        display: "flex", alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "10px 14px",
                                        background: "var(--bg-hover)",
                                        borderRadius: 10,
                                        cursor: a._id ? "pointer" : "default",
                                        transition: "background 0.14s",
                                    }}
                                    onMouseEnter={(e) => { if (a._id) e.currentTarget.style.background = "var(--border)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{a.problemTitle}</div>
                                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                                            {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}
                                            {a.timeTaken > 0 && ` · ${Math.floor(a.timeTaken / 60)}m ${a.timeTaken % 60}s`}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: col }}>
                                        {sc.toFixed(1)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}