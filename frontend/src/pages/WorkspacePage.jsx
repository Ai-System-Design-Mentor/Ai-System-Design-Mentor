import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { problemsApi, chatApi, designsApi } from '../utils/Api';
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

    useEffect(() => {
        if (!slug && !customQ) return;
        setLoadingProblem(true);

        if (customQ) {
            setProblemTitle(customQ);
            chatApi.generateProblem(customQ)
                .then(({ problems }) => setProblemInfo(problems))
                .catch(() => { })
                .finally(() => setLoadingProblem(false));
        } else if (slug) {
            problemsApi.getBySlug(slug)
                .then(({ problems }) => {
                    setProblemTitle(problems.title);
                    setProblemInfo(problems);
                })
                .catch(() => { })
                .finally(() => setLoadingProblem(false));
        }
    }, [slug, customQ]);

    return (
        <div className="workspace_container">
            <div className="workspace_topbar">
                <button className='btn btn-ghost backButton' onClick={() => navigate("/")}>← Back</button>
                <div className="workspace_title">
                    <span className='problem_title'>{problemTitle}</span>
                    {slug && problemInfo?.difficulty && (
                        <span className={`badge ${problemInfo.difficulty === "Easy" ? "badge-green" :
                            problemInfo.difficulty === "Medium" ? "badge-yellow" : "badge-red"}`}>{problemInfo.difficulty}</span>
                    )}
                    {loadingProblem && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }} className="pulse">
                            Generating problem…
                        </span>
                    )}
                </div>

                <div style={{ flex: 1 }} />

                <button className="btn btn-primary"
                    style={{ padding: "9px 22px" }}>
                    Submit & Evaluate →
                </button>
            </div>
        </div>
    )
};
