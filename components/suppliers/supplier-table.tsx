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
import { MoreHorizontal, Trash, Edit, Truck } from "lucide-react";
import { Supplier } from "@/types";
import { deleteSupplier } from "@/lib/actions/suppliers";
import { useToast } from "@/hooks/use-toast";
import { SupplierDialog } from "@/components/expenses/SupplierDialog";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { useTranslation } from "@/lib/i18n/provider";

interface SupplierTableProps {
    suppliers: Supplier[];
}

export function SupplierTable({ suppliers }: SupplierTableProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this supplier?")) return;

        const result = await deleteSupplier(id);
        if (result.success) {
            toast({
                title: "Supplier Deleted",
                description: "The supplier has been removed.",
            });
        } else {
            toast({
                title: "Error",
                description: result.error,
                variant: "destructive",
            });
        }
    };

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setDialogOpen(true);
    };

    return (
        <>
            <SupplierDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) setEditingSupplier(undefined);
                }}
                supplier={editingSupplier}
            />

            <div className="rounded-md border overflow-x-auto bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-20 bg-muted/80">{t("registry.table.no")}</TableHead>
                            <TableHead className="sticky left-[40px] z-20 bg-muted/80">{t("registry.table.name")}</TableHead>
                            <TableHead>{t("registry.table.phone")}</TableHead>
                            <TableHead>{t("registry.table.email")}</TableHead>
                            <TableHead>{t("registry.table.address")}</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="p-0 border-0">
                                    <EmptyState
                                        icon={Truck}
                                        title={t("common.noData")}
                                        description="Add verified suppliers and manufacturers to your procurement network."
                                        className="border-0 my-0 rounded-none bg-transparent"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            suppliers.map((supplier, index) => (
                                <TableRow key={supplier.id}>
                                    <TableCell className="sticky left-0 z-10 bg-background">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[40px] z-10 bg-background font-medium">{supplier.name}</TableCell>
                                    <TableCell>{supplier.phone || "-"}</TableCell>
                                    <TableCell>{supplier.email || "-"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={supplier.address}>
                                        {supplier.address || "-"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash className="mr-2 h-4 w-4" /> Delete
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
        </>
    );
}
