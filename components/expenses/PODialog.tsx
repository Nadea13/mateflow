"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createPurchaseOrder } from "@/lib/actions/purchase-orders";
import { getSuppliers } from "@/lib/actions/suppliers";
import { PurchaseOrder, Supplier } from "@/types";
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
        date: po?.date || new Uint8Array(10).toString().split('T')[0], // placeholder for now, will fix below
        note: po?.note || "",
        items: po?.items?.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
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

    const totalAmount = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

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
            const res = await createPurchaseOrder(formData);
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
                            <DialogTitle>{isViewOnly ? `PO Details: ${po.po_number}` : "Create Purchase Order"}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <div className="flex gap-2">
                                        <Select
                                            disabled={isViewOnly}
                                            value={formData.supplier_id}
                                            onValueChange={(val) => setFormData({ ...formData, supplier_id: val })}
                                        >
                                            <SelectTrigger id="supplier">
                                                <SelectValue placeholder="Select supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map(s => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {!isViewOnly && (
                                            <Button type="button" variant="outline" size="icon" onClick={() => setSupplierDialogOpen(true)}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="po_number">PO Number</Label>
                                    <Input
                                        id="po_number"
                                        value={formData.po_number}
                                        onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                                        readOnly={isViewOnly}
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
                                        readOnly={isViewOnly}
                                        required
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Input
                                        id="status"
                                        value={po?.status || "Draft"}
                                        readOnly
                                        className="bg-muted"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Items</Label>
                                    {!isViewOnly && (
                                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Item
                                        </Button>
                                    )}
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead className="w-[100px]">Qty</TableHead>
                                            <TableHead className="w-[120px]">Price</TableHead>
                                            {!isViewOnly && <TableHead className="w-[100px] text-center">Product</TableHead>}
                                            <TableHead className="w-[120px] text-right">Total</TableHead>
                                            {!isViewOnly && <TableHead className="w-[50px]"></TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {formData.items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Input
                                                        value={item.name}
                                                        onChange={(e) => updateItem(index, "name", e.target.value)}
                                                        placeholder="Item name"
                                                        readOnly={isViewOnly}
                                                        required
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                                                        min="0.01"
                                                        step="0.01"
                                                        readOnly={isViewOnly}
                                                        required
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        value={item.unit_price}
                                                        onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value))}
                                                        min="0"
                                                        step="0.01"
                                                        readOnly={isViewOnly}
                                                        required
                                                    />
                                                </TableCell>
                                                {!isViewOnly && (
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={item.save_as_product}
                                                            onCheckedChange={(checked) => updateItem(index, "save_as_product", !!checked)}
                                                        />
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-right">
                                                    {(item.quantity * item.unit_price).toLocaleString()}
                                                </TableCell>
                                                {!isViewOnly && (
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeItem(index)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="flex justify-end pt-2">
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total Amount</p>
                                        <p className="text-2xl font-bold">{totalAmount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="note">Notes</Label>
                                <Textarea
                                    id="note"
                                    value={formData.note}
                                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Any additional information..."
                                    readOnly={isViewOnly}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                                {isViewOnly ? "Close" : "Cancel"}
                            </Button>
                            {!isViewOnly && (
                                <Button type="submit" size="sm" disabled={loading}>
                                    {loading ? "Creating..." : "Create PO"}
                                </Button>
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
                        setFormData({ ...formData, supplier_id: newSupplier.id });
                    }
                }}
            />
        </>
    );
}
