"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PurchaseOrder } from "@/types";
import { updatePOStatus, deletePurchaseOrder, getPurchaseOrder } from "@/lib/actions/purchase-orders";
import { toast } from "sonner";
import { MoreHorizontal, Eye, Trash2, CheckCircle2, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { PODialog } from "./PODialog";
import { useTranslation } from "@/lib/i18n/provider";
import { EmptyState } from "@/components/shared/empty-state";

interface POTableProps {
    pos: PurchaseOrder[];
}

export function POTable({ pos }: POTableProps) {
    const { t } = useTranslation();
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleViewPO = async (id: string) => {
        const po = await getPurchaseOrder(id);
        if (po) {
            setSelectedPO(po);
            setDialogOpen(true);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        const res = await updatePOStatus(id, status);
        if ('error' in res) {
            toast.error(res.error);
        } else {
            toast.success(`PO status updated to ${status}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this PO?")) {
            const res = await deletePurchaseOrder(id);
            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success("PO deleted successfully");
            }
        }
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "draft": return "outline";
            case "sent": return "secondary";
            case "received": return "default";
            case "cancelled": return "destructive";
            default: return "outline";
        }
    };

    return (
        <>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-muted/80">PO Number</TableHead>
                            <TableHead className="bg-muted/80">{t("registry.tabSuppliers")}</TableHead>
                            <TableHead className="bg-muted/80">{t("bills.date")}</TableHead>
                            <TableHead className="bg-muted/80">{t("bills.amount")}</TableHead>
                            <TableHead className="bg-muted/80">{t("bills.status")}</TableHead>
                            <TableHead className="bg-muted/80 text-right">{t("bills.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0 border-0">
                                    <EmptyState
                                        icon={FileText}
                                        title={t("common.noData")}
                                        description="Generate and track official Purchase Orders for your suppliers."
                                        className="border-0 my-0 rounded-none bg-transparent"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            pos.map((po) => (
                                <TableRow key={po.id}>
                                    <TableCell className="font-medium">{po.po_number}</TableCell>
                                    <TableCell>{po.supplier_name}</TableCell>
                                    <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{po.total_amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(po.status)}>
                                            {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleViewPO(po.id)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                {po.status !== 'received' && (
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(po.id, 'received')}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Mark Received
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleDelete(po.id)} className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete PO
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedPO && (
                <PODialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    po={selectedPO}
                />
            )}
        </>
    );
}
