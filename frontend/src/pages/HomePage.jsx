import React, { useState, useRef, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import '../index.css';

export default function HomePage() {
    const navigate = useNavigate();
    const [selectedDifficulty, setSelectedDifficulty] = useState("All");
    const problems = [
        { id: 1, title: "Design a URL Shortener", difficulty: "Easy", tags: ["Hashing", "Database", "API Gateway"], time: "30 min", logo: "🔗" },
        { id: 2, title: "Design a Twitter/X", difficulty: "Hard", tags: ["Feed", "Scale", "Cache", "CDN"], time: "60 min", logo: "🐦" },
        { id: 3, title: "Design a real-time chat app", difficulty: "Medium", tags: ["WebSocket", "Messaging", "Queue"], time: "30 min", logo: "💬" },
        { id: 4, title: "Design a Netflix", difficulty: "Hard", tags: ["CDN", "Streaming", "Load Balancer"], time: "60 min", logo: "🎬" },
        { id: 5, title: "Design a rate limiter", difficulty: "Medium", tags: ["Redis", "Algorithm", "API Gateway"], time: "30 min", logo: "⏱️" },
        { id: 6, title: "Design a Google Drive", difficulty: "Medium", tags: ["Storage", "Sync", "Auth", "Metadata DB"], time: "60 min", logo: "📁" },
        { id: 7, title: "Design a WhatsApp", difficulty: "Medium", tags: ["Message", "E2E", "Push"], time: "60 min", logo: "💬" },
        { id: 8, title: "Design a Uber", difficulty: "Hard", tags: ["GPS", "Matching", "Real-Time"], time: "50 min", logo: "🚗" },
        { id: 9, title: "Design a Youtube", difficulty: "Hard", tags: ["CDN", "Streaming", "Storage"], time: "60 min", logo: "▶" },
    ];

    const activity = [
        { id: 1, title: `${problems.length}+`, dis: "Design Problem" },
        { id: 2, title: "AI", dis: "Powered Evaluation" },
        { id: 3, title: "Real-Time", dis: "Mentor Chat" },
    ];

    const colors = { Easy: "#22c55e", Medium: "#f59e0b", Hard: "#ef4444" };

    const filteredProblems = selectedDifficulty === "All" ? problems : problems.filter(p => p.difficulty === selectedDifficulty);

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
                {filteredProblems.map((p) => (
                    <div key={p.id}
                        className='problems_components'
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >

                        <div className="problem_upper">
                            <div className="problemLeft">
                                <span className='problemLogo'>{p.logo}</span>
                            </div>
                            <div className="problemRight">
                                <div className='problem_box'>
                                    <span
                                        className="problem_diff"
                                        style={{
                                            background: colors[p.difficulty] + "20",
                                            color: colors[p.difficulty]
                                        }}
                                    >
                                        <span
                                            className="dot"
                                            style={{ backgroundColor: colors[p.difficulty] }}
                                        ></span>

                                        {p.difficulty}
                                    </span>
                                    <span className='problemTime'>⏱ {p.time}</span>
                                </div>
                                <h3 className='problem_title' >{p.title}</h3>
                            </div>
                        </div>
                        <div className='problem_tag'>
                            {p.tags.map((t) => (
                                <span key={t} className="problem_tags">{t}</span>
                            ))}
                        </div>
                        <div className="designBtn">
                            <button className='dbtn' onClick={() => navigate("./workspace")}>Start Designing →</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
