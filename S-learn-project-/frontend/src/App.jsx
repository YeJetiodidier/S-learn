import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import RegisterPage from "./pages/registerpage.jsx";
import Dashboard from "./pages/dashboard";
import Login from "./pages/index";
import Schedule from "./components/schedule";
import SmartSubjects from "./pages/SmartSubjects";
import ScienceLab from "./pages/ScienceLab";
import Settings from "./pages/Settings";
import LoadingScreen, { LoadingIndicator } from "./pages/LoadingScreen";
import ForgotPassword from "./pages/ForgotPassword";
import ExamSetup from "./pages/ExamSetup";
import ExamRun from "./pages/ExamRun";
import Result from "./pages/Result";
import ResetPassword from "./pages/ResetPassword";
import { onAuthChange } from "./firebase/authService";

// Guards authenticated routes: waits for Firebase Auth to resolve, then
// either renders the page or redirects to /login.
function RequireAuth({ children }) {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => {
    const unsub = onAuthChange((user) => setState({ loading: false, user }));
    return () => unsub();
  }, []);
  if (state.loading) return <LoadingIndicator message="Checking your account…" />;
  if (!state.user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/loading" element={<LoadingScreen />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/schedule" element={<RequireAuth><Schedule /></RequireAuth>} />
        <Route path="/smartsubjects" element={<RequireAuth><SmartSubjects /></RequireAuth>} />
        <Route path="/sciencelab" element={<RequireAuth><ScienceLab /></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
        <Route path="/exam" element={<RequireAuth><ExamSetup /></RequireAuth>} />
        <Route path="/exam/run" element={<RequireAuth><ExamRun /></RequireAuth>} />
        <Route path="/exam/result" element={<RequireAuth><Result /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
