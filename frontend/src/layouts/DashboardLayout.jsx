import React from "react";
import { Outlet } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import WelcomeCard from "../components/WelcomeCard";
import { useNavigate } from "react-router-dom";
import { IoHome } from "react-icons/io5";

// Minimal, unstyled dashboard layout. Place <Outlet /> where nested routes render.
function DashboardLayout({ username, onLogout, children }) {
    const navigate = useNavigate();
    const goHome = () =>  navigate("/dashboard", { replace: true });

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <header
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    padding: "16px 24px 0 24px",
                    borderBottom: "1px solid #ddd",
                }}
            >
                <div style={{ display: "flex", padding: 20, alignItems: "center", gap: "16px" }}>
                    <IoHome onClick={goHome} size={30} />
                </div>
                <div>
                    <UserMenu onLogout={onLogout} />
                </div>
            </header>

            <main
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 24,
                }}
            >
                {children ? children : <Outlet />}
            </main>

            <footer
                style={{
                    padding: 12,
                    textAlign: "center",
                    borderTop: "1px solid #eee",
                    fontSize: 13,
                    color: "#666",
                }}
            >
                © Satellite App
            </footer>
        </div>
    );
}
export default DashboardLayout;


