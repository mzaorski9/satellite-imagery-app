import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";


function UserMenu({ onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const navigate = useNavigate();


  // close on outside click
  useEffect(() => {
    function handle(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  const username = localStorage.getItem("username") || "User";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((s) => !s)} style={avatarStyle} aria-haspopup="true" aria-expanded={open}>
        {username.slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <div style={menuStyle} role="menu">
          <div style={menuItemStyle} >{username}</div>
          <button style={menuButtonStyle} onClick={() => alert("Settings (placeholder)")}>Settings</button>
          <button style={menuButtonStyle} onClick={() => navigate("glossary")}>Glossary</button>
          <button
            style={menuButtonStyle}
            onClick={() => {
              // clear stored auth and call onLogout if provided
              localStorage.removeItem("access");
              localStorage.removeItem("refresh");
              localStorage.removeItem("username");
              setOpen(false);
              if (onLogout) onLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}


const avatarStyle = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: "#1f6feb",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
};

const menuStyle = {
    position: "absolute",
    right: 0,
    marginTop: 8,
    background: "white",
    border: "1px solid #ddd",
    borderRadius: 6,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    minWidth: 160,
    padding: 8,
};

const menuItemStyle = { 
    padding: "8px 12px", 
    fontWeight: 600,
    borderBottom: "1px solid #ddd"
};

const menuButtonStyle = { 
    padding: "8px 12px", 
    textAlign: "left", 
    border: "none", 
    background: "none", 
    cursor: "pointer" 
};

export default UserMenu;