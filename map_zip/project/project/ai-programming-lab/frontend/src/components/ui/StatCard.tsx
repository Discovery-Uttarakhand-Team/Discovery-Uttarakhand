interface StatCardProps {
    label: string;
    value: number | string;
    icon?: string;
    color?: "primary" | "success" | "warning" | "danger" | "secondary";
}

export function StatCard({ label, value, icon, color = "primary" }: StatCardProps) {
    return (
        <div className="stat-card">
            {icon && (
                <div className={`stat-card-icon badge-${color}`}>{icon}</div>
            )}
            <div className="stat-card-label">{label}</div>
            <div className="stat-card-value">{value}</div>
        </div>
    );
}