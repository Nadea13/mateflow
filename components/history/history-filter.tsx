"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

import { useTranslation } from "@/lib/i18n/provider";

export function HistoryFilter() {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentType = searchParams.get("type") || "all";

    const onValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === "all") {
            params.delete("type");
        } else {
            params.set("type", value);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <Select value={currentType} onValueChange={onValueChange}>
            <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder={t("history.filterAll")} />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">{t("history.filterAll")}</SelectItem>
                <SelectItem value="bill">{t("history.filterBills")}</SelectItem>
                <SelectItem value="product">{t("history.filterProducts")}</SelectItem>
                <SelectItem value="customer">{t("history.filterCustomers")}</SelectItem>
                <SelectItem value="expense">{t("history.filterExpenses")}</SelectItem>
            </SelectContent>
        </Select>
    );
}
