"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

export function HistoryFilter() {
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
                <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="bill">Bills</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="customer">Customers</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
            </SelectContent>
        </Select>
    );
}
