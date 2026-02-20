import { getProducts } from "@/lib/actions/products";

export const dynamic = "force-dynamic";

import { ProductTable } from "@/components/products/product-table";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/product-form";
import { Plus } from "lucide-react";
import { ProductHeader } from "@/components/products/product-header";

export default async function ProductsPage() {
    const products = await getProducts();

    return (
        <div className="flex flex-col">
            <div className="hidden md:block">
                <ProductHeader />
            </div>
            <div className="md:hidden">
                <div className="flex flex-col gap-1 mb-4">
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <p className="text-muted-foreground">Manage your product inventory.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <ProductHeader mobile />
                </div>
            </div>
            <ProductTable products={products || []} />


        </div>
    );
}
