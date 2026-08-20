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
import { MoreHorizontal, FileText, CheckCircle, XCircle, Trash2, Printer, Eye, ArrowRight, FileCheck } from "lucide-react";
import { deleteBill, updateBillStatus } from "@/lib/actions/bills";
import { useToast } from "@/hooks/use-toast";
import { BillViewerDialog } from "./bill-viewer-dialog";
import { useTranslation } from "@/lib/i18n/provider";

interface BillTableProps {
    bills: Bill[];
    storeProfile?: any;
}

export function BillTable({ bills, storeProfile }: BillTableProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้?")) return;
        const result = (await deleteBill(id)) as any;
        if (result.success) {
            toast({ title: "ลบสำเร็จ", description: "เอกสารถูกลบเรียบร้อยแล้ว" });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleStatus = async (id: string, status: "quotation" | "draft" | "paid" | "cancelled") => {
        const result = (await updateBillStatus(id, status)) as any;
        if (result.success) {
            const label = status === "quotation" ? "ใบเสนอราคา" : status === "draft" ? "ใบแจ้งหนี้" : status === "paid" ? "ใบเสร็จรับเงิน" : "ยกเลิก";
            toast({ title: "อัปเดตสถานะสำเร็จ", description: `เปลี่ยนสถานะเป็น "${label}" เรียบร้อยแล้ว (อัปเดตวันที่เอกสาร)` });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const statusBadge = (status: string) => {
        const config: Record<string, { label: string; style: string }> = {
            quotation: { label: "ใบเสนอราคา", style: "bg-sky-500/10 text-sky-600 border-sky-500/20" },
            draft: { label: "ใบแจ้งหนี้", style: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
            paid: { label: "ใบเสร็จรับเงิน", style: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            cancelled: { label: "ยกเลิก", style: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
        };

        const current = config[status] || { label: status, style: "bg-muted text-muted-foreground border-border" };

        return (
            <Badge variant="outline" className={`font-semibold text-[11px] ${current.style}`}>
                {current.label}
            </Badge>
        );
    };

    if (bills.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed">
                <FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <h3 className="font-semibold text-lg">ยังไม่มีเอกสารในระบบ</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                    กดปุ่ม "ออกเอกสาร" เพื่อเริ่มต้นสร้างใบเสนอราคา หรือใบแจ้งหนี้
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="border rounded-md overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>เลขที่เอกสาร</TableHead>
                            <TableHead>ลูกค้า</TableHead>
                            <TableHead>วันที่เอกสาร</TableHead>
                            <TableHead className="text-right">ยอดรวมสุทธิ</TableHead>
                            <TableHead>สถานะเอกสาร</TableHead>
                            <TableHead className="w-[120px] text-right">จัดการ</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {bills.map((bill) => (
                            <TableRow key={bill.id}>
                                <TableCell className="font-mono text-xs font-semibold">
                                    INV-{bill.id.slice(0, 8).toUpperCase()}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {bill.customer_name || "ลูกค้าทั่วไป (Guest)"}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(bill.created_at).toLocaleDateString("th-TH")}
                                </TableCell>
                                <TableCell className="text-right font-semibold font-mono">
                                    ฿{Number(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>{statusBadge(bill.status)}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedBill(bill);
                                                setViewerOpen(true);
                                            }}
                                            className="h-8 px-2 text-xs font-semibold gap-1 text-primary hover:bg-primary/10 cursor-pointer"
                                            title="ดูเอกสารและพิมพ์"
                                        >
                                            <Printer className="h-3.5 w-3.5" />
                                            พิมพ์
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="text-xs">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSelectedBill(bill);
                                                        setViewerOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-2 text-primary" />
                                                    ดูเอกสารฉบับเต็ม
                                                </DropdownMenuItem>

                                                {/* Action: Quotation -> Invoice (Draft) */}
                                                {bill.status === "quotation" && (
                                                    <DropdownMenuItem onClick={() => handleStatus(bill.id, "draft")}>
                                                        <ArrowRight className="h-4 w-4 mr-2 text-amber-500" />
                                                        เปลี่ยนเป็น "ใบแจ้งหนี้" (ออกบิล)
                                                    </DropdownMenuItem>
                                                )}

                                                {/* Action: Invoice (Draft) / Quotation -> Paid */}
                                                {(bill.status === "draft" || bill.status === "quotation") && (
                                                    <DropdownMenuItem onClick={() => handleStatus(bill.id, "paid")}>
                                                        <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                                                        รับชำระเงิน (ออกใบเสร็จรับเงิน)
                                                    </DropdownMenuItem>
                                                )}

                                                {bill.status !== "cancelled" && (
                                                    <DropdownMenuItem onClick={() => handleStatus(bill.id, "cancelled")}>
                                                        <XCircle className="h-4 w-4 mr-2 text-rose-500" />
                                                        ยกเลิกเอกสาร
                                                    </DropdownMenuItem>
                                                )}

                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(bill.id)}
                                                    className="text-rose-500 focus:text-rose-500"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    ลบเอกสาร
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <BillViewerDialog
                bill={selectedBill}
                storeProfile={storeProfile}
                open={viewerOpen}
                onOpenChange={setViewerOpen}
            />
        </>
    );
}
