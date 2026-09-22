import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { StudentDashboard } from "../pages/student/StudentDashboard";
import { TeacherDashboard } from "../pages/teacher/TeacherDashboard";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { PlaceholderPage } from "../pages/common/PlaceholderPage";
import { DashboardLayout } from "../layouts/DashboardLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoleRoute } from "./RoleRoute";
import { useAuth } from "../context/AuthContext";
import { Role } from "../types";

function HomeRedirect() {
    const { user } = useAuth();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    switch (user.role) {
        case "STUDENT":
            return <Navigate to="/student/dashboard" replace />;
        case "TEACHER":
            return <Navigate to="/teacher/dashboard" replace />;
        case "ADMIN":
            return <Navigate to="/admin/dashboard" replace />;
        default:
            return <Navigate to="/login" replace />;
    }
}

export function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Root redirect based on role */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Protected routes with dashboard layout */}
            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                {/* Student routes */}
                <Route
                    path="/student"
                    element={
                        <RoleRoute roles={[Role.STUDENT]}>
                            <Navigate to="/student/dashboard" replace />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/student/dashboard"
                    element={
                        <RoleRoute roles={[Role.STUDENT]}>
                            <StudentDashboard />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/student/labs"
                    element={
                        <RoleRoute roles={[Role.STUDENT]}>
                            <PlaceholderPage
                                title="Labs"
                                description="Your programming labs will appear here"
                                icon="🧪"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/student/assignments"
                    element={
                        <RoleRoute roles={[Role.STUDENT]}>
                            <PlaceholderPage
                                title="Assignments"
                                description="Your assignments will appear here"
                                icon="📝"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/student/quizzes"
                    element={
                        <RoleRoute roles={[Role.STUDENT]}>
                            <PlaceholderPage
                                title="Quizzes"
                                description="Your quizzes will appear here"
                                icon="🎯"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/student/progress"
                    element={
                        <RoleRoute roles={[Role.STUDENT]}>
                            <PlaceholderPage
                                title="My Progress"
                                description="Your learning progress will appear here"
                                icon="📊"
                            />
                        </RoleRoute>
                    }
                />

                {/* Teacher routes */}
                <Route
                    path="/teacher"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <Navigate to="/teacher/dashboard" replace />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/teacher/dashboard"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <TeacherDashboard />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/teacher/classes"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <PlaceholderPage
                                title="Classes"
                                description="Manage your classes here"
                                icon="🏫"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/teacher/labs"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <PlaceholderPage
                                title="Labs"
                                description="Create and manage programming labs"
                                icon="🧪"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/teacher/assignments"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <PlaceholderPage
                                title="Assignments"
                                description="Create and manage assignments"
                                icon="📝"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/teacher/students"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <PlaceholderPage
                                title="Students"
                                description="View and manage your students"
                                icon="👥"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/teacher/reports"
                    element={
                        <RoleRoute roles={[Role.TEACHER]}>
                            <PlaceholderPage
                                title="Reports"
                                description="AI-generated student reports will appear here"
                                icon="📈"
                            />
                        </RoleRoute>
                    }
                />

                {/* Admin routes */}
                <Route
                    path="/admin"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <Navigate to="/admin/dashboard" replace />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/dashboard"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <AdminDashboard />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/students"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <PlaceholderPage
                                title="Students"
                                description="Manage all students"
                                icon="👥"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/teachers"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <PlaceholderPage
                                title="Teachers"
                                description="Manage all teachers"
                                icon="👨‍🏫"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/classes"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <PlaceholderPage
                                title="Classes"
                                description="Manage all classes"
                                icon="🏫"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/courses"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <PlaceholderPage
                                title="Courses"
                                description="Manage all courses"
                                icon="📚"
                            />
                        </RoleRoute>
                    }
                />
                <Route
                    path="/admin/system"
                    element={
                        <RoleRoute roles={[Role.ADMIN]}>
                            <PlaceholderPage
                                title="System"
                                description="System configuration and health"
                                icon="🖥️"
                            />
                        </RoleRoute>
                    }
                />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}