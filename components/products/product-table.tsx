"use client";

import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, MoreHorizontal, Plus, Tag, Barcode } from "lucide-react";
import { deleteProduct } from "@/lib/actions/products";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ProductForm } from "./product-form";
import { PODialog } from "@/components/expenses/PODialog";
import { PurchaseOrder } from "@/types";
import { useCurrencyStore } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency";
import { EmptyState } from "@/components/shared/empty-state";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n/provider";

interface ProductTableProps {
    products: Product[];
}

export function ProductTable({ products }: ProductTableProps) {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { currency } = useCurrencyStore();
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Auto PO state
    const [poDialogOpen, setPoDialogOpen] = useState(false);
    const [poData, setPoData] = useState<PurchaseOrder | undefined>(undefined);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;

        const result = await deleteProduct(id);
        if (result.success) {
            toast({ title: "Product deleted" });
        } else {
            toast({ title: "Error", description: result.error, variant: "destructive" });
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleAutoPO = (product: Product) => {
        const dummyPO: PurchaseOrder = {
            id: "",
            po_number: `PO-AUTO-${Date.now().toString().slice(-4)}`,
            supplier_id: product.supplier_id || "",
            user_id: "",
            date: new Date().toISOString().split("T")[0],
            status: "draft",
            total_amount: Number(product.cost_price || 0) * 10,
            items: [
                {
                    name: product.name,
                    sku: product.sku,
                    quantity: 10,
                    unit_price: Number(product.cost_price || 0),
                    total_price: Number(product.cost_price || 0) * 10,
                },
            ] as any,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        setPoData(dummyPO);
        setPoDialogOpen(true);
    };

    return (
        <>
            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-20 bg-muted/80 w-[50px]">{t("registry.table.no")}</TableHead>
                            <TableHead className="sticky left-[50px] z-20 bg-muted/80 min-w-[200px]">{t("registry.table.productSku")}</TableHead>
                            <TableHead>{t("registry.table.retailPrice")}</TableHead>
                            <TableHead>{t("registry.table.costPrice")}</TableHead>
                            <TableHead>{t("registry.table.stockLevel")}</TableHead>
                            <TableHead>{t("registry.table.supplier")}</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="p-0 border-0">
                                    <EmptyState
                                        icon={Tag}
                                        title={t("registry.table.noProducts")}
                                        description={t("registry.table.noProductsDesc")}
                                        className="border-0 my-0 rounded-none bg-transparent"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product, index) => (
                                <TableRow key={product.id}>
                                    <TableCell className="sticky left-0 z-10 bg-background">{index + 1}</TableCell>
                                    <TableCell className="sticky left-[50px] z-10 bg-background font-medium">
                                        <div>
                                            <div className="font-semibold text-foreground">{product.name}</div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                {product.sku && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted font-mono">
                                                        SKU: {product.sku}
                                                    </span>
                                                )}
                                                {product.barcode && (
                                                    <span className="inline-flex items-center text-muted-foreground">
                                                        <Barcode className="h-3 w-3 mr-1 inline" />
                                                        {product.barcode}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{formatMoney(product.price, currency)}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {product.cost_price ? formatMoney(product.cost_price, currency) : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className={product.stock <= (product.min_stock_level || 0) ? "text-red-500 font-bold" : "font-medium"}>
                                                {product.stock} units
                                            </span>
                                            {product.stock <= (product.min_stock_level || 0) && (
                                                <span className="text-[10px] text-destructive bg-destructive/10 px-1 py-0.5 rounded-sm w-fit mt-1">
                                                    Low Stock (≤{product.min_stock_level || 0})
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {product.supplier_name || "-"}
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
                                                {product.stock <= (product.min_stock_level || 0) && (
                                                    <DropdownMenuItem onClick={() => handleAutoPO(product)} className="text-primary focus:text-primary">
                                                        <Plus className="mr-2 h-4 w-4" /> Create Auto PO
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem onClick={() => handleEdit(product)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(product.id)}
                                                    className="text-red-600 focus:text-red-600"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
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

            <ProductForm
                open={isFormOpen}
                setOpen={setIsFormOpen}
                productToEdit={editingProduct}
                onClose={() => setEditingProduct(null)}
            />

            <PODialog
                open={poDialogOpen}
                onOpenChange={setPoDialogOpen}
                po={poData}
            />
        </>
    );
}
