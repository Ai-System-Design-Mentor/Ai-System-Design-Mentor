import React, { useState, useRef, useEffect, use } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import '../index.css';

export default function HomePage() {
    const navigate = useNavigate();
    const problems = [
        { id: 1, title: "Design a URL Shortener", difficulty: "Easy", tags: ["Hashing", "Database", "API Gateway"] },
        { id: 2, title: "Design a Twitter/X", difficulty: "Hard", tags: ["Feed", "Scale", "Cache", "CDN"] },
        { id: 3, title: "Design a real-time chat app", difficulty: "Medium", tags: ["WebSocket", "Messaging", "Queue"] },
        { id: 4, title: "Design a Netflix", difficulty: "Hard", tags: ["CDN", "Streaming", "Storage", "Load Balancer"] },
        { id: 5, title: "Design a rate limiter", difficulty: "Medium", tags: ["Redis", "Algorithm", "API Gateway"] },
        { id: 6, title: "Design a Google Drive", difficulty: "Medium", tags: ["Storage", "Sync", "Auth", "Metadata DB"] },
    ];

    const colors = { Easy: "#22c55e", Medium: "#f59e0b", Hard: "#ef4444" };

    return (
        <div className="home">
            <h1 className="headline">👋 Welcome back, Karan!</h1>
            <p className="headPara">Pick a system design problem and start practicing.</p>

            <div className="problems">
                {problems.map((p) => (
                    <div key={p.id}
                        onClick={() => navigate("/workspace")}
                        className='problems_components'
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                    >
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
                        </div>
                        <h3 className='problem_title' >{p.title}</h3>
                        <div className='problem_tag'>
                            {p.tags.map((t) => (
                                <span key={t} className="problem_tags">{t}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
