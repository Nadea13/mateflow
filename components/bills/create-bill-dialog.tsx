"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBill } from "@/lib/actions/bills";
import { Customer, Product } from "@/types";
import { Plus, Trash, Receipt, Percent, Tags } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

interface LineItem {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
}

interface Adjustment {
    label: string;
    type: "percent" | "fixed";
    value: number;
}

interface CreateBillDialogProps {
    customers: Customer[];
    products: Product[];
}

export function CreateBillDialog({ customers, products }: CreateBillDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customerId, setCustomerId] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState<LineItem[]>([
        { product_id: "", product_name: "", quantity: 1, unit_price: 0 },
    ]);
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [paymentTerms, setPaymentTerms] = useState(0);
    const [validityDays, setValidityDays] = useState(7);
    const [includeVat, setIncludeVat] = useState(false);
    const { toast } = useToast();

    const addItem = () => {
        setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        if (items.length <= 1) return;
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...items];
        if (field === "product_id") {
            const product = products.find(p => p.id === value);
            if (product) {
                updated[index] = {
                    ...updated[index],
                    product_id: product.id,
                    product_name: product.name,
                    unit_price: product.price,
                };
            }
        } else {
            (updated[index] as any)[field] = value;
        }
        setItems(updated);
    };

    // Adjustments
    const addAdjustment = () => {
        setAdjustments([...adjustments, { label: "", type: "percent", value: 0 }]);
    };

    const removeAdjustment = (index: number) => {
        setAdjustments(adjustments.filter((_, i) => i !== index));
    };

    const updateAdjustment = (index: number, field: keyof Adjustment, value: string | number) => {
        const updated = [...adjustments];
        (updated[index] as any)[field] = value;
        setAdjustments(updated);
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    const adjustmentAmounts = adjustments.map(adj => {
        if (adj.type === "percent") {
            return (subtotal * adj.value) / 100;
        }
        return adj.value;
    });

    const totalAdjustments = adjustmentAmounts.reduce((sum, amt) => sum + amt, 0);
    const grandTotal = Math.max(0, subtotal + totalAdjustments);

    const handleSubmit = async () => {
        if (!customerId) {
            toast({ title: "Error", description: "Please select a customer.", variant: "destructive" });
            return;
        }
        const validItems = items.filter(i => i.product_id && i.quantity > 0);
        if (validItems.length === 0) {
            toast({ title: "Error", description: "Please add at least one product.", variant: "destructive" });
            return;
        }

        // Filter out empty adjustments
        const validAdjustments = adjustments.filter(a => a.label.trim() && a.value !== 0);

        setLoading(true);
        try {
            const result = await createBill({
                customer_id: customerId,
                note,
                items: validItems,
                adjustments: validAdjustments,
                payment_terms: paymentTerms,
                validity_days: validityDays,
            }) as any;

            if (result.success) {
                toast({ title: "Bill Created", description: `Bill ฿${grandTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} created.` });
                setOpen(false);
                // Reset
                setCustomerId("");
                setNote("");
                setItems([{ product_id: "", product_name: "", quantity: 1, unit_price: 0 }]);
                setAdjustments([]);
                setPaymentTerms(0);
                setValidityDays(7);
                setIncludeVat(false);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Unexpected error.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2 });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Receipt className="mr-2 h-4 w-4" /> Create Bill
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Bill</DialogTitle>
                    <DialogDescription>Select a customer and add products.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Customer Select */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="customer">Customer</Label>
                        <select
                            id="customer"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <option value="">Select customer...</option>
                            {customers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="payment_terms">Credit (Days)</Label>
                            <Input
                                id="payment_terms"
                                type="number"
                                min={0}
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 0)}
                                placeholder="0 = Cash"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="validity_days">Valid (Days)</Label>
                            <Input
                                id="validity_days"
                                type="number"
                                min={1}
                                value={validityDays}
                                onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="grid gap-2">
                        <Label>Products</Label>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-muted rounded-lg border">
                                    <div className="flex-1 w-full">
                                        <select
                                            value={item.product_id}
                                            onChange={(e) => updateItem(index, "product_id", e.target.value)}
                                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                            <option value="">Select product...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (฿{p.price} / Stock: {p.stock})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-center gap-2 justify-between md:justify-end w-full md:w-auto">
                                        <Input
                                            type="number"
                                            min={1}
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                            className="w-20 h-9 text-center"
                                            placeholder="Qty"
                                        />
                                        <span className="text-sm font-mono w-24 text-right">
                                            ฿{fmt(item.quantity * item.unit_price)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-400 hover:text-red-600"
                                            onClick={() => removeItem(index)}
                                            disabled={items.length <= 1}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm" onClick={addItem} className="w-fit">
                            <Plus className="mr-1 h-4 w-4" /> Add Item
                        </Button>
                    </div>

                    {/* Subtotal */}
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm text-muted-foreground">Subtotal</span>
                        <span className="text-sm font-mono font-medium">฿{fmt(subtotal)}</span>
                    </div>

                    {/* Adjustments (Discounts / Taxes) */}
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Tags className="h-4 w-4" /> Discount / Tax
                        </Label>
                        <div className="flex items-center space-x-2 pb-2">
                            <Checkbox
                                id="vat"
                                checked={includeVat}
                                onCheckedChange={(checked) => {
                                    setIncludeVat(!!checked);
                                    if (checked) {
                                        // Add VAT adjustment if not exists
                                        if (!adjustments.some(a => a.label === "VAT 7%")) {
                                            setAdjustments([...adjustments, { label: "VAT 7%", type: "percent", value: 7 }]);
                                        }
                                    } else {
                                        // Remove VAT adjustment
                                        setAdjustments(adjustments.filter(a => a.label !== "VAT 7%"));
                                    }
                                }}
                            />
                            <label
                                htmlFor="vat"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                Apply VAT 7%
                            </label>
                        </div>
                        {adjustments.length > 0 && (
                            <div className="space-y-2">
                                {adjustments.map((adj, index) => (
                                    <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-muted rounded-lg border">
                                        <Input
                                            value={adj.label}
                                            onChange={(e) => updateAdjustment(index, "label", e.target.value)}
                                            placeholder="e.g. Discount, VAT 7%"
                                            className="w-full md:flex-1 h-9"
                                        />
                                        <div className="flex items-center gap-2 justify-between md:justify-end w-full md:w-auto">
                                            <div className="flex items-center gap-1">
                                                <select
                                                    value={adj.type}
                                                    onChange={(e) => updateAdjustment(index, "type", e.target.value)}
                                                    className="h-9 rounded-md border border-input bg-background px-2 text-sm w-16"
                                                >
                                                    <option value="percent">%</option>
                                                    <option value="fixed">฿</option>
                                                </select>
                                                <Input
                                                    type="number"
                                                    value={adj.value}
                                                    onChange={(e) => updateAdjustment(index, "value", parseFloat(e.target.value) || 0)}
                                                    className="w-20 h-9 text-right"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <span className="text-xs font-mono w-20 text-right text-muted-foreground whitespace-nowrap">
                                                {adj.type === "percent"
                                                    ? `฿${fmt((subtotal * adj.value) / 100)}`
                                                    : `฿${fmt(adj.value)}`
                                                }
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-600"
                                                onClick={() => removeAdjustment(index)}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <Button variant="outline" size="sm" onClick={addAdjustment} className="w-fit">
                            <Percent className="mr-1 h-4 w-4" /> Add Discount / Tax
                        </Button>
                    </div>

                    {/* Note */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="note">Note (optional)</Label>
                        <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Additional notes..." />
                    </div>

                    {/* Grand Total */}
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
                        <span className="text-xl font-bold text-primary">
                            ฿{fmt(grandTotal)}
                        </span>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Creating..." : "Create Bill"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
