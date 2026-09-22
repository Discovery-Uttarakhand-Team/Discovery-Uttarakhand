import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Role } from "../../types";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems: Record<Role, Array<{ to: string; label: string }>> = {
    STUDENT: [
        { to: "/student/dashboard", label: "Dashboard" },
        { to: "/student/labs", label: "Labs" },
        { to: "/student/assignments", label: "Assignments" },
        { to: "/student/quizzes", label: "Quizzes" },
        { to: "/student/progress", label: "My Progress" },
    ],
    TEACHER: [
        { to: "/teacher/dashboard", label: "Dashboard" },
        { to: "/teacher/classes", label: "Classes" },
        { to: "/teacher/labs", label: "Labs" },
        { to: "/teacher/assignments", label: "Assignments" },
        { to: "/teacher/students", label: "Students" },
        { to: "/teacher/reports", label: "Reports" },
    ],
    ADMIN: [
        { to: "/admin/dashboard", label: "Dashboard" },
        { to: "/admin/students", label: "Students" },
        { to: "/admin/teachers", label: "Teachers" },
        { to: "/admin/classes", label: "Classes" },
        { to: "/admin/courses", label: "Courses" },
        { to: "/admin/system", label: "System" },
    ],
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user } = useAuth();

    if (!user) return null;

    const items = navItems[user.role];

    return (
        <aside className={`sidebar ${isOpen ? "open" : ""}`}>
            <div className="sidebar-header">
                <div className="sidebar-brand">
                    <span>💻</span>
                    <span>AI Lab</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `sidebar-nav-item ${isActive ? "active" : ""}`
                        }
                        onClick={onClose}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="badge badge-primary">{user.role}</div>
            </div>
        </aside>
    );
}