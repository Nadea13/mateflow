"use client";

import { useState } from "react";
import { MapPin, Package, Plus, ArrowRightLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Location, Product, InventoryLevel } from "@/types";
import { LocationTable } from "./location-table";
import { InventoryTransferTable } from "./inventory-transfer-table";
import { StockTransferDialog } from "./stock-transfer-dialog";
import { useTranslation } from "@/lib/i18n/provider";

interface InventoryViewProps {
    locations: Location[];
    products: Product[];
    inventoryLevels: any[];
}

export function InventoryView({ locations, products, inventoryLevels }: InventoryViewProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("locations");

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <TabsList>
                        <TabsTrigger value="locations">
                            <MapPin className="h-3.5 w-3.5 mr-1.5" />
                            {t("registry.tabInventory")}
                        </TabsTrigger>
                        <TabsTrigger value="stock">
                            <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5" />
                            Stock Allocation & Movements
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-2">
                        <StockTransferDialog branches={locations} products={products} />
                    </div>
                </div>

                <TabsContent value="locations" className="space-y-6">
                    <LocationTable locations={locations} onEdit={() => { }} />
                </TabsContent>

                <TabsContent value="stock" className="space-y-6">
                    <InventoryTransferTable
                        locations={locations}
                        products={products}
                        inventoryLevels={inventoryLevels}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
