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
import { Product } from "@/types";
import { useEffect, useState, useTransition } from "react";
import { createProduct, updateProduct } from "@/lib/actions/products";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProductFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    productToEdit?: Product | null;
    onClose?: () => void;
}

export function ProductForm({ open, setOpen, productToEdit, onClose }: ProductFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        stock: "",
        image_url: "",
    });

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                name: productToEdit.name,
                price: productToEdit.price.toString(),
                stock: productToEdit.stock.toString(),
                image_url: productToEdit.image_url || "",
            });
        } else {
            setFormData({ name: "", price: "", stock: "", image_url: "" });
        }
    }, [productToEdit, open]);

    const [isPending, startTransition] = useTransition();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const dataToSave: Partial<Product> = {
            name: formData.name,
            price: parseFloat(formData.price) || 0,
            stock: parseInt(formData.stock) || 0,
            image_url: formData.image_url || undefined,
        };

        try {
            let result;
            if (productToEdit) {
                result = await updateProduct(productToEdit.id, dataToSave);
            } else {
                result = await createProduct(dataToSave);
            }

            if (result.success) {
                toast({ title: `Product ${productToEdit ? "updated" : "created"} successfully` });
                setOpen(false);
                startTransition(() => {
                    router.refresh();
                });
                if (onClose) onClose();
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={(val: boolean) => {
            setOpen(val);
            if (!val && onClose) onClose();
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{productToEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                            {productToEdit ? "Make changes to your product here." : "Add a new item to your inventory."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Price
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="col-span-3"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="stock" className="text-right">
                                Stock
                            </Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="col-span-3"
                                required
                                min="0"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="image" className="text-right">
                                Image URL
                            </Label>
                            <Input
                                id="image"
                                value={formData.image_url}
                                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                className="col-span-3"
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
