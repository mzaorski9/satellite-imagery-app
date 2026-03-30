import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function UserMenu({ onLogout, username }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  // close menu on outside click
  useEffect(() => {
    function handle(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", handle);
    return () => document.removeEventListener("click", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-9 h-9 rounded-full bg-blue-700 text-white font-semibold hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {(username || "U").slice(0, 1).toUpperCase()}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col p-1">
          <div className="px-3 py-2 text-sm font-semibold border-b border-gray-100 mb-1">
            {username}
          </div>
          <button
            className="px-3 py-2 text-left text-sm rounded hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => navigate("settings")}
          >
            Settings
          </button>
          <button
            className="px-3 py-2 text-left text-sm rounded hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => navigate("glossary")}
          >
            Glossary
          </button>
          <button
            className="px-3 py-2 text-left text-sm rounded hover:bg-red-50 text-red-600 transition-colors mt-1 border-t border-gray-100 cursor-pointer"
            onClick={() => { setOpen(false); onLogout?.(); }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  )};

export default UserMenu;