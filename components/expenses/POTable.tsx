"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, FileCheck, XCircle, FileText } from "lucide-react";
import { PurchaseOrder } from "@/types";
import { PODialog } from "./PODialog";
import { updatePOStatus, getPurchaseOrder } from "@/lib/actions/purchase-orders";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n/provider";

interface POTableProps {
    pos: PurchaseOrder[];
    onUpdate?: () => void;
}

export function POTable({ pos, onUpdate }: POTableProps) {
    const { t } = useTranslation();
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | undefined>();
    const [dialogOpen, setDialogOpen] = useState(false);

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "draft":
                return "secondary";
            case "ordered":
                return "default";
            case "received":
                return "outline";
            case "cancelled":
                return "destructive";
            default:
                return "secondary";
        }
    };

    const handleViewPO = async (id: string) => {
        const fullPO = await getPurchaseOrder(id);
        if (fullPO) {
            setSelectedPO(fullPO);
            setDialogOpen(true);
        }
    };

    const handleStatusChange = async (id: string, status: "draft" | "ordered" | "received" | "cancelled") => {
        try {
            const res = await updatePOStatus(id, status);
            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success(`PO status updated to ${status}`);
                onUpdate?.();
            }
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>PO Number</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
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
                                    <TableCell>{new Date(po.date || po.created_at || Date.now()).toLocaleDateString()}</TableCell>
                                    <TableCell>{(po.total_amount || 0).toLocaleString()}</TableCell>
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
                                                {po.status === "draft" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(po.id, "ordered")}>
                                                        <FileCheck className="mr-2 h-4 w-4 text-blue-500" /> Mark Ordered
                                                    </DropdownMenuItem>
                                                )}
                                                {po.status === "ordered" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(po.id, "received")}>
                                                        <FileCheck className="mr-2 h-4 w-4 text-green-500" /> Mark Received
                                                    </DropdownMenuItem>
                                                )}
                                                {po.status !== "cancelled" && po.status !== "received" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(po.id, "cancelled")}>
                                                        <XCircle className="mr-2 h-4 w-4 text-red-500" /> Cancel PO
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PODialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                po={selectedPO}
            />
        </>
    );
}
