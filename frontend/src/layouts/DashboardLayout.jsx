import { Outlet } from "react-router-dom";
import UserMenu from "../components/UserMenu";
import { useNavigate } from "react-router-dom";
import { IoHome } from "react-icons/io5";

/**
 * DashboardLayout
 * Main layout wrapper for dashboard pages with header, footer, and nested route support.
 */
function DashboardLayout({ username, onLogout }) {
    const navigate = useNavigate();
    const goHome = () => navigate("/dashboard", { replace: true });

    return (
        <div className="min-h-screen flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div
                    onClick={goHome}
                    className="flex items-center gap-4 p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                    title="Go Home"
                >
                    <IoHome size={26} className="text-gray-700" />
                </div>
                <UserMenu onLogout={onLogout} username={username} />
            </header>

            <main className="flex-1 flex items-center justify-center p-6">
                {/* render active component from parent */}
                <Outlet />
            </main>

            <footer className="py-3 text-center border-t border-gray-100 text-xs text-gray-400">
                © Satellite App
            </footer>
        </div>
    );
}

export default DashboardLayout;
