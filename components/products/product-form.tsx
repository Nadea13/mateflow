"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Product, Supplier } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { getSuppliers } from "@/lib/actions/suppliers";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Barcode, DollarSign, Layers, Package, Tag } from "lucide-react";

interface ProductFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    productToEdit?: Product | null;
    suppliers?: Supplier[];
    onClose?: () => void;
}

export function ProductForm({ open, setOpen, productToEdit, suppliers: initialSuppliers, onClose }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers || []);

    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        barcode: "",
        price: "",
        cost_price: "",
        stock: "",
        image_url: "",
        min_stock_level: "0",
        supplier_id: "none",
    });

    // Re-fetch suppliers every time the modal is opened so newly added suppliers appear immediately
    useEffect(() => {
        if (open) {
            const fetchSuppliers = async () => {
                const data = await getSuppliers();
                setSuppliers(data);
            };
            fetchSuppliers();
        }
    }, [open]);

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name || "",
                sku: productToEdit.sku || "",
                barcode: productToEdit.barcode || "",
                price: productToEdit.price?.toString() || "0",
                cost_price: productToEdit.cost_price?.toString() || "0",
                stock: productToEdit.stock?.toString() || "0",
                image_url: productToEdit.image_url || "",
                min_stock_level: productToEdit.min_stock_level?.toString() || "0",
                supplier_id: productToEdit.supplier_id || "none",
            });
        } else {
            setFormData({
                name: "",
                sku: "",
                barcode: "",
                price: "",
                cost_price: "",
                stock: "",
                image_url: "",
                min_stock_level: "0",
                supplier_id: "none",
            });
        }
    }, [productToEdit, open]);

    const [isPending, startTransition] = useTransition();

    const generateSku = () => {
        if (!formData.name) return;
        const prefix = formData.name.trim().slice(0, 3).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000);
        setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}` }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const dataToSave: Partial<Product> = {
            name: formData.name,
            sku: formData.sku.trim() || undefined,
            barcode: formData.barcode.trim() || undefined,
            price: parseFloat(formData.price) || 0,
            cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
            stock: parseInt(formData.stock) || 0,
            image_url: formData.image_url.trim() || undefined,
            min_stock_level: parseInt(formData.min_stock_level) || 0,
            supplier_id: formData.supplier_id === "none" ? undefined : formData.supplier_id,
        };

        try {
            if (productToEdit) {
                const result = await updateProduct(productToEdit.id, dataToSave);
                if (result.success) {
                    toast({ title: "Product updated successfully" });
                    setOpen(false);
                    onClose?.();
                } else {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                }
            } else {
                const result = await createProduct(dataToSave);
                if (result.success) {
                    toast({ title: "Product created successfully" });
                    setOpen(false);
                    setFormData({
                        name: "",
                        sku: "",
                        barcode: "",
                        price: "",
                        cost_price: "",
                        stock: "",
                        image_url: "",
                        min_stock_level: "0",
                        supplier_id: "none",
                    });
                } else {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                }
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{productToEdit ? "Edit Product" : "Add New Global Product"}</DialogTitle>
                        <DialogDescription>
                            {productToEdit
                                ? "Update your product details across the network."
                                : "Create a central product catalog entry for all branches."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {/* Name */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="name" className="text-right font-medium">
                                Name *
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                                placeholder="e.g. Premium Cotton T-Shirt"
                            />
                        </div>

                        {/* SKU */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="sku" className="text-right font-medium">
                                SKU
                            </Label>
                            <div className="col-span-3 flex gap-2">
                                <Input
                                    id="sku"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                    placeholder="TSH-001"
                                    className="font-mono text-xs"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={generateSku}
                                    className="text-xs shrink-0"
                                >
                                    Auto
                                </Button>
                            </div>
                        </div>

                        {/* Barcode */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="barcode" className="text-right font-medium">
                                Barcode
                            </Label>
                            <Input
                                id="barcode"
                                value={formData.barcode}
                                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                className="col-span-3 font-mono text-xs"
                                placeholder="e.g. 8851234567890"
                            />
                        </div>

                        {/* Price & Cost Price */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="price" className="text-right font-medium">
                                Retail Price *
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="col-span-3 font-mono text-xs"
                                required
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="cost_price" className="text-right font-medium">
                                Cost Price
                            </Label>
                            <Input
                                id="cost_price"
                                type="number"
                                value={formData.cost_price}
                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                className="col-span-3 font-mono text-xs"
                                min="0"
                                step="0.01"
                                placeholder="COGS / Cost of Goods Sold"
                            />
                        </div>

                        {/* Stock & Alert Level */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="stock" className="text-right font-medium">
                                Initial Stock *
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="col-span-3 font-mono text-xs"
                                required
                                min="0"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="min_stock_level" className="text-right font-medium">
                                Low Stock Alert
                            </Label>
                            <Input
                                id="min_stock_level"
                                type="number"
                                value={formData.min_stock_level}
                                onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value })}
                                className="col-span-3 font-mono text-xs"
                                min="0"
                                placeholder="Threshold (e.g. 10)"
                            />
                        </div>

                        {/* Image URL */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="image" className="text-right font-medium">
                                Image URL
                            </Label>
                            <Input
                                id="image"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                className="col-span-3 text-xs"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Supplier */}
                        <div className="grid grid-cols-4 items-center gap-3">
                            <Label htmlFor="supplier" className="text-right font-medium">
                                Supplier
                            </Label>
                            <select
                                id="supplier"
                                value={formData.supplier_id}
                                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                className="col-span-3 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="none">-- ไม่มีซัพพลายเออร์ที่กำหนด (None) --</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} {s.phone ? `(${s.phone})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Product"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
