// frontend/src/pages/RegisterForm.jsx
import { useState } from "react";
import { API_BASE } from "../config.js";

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
    // clear error for this field as user types
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/accounts/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        // If DRF returns a dict of errors, convert arrays to strings
        if (data && typeof data === "object") {
          const errors = {};
          for (const [key, val] of Object.entries(data)) {
            // val could be array of messages or nested object
            if (Array.isArray(val)) errors[key] = val.join(" ");
            else if (typeof val === "object") errors[key] = JSON.stringify(val);
            else errors[key] = String(val);
          }
          // move non_field_errors to a top-level display key (if present)
          setFieldErrors(errors);
        } else {
          setFieldErrors({ non_field_errors: `Unexpected error (HTTP ${res.status})` });
        }
        return;
      }
      // msg and timeout for better UX
      setSuccess(true);
      setTimeout(() => {
        onSuccess && onSuccess();      
      }, 3000)

    } catch (err) {
      setFieldErrors({ non_field_errors: `Network error: ${err.message || err}` });
    } finally {
      setLoading(false);
    }
  };

  // small helper to produce input style (red border if field has error)
  const inputStyle = (fieldName) => ({
    padding: 8,
    borderRadius: 4,
    border: fieldErrors[fieldName] ? "1px solid #e04b4b" : "1px solid #ccc",
    outline: "none",
  });

  const errorTextStyle = { color: "#b91c1c", fontSize: 13, marginTop: 6 };

  if (success) {
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <h2>✅ Account created successfully!</h2>
        <p>You’ll be redirected to the login page shortly...</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 420, margin: "0 auto", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <h2 style={{ textAlign: "center" }}>Register</h2>

      {fieldErrors.non_field_errors && (
        <div style={{ color: "#b91c1c", padding: 8, border: "1px solid #f5c6c6", borderRadius: 6 }}>
          {fieldErrors.non_field_errors}
        </div>
      )}

      <label>
        Username
        <input
          name="username"
          value={form.username}
          onChange={handleChange}
          placeholder="Username"
          style={inputStyle("username")}
        />
        {fieldErrors.username && <div style={errorTextStyle}>{fieldErrors.username}</div>}
      </label>

      <label>
        Email
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          style={inputStyle("email")}
        />
        {fieldErrors.email && <div style={errorTextStyle}>{fieldErrors.email}</div>}
      </label>

      <label>
        Password
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Password"
          style={inputStyle("password")}
        />
        {fieldErrors.password && <div style={errorTextStyle}>{fieldErrors.password}</div>}
      </label>

      <label>
        Confirm password
        <input
          name="password2"
          type="password"
          value={form.password2}
          onChange={handleChange}
          placeholder="Confirm password"
          style={inputStyle("password2")}
        />
        {fieldErrors.password2 && <div style={errorTextStyle}>{fieldErrors.password2}</div>}
      </label>

      <button type="submit" disabled={loading} style={{ padding: 10 }}>
        {loading ? "Creating..." : "Create account"}
      </button>
    </form>
  );
}
