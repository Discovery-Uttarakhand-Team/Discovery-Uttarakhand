import { EmptyState } from "../../components/ui/EmptyState";

interface PlaceholderPageProps {
    title: string;
    description: string;
    icon?: string;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
    return (
        <div className="page-header">
            <div>
                <h1 className="page-title">{title}</h1>
                <p className="page-subtitle">{description}</p>
            </div>
            <div className="card" style={{ width: "100%", marginTop: "var(--spacing-lg)" }}>
                <div className="card-body">
                    <EmptyState
                        icon={icon}
                        title="Coming Soon"
                        description="This feature will be available in a future phase."
                    />
                </div>
            </div>
        </div>
    );
}