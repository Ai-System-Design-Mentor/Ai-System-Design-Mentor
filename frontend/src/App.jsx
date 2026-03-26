import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import Auth from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import useAutoLogout from "./context/AutoLogOut";
import Profile from "./pages/ProfilePage";
import Dashboard from "./pages/DashboardPage";

export default function App() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    }
    useAutoLogout(handleLogout, 86400000);
    return (
        <>
            <Navbar />
            <Routes>
                {/* Protected */}
                <Route path="/login" element={<Auth />} />
                <Route path="/" element={
                    <ProtectedRoute> <HomePage /></ProtectedRoute>
                } />
                <Route path="/workspace" element={
                    <ProtectedRoute> <WorkspacePage /></ProtectedRoute>
                } />
                <Route path="/profile" element={
                    <ProtectedRoute> <Profile /></ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute> <Dashboard /></ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
