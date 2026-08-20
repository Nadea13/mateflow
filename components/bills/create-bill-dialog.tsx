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
import { Plus, Trash, Receipt, Percent, Tags, Globe } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyStore } from "@/lib/currency/store";
import { formatMoney, SUPPORTED_CURRENCIES, CurrencyCode } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/provider";

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
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    showTrigger?: boolean;
}

export function CreateBillDialog({
    customers,
    products,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
    showTrigger = true,
}: CreateBillDialogProps) {
    const { t } = useTranslation();
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;
    
    const [loading, setLoading] = useState(false);
    const [customerId, setCustomerId] = useState("");
    const [note, setNote] = useState("");
    const [items, setItems] = useState<LineItem[]>([
        { product_id: "", product_name: "", quantity: 1, unit_price: 0 },
    ]);
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
    const [paymentTerms, setPaymentTerms] = useState(0);
    const [validityDays, setValidityDays] = useState(7);
    const [taxPreset, setTaxPreset] = useState("none");

    const { currency: globalCurrency } = useCurrencyStore();
    const [billCurrency, setBillCurrency] = useState<CurrencyCode>(globalCurrency);
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
            const product = products.find((p) => p.id === value);
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

    const handleTaxPresetChange = (preset: string) => {
        setTaxPreset(preset);
        // Remove existing standard taxes first
        const nonTaxAdjustments = adjustments.filter(
            (a) => !["VAT 7%", "VAT 20% (UK/EU)", "US Sales Tax (8.25%)", "GST 10% (AU)", "GST 9% (SG)"].includes(a.label)
        );

        if (preset === "vat_7") {
            setAdjustments([...nonTaxAdjustments, { label: "VAT 7%", type: "percent", value: 7 }]);
        } else if (preset === "vat_20") {
            setAdjustments([...nonTaxAdjustments, { label: "VAT 20% (UK/EU)", type: "percent", value: 20 }]);
        } else if (preset === "us_sales_tax") {
            setAdjustments([...nonTaxAdjustments, { label: "US Sales Tax (8.25%)", type: "percent", value: 8.25 }]);
        } else if (preset === "gst_au") {
            setAdjustments([...nonTaxAdjustments, { label: "GST 10% (AU)", type: "percent", value: 10 }]);
        } else if (preset === "gst_sg") {
            setAdjustments([...nonTaxAdjustments, { label: "GST 9% (SG)", type: "percent", value: 9 }]);
        } else {
            setAdjustments(nonTaxAdjustments);
        }
    };

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    const adjustmentAmounts = adjustments.map((adj) => {
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
        const validItems = items.filter((i) => i.product_id && i.quantity > 0);
        if (validItems.length === 0) {
            toast({ title: "Error", description: "Please add at least one product.", variant: "destructive" });
            return;
        }

        const validAdjustments = adjustments.filter((a) => a.label.trim() && a.value !== 0);

        setLoading(true);
        try {
            const result = (await createBill({
                customer_id: customerId,
                note,
                items: validItems,
                adjustments: validAdjustments,
                payment_terms: paymentTerms,
                validity_days: validityDays,
            })) as any;

            if (result.success) {
                toast({
                    title: "Invoice Created",
                    description: `Invoice ${formatMoney(grandTotal, billCurrency)} created successfully.`,
                });
                setOpen(false);
                // Reset
                setCustomerId("");
                setNote("");
                setItems([{ product_id: "", product_name: "", quantity: 1, unit_price: 0 }]);
                setAdjustments([]);
                setPaymentTerms(0);
                setValidityDays(7);
                setTaxPreset("none");
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Unexpected error.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {showTrigger && (
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs gap-1.5 font-medium">
                        <Receipt className="h-3.5 w-3.5" /> {t("bills.createBill")}
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create International Commercial Invoice</DialogTitle>
                    <DialogDescription>Select customer, currency, tax jurisdiction, and line items.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Customer & Currency */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 grid gap-1.5">
                            <Label htmlFor="customer">Customer *</Label>
                            <select
                                id="customer"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <option value="">Select customer...</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.country ? `(${c.country})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="currency">Currency</Label>
                            <select
                                id="currency"
                                value={billCurrency}
                                onChange={(e) => setBillCurrency(e.target.value as CurrencyCode)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background font-semibold"
                            >
                                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="payment_terms">Payment Terms (Credit Days)</Label>
                            <Input
                                id="payment_terms"
                                type="number"
                                min={0}
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 0)}
                                placeholder="0 = Due on Receipt (Cash)"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="validity_days">Quote Validity (Days)</Label>
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
                        <Label>Line Items & Products</Label>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-muted rounded-lg border"
                                >
                                    <div className="flex-1 w-full">
                                        <select
                                            value={item.product_id}
                                            onChange={(e) => updateItem(index, "product_id", e.target.value)}
                                            className="w-full h-9 rounded-md border border-input bg-background px-2 text-sm"
                                        >
                                            <option value="">Select product...</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.sku ? `[${p.sku}]` : ""} ({formatMoney(p.price, billCurrency)} / Stock: {p.stock})
                                                </option>
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
                                            {formatMoney(item.quantity * item.unit_price, billCurrency)}
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
                    <div className="flex items-center justify-between px-3 py-2 bg-muted/40 rounded">
                        <span className="text-sm text-muted-foreground font-medium">Subtotal</span>
                        <span className="text-sm font-mono font-bold">{formatMoney(subtotal, billCurrency)}</span>
                    </div>

                    {/* Global Tax Engine Presets */}
                    <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary" /> Tax Engine / Jurisdiction
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <select
                                value={taxPreset}
                                onChange={(e) => handleTaxPresetChange(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                            >
                                <option value="none">Zero Tax / Tax Exempt</option>
                                <option value="vat_7">🇹🇭 Thailand VAT (7%)</option>
                                <option value="vat_20">🇬🇧/🇪🇺 UK & EU Standard VAT (20%)</option>
                                <option value="us_sales_tax">🇺🇸 US General Sales Tax (~8.25%)</option>
                                <option value="gst_au">🇦🇺 Australia GST (10%)</option>
                                <option value="gst_sg">🇸🇬 Singapore GST (9%)</option>
                            </select>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addAdjustment}
                                className="flex items-center gap-1"
                            >
                                <Percent className="h-3.5 w-3.5" /> Add Custom Discount / Fee
                            </Button>
                        </div>

                        {adjustments.length > 0 && (
                            <div className="space-y-2 mt-2">
                                {adjustments.map((adj, index) => (
                                    <div
                                        key={index}
                                        className="flex flex-col md:flex-row md:items-center gap-2 p-2.5 bg-muted/60 rounded-lg border text-sm"
                                    >
                                        <Input
                                            value={adj.label}
                                            onChange={(e) => updateAdjustment(index, "label", e.target.value)}
                                            placeholder="e.g. Volume Discount, Freight / Shipping"
                                            className="w-full md:flex-1 h-8 text-sm"
                                        />
                                        <div className="flex items-center gap-2 justify-between md:justify-end w-full md:w-auto">
                                            <div className="flex items-center gap-1">
                                                <select
                                                    value={adj.type}
                                                    onChange={(e) => updateAdjustment(index, "type", e.target.value)}
                                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs w-16"
                                                >
                                                    <option value="percent">%</option>
                                                    <option value="fixed">{SUPPORTED_CURRENCIES[billCurrency].symbol}</option>
                                                </select>
                                                <Input
                                                    type="number"
                                                    value={adj.value}
                                                    onChange={(e) =>
                                                        updateAdjustment(index, "value", parseFloat(e.target.value) || 0)
                                                    }
                                                    className="w-20 h-8 text-right text-sm"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <span className="text-xs font-mono w-24 text-right text-muted-foreground whitespace-nowrap">
                                                {adj.type === "percent"
                                                    ? formatMoney((subtotal * adj.value) / 100, billCurrency)
                                                    : formatMoney(adj.value, billCurrency)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-400 hover:text-red-600"
                                                onClick={() => removeAdjustment(index)}
                                            >
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="note">Commercial Terms & Note</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Incoterms (e.g. FOB, CIF), bank wire instructions, or customer reference..."
                        />
                    </div>

                    {/* Grand Total */}
                    <div className="flex items-center justify-between p-3.5 bg-primary/10 rounded-lg border border-primary/20">
                        <span className="text-sm font-semibold text-foreground">Total Payable Amount</span>
                        <span className="text-xl font-bold text-primary font-mono">{formatMoney(grandTotal, billCurrency)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Issuing Invoice..." : "Issue Commercial Invoice"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
