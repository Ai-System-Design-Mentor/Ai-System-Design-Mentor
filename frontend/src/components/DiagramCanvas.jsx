import { useState, useRef, useCallback, useEffect } from "react";
import { DIAGRAM_COMPONENTS } from "../utils/constants";
import { useTheme } from "../context/ThemeContext";
import styles from "./DiagramCanvas.module.css";

let idCounter = 1;
const uid = () => `node_${idCounter++}_${Date.now()}`;

export default function DiagramCanvas({ onDiagramChange }) {
  const { theme } = useTheme();
  const [nodes, setNodes]             = useState([]);
  const [edges, setEdges]             = useState([]);
  const [selected, setSelected]       = useState(null);   // selected node id
  const [connecting, setConnecting]   = useState(null);   // source node id for edge
  const [dragging, setDragging]       = useState(null);   // { id, offsetX, offsetY }
  const [zoom, setZoom]               = useState(1);
  const [pan, setPan]                 = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning]     = useState(false);
  const [panStart, setPanStart]       = useState(null);
  const [editingNode, setEditingNode] = useState(null);   // node being label-edited
  const [editLabel, setEditLabel]     = useState("");
  const [showGrid, setShowGrid]       = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const canvasRef = useRef(null);

  // Notify parent on change
  useEffect(() => {
    onDiagramChange?.({ nodes, edges });
  }, [nodes, edges]);

  // ── Add node from panel ──────────────────────────────────
  function addNode(comp) {
    const newNode = {
      id:     uid(),
      type:   comp.type,
      emoji:  comp.emoji,
      bg:     theme === "dark" ? comp.darkBg : comp.bg,
      border: comp.border,
      color:  comp.color,
      x:      80 + Math.random() * 350,
      y:      80 + Math.random() * 220,
      label:  "",
    };
    setNodes((n) => [...n, newNode]);
  }

  // ── Dragging ─────────────────────────────────────────────
  function onNodeMouseDown(e, id) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    if (connecting) { finishConnection(id); return; }
    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find((n) => n.id === id);
    setDragging({ id, offsetX: (e.clientX - rect.left) / zoom - pan.x - node.x, offsetY: (e.clientY - rect.top) / zoom - pan.y - node.y });
    setSelected(id);
  }

  function onMouseMove(e) {
    if (dragging) {
      const rect = canvasRef.current.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / zoom - pan.x - dragging.offsetX;
      const ny = (e.clientY - rect.top)  / zoom - pan.y - dragging.offsetY;
      setNodes((ns) => ns.map((n) => n.id === dragging.id ? { ...n, x: Math.max(0, nx), y: Math.max(0, ny) } : n));
    }
    if (isPanning && panStart) {
      setPan({ x: pan.x + (e.clientX - panStart.x) / zoom, y: pan.y + (e.clientY - panStart.y) / zoom });
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }

  function onMouseUp() { setDragging(null); setIsPanning(false); setPanStart(null); }

  // ── Canvas pan ────────────────────────────────────────────
  function onCanvasMouseDown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    } else {
      setSelected(null);
      if (connecting) setConnecting(null);
    }
  }

  // ── Zoom ─────────────────────────────────────────────────
  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.3, Math.min(2.5, z * delta)));
  }

  // ── Connections ───────────────────────────────────────────
  function startConnection(e, id) {
    e.stopPropagation();
    if (connecting === id) { setConnecting(null); return; }
    setConnecting(id);
  }

  function finishConnection(targetId) {
    if (!connecting || connecting === targetId) { setConnecting(null); return; }
    const exists = edges.some(
      (ed) => (ed.from === connecting && ed.to === targetId) ||
               (ed.from === targetId   && ed.to === connecting)
    );
    if (!exists) {
      setEdges((ed) => [...ed, { id: uid(), from: connecting, to: targetId }]);
    }
    setConnecting(null);
  }

  function removeEdge(id) {
    setEdges((ed) => ed.filter((e) => e.id !== id));
  }

  // ── Node actions ──────────────────────────────────────────
  function removeNode(id) {
    setNodes((n) => n.filter((x) => x.id !== id));
    setEdges((ed) => ed.filter((e) => e.from !== id && e.to !== id));
    if (selected === id)   setSelected(null);
    if (connecting === id) setConnecting(null);
  }

  function duplicateNode(id) {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    setNodes((ns) => [...ns, { ...node, id: uid(), x: node.x + 30, y: node.y + 30 }]);
  }

  function startEditLabel(node) {
    setEditingNode(node.id);
    setEditLabel(node.label || "");
  }

  function saveLabel() {
    setNodes((ns) => ns.map((n) => n.id === editingNode ? { ...n, label: editLabel } : n));
    setEditingNode(null);
  }

  // ── Clear ─────────────────────────────────────────────────
  function clearCanvas() {
    if (nodes.length === 0) return;
    if (window.confirm("Clear all nodes and connections?")) {
      setNodes([]); setEdges([]); setSelected(null); setConnecting(null);
    }
  }

  function fitView() {
    if (nodes.length === 0) return;
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs) - 40;
    const minY = Math.min(...ys) - 40;
    setPan({ x: -minX + 40, y: -minY + 40 });
    setZoom(1);
  }

  // ── Edge midpoint for click-to-remove ─────────────────────
  function edgeMidpoint(from, to) {
    const fn = nodes.find((n) => n.id === from);
    const tn = nodes.find((n) => n.id === to);
    if (!fn || !tn) return null;
    return {
      x1: fn.x + 55, y1: fn.y + 38,
      x2: tn.x + 55, y2: tn.y + 38,
      mx: (fn.x + tn.x) / 2 + 55,
      my: (fn.y + tn.y) / 2 + 38,
    };
  }

  return (
    <div className={styles.wrap}>
      {/* ── Component Panel ─────────────────────── */}
      <div className={styles.panel}>
        <div className={styles.panelTitle}>Components</div>
        <div className={styles.panelList}>
          {DIAGRAM_COMPONENTS.map((c) => (
            <div
              key={c.type}
              className={styles.panelItem}
              style={{ "--item-border": c.border, "--item-bg": theme === "dark" ? c.darkBg : c.bg }}
              onClick={() => addNode(c)}
              title={`Add ${c.type}`}
            >
              <span className={styles.panelEmoji}>{c.emoji}</span>
              <span className={styles.panelLabel} style={{ color: c.color }}>{c.type}</span>
            </div>
          ))}
        </div>
        <div className={styles.panelHint}>
          <b>Click</b> to add · <b>Drag</b> to move<br />
          <b>🔗</b> connect · <b>Alt+drag</b> pan
        </div>
      </div>

      {/* ── Canvas Area ─────────────────────────── */}
      <div className={styles.canvasWrap}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>
            {nodes.length} nodes · {edges.length} connections
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => setShowGrid((g) => !g)} title="Toggle grid">
              {showGrid ? "▦ Grid" : "▪ Grid"}
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={fitView} title="Fit view">
              ⊡ Fit
            </button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}>+</button>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", minWidth: 38, justifyContent: "center" }}>
              {Math.round(zoom * 100)}%
            </span>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 10px" }} onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>−</button>
            <button className="btn btn-danger" style={{ fontSize: 12, padding: "5px 10px" }} onClick={clearCanvas}>🗑 Clear</button>
          </div>
        </div>

        {/* SVG + Nodes Canvas */}
        <div
          ref={canvasRef}
          className={`${styles.canvas} ${showGrid ? styles.grid : ""}`}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseDown={onCanvasMouseDown}
          onWheel={onWheel}
          style={{ cursor: isPanning ? "grabbing" : connecting ? "crosshair" : "default" }}
        >
          {/* Connecting hint */}
          {connecting && (
            <div className={styles.connectingHint}>
              🔗 Click a target node to connect — or click canvas to cancel
            </div>
          )}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className={styles.emptyState}>
              <div style={{ fontSize: 52, marginBottom: 12, opacity: 0.35 }}>🏗️</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-faint)" }}>Click components on the left to start</div>
              <div style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 4 }}>Then use 🔗 to connect them</div>
            </div>
          )}

          {/* Transformed content */}
          <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", position: "absolute", inset: 0 }}>
            {/* SVG edges */}
            <svg style={{ position: "absolute", inset: 0, width: "10000px", height: "10000px", pointerEvents: "none", zIndex: 1 }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="var(--text-faint)" />
                </marker>
              </defs>
              {edges.map((e) => {
                const p = edgeMidpoint(e.from, e.to);
                if (!p) return null;
                return (
                  <g key={e.id}>
                    <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                      stroke="var(--border)" strokeWidth="2"
                      strokeDasharray="6,4" markerEnd="url(#arrow)" />
                    {/* invisible wider hit area */}
                    <line x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                      stroke="transparent" strokeWidth="12"
                      style={{ cursor: "pointer", pointerEvents: "stroke" }}
                      onClick={() => removeEdge(e.id)} />
                    {/* midpoint dot */}
                    <circle cx={p.mx} cy={p.my} r="5" fill="var(--bg-card)"
                      stroke="var(--border)" strokeWidth="1.5"
                      style={{ cursor: "pointer", pointerEvents: "all" }}
                      onClick={() => removeEdge(e.id)}
                      title="Click to remove" />
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className={`${styles.node} ${selected === node.id ? styles.nodeSelected : ""} ${connecting === node.id ? styles.nodeConnecting : ""}`}
                style={{
                  left: node.x, top: node.y,
                  background:   node.bg,
                  borderColor:  connecting === node.id ? node.border : (selected === node.id ? node.border : "transparent"),
                  "--node-border": node.border,
                }}
                onMouseDown={(e) => onNodeMouseDown(e, node.id)}
                onDoubleClick={() => startEditLabel(node)}
              >
                <div className={styles.nodeEmoji}>{node.emoji}</div>
                <div className={styles.nodeType} style={{ color: node.color }}>{node.type}</div>
                {editingNode === node.id ? (
                  <input
                    className={styles.nodeLabelInput}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={saveLabel}
                    onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditingNode(null); }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    placeholder="Label..."
                  />
                ) : node.label ? (
                  <div className={styles.nodeLabel}>{node.label}</div>
                ) : null}
                <div className={styles.nodeActions}>
                  <button
                    className={`${styles.nodeBtn} ${connecting === node.id ? styles.nodeBtnActive : ""}`}
                    onClick={(e) => { e.stopPropagation(); startConnection(e, node.id); }}
                    title="Connect to another node"
                  >🔗</button>
                  <button
                    className={styles.nodeBtn}
                    onClick={(e) => { e.stopPropagation(); duplicateNode(node.id); }}
                    title="Duplicate"
                  >⧉</button>
                  <button
                    className={`${styles.nodeBtn} ${styles.nodeBtnDanger}`}
                    onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}
                    title="Remove"
                  >✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Minimap */}
        {showMinimap && nodes.length > 0 && (
          <div className={styles.minimap}>
            <div style={{ fontSize: 9, color: "var(--text-faint)", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Minimap</div>
            <div style={{ position: "relative", width: "100%", height: 70, background: "var(--bg)", borderRadius: 4, overflow: "hidden" }}>
              {nodes.map((n) => (
                <div key={n.id} style={{
                  position: "absolute",
                  left: `${(n.x / 800) * 100}%`,
                  top:  `${(n.y / 500) * 100}%`,
                  width: 8, height: 6,
                  borderRadius: 2,
                  background: n.border || "var(--accent)",
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
