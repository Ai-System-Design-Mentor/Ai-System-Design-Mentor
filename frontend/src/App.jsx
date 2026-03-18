import { Routes, Route, Navigate } from "react-router-dom";
import Navbar          from "./components/Navbar";
import HomePage        from "./pages/HomePage";
import WorkspacePage   from "./pages/WorkspacePage";
import Auth           from "./pages/AuthPage";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Protected */}
        <Route path="/" element={
        <HomePage/>
        } />
        <Route path="/workspace" element={
            <WorkspacePage/>
        } />
        <Route path="/login" element={<Auth/>}/>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
