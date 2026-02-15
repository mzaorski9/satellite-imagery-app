import { API_BASE } from "./config.js";

export async function apiFetch(path, opts = {}) {
    
  const publicPaths = ["/api/accounts/login/", "/api/accounts/register/"];
  const token = localStorage.getItem("access");

  const headers = { 
    "Content-Type": "application/json",
    ...(opts.headers || {}), 
  };
  // add Bearer token only if it is required
  if (token && !path.includes(publicPaths)) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh");
    if (refresh) {
      const r = await fetch(`${API_BASE}/api/accounts/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (r.ok) {
        const newData = await r.json();
        localStorage.setItem("access", newData.access);
        // recursively retry the request with new token
        return apiFetch(path, opts);
      } else {
        localStorage.clear();
        // "Hard redirection": total wipeout of stale and old user data 
        window.location.href = "/login";
        throw new Error("Session expired");
      }
    }
  }
  return res;
}