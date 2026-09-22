import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { AdminDashboardData } from "../../types";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingScreen } from "../../components/common/LoadingScreen";

export function AdminDashboard() {
    const [data, setData] = useState<AdminDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.get<AdminDashboardData>(
                    "/admin/dashboard"
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
                <h2>System Overview 🛡️</h2>
                <p>Monitor the entire platform, users, and system health.</p>
            </div>

            <div className="stats-grid">
                <StatCard label="Total Students" value={data?.stats.totalStudents ?? 0} icon="👥" color="primary" />
                <StatCard label="Total Teachers" value={data?.stats.totalTeachers ?? 0} icon="👨‍🏫" color="secondary" />
                <StatCard label="Total Classes" value={data?.stats.totalClasses ?? 0} icon="🏫" color="warning" />
                <StatCard label="Total Courses" value={data?.stats.totalCourses ?? 0} icon="📚" color="success" />
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">System Activity</h3>
                    </div>
                    <div className="card-body">
                        <EmptyState
                            icon="🖥️"
                            title="No system activity yet"
                            description="System-wide activity and logs will appear here."
                        />
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Platform Stats</h3>
                    </div>
                    <div className="card-body">
                        <div className="stats-grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 0 }}>
                            <StatCard label="Admins" value={data?.stats.totalAdmins ?? 0} icon="🛡️" color="danger" />
                            <StatCard label="Topics" value={data?.stats.totalTopics ?? 0} icon="📖" color="primary" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}