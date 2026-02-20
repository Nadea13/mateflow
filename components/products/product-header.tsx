"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ProductForm } from "./product-form";
import { ImportStockDialog } from "./import-stock-dialog";

interface ProductHeaderProps {
    mobile?: boolean;
}

export function ProductHeader({ mobile }: ProductHeaderProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);

    if (mobile) {
        return (
            <>
                <ImportStockDialog />
                <Button onClick={() => setIsFormOpen(true)} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
                <ProductForm open={isFormOpen} setOpen={setIsFormOpen} />
            </>
        )
    }

    return (
        <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">Products</h2>
            <div className="flex items-center gap-2">
                <ImportStockDialog />
                <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
            </div>
            <ProductForm open={isFormOpen} setOpen={setIsFormOpen} />
        </div>
    );
}
