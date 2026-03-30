import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../apiFetch.js";

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

    const checkForm = () => {
        if (!form.username.trim() || !form.password.trim()) {
            setErr(`Please complete your login credentials.`);
            return false;
        }
        return true;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr(null);

        if (!checkForm()) return;

        setLoading(true);
        try {
            const res = await apiFetch(`/api/accounts/login/`, {
                method: "POST",
                body: JSON.stringify(form)
            });

            let data = null;
            try {
                data = await res.json();
            } catch (parseErr) {
                setErr(`Unexpected response (HTTP ${res.status})`);
                return;
            }

            if (!res.ok) {
                const msg = (data && (data.detail || data.message || data.error)) || `HTTP ${res.status}`;
                setErr(msg);
                return;
            }

            // clear the password from RAM before leaving the page
            setForm({ username: "", password: "" });
            onLogin?.(data);

        } catch (err) {
            setErr(`Network error: ${err.message}`);
        } finally {
            setLoading(false);  
        }
        
    };

    const expired = new URLSearchParams(window.location.search).get("session_expired");

    // strip "session_expired=1" query param from the URL
    useEffect(() => {
        if (expired) {
            window.history.replaceState({}, "", "/");
        }
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-cover bg-center"
            style={{ backgroundImage: `url('/background.png')` }}
        >
            <div className="p-8 w-full max-w-sm relative overflow-hidden rounded-lg bg-white/30 backdrop-blur-md shadow-xl">
                <div className="flex flex-col items-center">
                    <img 
                        src="/satellite.png"
                        alt="Satellite Project Logo" 
                        className="w-18 h-18 rounded-full mt-4"
                    />
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-sm p-6 shadow-md space-y-4 rounded-lg"
                >
                    <h2 className="text-2xl font-bold text-center">Sign in</h2>
                    {expired && (
                        <p className="text-red-800 text-sm text-center mb-2">
                            Your session expired. Please sign in again.
                        </p>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
                        />
                    </div>
                    {err && (
                        <div className="text-red-600 text-xs mt-1">{err}</div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-700 py-2.5 text-white font-semibold tracking-wide hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                    <p className="text-center text-sm">
                        Not registered?{" "}
                        <Link to="/register" className="text-blue-600 hover:underline">
                            Create an account
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    ); 
}

export default LoginForm;