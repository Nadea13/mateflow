"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import { Supplier, PurchaseOrder } from "@/types";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SupplierDialog } from "./SupplierDialog";

interface PODialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    po?: PurchaseOrder;
}

export function PODialog({ open, onOpenChange, po }: PODialogProps) {
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

    const [formData, setFormData] = useState({
        supplier_id: po?.supplier_id || "",
        po_number: po?.po_number || `PO-${Date.now().toString().slice(-6)}`,
        date: po?.date || new Date().toISOString().split('T')[0],
        note: po?.note || po?.notes || "",
        items: po?.items?.map(item => ({
            name: item.name || item.product_name || "",
            quantity: item.quantity || 1,
            unit_price: item.unit_price ?? item.unit_cost ?? 0,
            save_as_product: false,
        })) || [{ name: "", quantity: 1, unit_price: 0, save_as_product: false }],
    });

    useEffect(() => {
        if (open) {
            loadSuppliers();
            if (!po) {
                const today = new Date().toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, date: today }));
            }
        }
    }, [open, po]);

    async function loadSuppliers() {
        const data = await getSuppliers();
        setSuppliers(data);
    }

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { name: "", quantity: 1, unit_price: 0, save_as_product: false }],
        });
    };

    const removeItem = (index: number) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const updateItem = (index: number, field: string, value: string | number | boolean) => {
        const newItems = [...formData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setFormData({ ...formData, items: newItems });
    };

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * (item.unit_price || 0)), 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!formData.supplier_id) {
            toast.error("Please select a supplier");
            return;
        }
        if (formData.items.length === 0) {
            toast.error("Please add at least one item");
            return;
        }

        setLoading(true);
        try {
            const cleanItems = formData.items.map(item => ({
                name: item.name || "Item",
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                save_as_product: item.save_as_product,
            }));

            const res = await createPurchaseOrder({
                supplier_id: formData.supplier_id,
                po_number: formData.po_number,
                date: formData.date,
                note: formData.note,
                items: cleanItems,
            });
            if ('error' in res) {
                toast.error(res.error);
            } else {
                toast.success("Purchase order created successfully");
                onOpenChange(false);
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    const isViewOnly = !!po;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{isViewOnly ? `PO Details: ${po?.po_number}` : "Create Purchase Order"}</DialogTitle>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="po_number">PO Number</Label>
                                    <Input
                                        id="po_number"
                                        value={formData.po_number}
                                        onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                                        disabled={isViewOnly}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input
                                        id="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        disabled={isViewOnly}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    {!isViewOnly && (
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="h-auto p-0 text-xs"
                                            onClick={() => setSupplierDialogOpen(true)}
                                        >
                                            + Add New Supplier
                                        </Button>
                                    )}
                                </div>
                                <Select
                                    value={formData.supplier_id}
                                    onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                                    disabled={isViewOnly}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-2">
                                <Label>Items</Label>
                                <div className="border rounded-md p-2 space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex flex-col gap-2 p-2 bg-muted/50 rounded-md">
                                            <div className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <Input
                                                        placeholder="Item name / description"
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, "name", e.target.value)}
                                                        disabled={isViewOnly}
                                                        required
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Input
                                                        type="number"
                                                        placeholder="Qty"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                                                        disabled={isViewOnly}
                                                        required
                                                    />
                                                </div>
                                                <div className="w-28">
                                                    <Input
                                                        type="number"
                                                        placeholder="Unit Price"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                                                        disabled={isViewOnly}
                                                        required
                                                    />
                                                </div>
                                                <div className="w-24 text-right font-medium text-sm">
                                                    {(item.quantity * item.unit_price).toLocaleString()}
                                                </div>
                                                {!isViewOnly && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(index)}
                                                        disabled={formData.items.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>

                                            {!isViewOnly && (
                                                <div className="flex items-center space-x-2 pl-1">
                                                    <Checkbox
                                                        id={`save_product_${index}`}
                                                        checked={item.save_as_product}
                                                        onCheckedChange={(checked) => updateItem(index, "save_as_product", !!checked)}
                                                    />
                                                    <Label htmlFor={`save_product_${index}`} className="text-xs text-muted-foreground cursor-pointer">
                                                        Save as new product in Catalog (if not exists)
                                                    </Label>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {!isViewOnly && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addItem}
                                            className="w-full mt-2"
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Add Item
                                        </Button>
                                    )}
                                </div>

                                <div className="flex justify-end text-lg font-bold">
                                    Total: {totalAmount.toLocaleString()}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="note">Notes / Terms</Label>
                                <Textarea
                                    id="note"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Add any instructions or payment terms..."
                                    disabled={isViewOnly}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            {isViewOnly ? (
                                <Button type="button" onClick={() => onOpenChange(false)}>
                                    Close
                                </Button>
                            ) : (
                                <>
                                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? "Creating..." : "Create Purchase Order"}
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <SupplierDialog
                open={supplierDialogOpen}
                onOpenChange={setSupplierDialogOpen}
                onSuccess={(newSupplier) => {
                    loadSuppliers();
                    if (newSupplier) {
                        setFormData(prev => ({ ...prev, supplier_id: newSupplier.id }));
                    }
                }}
            />
        </>
    );
}
