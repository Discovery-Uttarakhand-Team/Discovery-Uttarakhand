import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/layout/Sidebar";
import { Navbar } from "../components/layout/Navbar";

export function DashboardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="main-content">
                <div className="page-container">
                    <Outlet />
                </div>
            </main>
        </>
    );
}