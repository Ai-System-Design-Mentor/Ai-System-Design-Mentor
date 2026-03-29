import React, { useState, useEffect } from 'react';
import { useAuth } from "../context/AuthContext";
import "../index.css";
import "./Profile.css";
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../utils/Api';

export default function Profile() {
    const { user, logout, updateUser } = useAuth();
    const [showPw, setShowPw] = useState(false);
    const navigate = useNavigate();
    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";

    const date = user?.createdAt ? new Date(user.createdAt) : null;
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const formatted = date ? `${months[date.getMonth()]} ${date.getFullYear()}` : "-";

    const [username, setUsername] = useState(user?.username || "");
    const [unMsg, setUnMsg] = useState("");
    const [savingUn, setSavingUn] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [psMsg, setPsMsg] = useState("");
    const [savingPs, setSavingPs] = useState(false);

    // ─── DYNAMIC STATS CALCULATION ──────────────────────────────────────
    const [attempts, setAttempts] = useState([]);

    useEffect(() => {
        // Fetch the latest attempts quietly in the background
        usersApi.getProfile()
            .then(({ attempts: a }) => setAttempts(a || []))
            .catch(() => {});
    }, []);

    const totalAttempts = attempts.length;
    
    const bestScore = totalAttempts > 0 
        ? Math.max(...attempts.map(a => parseFloat(a.score) || 0)).toFixed(1) 
        : "0.0";
        
    const avgScore = totalAttempts > 0 
        ? (attempts.reduce((sum, a) => sum + (parseFloat(a.score) || 0), 0) / totalAttempts).toFixed(1) 
        : "0.0";
    // ────────────────────────────────────────────────────────────────────

    const handleUsernameUpdate = async () => {
        if (!username.trim() || username.trim().length < 3) {
            setUnMsg("Username must be at least 3 length");
            return;
        }

        setSavingUn(true);
        setUnMsg("");

        try {
            const { user: updated } = await usersApi.updateProfile(username.trim());
            updateUser(updated);
            setUnMsg("Username updated successfully");
        } catch (error) {
            setUnMsg(error.message);
        }
        setSavingUn(false);
    };

    const handlePasswordUpdate = async () => {
        if (!currentPassword || !newPassword) {
            setPsMsg("Please fill in all password fields");
            return;
        }

        if (newPassword.length < 6) {
            setPsMsg("Password length must be greater than 6 length");
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPsMsg("Passwords do not match.");
            return;
        }

        setSavingPs(true);
        setPsMsg("");

        try {
            await usersApi.updatePassword(currentPassword, newPassword);
            setPsMsg("Password Update Successfully");
            setCurrentPassword("");
            setConfirmNewPassword("");
            setNewPassword("");
        } catch (error) {
            setPsMsg(error.message);
        }
        setSavingPs(false);
    }

    function handleLogout() { logout(); navigate("./login"); }

    return (
        <div className="profile">
            <div className="profile_container">
                <h1 className='profile_setting'>Profile Settings</h1>
                <div className="profile_activity profile_border">
                    <div className="profile_left">
                        <h2 className='profile_avtar'>{initials}</h2>
                    </div>
                    <div className="profile_right">
                        <h4 className='profile-username'>{user.username}</h4>
                        <h6 className='profile-email' >{user.email}</h6>
                        <div className="profile_stats">
                            {/* Replaced with Dynamic Stats */}
                            <div className="stats">
                                <h2 className='profile_scores'>{totalAttempts}</h2>
                                <span className='profile_tags'>Design</span>
                            </div>
                            <div className="stats">
                                <h2 className='profile_scores'>{avgScore}</h2>
                                <span className='profile_tags'>Avg Score</span>
                            </div>
                            <div className="stats">
                                <h2 className='profile_scores'>{bestScore}</h2>
                                <span className='profile_tags'>Best</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="profile_username_change profile_border">
                    <h4 className='change_username'>👤 Change Username</h4>
                    <input
                        type="text"
                        placeholder={user.username}
                        onChange={(e) => setUsername(e.target.value)} minLength={3} required
                    />
                    <span className='message'>{unMsg}</span>
                    <button onClick={handleUsernameUpdate} className='updatebutton' disabled={savingUn}>
                        {savingUn ? "Saving..." : "Save Username"}
                    </button>
                </div>

                <div className="profile_password_change profile_border">
                    <h4 className='change_username'>🔐 Change Password</h4>
                    <div className="inputWrapper">
                        <input
                            type={showPw ? "text" : "password"}
                            placeholder="Current Password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="passwordInput"
                        />
                        <button type='button' onClick={() => setShowPw(s => !s)}
                            className='eyeBtn'>
                            {showPw ? "🙈" : "👁"}
                        </button>
                    </div>
                    <input
                        type={showPw ? "text" : "password"}
                        value={newPassword}
                        placeholder="New Password"
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type={showPw ? "text" : "password"}
                        value={confirmNewPassword}
                        placeholder="Confirm New Password"
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                    <span className='message'>{psMsg}</span>
                    <button onClick={handlePasswordUpdate} className='updatebutton' disabled={savingPs}>
                        {savingPs ? "Updating..." : "Update Password"}
                    </button>
                </div>

                <div className="account_info profile_border">
                    <h4 className='change_username'>ℹ️ Account Information</h4>
                    <div className="account_details">
                        <div className="account_d">
                            <h6 className='detail_tag'>EMAIL</h6>
                            <span className='details'>{user.email}</span>
                        </div>
                        <div className="account_d">
                            <h6 className='detail_tag'>MEMBER SINCE</h6>
                            <span className='details'>{formatted}</span>
                        </div>
                        {/* Replaced with Dynamic Stats */}
                        <div className="account_d">
                            <h6 className='detail_tag'>DESIGN SUBMITTED</h6>
                            <span className='details'>{totalAttempts}</span>
                        </div>
                        <div className="account_d">
                            <h6 className='detail_tag'>AVERAGE SCORE</h6>
                            <span className='details'>{avgScore} / 10</span>
                        </div>
                    </div>
                </div>
                <button className='logoutProfile' onClick={handleLogout}>Logout</button>
            </div>
        </div>
    )
};

// ── Fixed InputField Component ──────────────────────────────────────────────
// Added the return statement and destructured the props correctly
function InputField({ icon, type, placeholder, value, onChange, rightEl }) {
    return (
        <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 15, opacity: 0.4, pointerEvents: "none" }}>
                {icon}
            </span>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={{ width: "100%", background: "var(--bg-card)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontFamily: "var(--font-main)", fontSize: 14, padding: "12px 14px 12px 42px", outline: "none", transition: "all 0.2s" }}
                onFocus={e => { e.target.style.borderColor = "#2563EB"; e.target.style.background = "rgba(37,99,235,0.08)"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.background = "var(--bg-card)"; e.target.style.boxShadow = "none"; }}
            />
            {rightEl}
        </div>
    );
}