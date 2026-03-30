import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { designsApi } from "../utils/Api";

function ScoreRing({ score, size = 104 }) {
    const r = size / 2 - 9;
    const circ = 2 * Math.PI * r;
    const dash = circ - (Math.max(0, Math.min(10, score)) / 10) * circ;
    const col = score >= 8 ? "#22C55E" : score >= 6 ? "#F97316" : "#EF4444";

    return (
        <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke="var(--bg-hover)" strokeWidth="9" />
                <circle cx={size / 2} cy={size / 2} r={r}
                    fill="none" stroke={col} strokeWidth="9"
                    strokeDasharray={circ} strokeDashoffset={dash}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: "stroke-dashoffset 1.2s ease-out" }} />
            </svg>
            <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
            }}>
                <span style={{ fontSize: size * 0.22, fontWeight: 800, color: col, lineHeight: 1 }}>
                    {score.toFixed(1)}
                </span>
                <span style={{ fontSize: size * 0.10, color: "var(--text-faint)", fontWeight: 600 }}>
                    / 10
                </span>
            </div>
        </div>
    );
}

/* ── Sub-score bar ────────────────────────────────────────────────────────── */
function SubScore({ label, value }) {
    const col = value >= 8 ? "#22C55E" : value >= 6 ? "#F97316" : "#EF4444";
    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{label}</span>
                <span style={{ fontWeight: 700, color: col }}>{value}/10</span>
            </div>
            <div style={{ height: 5, background: "var(--bg-hover)", borderRadius: 3 }}>
                <div style={{
                    height: "100%", width: `${value * 10}%`,
                    background: col, borderRadius: 3,
                    transition: "width 1.1s ease",
                }} />
            </div>
        </div>
    );
}

