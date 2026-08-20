"use client";

import { useCurrencyStore } from "@/lib/currency/store";
import { SUPPORTED_CURRENCIES, CurrencyCode } from "@/lib/currency";
import { DollarSign } from "lucide-react";

export function CurrencySwitcher({ variant = "default" }: { variant?: "default" | "compact" }) {
    const { currency, setCurrency } = useCurrencyStore();

    if (variant === "compact") {
        return (
            <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-muted-foreground">$</span>
                <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-muted-foreground hover:text-foreground"
                    title="Change Currency"
                >
                    {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                        <option key={c.code} value={c.code} className="bg-background text-foreground">
                            {c.code} ({c.symbol})
                        </option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-2 rounded-lg border bg-card text-card-foreground">
            <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Currency</span>
            </div>
            <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer text-foreground px-2 py-1 rounded border border-border"
            >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code} className="bg-background text-foreground">
                        {c.code} - {c.name} ({c.symbol})
                    </option>
                ))}
            </select>
        </div>
    );
}
