import { useAuth } from "../../context/AuthContext";

interface NavbarProps {
    onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const { user, logout } = useAuth();

    if (!user) return null;

    const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

    return (
        <header className="navbar">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
                <button className="mobile-menu-toggle" onClick={onMenuClick}>
                    ☰
                </button>
                <h1 className="navbar-title">Dashboard</h1>
            </div>

            <div className="navbar-actions">
                <div className="navbar-user">
                    <div className="navbar-avatar">{initials}</div>
                    <div className="navbar-user-info">
                        <span className="navbar-user-name">
                            {user.firstName} {user.lastName}
                        </span>
                        <span className="navbar-user-role">{user.role}</span>
                    </div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={logout}>
                    Logout
                </button>
            </div>
        </header>
    );
}