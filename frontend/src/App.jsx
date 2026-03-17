import { Routes, Route, Navigate } from "react-router-dom";
import Navbar          from "./components/Navbar";
import HomePage        from "./pages/HomePage";
import WorkspacePage   from "./pages/WorkspacePage";

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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
