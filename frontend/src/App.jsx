import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import WorkspacePage from "./pages/WorkspacePage";
import Auth from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";
import useAutoLogout from "./context/AutoLogOut";

export default function App() {
    const naviagte = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("token");
        Navigate("/login");
    }
    useAutoLogout(handleLogout, 300000);
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

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}
