"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/provider";

export function ThemeToggle({ variant = "default" }: { variant?: "default" | "compact" }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { t } = useTranslation();

    useEffect(() => setMounted(true), []);

    if (!mounted) {
        return (
            <div className={variant === "compact" ? "h-8 w-16" : "h-9 w-full"} />
        );
    }

    const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

    if (variant === "compact") {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className="gap-2 text-muted-foreground hover:text-foreground"
                title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
                {theme === "dark" ? (
                    <>
                        <Sun className="h-4 w-4" />
                        <span className="text-xs font-medium">Light</span>
                    </>
                ) : (
                    <>
                        <Moon className="h-4 w-4" />
                        <span className="text-xs font-medium">Dark</span>
                    </>
                )}
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={toggle}
            className="w-full justify-start gap-2"
        >
            {theme === "dark" ? (
                <>
                    <Sun className="h-4 w-4" />
                    <span>{t("settings.lightMode")}</span>
                </>
            ) : (
                <>
                    <Moon className="h-4 w-4" />
                    <span>{t("settings.darkMode")}</span>
                </>
            )}
        </Button>
    );
}
