import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { API_BASE } from "./config.js";
import LoginForm from "./pages/LoginForm";
import RegisterForm from "./pages/RegisterForm";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TaskForm from "./pages/TaskForm";
import HistoryPage from "./pages/HistoryPage";
import TaskStatus from "./pages/TaskStatus";
import Glossary from "./pages/GlossaryPage"

function App() {

  const navigate = useNavigate();
  const [err, setErr] = useState(null);
  const [auth, setAuth] = useState(() => ({
    access: localStorage.getItem("access"),
    refresh: localStorage.getItem("refresh"),
    username: localStorage.getItem("username"),
  }));
  

  const handleLogin = async (data) => {
    if (!data?.access) return;
    localStorage.setItem("access", data.access);
    if (data.refresh) localStorage.setItem("refresh", data.refresh);
    // getting username for dashboard welcome msg
    try {
        const meRes = await fetch(`${API_BASE}/api/accounts/me/`, {
            headers: {"Authorization": `Bearer ${data.access}`},
        });
        if (!meRes.ok) {
          setErr(`Failed to fetch user info: HTTP ${meRes.status}`);
          return;
        }
        const me = await meRes.json();
        localStorage.setItem("username", me.username);
        setAuth({ access: data.access, refresh: data.refresh, username: me.username });
    } catch (err){
        console.error("Failed to catch user info: ", err);
        setErr(String(err));  
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("username");
    setAuth({ access: null, refresh: null, username: null });
  };

  const isLogged = !!auth.access;

  return (
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
          <Route 
            path="new_task" 
            element={<TaskForm onSubmit={(data) => navigate(`/dashboard/task_status/${data.id}`)}/>} 
          />
          <Route path="history" element={<HistoryPage />} />
          <Route path="task_status/:tid" element={<TaskStatus />} />
          <Route path="glossary" element={<Glossary />} />
        </Route>
        {/* optional: catch-all redirect */}
        <Route path="*" element={<Navigate to={isLogged ? "/dashboard" : "/"} replace />} />
      </Routes>

  );
}

export default App;




















