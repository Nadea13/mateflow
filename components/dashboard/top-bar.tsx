"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { StoreBranchDropdown } from "@/components/dashboard/store-branch-dropdown";
import { Location } from "@/types";

interface TopBarProps {
    storeName?: string;
    locations?: Location[];
}

export function TopBar({ storeName, locations = [] }: TopBarProps) {
    return (
        <header className="sticky top-0 z-30 flex h-13 items-center justify-between border-b border-border bg-background/90 px-4 sm:px-6 backdrop-blur-md">
            {/* Store & Branch Selector Dropdown */}
            <div className="flex items-center gap-3">
                <StoreBranchDropdown
                    storeName={storeName}
                    locations={locations}
                />
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
