import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

interface RoleRouteProps {
    roles: Role[];
    children: ReactNode;
}

export function RoleRoute({ roles, children }: RoleRouteProps) {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}