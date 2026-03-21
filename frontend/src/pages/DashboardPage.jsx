import React from "react";
import { useAuth } from "../context/AuthContext";
import "./Dashboard.css"

export default function Dashboard(){
    const {user} = useAuth();
    return(
        <div className="dashboard">
            <div className="dashboard_container">
                <h2 className="dashboard_title">Welcome Back, {user.username}!👋</h2>
                <h4 className="dashboard_para">Your System design journey at a glance</h4>

                <div className="dashboard_stats">
                    <div className="dashboardstats stats1">
                        <h4 className="stats_title">🏆 Problems Solved</h4>
                        <span>{user.stats.totalAttempts}</span>
                        <h4 className="stats_base">Total Attemps</h4>
                    </div>
                    <div className="dashboardstats stats2">
                        <h4 className="stats_title">📈 Avg. Score</h4>
                        <span>{user.stats.averageScore}</span>
                        <h4 className="stats_base">Out of 10</h4>
                    </div>
                    <div className="dashboardstats stats3">
                        <h4 className="stats_title">⭐ Best Score</h4>
                        <span>{user.stats.bestScore}</span>
                        <h4 className="stats_base">Personal Best</h4>
                    </div>
                </div>

                <div className="progress_skills ">
                    <div className="progress dashboard_border">
                        <h4 className="progress_overview">Progess Overview</h4>
                        <h6>Score trend accross your last attemps</h6>
                    </div>
                    <div className="skills dashboard_border">
                        <h4>LoadBalancing</h4>
                    </div>
                </div>
                <div className="history dashboard_border" >
                    <span>startPractecing</span>
                </div>
            </div>
        </div>
    )
}