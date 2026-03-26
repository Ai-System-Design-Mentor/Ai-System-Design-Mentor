import { useState, useRef, useEffect } from "react";
import { chatApi } from "../utils/Api";
import s from "./AIMentorChat.module.css";

const SUGGESTIONS = [
    "What should I think about next?",
    "Is my current approach scalable?",
    "How do I handle component failure?",
    "What database should I consider?",
    "Am I missing something important?",
    "How does this scale to 100M users?",
];

export default function AIMentorChat({ problemTitle, problemSlug, currentDiagram }) {
    const [messages, setMessages] = useState([{
        role: "ai",
        text: `Hi! I'm your AI mentor for "${problemTitle}". I'll guide your thinking — but I won't hand you the answer. That discovery is yours! Ask me anything. 🧠`,
    }]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hintLoading, setHintLoad] = useState(false);
    const [stuckText, setStuckText] = useState("");
    const [showStuck, setShowStuck] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function send(text) {
        const msg = (text || input).trim();
        if (!msg || loading) return;
        setInput("");
        const history = [...messages, { role: "user", text: msg }];
        setMessages(history);
        setLoading(true);
        try {
            const { reply } = await chatApi.send(msg, problemTitle, problemSlug, history, currentDiagram);
            setMessages((m) => [...m, { role: "ai", text: reply }]);
        } catch (err) {
            setMessages((m) => [...m, { role: "ai", text: `⚠️ ${err.message || "Something went wrong. Please try again."}` }]);
        }
        setLoading(false);
    }

    async function getHint() {
        setHintLoad(true);
        setShowStuck(false);
        try {
            const { hint } = await chatApi.getHint(problemTitle, problemSlug, currentDiagram, stuckText);
            setMessages((m) => [...m, { role: "ai", text: `💡 Hint: ${hint}`, isHint: true }]);
            setStuckText("");
        } catch (err) {
            setMessages((m) => [...m, { role: "ai", text: "Could not generate hint. Please try again." }]);
        }
        setHintLoad(false);
    }

    const nodeCount = currentDiagram?.nodes?.length || 0;
    const edgeCount = currentDiagram?.edges?.length || 0;

    // ── Collapsed state
    if (collapsed) {
        return (
            <div className={s.collapsed} onClick={() => setCollapsed(false)} title="Open AI Mentor">
                <span style={{ fontSize: 22 }}>🤖</span>
                <span className={s.collapsedLabel}>AI Mentor</span>
            </div>
        );
    }

    return (
        <div className={s.chat}>
            {/* Header */}
            <div className={s.header}>
                <div className={s.statusDot} />
                <div style={{ flex: 1 }}>
                    <div className={s.title}>AI Mentor</div>
                    <div className={s.sub}>Guides you — won't give the answer</div>
                </div>
                <button className={s.collapseBtn} onClick={() => setCollapsed(true)} title="Minimise">⟫</button>
            </div>

            {/* Canvas awareness bar */}
            {nodeCount > 0 && (
                <div className={s.ctxBar}>
                    👁 Watching: <strong>{nodeCount}</strong> node{nodeCount !== 1 ? "s" : ""}, <strong>{edgeCount}</strong> connection{edgeCount !== 1 ? "s" : ""}
                </div>
            )}

            {/* Messages */}
            <div className={s.messages}>
                {messages.map((m, i) => (
                    <div key={i} className={`${s.row} ${m.role === "user" ? s.rowUser : s.rowAi} fade-in`}>
                        {m.role === "ai" && (
                            <div className={`${s.avatar} ${m.isHint ? s.avatarHint : ""}`}>
                                {m.isHint ? "💡" : "🤖"}
                            </div>
                        )}
                        <div className={`${m.role === "user" ? s.bubbleUser : s.bubbleAi} ${m.isHint ? s.bubbleHint : ""}`}>
                            {m.text}
                        </div>
                    </div>
                ))}
                {(loading || hintLoading) && (
                    <div className={`${s.row} ${s.rowAi}`}>
                        <div className={s.avatar}>🤖</div>
                        <div className={`${s.bubbleAi} pulse`} style={{ minWidth: 60 }}>● ● ●</div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* "I'm stuck" hint panel */}
            {showStuck && (
                <div className={s.stuckPanel}>
                    <div className={s.stuckTitle}>What exactly are you stuck on?</div>
                    <input
                        className={`input ${s.stuckInput}`}
                        value={stuckText}
                        onChange={(e) => setStuckText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && getHint()}
                        placeholder="e.g. database choice, handling 10M users..."
                    />
                    <div className={s.stuckBtns}>
                        <button className="btn btn-primary" style={{ flex: 1, fontSize: 12, padding: "7px" }}
                            onClick={getHint} disabled={hintLoading}>
                            {hintLoading ? <span className="pulse">Getting hint…</span> : "Get Hint 💡"}
                        </button>
                        <button className="btn btn-secondary" style={{ fontSize: 12, padding: "7px 12px" }}
                            onClick={() => setShowStuck(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Suggestion chips */}
            <div className={s.chips}>
                {SUGGESTIONS.slice(0, 4).map((sg) => (
                    <button key={sg} className={s.chip} onClick={() => send(sg)}>{sg}</button>
                ))}
            </div>

            {/* Input row */}
            <div className={s.inputRow}>
                <button
                    className={s.hintBtn}
                    onClick={() => setShowStuck((x) => !x)}
                    title="I'm stuck — get a nudge"
                    disabled={hintLoading}>
                    💡
                </button>
                <input
                    className={`input ${s.input}`}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Ask about your design…"
                    disabled={loading}
                />
                <button className="btn btn-primary" style={{ padding: "9px 14px", fontSize: 15, background: "var(--accent)" }}
                    onClick={() => send()} disabled={loading || !input.trim()}>→</button>
            </div>
        </div>
    );
}
