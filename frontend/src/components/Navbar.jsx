import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";
import "../index.css";

const NAV_LINKS = [
    { path: "/", label: "Home" },
    { path: "/workspace", label: "Workspace" },
];

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();
    const [dropOpen, setDropOpen] = useState(false);
    const { user, logout } = useAuth();
    const dropRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Close dropdown on outside click
    useEffect(() => {
        function handle(e) {
            if (dropRef.current && !dropRef.current.contains(e.target)) {
                setDropOpen(false);
            }
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    useEffect(() => {
        setDropOpen(false);
    }, [location.pathname]);

    function handleLogout() {
        logout();
        navigate("/login");
    }

    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : "?";

    return (
        <nav className={styles.nav}>
            {/* Brand */}
            <div className={styles.brand} onClick={() => navigate("/")}>
                <div className={styles.logo}>A</div>
                <span className={styles.brandName}>AI System Design</span>
            </div>

            {/* Nav Links */}
            <div className={styles.links}>
                {NAV_LINKS.map(({ path, label }) => (
                    <button
                        key={path}
                        className={`${styles.navBtn} ${location.pathname === path ? styles.active : ""
                            }`}
                        onClick={() => navigate(path)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Right Side */}
            <div className={styles.right}>
                <button
                    className={`btn btn-ghost ${styles.themeBtn}`}
                    onClick={toggleTheme}
                    title="Toggle Theme"
                    aria-label="Toggle Theme"
                >
                    {theme === "light" ? "🌙 Dark" : "☀️ Light"}
                </button>

                {user ? (
                    <div className={styles.profileWrap} ref={dropRef}>
                        <button
                            className={styles.profileBtn}
                            onClick={() => setDropOpen((o) => !o)}
                            aria-haspopup="true"
                            aria-expanded={dropOpen}
                        >
                            <div className={styles.avatar}>{initials}</div>
                            {/* <span className={styles.userName}>{user.username}</span> */}
                            {/* <span className={styles.caret}>{dropOpen ? "▲" : "▼"}</span> */}
                        </button>

                        {dropOpen && (
                            <div className={`${styles.dropdown} slide-down`} role="menu">
                                {/* User info header */}
                                <div className={styles.dropHeader}>
                                    <div className={styles.dropAvatar}>{initials}</div>
                                    <div className={styles.dropInfo}>
                                        <div className={styles.dropName}>{user.username}</div>
                                        <div className={styles.dropEmail}>{user.email}</div>
                                    </div>
                                </div>

                                <div className={styles.dropDivider} />

                                {user.stats && (
                                    <>
                                        <div className={styles.dropStats}>
                                            <div className={styles.dropStat}>
                                                <span className={styles.dropStatVal}>{user.stats.totalAttempts || 0}</span>
                                                <span className={styles.dropStatLabel}>Designs</span>
                                            </div>
                                            <div className={styles.dropStat}>
                                                <span className={styles.dropStatVal}>{(user.stats.averageScore || 0).toFixed(1)}</span>
                                                <span className={styles.dropStatLabel}>Avg Score</span>
                                            </div>
                                            <div className={styles.dropStat}>
                                                <span className={styles.dropStatVal}>{(user.stats.bestScore || 0).toFixed(1)}</span>
                                                <span className={styles.dropStatLabel}>Best</span>
                                            </div>
                                        </div>
                                        <div className={styles.dropDivider} />
                                    </>
                                )}

                                <button className={styles.dropItem} role="menuitem"
                                    onClick={() => navigate("/profile")}>
                                    <span>👤</span> Profile
                                </button>
                                <button className={styles.dropItem} role="menuitem"
                                    onClick={() => navigate("/dashboard")}>
                                    <span>📊</span> Dashboard
                                </button>

                                <div className={styles.dropDivider} />

                                <button className={`${styles.dropItem} ${styles.dropDanger}`} role="menuitem"
                                    onClick={handleLogout}>
                                    <span>🚪</span> Logout
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <button className="btn btn-primary" onClick={() => navigate("/login")}>
                        Sign In
                    </button>
                )}
            </div>
        </nav>
    );
}
