// frontend/src/pages/RegisterForm.jsx
import { useState } from "react";
import { apiFetch } from "../apiFetch.js";
import { Link } from "react-router-dom";

export default function RegisterForm({ onSuccess }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    password2: "",
  });

  // fieldErrors is an object like { username: "msg", email: "msg", non_field_errors: "msg" }
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field as user types
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const checkPassword = () => {
    const errors = {};

    if (form.password.length < 8) {
      errors.pass = "Password must have at least 8 characters.";
    } else if (form.password !== form.password2) {
      errors.pass = "Passwords do not match.";
    }
    setFieldErrors(prev => ({ ...prev, ...errors })); 
    
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!checkPassword()) return;

    setLoading(true);

    try {
      const res = await apiFetch(`/api/accounts/register/`, {
        method: "POST",
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // If DRF returns a dict of errors, convert arrays to strings
        if (data && typeof data === "object") {
          const errors = {};
          for (const [key, val] of Object.entries(data)) {
            // val could be array of messages or nested object
            if (Array.isArray(val)) {
              errors[key] = val.join(" ");
            } else if (typeof val === "object") {
              errors[key] = JSON.stringify(val);
            } else {
              errors[key] = String(val);
            }
          }
          // Move non_field_errors to a top-level display key (if present)
          setFieldErrors(errors);
        } else {
          setFieldErrors({
            non_field_errors: `Unexpected error (HTTP ${res.status})`,
          });
        }
        return;
      }

      // Success: show confirmation message with timeout for better UX
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.()
      }, 3000);
    } catch (err) {
      setFieldErrors({
        non_field_errors: `Network error: ${err.message || err}`,
      });
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-2xl">✅</p>
          <h2 className="text-xl font-semibold">Account created!</h2>
          <p className="text-gray-500 text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url('/background.png')` }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm p-6 shadow-md space-y-4 bg-white/30 backdrop-blur-md rounded-lg"
      >
        <h2 className="text-2xl font-bold text-center">Register</h2>

        {fieldErrors.non_field_errors && (
          <div
            style={{
              color: "#ff0000",
              padding: 8,
              border: "1px solid #f5c6c6",
              borderRadius: 6,
            }}
          >
            {fieldErrors.non_field_errors}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            name="username"
            value={form.username}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          {fieldErrors.username && (
            <div className="text-red-600 text-xs mt-1">{fieldErrors.username}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          {fieldErrors.email && (
            <div className="text-red-600 text-xs mt-1">{fieldErrors.email}</div>
          )}
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

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            name="password2"
            type="password"
            value={form.password2}
            onChange={handleChange}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-300"
          />
          {fieldErrors.pass && (
            <div className="text-red-600 text-xs mt-1">{fieldErrors.pass}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-700 py-2.5 text-white font-semibold tracking-wide hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Create account"}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
