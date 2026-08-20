"use client";

import { useTranslation } from "@/lib/i18n/provider";

interface PageHeaderProps {
    titleKey: string;
    subtitleKey: string;
    children?: React.ReactNode;
}

export function PageHeader({ titleKey, subtitleKey, children }: PageHeaderProps) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
                <h1 className="text-xl font-semibold tracking-tight text-foreground">{t(titleKey)}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">{t(subtitleKey)}</p>
            </div>
            {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
        </div>
    );
}
