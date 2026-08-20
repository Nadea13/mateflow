"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopBar() {
    return (
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur-md">
            {/* Status / Workspace indicator */}
            <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-muted-foreground">Production Workspace</span>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
                <CurrencySwitcher variant="compact" />
                <div className="h-3.5 w-[1px] bg-border" />
                <LanguageSwitcher variant="compact" />
                <div className="h-3.5 w-[1px] bg-border" />
                <ThemeToggle variant="compact" />
            </div>
        </header>
    );
}
