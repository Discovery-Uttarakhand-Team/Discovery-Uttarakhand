import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { TeacherDashboardData } from "../../types";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingScreen } from "../../components/common/LoadingScreen";

export function TeacherDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<TeacherDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.get<TeacherDashboardData>(
                    "/teacher/dashboard"
                );
                setData(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <>
            <div className="welcome-banner">
                <h2>Welcome, {user?.firstName}! 👨‍🏫</h2>
                <p>Manage your classes, labs, and track student performance.</p>
            </div>

            <div className="stats-grid">
                <StatCard label="Total Students" value={data?.stats.totalStudents ?? 0} icon="👥" color="primary" />
                <StatCard label="Total Labs" value={data?.stats.totalLabs ?? 0} icon="🧪" color="secondary" />
                <StatCard label="Assignments" value={data?.stats.totalAssignments ?? 0} icon="📝" color="warning" />
                <StatCard label="Avg Performance" value={`${data?.stats.averagePerformance ?? 0}%`} icon="📈" color="success" />
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">My Classes</h3>
                    </div>
                    <div className="card-body">
                        {data?.teacher.classes.length ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Class</th>
                                            <th>Code</th>
                                            <th>Students</th>
                                            <th>Courses</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.teacher.classes.map((cls) => (
                                            <tr key={cls.id}>
                                                <td>{cls.name}</td>
                                                <td>{cls.code}</td>
                                                <td>{cls.studentCount}</td>
                                                <td>{cls.courseCount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon="🏫"
                                title="No classes yet"
                                description="Your classes will appear here once they are assigned."
                            />
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Activity</h3>
                    </div>
                    <div className="card-body">
                        <EmptyState
                            icon="📭"
                            title="No activity yet"
                            description="Student submissions and activity will show up here."
                        />
                    </div>
                </div>
            </div>
        </>
    );
}