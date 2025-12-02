import React from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const goNewTask = () => navigate("new_task");
  const goHistory = () => navigate("history");

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
        <button onClick={goNewTask} style={primaryButtonStyle}>Generate New Task</button>
        <button onClick={goHistory} style={secondaryButtonStyle}>Get Task History</button>
      </div>
    </div>
  );
}

const primaryButtonStyle = {
  padding: "12px 20px",
  borderRadius: 6,
  border: "none",
  background: "#1f6feb",
  color: "white",
  cursor: "pointer",
  fontSize: 16,
};
const secondaryButtonStyle = {
  padding: "12px 20px",
  borderRadius: 6,
  border: "1px solid #ccc",
  background: "white",
  color: "#333",
  cursor: "pointer",
  fontSize: 16,
};

export default Dashboard;



async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("access");
  const headers = { ...(opts.headers || {}), "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`http://localhost:8000${path}`, { ...opts, headers });
  if (res.status === 401) {
    // try refresh
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      const r = await fetch("http://localhost:8000/api/accounts/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (r.ok) {
        const newData = await r.json();
        localStorage.setItem("access", newData.access);
        // retry original request
        return apiFetch(path, opts);
      } else {
        // refresh failed -> force logout
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        throw new Error("Session expired");
      }
    }
  }
  return res;
}


// File: src/components/UserMenu.jsx


// File: src/components/WelcomeCard.jsx



/*
Usage notes:
- Place these files in your project under the paths above.
- In your router (App.jsx) use nested routes so DashboardLayout stays persistent:

  <Route path="/dashboard" element={<DashboardLayout username={auth.username} onLogout={handleLogout} />}>
    <Route index element={<Dashboard />} />
    <Route path="new-task" element={<NewTaskPage />} />
    <Route path="history" element={<HistoryPage />} />
  </Route>

- These components are intentionally minimal (no external CSS). Replace inline styles as you like.
*/
