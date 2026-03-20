import { Routes, Route, Navigate } from "react-router-dom";
import Navbar          from "./components/Navbar";
import HomePage        from "./pages/HomePage";
import WorkspacePage   from "./pages/WorkspacePage";
import Auth           from "./pages/AuthPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Protected */}
        <Route path="/login" element={<Auth/>}/>
        <Route path="/" element={
            <ProtectedRoute> <HomePage/></ProtectedRoute>
        } />
        <Route path="/workspace" element={
            <ProtectedRoute> <WorkspacePage/></ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
