import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import styles from './Navbar.module.css';
import '../index.css'

const NAV_LINKS = [
  { path: "/",          label: "Home"      },
  { path: "/workspace", label: "Workspace" },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef  = useRef(null);
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
            className={`${styles.navBtn} ${location.pathname === path ? styles.active : ""}`}
            onClick={() => navigate(path)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right Side */}
      <div className={styles.right}>
        {/* Theme Toggle */}
        <button
          className={`btn btn-ghost ${styles.themeBtn}`}
          onClick={toggleTheme}
          title="Toggle Theme"
          aria-label="Toggle Theme"
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        {/* Simple Login Button */}
        <button
          className="btn btn-primary"
          onClick={() => navigate("/login")}
        >
          Sign In
        </button>
      </div>
    </nav>
  );
}