import React from 'react';
import { useState } from 'react';
import { useAuth } from "../context/AuthContext";
import "../index.css";
import "./Profile.css";
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../utils/Api';

export default function Profile() {
    const { user, logout, setUser } = useAuth();
    const navigate = useNavigate();
    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";

    const date = user?.createdAt ? new Date(user.createdAt) : null;
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const formatted = `${months[date.getMonth()]} ${date.getFullYear()}`;

    const [username, setUsername] = React.useState(user?.username || "");
    const [unMsg, setUnMsg] = useState(null);
    const [savingUn, setSavingUn] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [psMsg, setPsMsg] = useState(null);

    const handleUsernameUpdate = async () => {
        if(!username.trim() || username.trim().length < 3){
            setUnMsg("Username must be at least 3 length");
            return;
        }

        setSavingUn(true);
        setUnMsg("");

        try {
            const {user: updated} = await usersApi.updateProfile(username.trim());
            setUser(updated);
            setUnMsg("Username updated successfully");
        } catch (error) {
            setUnMsg(error.message);
        }
        setSavingUn(false);
    };

    const handlePasswordUpdate = async () => {
        if(!currentPassword || !newPassword){
            setPsMsg("Please fill in all password fields");
            return;
        }

        if(newPassword.length < 6){
            setPsMsg("Password length must be greater than 6 length");
            return;
        }

        if(newPassword != confirmNewPassword){
            setPsMsg("Passwords do not match.");
            return;
        }

        setSavingUn(true);
        setPsMsg("");

        try {
            await usersApi.updatePassword(currentPassword, newPassword);
            setUnMsg("Password Update Successfully");
            setCurrentPassword("");
            setConfirmNewPassword("");
            setNewPassword("");
        } catch (error) {
            setUnMsg(error.message);
        }
        setSavingUn(false);
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
                            <div className="stats">
                                <h2 className='profile_scores'>{user.stats.totalAttempts}</h2>
                                <span className='profile_tags'>Design</span>
                            </div>
                            <div className="stats">
                                <h2 className='profile_scores'>{user.stats.averageScore}</h2>
                                <span className='profile_tags'>Avg Score</span>
                            </div>
                            <div className="stats">
                                <h2 className='profile_scores'>{user.stats.bestScore}</h2>
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
                    <button onClick={handleUsernameUpdate} className='updatebutton'>Save Username</button>
                </div>
                <div className="profile_password_change profile_border">
                    <h4 className='change_username'>🔐 Change Password</h4>
                    <input
                        type="password"
                        placeholder="CurrentPassword"
                        onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="New Password"
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                    <span className='message'>{psMsg}</span>
                    <button onClick={handlePasswordUpdate} className='updatebutton'>Update Password</button>
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
                        <div className="account_d">
                            <h6 className='detail_tag'>DESIGN SUBMITTED</h6>
                            <span className='details'>{user.stats.totalAttempts}</span>
                        </div>
                        <div className="account_d">
                            <h6 className='detail_tag'>AVERAGE SCORE</h6>
                            <span className='details'>{user.stats.averageScore} / 10</span>
                        </div>
                    </div>
                </div>
                <button className='logoutProfile' onClick={handleLogout}>Logout</button>
            </div>
        </div>
    )
};
