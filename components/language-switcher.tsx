"use client";

import { useTranslation } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "compact" }) {
    const { locale, setLocale } = useTranslation();

    const toggle = () => setLocale(locale === "en" ? "th" : "en");

    if (variant === "compact") {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={toggle}
                className="gap-2 text-muted-foreground hover:text-foreground"
            >
                <Languages className="h-4 w-4" />
                <span className="text-xs font-medium">{locale === "en" ? "TH" : "EN"}</span>
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
            <Languages className="h-4 w-4" />
            <span>{locale === "en" ? "🇹🇭 ไทย" : "🇬🇧 English"}</span>
        </Button>
    );
}
