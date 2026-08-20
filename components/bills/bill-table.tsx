"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash, CheckCircle, XCircle, FileText } from "lucide-react";
import { Bill } from "@/types";
import { deleteBill, updateBillStatus } from "@/lib/actions/bills";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCurrencyStore } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n/provider";

interface BillTableProps {
    bills: Bill[];
}

export function BillTable({ bills }: BillTableProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const router = useRouter();
    const { currency } = useCurrencyStore();

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this bill?")) return;
        const result = (await deleteBill(id)) as any;
        if (result.success) {
            toast({ title: "Bill Deleted", description: "The bill has been removed." });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleStatus = async (id: string, status: string) => {
        const result = (await updateBillStatus(id, status)) as any;
        if (result.success) {
            toast({ title: "Status Updated", description: `Bill marked as ${status}.` });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
            paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
            cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        };
        const label = status === "draft" ? t("bills.draft") : status === "paid" ? t("bills.paid") : status === "cancelled" ? t("bills.cancelled") : status;
        return (
            <span className={cn("px-2 py-1 rounded-full text-xs font-medium", styles[status] || "bg-muted text-muted-foreground")}>
                {label}
            </span>
        );
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="sticky left-0 z-20 bg-muted/80">No.</TableHead>
                        <TableHead className="sticky left-[40px] z-20 bg-muted/80">{t("bills.customer")}</TableHead>
                        <TableHead className="text-right">{t("bills.amount")}</TableHead>
                        <TableHead>{t("bills.status")}</TableHead>
                        <TableHead>{t("bills.date")}</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="w-[70px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bills.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="p-0 border-0">
                                <EmptyState
                                    icon={FileText}
                                    title={t("bills.noBills")}
                                    description="Get started by creating your first commercial invoice or importing via CSV."
                                    className="border-0 my-0 rounded-none bg-transparent"
                                />
                            </TableCell>
                        </TableRow>
                    ) : (
                        bills.map((bill, index) => {
                            const billCurr = (bill.currency as any) || currency;
                            return (
                                <TableRow key={bill.id}>
                                    <TableCell className="sticky left-0 z-10 bg-background">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] z-10 bg-background font-medium">
                                        {bill.customer_name || "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono font-semibold">
                                        {formatMoney(bill.total_amount, billCurr)}
                                    </TableCell>
                                    <TableCell>{statusBadge(bill.status)}</TableCell>
                                    <TableCell>{formatDate(bill.created_at)}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={bill.note}>
                                        {bill.note || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                {bill.status === "draft" && (
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bills/${bill.id}`)}>
                                                        <FileText className="mr-2 h-4 w-4 text-blue-500" /> Commercial Quotation
                                                    </DropdownMenuItem>
                                                )}
                                                {bill.status === "paid" && (
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/bills/${bill.id}`)}>
                                                        <FileText className="mr-2 h-4 w-4 text-green-600" /> Tax Invoice / Receipt
                                                    </DropdownMenuItem>
                                                )}
                                                {bill.status !== "paid" && (
                                                    <DropdownMenuItem onClick={() => handleStatus(bill.id, "paid")}>
                                                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Mark as Paid
                                                    </DropdownMenuItem>
                                                )}
                                                {bill.status !== "cancelled" && (
                                                    <DropdownMenuItem onClick={() => handleStatus(bill.id, "cancelled")}>
                                                        <XCircle className="mr-2 h-4 w-4 text-orange-500" /> Cancel
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(bill.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
