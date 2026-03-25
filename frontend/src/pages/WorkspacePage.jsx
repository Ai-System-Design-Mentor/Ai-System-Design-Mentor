import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { problemsApi, chatApi, designsApi } from '../utils/Api';
import DiagramCanvas from '../components/DiagramCanvas';
import './WorkSpace.css';
import '../index.css';

export default function WorkspacePage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();

    const slug = params.get("slug");
    const customQ = params.get("custom");
    const titleParams = params.get("title");

    const [problemTitle, setProblemTitle] = useState(titleParams || customQ || "System Design");
    const [problemInfo, setProblemInfo] = useState(null);
    const [loadingProblem, setLoadingProblem] = useState(false);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(true);
    const timerRef = useRef(null);
    const [explanation, setExplanation] = useState("");
    const [diagramData, setDiagramData] = useState({ nodes: [], edges: [] });

    // Timer
    useEffect(() => {
        if (timerActive) {
            timerRef.current = setInterval(() => {
                setTimer((t) => t + 1);
            }, 1000);
        }

        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    // Load a Problem
    useEffect(() => {
        if (!slug && !customQ) return;
        setLoadingProblem(true);

        if (customQ) {
            setProblemTitle(customQ);
            chatApi.generateProblem(customQ)
                .then(({ problem }) => setProblemInfo(problem))
                .catch(() => { })
                .finally(() => setLoadingProblem(false));
        } else if (slug) {
            problemsApi.getBySlug(slug)
                .then(({ problem }) => {
                    setProblemTitle(problem.title);
                    setProblemInfo(problem);
                })
                .catch(() => { })
                .finally(() => setLoadingProblem(false));
        }
    }, [slug, customQ]);

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    const timerColor =
        timer > 2700 ? "#EF4444" :
            timer > 1800 ? "#F97316" : "var(--text)";

    const colors =
        problemInfo?.difficulty === "Easy" ? "34,197,94" :
            problemInfo?.difficulty === "Medium" ? "234,179,8" :
                problemInfo?.difficulty === "Hard" ? "239,68,68" : "239,68,68";

    return (
        <div className="workspace_container">
            <div className="workspace_topbar">
                <button className='btn btn-ghost backButton' onClick={() => navigate("/")}>← Back</button>
                <div className="workspace_title">
                    <span className='workspace_ptitle'>{problemTitle}</span>

                    {customQ && <span style={{ color: "purple" }}>Custom</span>}
                    {slug && problemInfo?.difficulty && (
                        <span style={{ background: `rgba(${colors}, 0.2)`, color: `rgba(${colors})`, paddingLeft: 10, paddingRight: 10, paddingTop: 3, paddingBottom: 3, borderRadius: 7, fontSize: 10 }}>{problemInfo.difficulty}</span>
                    )}
                    {loadingProblem && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }} className="pulse">
                            Generating problem…
                        </span>
                    )}
                </div>

                <div style={{ flex: 1 }} />

                <div className="workspaceTimer">
                    <span className='timer' style={{ color: timerColor }}>⏱ {formatTime(timer)}</span>
                    <button className='timerCheck' onClick={() => setTimerActive((a) => !a)}
                        title={timerActive ? "Pause timer" : "Resume timer"}>{timerActive ? "⏸" : "▶"}</button>
                </div>

                <button className="btn btn-primary"
                    style={{ padding: "9px 22px" }}>
                    Submit & Evaluate →
                </button>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <DiagramCanvas onDiagramChange={setDiagramData} />
                </div>
            </div>
        </div>
    )
};