import { useState, useRef, useEffect, useCallback } from "react";
import { DIAGRAM_COMPONENTS, getNodeStyle } from "../utils/constant";
import { useTheme } from "../context/ThemeContext";
import s from "./DiagramCanvas.module.css";

let _uid = 1;
const uid = () => `n${_uid++}_${Date.now()}`;
const eid = () => `e${_uid++}_${Date.now()}`;
const SNAP = 28;
const snap = (v) => Math.round(v / SNAP) * SNAP;

const TOOLS = [
    { id: "select", icon: "↖", label: "Select" },
    { id: "connect", icon: "🔗", label: "Connect" },
    { id: "label", icon: "T", label: "Label" },
    { id: "delete", icon: "✕", label: "Delete" },
    { id: "pan", icon: "✋", label: "Pan" },
];

export default function DiagramCanvas({ onDiagramChange }) {
    const { theme } = useTheme();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [tool, setTool] = useState("select");
    const [selected, setSelected] = useState(new Set());
    const [connecting, setConn] = useState(null);
    const [dragging, setDrag] = useState(null);
    const [pan, setPan] = useState({ x: 60, y: 40 });
    const [zoom, setZoom] = useState(1);
    const [isPanning, setIsPan] = useState(false);
    const [panAnchor, setPanAnchor] = useState(null);
    const [editId, setEditId] = useState(null);
    const [editText, setEditText] = useState("");
    const [showGrid, setShowGrid] = useState(true);
    const [snapOn, setSnapOn] = useState(true);
    const [history, setHistory] = useState([{ nodes: [], edges: [] }]);
    const [hIdx, setHIdx] = useState(0);
    const canvasRef = useRef(null);

    // ── Refs to avoid stale closures in event listeners
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);
    const selectedRef = useRef(selected);
    const hIdxRef = useRef(hIdx);
    const historyRef = useRef(history);

    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { edgesRef.current = edges; }, [edges]);
    useEffect(() => { selectedRef.current = selected; }, [selected]);
    useEffect(() => { hIdxRef.current = hIdx; }, [hIdx]);
    useEffect(() => { historyRef.current = history; }, [history]);

    // Notify parent whenever diagram changes
    useEffect(() => { onDiagramChange?.({ nodes, edges }); }, [nodes, edges]);

    // History helpers
    const commit = useCallback((ns, es) => {
        const idx = hIdxRef.current;
        setHistory((h) => [...h.slice(0, idx + 1), { nodes: ns, edges: es }]);
        setHIdx(idx + 1);
    }, []);

    function undo() {
        const idx = hIdxRef.current;
        const hist = historyRef.current;
        if (idx <= 0) return;
        const p = hist[idx - 1];
        setNodes(p.nodes);
        setEdges(p.edges);
        setHIdx(idx - 1);
    }

    function redo() {
        const idx = hIdxRef.current;
        const hist = historyRef.current;
        if (idx >= hist.length - 1) return;
        const n = hist[idx + 1];
        setNodes(n.nodes);
        setEdges(n.edges);
        setHIdx(idx + 1);
    }

    // Keyboard shortcuts
    useEffect(() => {
        function onKey(e) {
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

            if ((e.ctrlKey || e.metaKey) && e.key === "z") { e.preventDefault(); undo(); return; }
            if ((e.ctrlKey || e.metaKey) && e.key === "y") { e.preventDefault(); redo(); return; }

            if (e.key === "Delete" || e.key === "Backspace") {
                const sel = selectedRef.current;
                const ns_ = nodesRef.current;
                const es_ = edgesRef.current;
                if (!sel.size) return;
                const ids = [...sel];
                const ns = ns_.filter((n) => !ids.includes(n.id));
                const es = es_.filter((ed) => !ids.includes(ed.from) && !ids.includes(ed.to));
                setNodes(ns); setEdges(es); commit(ns, es); setSelected(new Set());
                return;
            }
            if (e.key === "Escape") { setConn(null); setSelected(new Set()); setEditId(null); return; }
            if (e.key === "v") { setTool("select"); return; }
            if (e.key === "c") { setTool("connect"); return; }
            if (e.key === "d") { setTool("delete"); return; }
            if (e.key === "t") { setTool("label"); return; }
            if (e.key === " ") { e.preventDefault(); setTool("pan"); return; }
        }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // Add node
    function addNode(comp) {
        const style = getNodeStyle(comp.type, theme);
        const node = {
            id: uid(),
            type: comp.type,
            emoji: comp.emoji,
            ...style,
            x: snap(80 + Math.random() * 340),
            y: snap(80 + Math.random() * 220),
            label: "",
        };
        const ns = [...nodes, node];
        setNodes(ns);
        commit(ns, edges);
    }

    // ── Canvas mouse events ───────────────────────────────────────────────────
    function onCanvasDown(e) {
        if (e.button === 1 || tool === "pan" || (e.button === 0 && e.altKey)) {
            e.preventDefault();
            setIsPan(true);
            setPanAnchor({ x: e.clientX - pan.x, y: e.clientY - pan.y });
            return;
        }
        if (e.button === 0) {
            setSelected(new Set());
            setConn(null);
        }
    }

    function onCanvasMove(e) {
        if (isPanning && panAnchor) {
            setPan({ x: e.clientX - panAnchor.x, y: e.clientY - panAnchor.y });
        }
        if (dragging) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mx = (e.clientX - rect.left - pan.x) / zoom;
            const my = (e.clientY - rect.top - pan.y) / zoom;
            setNodes((ns) => ns.map((n) =>
                n.id !== dragging.id ? n : {
                    ...n,
                    x: snapOn ? snap(mx - dragging.ox) : mx - dragging.ox,
                    y: snapOn ? snap(my - dragging.oy) : my - dragging.oy,
                }
            ));
        }
    }

    function onCanvasUp() {
        if (dragging) commit(nodesRef.current, edgesRef.current);
        setIsPan(false);
        setPanAnchor(null);
        setDrag(null);
    }

    function onCanvasLeave() {
        setIsPan(false);
        setPanAnchor(null);
    }

    function onWheel(e) {
        setZoom((z) => Math.max(0.25, Math.min(3, z * (e.deltaY < 0 ? 1.1 : 0.91))));
    }

    // Node mouse events
    function onNodeDown(e, id) {
        if (e.button !== 0) return;
        e.stopPropagation();

        if (tool === "delete") {
            const ns = nodes.filter((n) => n.id !== id);
            const es = edges.filter((ed) => ed.from !== id && ed.to !== id);
            setNodes(ns); setEdges(es); commit(ns, es);
            return;
        }
        if (tool === "label") { beginEdit(id); return; }
        if (tool === "connect") {
            if (!connecting) { setConn(id); return; }
            if (connecting !== id) {
                const dup = edges.some(
                    (ed) => (ed.from === connecting && ed.to === id) ||
                        (ed.from === id && ed.to === connecting)
                );
                if (!dup) {
                    const es = [...edges, { id: eid(), from: connecting, to: id, label: "" }];
                    setEdges(es); commit(nodes, es);
                }
            }
            setConn(null);
            return;
        }

        // select / drag
        const rect = canvasRef.current.getBoundingClientRect();
        const mx = (e.clientX - rect.left - pan.x) / zoom;
        const my = (e.clientY - rect.top - pan.y) / zoom;
        const node = nodes.find((n) => n.id === id);
        setDrag({ id, ox: mx - node.x, oy: my - node.y });
        setSelected((prev) => {
            if(e.shiftKey) {
                const next = new Set(s);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
            }
            return new Set([id])
        });
    }

    // Label editing
    function beginEdit(id) {
        const n = nodes.find((x) => x.id === id);
        if (!n) return;
        setEditId(id);
        setEditText(n.label || "");
    }

    function saveEdit() {
        if (!editId) return;
        const ns = nodes.map((n) => n.id === editId ? { ...n, label: editText } : n);
        setNodes(ns); commit(ns, edges); setEditId(null);
    }

    // ── Delete selected ───────────────────────────────────────────────────────
    function deleteSelected() {
        if (!selected.size) return;
        const ids = [...selected];
        const ns = nodes.filter((n) => !ids.includes(n.id));
        const es = edges.filter((ed) => !ids.includes(ed.from) && !ids.includes(ed.to));
        setNodes(ns); setEdges(es); commit(ns, es); setSelected(new Set());
    }

    function duplicateSelected() {
        if (!selected.size) return;
        const added = [...selected].map((id) => {
            const n = nodes.find((x) => x.id === id);
            return n ? { ...n, id: uid(), x: n.x + 30, y: n.y + 30 } : null;
        }).filter(Boolean);
        const ns = [...nodes, ...added];
        setNodes(ns); commit(ns, edges);
        setSelected(new Set(added.map((n) => n.id)));
    }

    function removeEdge(id) {
        const es = edges.filter((e) => e.id !== id);
        setEdges(es); commit(nodes, es);
    }

    function clearAll() {
        if (!nodes.length) return;
        if (!window.confirm("Clear entire canvas? This cannot be undone.")) return;
        setNodes([]); setEdges([]); setSelected(new Set()); setConn(null);
        commit([], []);
    }

    function fitView() {
        if (!nodes.length) return;
        const xs = nodes.map((n) => n.x);
        const ys = nodes.map((n) => n.y);
        setPan({ x: -Math.min(...xs) + 60, y: -Math.min(...ys) + 60 });
        setZoom(1);
    }

    // Edge geometry
    function center(node) { return { x: node.x + 59, y: node.y + 40 }; }

    // Highlight edges when a node is selected
    const highlightedEdgesIds = new Set(
        edges.filter((ed) => selected.has(ed.from) || selected.has(ed.to))
            .map((ed) => ed.id)
    );

    const cursor =
        isPanning || tool === "pan" ? "grabbing" :
            tool === "connect" ? "crosshair" :
                tool === "delete" ? "not-allowed" :
                    tool === "label" ? "text" : "default";

    return (
        <div className={s.wrap}>

            {/* Left panel */}
            <div className={s.panel}>
                <div className={s.panelTitle}>Components</div>
                <div className={s.panelList}>
                    {DIAGRAM_COMPONENTS.map((c) => {
                        const style = getNodeStyle(c.type, theme);
                        return (
                            <div
                                key={c.type}
                                className={s.panelItem}
                                style={{ "--ib": style.border }}
                                onClick={() => addNode(c)}
                                title={`Add ${c.type}`}
                            >
                                <span className={s.panelEmoji}>{c.emoji}</span>
                                <span className={s.panelLabel} style={{ color: style.color }}>
                                    {c.type}
                                </span>
                            </div>
                        );
                    })}
                </div>
                <div className={s.hint}>
                    Click to add<br />
                    Drag to Move<br />
                    🔗 Connect<br />
                    Ctrl+Z Undo · Ctrl+Y Redo<br />
                </div>
            </div>

            {/* Canvas area  */}
            <div className={s.canvasWrap}>

                {/* Toolbar */}
                <div className={s.toolbar}>
                    <div className={s.toolGroup}>
                        {TOOLS.map((t) => (
                            <button
                                key={t.id}
                                className={`${s.toolBtn} ${tool === t.id ? s.toolActive : ""}`}
                                onClick={() => setTool(t.id)}
                                title={t.label}
                            >
                                <span style={{ fontSize: 13 }}>{t.icon}</span>
                                <span style={{ fontSize: 9 }}>{t.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className={s.sep} />

                    <div className={s.toolGroup}>
                        <button className={s.toolBtn} onClick={undo}
                            disabled={hIdx <= 0} title="Undo (Ctrl+Z)">↩</button>
                        <button className={s.toolBtn} onClick={redo}
                            disabled={hIdx >= history.length - 1} title="Redo (Ctrl+Y)">↪</button>
                        <button className={s.toolBtn} onClick={duplicateSelected}
                            disabled={!selected.size} title="Duplicate">⧉</button>
                        <button className={`${s.toolBtn} ${s.toolDanger}`}
                            onClick={deleteSelected} disabled={!selected.size}
                            title="Delete selected">🗑</button>
                    </div>

                    <div className={s.sep} />

                    <div className={s.toolGroup}>
                        <button className={`${s.toolBtn} ${showGrid ? s.toolActive : ""}`}
                            onClick={() => setShowGrid((g) => !g)} title="Toggle grid">▦</button>
                        <button className={`${s.toolBtn} ${snapOn ? s.toolActive : ""}`}
                            onClick={() => setSnapOn((g) => !g)} title="Toggle snap">⊞</button>
                        <button className={s.toolBtn} onClick={fitView} title="Fit view">⊡</button>
                        <button className={s.toolBtn}
                            onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
                            title="Zoom in">+</button>
                        <span className={s.zoomVal}>{Math.round(zoom * 100)}%</span>
                        <button className={s.toolBtn}
                            onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.15).toFixed(2)))}
                            title="Zoom out">−</button>
                    </div>

                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11, color: "#22C55E", padding: "0 8px" }}>↗ Incoming</span>
                    <span style={{ fontSize: 11, color: "#F97316", padding: "0 8px" }}>↙ OutGoing</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", padding: "0 8px" }}>
                        {nodes.length} nodes · {edges.length} edges
                    </span>
                    <button className={`${s.toolBtn} ${s.toolDanger}`} style={{color : "var(--danger)"}} onClick={clearAll}>
                        Clear
                    </button>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className={`${s.canvas} ${showGrid ? s.grid : ""}`}
                    style={{ cursor }}
                    onMouseDown={onCanvasDown}
                    onMouseMove={onCanvasMove}
                    onMouseUp={onCanvasUp}
                    onMouseLeave={onCanvasLeave}
                    onWheel={onWheel}
                >
                    {connecting && (
                        <div className={s.connHint}>
                            🔗 Click the TARGET node — Esc to cancel
                        </div>
                    )}

                    {nodes.length === 0 && (
                        <div className={s.empty}>
                            <div style={{ fontSize: 56, opacity: 0.4, marginBottom: 14 }}>🏗️</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", opacity: 0.3 }}>
                                Click components on the left to start
                            </div>
                            <div style={{ fontSize: 12, color: "var(--text)", marginTop: 5, opacity:0.3 }}>
                                Use Connect tool (C) to draw arrows between nodes
                            </div>
                        </div>
                    )}

                    <div style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: "0 0",
                        position: "absolute", top: 0, left: 0,
                        width: "10000px", height: "10000px",
                    }}>
                        {/* SVG edges */}
                        <svg style={{
                            position: "absolute", inset: 0,
                            width: "10000px", height: "10000px",
                            pointerEvents: "none", zIndex: 1, overflow: "visible",
                        }}>
                            <defs>
                                {/* Normal Arrow visible  */}
                                <marker id="arrowNormal" markerWidth="8" markerHeight="6"
                                    refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                                </marker>

                                {/* Highlighted Arrow visible */}
                                <marker id="arrowHighlight" markerWidth="8" markerHeight="6"
                                    refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#2563EB" />
                                </marker>

                                {/* Outgoing Arrow visible */}
                                <marker id="arrowOut" markerWidth="8" markerHeight="6"
                                    refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#22C55E" />
                                </marker>

                                {/* Incoming Arrow visible */}
                                <marker id="arrowIn" markerWidth="8" markerHeight="6"
                                    refX="7" refY="3" orient="auto">
                                    <polygon points="0 0, 8 3, 0 6" fill="#F97316" />
                                </marker>
                            </defs>
                            {edges.map((ed) => {
                                const fn = nodes.find((n) => n.id === ed.from);
                                const tn = nodes.find((n) => n.id === ed.to);
                                if (!fn || !tn) return null;
                                const f = center(fn), t = center(tn);
                                const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2;
                                const dx = t.x - f.x, dy = t.y - f.y;
                                const cx = mx - dy * 0.12, cy = my + dx * 0.12;

                                const isHighlighted = highlightedEdgesIds.has(ed.id);
                                const isOutgoing = isHighlighted && selected.has(ed.from);
                                const isIncoming = isHighlighted && selected.has(ed.to);

                                const edgeColor = isOutgoing  ? "#F97316" : isIncoming  ? "#22C55E" : "#94a3b8";

                                const arrowId = isOutgoing ? "arrowOut"
                                : isIncoming ? "arrowIn"
                                : "arrowNormal";

                                const strokeWidth = isHighlighted ? 3 : 2;
                                const opacity     = isHighlighted ? 1 : 0.6;

                                return (
                                    <g key={ed.id} style={{ pointerEvents: "all" }}>
                                        <path
                                            d={`M${f.x},${f.y} Q${cx},${cy} ${t.x},${t.y}`}
                                            fill="none" stroke={edgeColor} strokeWidth={strokeWidth}
                                            strokeDasharray={isHighlighted ? "none" : "5, 3"} markerEnd={`url(#${arrowId})`}
                                            opacity={opacity}
                                            style={{transition: "stroke 0.2s, opacity 0.2s"}}
                                            onClick={() => removeEdge(ed.id)}
                                        />
                                        <circle cx={mx} cy={my} r="6.5"
                                            fill="var(--bg-card)" stroke="var(--danger)" strokeWidth="1.5"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => removeEdge(ed.id)}
                                        />
                                        <text x={mx} y={my + 4} textAnchor="middle"
                                            fontSize="9" fill="var(--danger)"
                                            style={{ pointerEvents: "all", cursor: "pointer" }}
                                            onClick={() => removeEdge(ed.id)}>✕</text>
                                    </g>
                                );
                            })}
                        </svg>

                        {/* Nodes */}
                        {nodes.map((node) => {
                            const isSel = selected.has(node.id);
                            const isCon = connecting === node.id;

                            const nodeEdges = edges.filter((ed) => ed.from === node.id || ed.to == node.id);
                            const outgoing = edges.filter((ed) => ed.from === node.id).length;
                            const incoming = edges.filter((ed) => ed.to === node.id).length;
                            const hasEdges = nodeEdges.length > 0;

                            return (
                                <div
                                    key={node.id}
                                    className={`${s.node} ${isSel ? s.nodeSel : ""} ${isCon ? s.nodeCon : ""}`}
                                    style={{
                                        left: node.x,
                                        top: node.y,
                                        background: node.bg,
                                        "--nb": node.border,
                                        zIndex: isSel ? 30 : 10,
                                        cursor:
                                            tool === "select" ? "grab" :
                                                tool === "connect" ? "crosshair" :
                                                    tool === "delete" ? "not-allowed" : "text",
                                    }}
                                    onMouseDown={(e) => onNodeDown(e, node.id)}
                                    onDoubleClick={() => beginEdit(node.id)}
                                >
                                    <div className={s.nodeEmoji}>{node.emoji}</div>
                                    <div className={s.nodeType} style={{ color: node.color }}>
                                        {node.type}
                                    </div>
                                    {editId === node.id ? (
                                        <input
                                            className={s.labelInput}
                                            value={editText}
                                            autoFocus
                                            onChange={(e) => setEditText(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") saveEdit();
                                                if (e.key === "Escape") setEditId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            placeholder="Label..."
                                        />
                                    ) : node.label ? (
                                        <div className={s.nodeLabel}>{node.label}</div>
                                    ) : null}

                                    {hasEdges && (
                                        <div className={s.edgeBadges}>
                                            {outgoing > 0 && (
                                                <span className={s.badgeOut} title={`${outgoing} outgoing`}>
                                                ↙ {outgoing}
                                                </span>
                                            )}
                                            {incoming > 0 && (
                                                <span className={s.badgeIn} title={`${incoming} incoming`}>
                                                ↗ {incoming}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Minimap */}
                {nodes.length > 0 && (
                    <div className={s.minimap}>
                        <div className={s.minimapTitle}>MAP</div>
                        <svg width="120" height="72" viewBox="0 0 900 600"
                            preserveAspectRatio="xMidYMid meet">
                            {edges.map((ed) => {
                                const fn = nodes.find((n) => n.id === ed.from);
                                const tn = nodes.find((n) => n.id === ed.to);
                                if (!fn || !tn) return null;
                                return (
                                    <line key={ed.id}
                                        x1={fn.x + 55} y1={fn.y + 40}
                                        x2={tn.x + 55} y2={tn.y + 40}
                                        stroke="var(--border)" strokeWidth="5"
                                    />
                                );
                            })}
                            {nodes.map((n) => (
                                <rect key={n.id}
                                    x={n.x} y={n.y} width="90" height="60" rx="8"
                                    fill={n.border + "40"} stroke={n.border} strokeWidth="4"
                                    opacity={selected.has(n.id) ? 1 : 0.7}
                                />
                            ))}
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
}