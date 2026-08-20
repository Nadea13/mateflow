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

        const result = (await adjustInventory(productId, selectedLocation, amount)) as any;

        if (result.success) {
            toast.success(`Inventory adjusted by ${amount > 0 ? '+' : ''}${amount}.`);
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
                            <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                {loc.name} {loc.code ? `(${loc.code})` : ""}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[30%]">{t("registry.productName")}</TableHead>
                            <TableHead className="w-[20%]">SKU</TableHead>
                            <TableHead className="w-[15%] text-right">{t("registry.stock")}</TableHead>
                            <TableHead className="w-[20%] text-right">Location Stock</TableHead>
                            <TableHead className="w-[15%] text-right">Adjust Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                const level = inventoryLevels.find(
                                    (l) => l.product_id === product.id && l.location_id === selectedLocation
                                );
                                const locationStock = level ? level.quantity : 0;

                                return (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium text-xs">
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs font-mono">
                                            {product.sku || "-"}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-mono font-semibold">
                                            {product.stock}
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-mono font-semibold text-primary">
                                            {locationStock}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Input
                                                    type="number"
                                                    placeholder="+/-"
                                                    value={transferAmounts[product.id] || ""}
                                                    onChange={(e) =>
                                                        setTransferAmounts({
                                                            ...transferAmounts,
                                                            [product.id]: e.target.value,
                                                        })
                                                    }
                                                    className="w-20 h-7 text-xs font-mono text-right"
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    disabled={loading[product.id] || !transferAmounts[product.id]}
                                                    onClick={() => handleAdjust(product.id)}
                                                    className="h-7 text-[11px] px-2"
                                                >
                                                    {loading[product.id] ? "Saving..." : "Set"}
                                                </Button>
                                            </div>
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