export default function ResultPage() {
    const { id } = useParams();
    const loc = useLocation();
    const navigate = useNavigate();

    const [data, setData] = useState(loc.state?.evaluation || null);
    const [title, setTitle] = useState(loc.state?.problemTitle || "");
    const [loading, setLoading] = useState(!data);
    const [tab, setTab] = useState("feedback");

    // 1. UPDATED USE EFFECT
    useEffect(() => {
        if (id) {
            // ALWAYS fetch from DB to get the full record (including diagramImage),
            // even if we already have partial text data from the router state.
            designsApi.getById(id)
                .then(({ attempt }) => {
                    setData(attempt);
                    setTitle(attempt.problemTitle);
                })
                .catch(() => {
                    if (!data) navigate("/"); // Only redirect if we have absolutely no data
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) return (
        <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <span className="spin" style={{ fontSize: 40, display: "block", marginBottom: 14 }}>⚙️</span>
                <p style={{ color: "var(--text-muted)" }}>Loading your evaluation…</p>
            </div>
        </div>
    );

    if (!data) return (
        <div style={{ textAlign: "center", padding: 80 }}>
            <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>No results found.</p>
            <button className="btn btn-primary" onClick={() => navigate("/")}>← Back to Home</button>
        </div>
    );

    const score = parseFloat(data.score) || 0;
    const scoreLabel =
        score >= 9 ? "Outstanding 🏆" :
            score >= 8 ? "Excellent 🎉" :
                score >= 6 ? "Good Job 👍" :
                    score >= 4 ? "Keep Practising 💪" : "Needs Work 📚";
    const scoreCol = score >= 8 ? "#22C55E" : score >= 6 ? "#F97316" : "#EF4444";
    const sb = data.scoringBreakdown || {};
    const comp = data.comparisonWithStandard;

    // ADD THE "YOUR DESIGN" TAB
    const TABS = [
        { id: "feedback", label: "📊 Feedback" },
        { id: "design", label: "🖼️ Your Design", hide: !data.diagramImage }, // Only shows if image exists
        { id: "comparison", label: "🔬 vs Standard", hide: !comp },
        { id: "reference", label: "📐 Reference" },
    ].filter((t) => !t.hide);

    return (
        <div style={{ maxWidth: 1020, margin: "0 auto", padding: "36px 24px" }} className="fade-in">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
                <button className="btn btn-secondary" style={{ fontSize: 13, padding: "7px 14px" }}
                    onClick={() => navigate("/")}>← Home</button>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>Evaluation Result</h1>
                {title && <span className="badge badge-blue">{title}</span>}
            </div>

            {/* Score hero card */}
            <div className="card" style={{ padding: "24px 28px", marginBottom: 20, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
                <ScoreRing score={score} size={104} />
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Overall Score
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: scoreCol, marginBottom: 8 }}>{scoreLabel}</div>
                    <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.65, maxWidth: 560 }}>{data.summary}</p>
                </div>

                {/* Sub-score breakdown */}
                {Object.keys(sb).length > 0 && (
                    <div style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 9 }}>
                        {[
                            ["Scalability", sb.scalability],
                            ["Reliability", sb.reliability],
                            ["Completeness", sb.completeness],
                            ["Data Modeling", sb.dataModeling],
                            ["Clarity", sb.communicationClarity],
                        ].filter(([, v]) => v != null).map(([label, value]) => (
                            <SubScore key={label} label={label} value={value} />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Alert cards: missing + anti-patterns ────────────── */}
            {(data.missingCriticalComponents?.length > 0 || data.antiPatternsFound?.length > 0) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                    {data.missingCriticalComponents?.length > 0 && (
                        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.22)", borderRadius: "var(--radius)", padding: "14px 18px" }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: "#EF4444", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                ⚠️ Missing Critical Components
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                {data.missingCriticalComponents.map((c, i) => (
                                    <span key={i} style={{ fontSize: 12, background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>{c}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {data.antiPatternsFound?.length > 0 && (
                        <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.22)", borderRadius: "var(--radius)", padding: "14px 18px" }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: "#F97316", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                🚫 Anti-Patterns Detected
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {data.antiPatternsFound.map((a, i) => (
                                    <div key={i} style={{ fontSize: 12, color: "var(--text-2)", display: "flex", gap: 7, alignItems: "flex-start" }}>
                                        <span style={{ color: "#F97316", flexShrink: 0, marginTop: 1 }}>●</span>{a}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "var(--bg-hover)", borderRadius: 10, padding: 4, marginBottom: 18, width: "fit-content", flexWrap: "wrap" }}>
                {TABS.map((t) => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        border: "none", borderRadius: 7, padding: "7px 18px",
                        fontSize: 13, cursor: "pointer",
                        fontFamily: "var(--font-main)", transition: "all 0.15s",
                        background: tab === t.id ? "var(--bg-card)" : "transparent",
                        color: tab === t.id ? "var(--accent)" : "var(--text-muted)",
                        boxShadow: tab === t.id ? "var(--shadow-sm)" : "none",
                        fontWeight: tab === t.id ? 600 : 400,
                    }}>{t.label}</button>
                ))}
            </div>

            {/* RENDER THE DIAGRAM IMAGE TAB */}
            {tab === "design" && data.diagramImage && (
                <div className="card fade-in" style={{ padding: "12px", background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text)", padding: "8px 12px" }}>
                        Your Submitted Architecture
                    </div>
                    <img
                        src={data.diagramImage}
                        alt="Your System Design Architecture"
                        style={{
                            width: "100%",
                            borderRadius: "6px",
                            display: "block",
                            border: "1px solid var(--border)"
                        }}
                    />
                </div>
            )}

            {/* Tab: Feedback*/}
            {tab === "feedback" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                    {/* Strengths */}
                    <div className="card" style={{ padding: "20px", borderColor: "rgba(34,197,94,0.3)" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#15803D", marginBottom: 12 }}>✅ Strengths</div>
                        {(data.strengths || []).map((str, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <span style={{ color: "#22C55E", fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                                <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{str}</span>
                            </div>
                        ))}
                        {!data.strengths?.length && <p style={{ fontSize: 12, color: "var(--text-faint)" }}>No strengths identified.</p>}
                    </div>

                    {/* Improvements */}
                    <div className="card" style={{ padding: "20px", borderColor: "rgba(249,115,22,0.3)" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#B45309", marginBottom: 12 }}>💡 To Improve</div>
                        {(data.improvements || []).map((imp, i) => (
                            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                                <span style={{ color: "#F97316", fontSize: 10, marginTop: 3, flexShrink: 0 }}>●</span>
                                <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{imp}</span>
                            </div>
                        ))}
                        {!data.improvements?.length && <p style={{ fontSize: 12, color: "var(--text-faint)" }}>No improvements flagged.</p>}
                    </div>

                    {/* Weak areas + actions */}
                    <div className="card" style={{ padding: "20px", borderColor: "rgba(239,68,68,0.3)" }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#B91C1C", marginBottom: 12 }}>⚠️ Focus Areas</div>
                        {(data.weakAreas || []).map((wa, i) => (
                            <div key={i} style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "7px 12px", marginBottom: 7, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{wa}</div>
                        ))}
                        {!data.weakAreas?.length && <p style={{ fontSize: 12, color: "var(--text-faint)" }}>No weak areas identified — well done!</p>}
                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                            <button className="btn btn-primary" style={{ justifyContent: "center", fontSize: 13 }} onClick={() => navigate("/")}>
                                Practice Again →
                            </button>
                            <button className="btn btn-secondary" style={{ justifyContent: "center", fontSize: 13 }} onClick={() => navigate("/dashboard")}>
                                View Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: vs Standard */}
            {tab === "comparison" && comp && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Verdict banner */}
                    <div style={{ background: "var(--accent-glow)", border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)", borderRadius: "var(--radius)", padding: "14px 20px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 5 }}>
                            Comparison Verdict
                        </div>
                        <p style={{ fontSize: 14, color: "var(--text-2)", fontWeight: 500 }}>{comp.verdict}</p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                        {/* Matched */}
                        <div className="card" style={{ padding: "18px", borderColor: "rgba(34,197,94,0.3)" }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: "#15803D", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                ✅ Matched ({comp.matchedComponents?.length || 0})
                            </div>
                            {(comp.matchedComponents || []).map((c, i) => (
                                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, alignItems: "center" }}>
                                    <span style={{ color: "#22C55E", fontSize: 11, flexShrink: 0 }}>✓</span>
                                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{c}</span>
                                </div>
                            ))}
                            {!comp.matchedComponents?.length && <p style={{ fontSize: 12, color: "var(--text-faint)" }}>None matched.</p>}
                        </div>

                        {/* Missing */}
                        <div className="card" style={{ padding: "18px", borderColor: "rgba(239,68,68,0.3)" }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: "#B91C1C", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                ❌ Not in Your Design ({comp.missingFromUser?.length || 0})
                            </div>
                            {(comp.missingFromUser || []).map((c, i) => (
                                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, alignItems: "center" }}>
                                    <span style={{ color: "#EF4444", fontSize: 11, flexShrink: 0 }}>✗</span>
                                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{c}</span>
                                </div>
                            ))}
                            {!comp.missingFromUser?.length && (
                                <p style={{ fontSize: 12, color: "#22C55E", fontStyle: "italic" }}>Nothing missing — great job! 🎉</p>
                            )}
                        </div>

                        {/* Extra valid */}
                        <div className="card" style={{ padding: "18px", borderColor: "rgba(37,99,235,0.3)" }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: "var(--accent)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                                ➕ Your Extras ({comp.userHadExtra?.length || 0})
                            </div>
                            {(comp.userHadExtra || []).map((c, i) => (
                                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7, alignItems: "center" }}>
                                    <span style={{ color: "var(--accent)", fontSize: 11, flexShrink: 0 }}>+</span>
                                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{c}</span>
                                </div>
                            ))}
                            {!comp.userHadExtra?.length && <p style={{ fontSize: 12, color: "var(--text-faint)" }}>No extras added.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Reference Architecture */}
            {tab === "reference" && (
                <div className="card" style={{ padding: "24px" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>📐 Ideal Reference Architecture</div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                        These are the components a FAANG interviewer would expect to see for this problem.
                    </p>
                    {(data.referenceComponents || []).length === 0 ? (
                        <p style={{ fontSize: 13, color: "var(--text-faint)" }}>No reference data available.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, maxWidth: 560 }}>
                            {data.referenceComponents.map((c, i, arr) => (
                                <div key={c}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                                            {i + 1}
                                        </div>
                                        <div style={{ background: "var(--accent-glow)", border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)", borderRadius: 8, padding: "5px 14px", fontSize: 13, fontWeight: 600, color: "var(--accent)", flex: 1 }}>
                                            {c}
                                        </div>
                                    </div>
                                    {i < arr.length - 1 && (
                                        <div style={{ marginLeft: 11, width: 2, height: 7, background: "var(--border)" }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}