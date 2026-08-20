import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    iconColor?: string;
    badgeText?: string;
}

export function KpiCard({ title, value, description, icon: Icon, iconColor }: KpiCardProps) {
    return (
        <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{title}</span>
                <Icon className={`h-4 w-4 ${iconColor || "text-muted-foreground"}`} />
            </div>
            <div className="mt-2">
                <div className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-mono">{value}</div>
                {description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {description}
                    </p>
                )}
            </div>
        </Card>
    );
}
