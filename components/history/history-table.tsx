"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
    History as HistoryIcon, 
    Receipt, 
    Package, 
    Users, 
    CreditCard, 
    Search,
    ArrowUpRight,
    FileText
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n/provider";
import { HistoryItem } from "@/lib/actions/history";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface HistoryTableProps {
    data: HistoryItem[];
}

export function HistoryTable({ data }: HistoryTableProps) {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredData = data.filter((item) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
            item.title.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.type.toLowerCase().includes(query) ||
            (item.status && item.status.toLowerCase().includes(query))
        );
    });

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            bill: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
            product: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
            customer: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
            expense: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        };

        const labels: Record<string, string> = {
            bill: "Bill / Invoice",
            product: "Product",
            customer: "Customer",
            expense: "Expense",
        };

        return (
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1", styles[type] || "bg-muted text-muted-foreground")}>
                {type === "bill" && <Receipt className="h-3 w-3" />}
                {type === "product" && <Package className="h-3 w-3" />}
                {type === "customer" && <Users className="h-3 w-3" />}
                {type === "expense" && <CreditCard className="h-3 w-3" />}
                {labels[type] || type}
            </span>
        );
    };

    const getStatusBadge = (status?: string) => {
        if (!status) return null;
        const styles: Record<string, string> = {
            draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
            pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
            completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        };

        return (
            <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider", styles[status.toLowerCase()] || "bg-muted text-muted-foreground")}>
                {status}
            </span>
        );
    };

    const getTargetLink = (item: HistoryItem) => {
        switch (item.type) {
            case "bill":
                return `/dashboard/bills`;
            case "product":
            case "customer":
                return `/dashboard/catalog`;
            case "expense":
                return `/dashboard/expenses`;
            default:
                return `/dashboard`;
        }
    };

    const formatDate = (d: string) => {
        const dateObj = new Date(d);
        return dateObj.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        }) + " " + dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="space-y-4">
            {/* Search Bar matching Backoffice Standard */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search records, entities, or activities..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 pl-8 text-xs"
                    />
                </div>
            </div>

            {/* Standard Bordered Table */}
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-20 bg-muted/80 w-[50px]">No.</TableHead>
                            <TableHead className="sticky left-[50px] z-20 bg-muted/80">Category</TableHead>
                            <TableHead>Activity & Details</TableHead>
                            <TableHead>Related Entity</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="p-0 border-0">
                                    <EmptyState
                                        icon={FileText}
                                        title={t("history.noActivities") || "No activity records found"}
                                        description={searchQuery ? "No matches found for your search criteria." : (t("history.noActivitiesDesc") || "Transactions and activities will appear here.")}
                                        className="border-0 my-8 rounded-none bg-transparent"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item, index) => (
                                <TableRow key={`${item.type}-${item.id}-${index}`}>
                                    <TableCell className="sticky left-0 z-10 bg-background text-xs font-mono">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell className="sticky left-[50px] z-10 bg-background">
                                        {getTypeBadge(item.type)}
                                    </TableCell>
                                    <TableCell className="font-medium text-xs">
                                        {item.description}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {item.title}
                                    </TableCell>
                                    <TableCell className="text-right text-xs font-medium font-mono">
                                        {item.amount !== undefined ? (
                                            <span className={item.type === "expense" ? "text-amber-600 dark:text-amber-400" : ""}>
                                                {item.type === "expense" ? "-" : "+"}฿{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {getStatusBadge(item.status) || <span className="text-muted-foreground text-xs">-</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDate(item.time)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link 
                                            href={getTargetLink(item)} 
                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                                        >
                                            View <ArrowUpRight className="h-3 w-3" />
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
