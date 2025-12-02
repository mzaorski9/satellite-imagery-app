import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../config.js"


function LoginForm({ onLogin }){
    const [form, setForm] = useState({ username: "", password: "" });
    const [err, setErr] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev, 
            [e.target.name]: e.target.value 
        }));
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr(null);
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/accounts/login/`, {
            method: "POST",
            headers: {"Content-type": "application/json"},
            body: JSON.stringify(form)
            }
        );
        let data = null;
        try {
            data = await res.json()
        } catch (parseErr) {
            setErr(`Unexpected response (HTTP ${res.status})`)
            setLoading(false);
            return;
        }

        if (!res.ok) {
            // for debugging
            const msg = (data && (data.detail || data.message || data.error)) ||
                `HTTP ${res.status}`
            
            setErr(msg || `HTTP ${res.status}`);
            setLoading(false);
            return;
        } 
    
        localStorage.setItem("access", data.access)
        localStorage.setItem("refresh", data.refresh)


        onLogin && onLogin(data);
    };
  
    
    return (
       <form onSubmit={handleSubmit} style={{ maxWidth: 350, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ textAlign: "center" }}>Login</h2>
            <label htmlFor="usrn">Username</label>
            <input
                id="usrn"
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
                style={{ marginBottom: 12, padding: 8 }}
            />
            <label htmlFor="pwd">Password</label>
            <input
                id="pwd"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ marginBottom: 20, padding: 8 }}
            />
            <button type="submit" disabled={loading} style={{ padding: 10, marginBottom: 10 }}>
                {loading ? "Logging in..." : "Login"}
            </button>
            {err && (
                <div style={{ color: "red", marginBottom: 10 }}>
                    Login failed. Check your credentials. 
                    <pre style={{ color: "red", fontSize: 12 }}>{typeof err === "string" ? err : JSON.stringify(err, null, 2)}</pre>
                </div>
            )}
            <div style={{ textAlign: "center", marginTop: 10 }}>
                <span>Not registered? </span>
                <Link to="/register">Create an account</Link>
            </div>
        </form>
    );
    
}

export default LoginForm;