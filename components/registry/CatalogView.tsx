"use client";

import { useState } from "react";
import { Package, Users, Plus, Truck, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductTable } from "@/components/products/product-table";
import { CustomerTable } from "@/components/customers/customer-table";
import { Button } from "@/components/ui/button";
import { ProductForm } from "@/components/products/product-form";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { ImportStockDialog } from "@/components/products/import-stock-dialog";
import { importCustomers } from "@/lib/actions/import";
import { SupplierTable } from "@/components/suppliers/supplier-table";
import { SupplierDialog } from "@/components/expenses/SupplierDialog";
import { InventoryView } from "@/components/inventory/inventory-view";
import { LocationDialog } from "@/components/inventory/location-dialog";
import { useTranslation } from "@/lib/i18n/provider";

interface CatalogViewProps {
    products: any[];
    customers: any[];
    suppliers: any[];
    locations: any[];
    inventoryLevels: any[];
}

export function CatalogView({ products, customers, suppliers, locations, inventoryLevels }: CatalogViewProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("products");
    const [isProductFormOpen, setIsProductFormOpen] = useState(false);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);

    const handleAdd = () => {
        if (activeTab === "products") {
            setIsProductFormOpen(true);
        } else if (activeTab === "customers") {
            setIsCustomerDialogOpen(true);
        } else if (activeTab === "suppliers") {
            setIsSupplierDialogOpen(true);
        } else if (activeTab === "inventory") {
            setIsLocationDialogOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        {t("registry.title")}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t("registry.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {activeTab === "products" ? (
                        <ImportStockDialog />
                    ) : activeTab === "customers" ? (
                        <ImportDialog
                            type="customer"
                            onImport={importCustomers}
                            triggerText={t("registry.import")}
                        />
                    ) : null}

                    <Button onClick={handleAdd} size="sm" className="h-8 text-xs gap-1.5 font-medium">
                        <Plus className="h-3.5 w-3.5" />
                        {activeTab === "products" && t("registry.addProduct")}
                        {activeTab === "customers" && t("registry.addCustomer")}
                        {activeTab === "suppliers" && t("registry.addSupplier")}
                        {activeTab === "inventory" && t("registry.addLocation")}
                    </Button>
                </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="products" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="products">
                        <Package className="h-3.5 w-3.5 mr-1.5" />
                        {t("registry.tabProducts")}
                    </TabsTrigger>
                    <TabsTrigger value="customers">
                        <Users className="h-3.5 w-3.5 mr-1.5" />
                        {t("registry.tabCustomers")}
                    </TabsTrigger>
                    <TabsTrigger value="suppliers">
                        <Truck className="h-3.5 w-3.5 mr-1.5" />
                        {t("registry.tabSuppliers")}
                    </TabsTrigger>
                    <TabsTrigger value="inventory">
                        <MapPin className="h-3.5 w-3.5 mr-1.5" />
                        {t("registry.tabInventory")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="focus-visible:outline-none">
                    <ProductTable products={products} />
                </TabsContent>

                <TabsContent value="customers" className="focus-visible:outline-none">
                    <CustomerTable customers={customers} />
                </TabsContent>

                <TabsContent value="suppliers" className="focus-visible:outline-none">
                    <SupplierTable suppliers={suppliers} />
                </TabsContent>

                <TabsContent value="inventory" className="focus-visible:outline-none">
                    <InventoryView locations={locations} products={products} inventoryLevels={inventoryLevels} />
                </TabsContent>
            </Tabs>

            <ProductForm open={isProductFormOpen} setOpen={setIsProductFormOpen} />
            <CustomerDialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen} />
            <SupplierDialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen} />
            <LocationDialog open={isLocationDialogOpen} setOpen={setIsLocationDialogOpen} />
        </div>
    );
}
