import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { StudentDashboardData } from "../../types";
import { StatCard } from "../../components/ui/StatCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { LoadingScreen } from "../../components/common/LoadingScreen";

export function StudentDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<StudentDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await api.get<StudentDashboardData>(
                    "/student/dashboard"
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
                <h2>Welcome back, {user?.firstName}! 👋</h2>
                <p>Here's your learning overview. Start coding to see your progress.</p>
            </div>

            <div className="stats-grid">
                <StatCard label="Overall Progress" value={`${data?.stats.overallProgress ?? 0}%`} icon="📊" color="primary" />
                <StatCard label="Problems Solved" value={data?.stats.problemsSolved ?? 0} icon="✅" color="success" />
                <StatCard label="Assignments" value={data?.stats.assignmentsCompleted ?? 0} icon="📝" color="warning" />
                <StatCard label="Quiz Score" value={data?.stats.quizScore ?? 0} icon="🎯" color="secondary" />
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Today's Focus</h3>
                    </div>
                    <div className="card-body">
                        <EmptyState
                            icon="🎯"
                            title="No focus set yet"
                            description="Your AI-powered daily focus will appear here once you start learning."
                        />
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
                            description="Your recent coding activity will show up here."
                        />
                    </div>
                </div>
            </div>
        </>
    );
}