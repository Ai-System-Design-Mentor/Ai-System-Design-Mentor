import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PROBLEMS } from '../utils/constants';
import ProblemCard from '../components/ProblemCard';
import './Home.css';
import '../index.css';

export default function HomePage() {
    const navigate = useNavigate();
    const [problems, setProblems] = useState(DEFAULT_PROBLEMS);
    const [selectedDifficulty, setSelectedDifficulty] = useState("All");
    const [showAll, setShowAll] = useState(false);
    const [custom, setCustom] = useState("");

    const activity = [
        { id: 1, title: `${problems.length}+`, dis: "Design Problem" },
        { id: 2, title: "AI", dis: "Powered Evaluation" },
        { id: 3, title: "Real-Time", dis: "Mentor Chat" },
    ];

    const filteredProblems = selectedDifficulty === "All" ? problems : problems.filter(p => p.difficulty === selectedDifficulty);

    const displayedProblem = showAll
        ? filteredProblems : filteredProblems.slice(0, 6);

    function start(e) {
        e.stopPropagation();
        if (!custom.trim()) {
            return;
        }
        navigate(`/workspace?custom=${encodeURIComponent(custom.trim())}`);
    }

    return (
        // Home Page Component
        <div className="home">
            <div className="homeTopMost">
                <span className='topmost'>✨ AI-Powered System Design Practice</span>
                <h1 className="headline">Master System Design</h1>
                <h1 className='headlineBack'>with Real AI Feedback</h1>
                <p className="headPara">Build architecture diagrams, chat with your AI mentor, and get scored evaluations — just like a real FAANG interview.</p>
            </div>

            <div className="problemDiscription">
                {activity.map((a) => (
                    <div key={a.id}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
                        <div className="designPbl">
                            <span style={{ fontSize: 30, fontWeight: 700, color: "var(--accent-hover)", marginBottom: 10 }}>{a.title}</span>
                            <span style={{ fontSize: 14, color: "#888" }}>{a.dis}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="problemSelect">
                <li className='chooseProblem'>Choose a Problem.</li>
                <div className="problemCategory">
                    <li
                        className={`listTag ${selectedDifficulty === "All" ? "active" : ""}`}
                        onClick={() => setSelectedDifficulty("All")}
                    >All</li>
                    <li className={`listTag ${selectedDifficulty === "Easy" ? "active" : ""}`}
                        onClick={() => setSelectedDifficulty("Easy")}
                    >Easy</li>

                    <li className={`listTag ${selectedDifficulty === "Medium" ? "active" : ""}`}
                        onClick={() => setSelectedDifficulty("Medium")}
                    > Medium </li>

                    <li className={`listTag ${selectedDifficulty === "Hard" ? "active" : ""}`}
                        onClick={() => setSelectedDifficulty("Hard")}
                    > Hard </li>
                </div>
            </div>
            <div className="problems">
                {displayedProblem.length === 0 ? (
                    <p style={{ color: "var(--text-muted)", fontSize: 14, padding: "20px 0" }}>
                        No problems found for this difficulty.
                    </p>
                ) : (
                    [...displayedProblem]
                        .sort((a, b) => a.title.localeCompare(b.title))
                        .map((p) => (
                            <ProblemCard key={p.slug || p.id} problem={p} />
                        )))}
            </div>
            <div className='viewBtn'>
                {!showAll && filteredProblems.length > 6 && (
                    <button
                        onClick={() => setShowAll(true)}
                        className='showMore'>
                        ▼ View More
                    </button>
                )}
                {showAll && (
                    <button
                        onClick={() => setShowAll(false)}
                        className='showLess'
                    >
                        ▲ Show Less
                    </button>
                )}
            </div>
            <div className="custom-problem">
                <h2 className='custom_title'>✨ Design your Own System</h2>
                <p className='custom_dis'>Enter any system - AI will generate requirements and evaluate your architecture</p>
                <div className="custom_design_title">
                    <input type="text" name="custom" id="custom"
                    placeholder='eg. Design a swiggy, Design a amazon, Design a IRCTC'
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && startCustom()}/>
                    <button className='custombtn' onClick={start}>Start Designing →</button>
                </div>
            </div>
        </div>
    )
}
