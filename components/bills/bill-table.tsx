"use client";

import { useState } from "react";
import { Bill } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { deleteBill, updateBillStatus } from "@/lib/actions/bills";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n/provider";

interface BillTableProps {
    bills: Bill[];
}

export function BillTable({ bills }: BillTableProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const handleDelete = async (id: string) => {
        const result = (await deleteBill(id)) as any;
        if (result.success) {
            toast({ title: "Deleted", description: "Bill removed." });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleStatus = async (id: string, status: "draft" | "paid" | "cancelled") => {
        const result = (await updateBillStatus(id, status)) as any;
        if (result.success) {
            toast({ title: "Status Updated", description: `Bill marked as ${status}.` });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20",
            paid: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20",
            cancelled: "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border-rose-500/20",
        };
        return (
            <Badge variant="outline" className={`capitalize ${styles[status] || ""}`}>
                {status}
            </Badge>
        );
    };

    if (bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-lg">{t("bills.noBills")}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    Create your first bill to start tracking sales.
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-md overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("bills.billNumber")}</TableHead>
                        <TableHead>{t("bills.customer")}</TableHead>
                        <TableHead>{t("bills.date")}</TableHead>
                        <TableHead className="text-right">{t("bills.total")}</TableHead>
                        <TableHead>{t("bills.status")}</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {bills.map((bill) => (
                        <TableRow key={bill.id}>
                            <TableCell className="font-mono text-xs font-semibold">
                                INV-{bill.id.slice(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell className="font-medium">
                                {bill.customer_name || "Guest"}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {new Date(bill.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                ฿{Number(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>{statusBadge(bill.status)}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {bill.status === "draft" && (
                                            <DropdownMenuItem onClick={() => handleStatus(bill.id, "paid")}>
                                                <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                                Mark as Paid
                                            </DropdownMenuItem>
                                        )}
                                        {bill.status !== "cancelled" && (
                                            <DropdownMenuItem onClick={() => handleStatus(bill.id, "cancelled")}>
                                                <XCircle className="h-4 w-4 mr-2 text-rose-500" />
                                                Cancel Bill
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                            onClick={() => handleDelete(bill.id)}
                                            className="text-rose-500 focus:text-rose-500"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
