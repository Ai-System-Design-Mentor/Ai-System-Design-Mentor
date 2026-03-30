import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { problemsApi, chatApi, designsApi } from '../utils/Api';
import DiagramCanvas from '../components/DiagramCanvas';
import AIMentorChat from '../components/AIMentorChat';
import './WorkSpace.css';
import '../index.css';
import { toPng } from 'html-to-image';
import { DEFAULT_PROBLEMS } from '../utils/constant';

export default function WorkspacePage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const DEFAULT_PROBLEM = DEFAULT_PROBLEMS[0];

    // 1. Reference to the diagram container for screenshotting
    const diagramRef = useRef(null);

    const slug = params.get("slug");
    const customQ = params.get("custom");
    const titleParams = params.get("title");
    const timerParams = params.get("estimatedTime");

    const [problemTitle, setProblemTitle] = useState(titleParams || customQ || DEFAULT_PROBLEM.title);
    const [problemTime, setProblemTime] = useState(Number(timerParams) || DEFAULT_PROBLEM.time);
    const [problemInfo, setProblemInfo] = useState(null);
    const [loadingProblem, setLoadingProblem] = useState(false);
    const [explanation, setExplanation] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [diagramData, setDiagramData] = useState({ nodes: [], edges: [] });

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
                    setProblemTime(problem.estimatedTime);
                    setProblemInfo(problem);
                })
                .catch(() => { })
                .finally(() => setLoadingProblem(false));
        }
    }, [slug, customQ]);

    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => {
        if (problemTime) {
            setTimer(problemTime * 60);
        }
    }, [problemTime]);

    // Timer
    useEffect(() => {
        if (!timerActive) return;

        timerRef.current = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    function formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    const timerColor =
        timer > 2700 ? "#EF4444" :
            timer > 1800 ? "#F97316" : "var(--text)";

    const colors =
        (problemInfo?.difficulty || DEFAULT_PROBLEM.difficulty) === "Easy" ? "34,197,94" :
            (problemInfo?.difficulty || DEFAULT_PROBLEM.difficulty) === "Medium" ? "234,179,8" :
                (problemInfo?.difficulty || DEFAULT_PROBLEM.difficulty) === "Hard" ? "239,68,68" : "239,68,68";

    async function handleSubmit() {
        if (diagramData.nodes.length < 2) {
            alert("Please add at least 2 components on your diagram before submitting.");
            return;
        }

        setSubmitting(true);
        setTimerActive(false);
        clearInterval(timerRef.current);

        try {
            // 2. Capture the screenshot
            let base64Image = "";
            if (diagramRef.current) {
                // Background color ensures the image isn't transparent (change hex to match your app's theme if needed)
                base64Image = await toPng(diagramRef.current, { backgroundColor: '#1e1e1e' });
            }

            const timeTaken = Math.max(0, (problemTime * 60) - timer);

            // 3. Send image to the backend
            const { attemptId, evaluation } = await designsApi.submit({
                problemSlug: slug || null,
                problemTitle,
                isCustomProblem: !!customQ,
                diagramData,
                textExplanation: explanation,
                timeTaken,
                diagramImage: base64Image, // <--- Image string is attached here
            });

            navigate(`/result/${attemptId}`, { state: { evaluation, problemTitle } });
        } catch (error) {
            console.log(error.message || "Submission failed. Please try again.");
            alert(error.message || "Submission failed. Please try again.");
            setSubmitting(false);
            setTimerActive(true);
        }
    }

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
                    {/* {DEFAULT_PROBLEM && DEFAULT_PROBLEM?.difficulty && (
                        <span style={{ background: `rgba(${colors}, 0.2)`, color: `rgba(${colors})`, paddingLeft: 10, paddingRight: 10, paddingTop: 3, paddingBottom: 3, borderRadius: 7, fontSize: 10 }}>{DEFAULT_PROBLEM.difficulty}</span>
                    )} */}
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
                    style={{ padding: "9px 22px" }} onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <span className="pulse">Evaluating…</span> : "Submit & Evaluate →"}
                </button>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* 4. Attach diagramRef to the wrapper div so it knows what to screenshot */}
                <div ref={diagramRef} style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <DiagramCanvas onDiagramChange={setDiagramData} />
                </div>
                <AIMentorChat problemTitle={problemTitle}
                    problemSlug={slug}
                    currentDiagram={diagramData} />
            </div>
        </div>
    )
};