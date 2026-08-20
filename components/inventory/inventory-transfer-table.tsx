"use client";

import { useState } from "react";
import { Location, Product, InventoryLevel } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { adjustInventory } from "@/lib/actions/inventory";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/provider";

interface InventoryTransferTableProps {
    locations: Location[];
    products: Product[];
    inventoryLevels: any[];
}

export function InventoryTransferTable({ locations, products, inventoryLevels }: InventoryTransferTableProps) {
    const { t } = useTranslation();
    const [selectedLocation, setSelectedLocation] = useState<string>(locations[0]?.id || "");
    const [transferAmounts, setTransferAmounts] = useState<{ [productId: string]: string }>({});
    const [loading, setLoading] = useState<{ [productId: string]: boolean }>({});

    const handleAdjust = async (productId: string) => {
        if (!selectedLocation) {
            toast.error("Please select a location first.");
            return;
        }

        const amountStr = transferAmounts[productId];
        if (!amountStr) return;

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount === 0) return;

        setLoading(prev => ({ ...prev, [productId]: true }));

        const result = await adjustInventory(productId, selectedLocation, amount);

        if (result.success) {
            toast.success(`Inventory adjusted by ${amount > 0 ? '+' : ''}${amount}. Total stock is now ${result.totalStock}`);
            setTransferAmounts(prev => ({ ...prev, [productId]: "" }));
        } else {
            toast.error(result.error || "Failed to adjust inventory");
        }

        setLoading(prev => ({ ...prev, [productId]: false }));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 max-w-sm">
                <span className="text-xs font-medium text-muted-foreground">{t("registry.tabInventory")}:</span>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                        {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                                {loc.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="bg-muted/80">{t("registry.tabProducts")}</TableHead>
                            <TableHead className="bg-muted/80">{t("registry.table.stockLevel")}</TableHead>
                            <TableHead className="bg-muted/80">Location Stock</TableHead>
                            <TableHead className="bg-muted/80">Adjust Stock (+/-)</TableHead>
                            <TableHead className="bg-muted/80 w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-xs text-muted-foreground">
                                    {t("common.noData")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                const level = inventoryLevels.find(
                                    l => l.product_id === product.id && l.location_id === selectedLocation
                                );
                                const locationStock = level ? level.quantity : 0;

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">{product.name}</TableCell>
                                        <TableCell>{product.stock}</TableCell>
                                        <TableCell>{locationStock}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                placeholder="+10 or -5"
                                                value={transferAmounts[product.id] || ""}
                                                onChange={(e) => setTransferAmounts(prev => ({ ...prev, [product.id]: e.target.value }))}
                                                className="w-32"
                                                disabled={!selectedLocation}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                onClick={() => handleAdjust(product.id)}
                                                disabled={loading[product.id] || !selectedLocation || !transferAmounts[product.id]}
                                                size="sm"
                                            >
                                                {loading[product.id] ? "Saving..." : "Apply"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
