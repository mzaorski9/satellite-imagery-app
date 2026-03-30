import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { apiFetch } from "./apiFetch.js";
import LoginForm from "./pages/LoginForm";
import RegisterForm from "./pages/RegisterForm";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TaskForm from "./pages/TaskForm";
import HistoryPage from "./pages/HistoryPage";
import TaskStatus from "./pages/TaskStatus";
import Glossary from "./pages/GlossaryPage"
import SettingsPage from "./pages/SettingsPage.jsx";

function App() {

  const navigate = useNavigate();
  const [err, setErr] = useState(null);
  const [auth, setAuth] = useState(() => ({
    access: localStorage.getItem("access"),
    refresh: localStorage.getItem("refresh"),
    username: localStorage.getItem("username"),
  }));
  // get already set timezone or default
  const [timeZone, setTimeZone] = useState(
    localStorage.getItem("userTimezone") || "UTC"
  );
  
  const handleLogin = async (data) => {
    if (!data?.access) return;

    localStorage.setItem("access", data.access);

    if (data.refresh) {
      localStorage.setItem("refresh", data.refresh);
    }
    // getting username for dashboard welcome msg
    try {
        const meRes = await apiFetch(`/api/accounts/me/`);
        if (!meRes.ok) {
          setErr(`Failed to fetch user info: HTTP ${meRes.status}`);
          return;
        }
        const me = await meRes.json();
        const tz = me.settings?.timezone ?? "UTC";

        localStorage.setItem("username", me.username);
        localStorage.setItem("userTimezone", tz);

        setTimeZone(tz);
        setAuth({ access: data.access, refresh: data.refresh, username: me.username });

    } catch (err){
        setErr(String(err));  
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    localStorage.removeItem("userTimezone");  // saved in user settings

    setAuth({ access: null, refresh: null, username: null });
  };

  const isLogged = !!auth.access;

  return (
    <div className="relative min-h-screen bg-satellite-grid">
      <Routes>
        <Route
          path="/"
          element={isLogged ? <Navigate to="/dashboard" replace /> : <LoginForm onLogin={handleLogin} />} 
        />
        <Route 
          path="/register"
          element={isLogged ? <Navigate to="/dashboard" replace /> : <RegisterForm onSuccess={() => navigate("/", { replace: true })} />}  
        />
        <Route
          path="/dashboard"
          element={isLogged ? <DashboardLayout username={auth.username} onLogout={handleLogout} /> : <Navigate to="/" replace />}
        >
          <Route index element={<Dashboard />} />
          <Route path="new_task" element={
            <TaskForm onSubmit={(data) => navigate(`/dashboard/task_status/${data.id}`)}/>
          } />
          <Route path="history" element={<HistoryPage tz={timeZone} />} />
          <Route path="task_status/:tid" element={<TaskStatus />} />
          <Route path="glossary" element={<Glossary />} />
          <Route path="settings" element={
            <SettingsPage setTz={(tz) => { 
              localStorage.setItem("userTimezone", tz);
              setTimeZone(tz);
            }} />
          } />
        </Route>
        {/* optional: catch-all redirect */}
        <Route path="*" element={<Navigate to={isLogged ? "/dashboard" : "/"} replace />} />
      </Routes>
    </div>
  );
}
export default App;



















