import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-border rounded-xl bg-card/40 my-4",
                className
            )}
        >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground mb-3.5 ring-1 ring-border/50">
                <Icon className="h-6 w-6 text-primary/80" />
            </div>
            <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
                {description}
            </p>
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    );
}
