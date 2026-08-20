"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash, Plus, Percent, DollarSign, Globe, Calculator, PlusCircle, FileText } from "lucide-react";
import { createBill } from "@/lib/actions/bills";
import { Product, Customer } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useCurrencyStore } from "@/lib/currency/store";
import { formatMoney, SUPPORTED_CURRENCIES, CurrencyCode } from "@/lib/currency";

interface CreateBillDialogProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
    products: Product[];
    customers: Customer[];
}

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

export function CreateBillDialog({ open: controlledOpen, setOpen: setControlledOpen, products, customers }: CreateBillDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const { toast } = useToast();
    const { currency: globalCurrency } = useCurrencyStore();
    const [loading, setLoading] = useState(false);

    // Document Type & Initial Status
    const [docType, setDocType] = useState<"quotation" | "draft" | "paid">("quotation");

    // Form states
    const [customerId, setCustomerId] = useState("");
    const [billCurrency, setBillCurrency] = useState<CurrencyCode>((globalCurrency as CurrencyCode) || "THB");
    const [note, setNote] = useState("");
    const [paymentTerms, setPaymentTerms] = useState<number>(0); // อายุการแจ้งหนี้ (วัน)
    const [validityDays, setValidityDays] = useState<number>(7); // อายุการเสนอราคา (วัน)
    
    // Tax Model: "none" | "exclusive" (คิดเพิ่ม) | "inclusive" (รวมในราคาแล้ว)
    const [taxType, setTaxType] = useState<"none" | "exclusive" | "inclusive">("none");
    const [vatRate, setVatRate] = useState<number>(7);

    // Withholding Tax (ภาษีหัก ณ ที่จ่าย เช่น 1%, 2%, 3%, 5%)
    const [whtRate, setWhtRate] = useState<number>(0);

    const [items, setItems] = useState<LineItem[]>([
        { product_id: "", product_name: "", quantity: 1, unit_price: 0 },
    ]);
    const [adjustments, setAdjustments] = useState<Adjustment[]>([]);

    // Items management
    const addItem = () => {
        setItems([...items, { product_id: "", product_name: "", quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
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

    // Adjustments (Custom discounts/surcharges)
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
    const rawTotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    // Calculate Custom Adjustments
    const customAdjustmentTotal = adjustments.reduce((sum, adj) => {
        if (adj.type === "percent") {
            return sum + (rawTotal * adj.value) / 100;
        }
        return sum + adj.value;
    }, 0);

    const baseAmount = Math.max(0, rawTotal + customAdjustmentTotal);

    // VAT Calculations
    let netBeforeVat = baseAmount;
    let vatAmount = 0;
    let totalAfterVat = baseAmount;

    if (taxType === "exclusive") {
        // คิด VAT เพิ่ม (Add-on)
        vatAmount = (baseAmount * vatRate) / 100;
        totalAfterVat = baseAmount + vatAmount;
        netBeforeVat = baseAmount;
    } else if (taxType === "inclusive") {
        // รวม VAT แล้ว (Inclusive: ดึงยอดก่อน VAT ออกมา)
        netBeforeVat = (baseAmount * 100) / (100 + vatRate);
        vatAmount = baseAmount - netBeforeVat;
        totalAfterVat = baseAmount;
    }

    // Withholding Tax Calculation (คิดจากยอดก่อน VAT)
    const whtAmount = whtRate > 0 ? (netBeforeVat * whtRate) / 100 : 0;
    const finalPayable = Math.max(0, totalAfterVat - whtAmount);

    const handleSubmit = async () => {
        if (!customerId) {
            toast({ title: "Error", description: "กรุณาเลือกลูกค้า", variant: "destructive" });
            return;
        }
        const validItems = items.filter((i) => i.product_id && i.quantity > 0);
        if (validItems.length === 0) {
            toast({ title: "Error", description: "กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ", variant: "destructive" });
            return;
        }

        // Build comprehensive adjustments array
        const finalAdjustments: Adjustment[] = [
            ...adjustments.filter((a) => a.label.trim() && a.value !== 0)
        ];

        if (taxType === "exclusive") {
            finalAdjustments.push({
                label: `VAT ${vatRate}% (ภาษีมูลค่าเพิ่มคิดแยก)`,
                type: "fixed",
                value: Number(vatAmount.toFixed(2)),
            });
        } else if (taxType === "inclusive") {
            finalAdjustments.push({
                label: `VAT ${vatRate}% (รวมในราคาสินค้าแล้ว)`,
                type: "fixed",
                value: 0,
            });
        }

        if (whtRate > 0) {
            finalAdjustments.push({
                label: `หักภาษี ณ ที่จ่าย (${whtRate}%)`,
                type: "fixed",
                value: -Number(whtAmount.toFixed(2)),
            });
        }

        setLoading(true);
        try {
            const result = (await createBill({
                customer_id: customerId,
                status: docType,
                note: note ? `${note}\n[ราคาก่อน VAT: ฿${netBeforeVat.toFixed(2)} | VAT: ฿${vatAmount.toFixed(2)}${whtAmount > 0 ? ` | หัก ณ ที่จ่าย: -฿${whtAmount.toFixed(2)}` : ""}]` : undefined,
                items: validItems,
                adjustments: finalAdjustments,
                payment_terms: paymentTerms,
                validity_days: validityDays,
            })) as any;

            if (result.success) {
                const docLabel = docType === "quotation" ? "ใบเสนอราคา" : docType === "draft" ? "ใบแจ้งหนี้" : "ใบเสร็จรับเงิน";
                toast({
                    title: `สร้าง${docLabel}สำเร็จ`,
                    description: `ยอดรวม ${formatMoney(finalPayable, billCurrency)} บันทึกเรียบร้อยแล้ว`,
                });
                setOpen(false);
                // Reset
                setCustomerId("");
                setNote("");
                setTaxType("none");
                setWhtRate(0);
                setItems([{ product_id: "", product_name: "", quantity: 1, unit_price: 0 }]);
                setAdjustments([]);
            } else {
                toast({ title: "Error", description: result.error, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to issue document", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button size="sm" className="h-8 text-xs gap-1.5 font-medium cursor-pointer">
                        <PlusCircle className="h-3.5 w-3.5" />
                        ออกเอกสาร
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        ออกเอกสาร (Issue Document)
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-3">
                    {/* Document Type Selector (Status) */}
                    <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1.5">
                        <Label className="text-xs font-bold text-foreground">ประเภทเอกสารที่ต้องการออก (สถานะเริ่มต้น)</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                onClick={() => setDocType("quotation")}
                                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                                    docType === "quotation"
                                        ? "border-sky-500 bg-sky-500/10 text-sky-700 shadow-2xs font-bold ring-1 ring-sky-500"
                                        : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <p className="leading-tight">ใบเสนอราคา</p>
                                <span className="text-[10px] font-normal text-muted-foreground">Quotation</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocType("draft")}
                                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                                    docType === "draft"
                                        ? "border-amber-500 bg-amber-500/10 text-amber-700 shadow-2xs font-bold ring-1 ring-amber-500"
                                        : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <p className="leading-tight">ใบแจ้งหนี้</p>
                                <span className="text-[10px] font-normal text-muted-foreground">Invoice (Pending)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setDocType("paid")}
                                className={`p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer text-left ${
                                    docType === "paid"
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 shadow-2xs font-bold ring-1 ring-emerald-500"
                                        : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <p className="leading-tight">ใบเสร็จรับเงิน</p>
                                <span className="text-[10px] font-normal text-muted-foreground">Receipt / Paid</span>
                            </button>
                        </div>
                    </div>

                    {/* Header Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="customer" className="text-xs font-semibold">เลือกลูกค้า (Customer) *</Label>
                            <select
                                id="customer"
                                value={customerId}
                                onChange={(e) => setCustomerId(e.target.value)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                            >
                                <option value="">-- เลือกลูกค้า --</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} {c.tax_id ? `[Tax: ${c.tax_id}]` : ""} ({c.phone || c.email || "No contact"})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="currency" className="text-xs font-semibold">สกุลเงิน (Currency)</Label>
                            <select
                                id="currency"
                                value={billCurrency}
                                onChange={(e) => setBillCurrency(e.target.value as CurrencyCode)}
                                className="h-9 rounded-md border border-input bg-background px-3 text-xs"
                            >
                                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} ({c.symbol})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Validity and Terms */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                            <Label htmlFor="validity_days" className="text-xs font-semibold">
                                อายุการเสนอราคา (วัน)
                            </Label>
                            <Input
                                id="validity_days"
                                type="number"
                                min={1}
                                value={validityDays}
                                onChange={(e) => setValidityDays(parseInt(e.target.value) || 7)}
                                placeholder="เช่น 7 วัน, 15 วัน, 30 วัน"
                                className="h-9 text-xs"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="payment_terms" className="text-xs font-semibold">
                                อายุการแจ้งหนี้ / กำหนดชำระ (วัน)
                            </Label>
                            <Input
                                id="payment_terms"
                                type="number"
                                min={0}
                                value={paymentTerms}
                                onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 0)}
                                placeholder="เช่น 0 = ชำระทันที, 30 วัน"
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold">รายการสินค้าและบริการ (Line Items)</Label>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex flex-col md:flex-row md:items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border/80 text-xs"
                                >
                                    <div className="flex-1 w-full">
                                        <select
                                            value={item.product_id}
                                            onChange={(e) => updateItem(index, "product_id", e.target.value)}
                                            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                                        >
                                            <option value="">-- เลือกสินค้า --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} {p.sku ? `[${p.sku}]` : ""} ({formatMoney(p.price, billCurrency)} | คลัง: {p.stock})
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
                                            className="w-16 h-8 text-center text-xs font-mono"
                                            placeholder="จำนวน"
                                        />
                                        <span className="text-xs font-mono font-bold w-24 text-right">
                                            {formatMoney(item.quantity * item.unit_price, billCurrency)}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                            onClick={() => removeItem(index)}
                                            disabled={items.length <= 1}
                                        >
                                            <Trash className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-fit h-7 text-xs gap-1">
                            <Plus className="h-3 w-3" /> เพิ่มรายการสินค้า
                        </Button>
                    </div>

                    {/* Tax & VAT Engine Options */}
                    <div className="p-3.5 rounded-xl bg-card border border-border space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <Calculator className="h-4 w-4 text-primary" />
                                การคำนวณภาษีมูลค่าเพิ่ม (VAT) และหัก ณ ที่จ่าย
                            </Label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* VAT Mode */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-muted-foreground font-medium">รูปแบบภาษีมูลค่าเพิ่ม (VAT)</Label>
                                <select
                                    value={taxType}
                                    onChange={(e) => setTaxType(e.target.value as any)}
                                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                                >
                                    <option value="none">ไม่มี VAT (0% / ยกเว้นภาษี)</option>
                                    <option value="exclusive">คิด VAT เพิ่มเติม (+7% แยกต่างหาก)</option>
                                    <option value="inclusive">ราคาสินค้ารวม VAT แล้ว (ดึง VAT 7% ในตัว)</option>
                                </select>
                            </div>

                            {/* Withholding Tax */}
                            <div className="space-y-1.5">
                                <Label className="text-[11px] text-muted-foreground font-medium">ภาษีหัก ณ ที่จ่าย (Withholding Tax)</Label>
                                <select
                                    value={whtRate}
                                    onChange={(e) => setWhtRate(parseFloat(e.target.value) || 0)}
                                    className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs font-medium"
                                >
                                    <option value={0}>ไม่หัก ณ ที่จ่าย (0%)</option>
                                    <option value={1}>หัก ณ ที่จ่าย 1% (ค่าขนส่ง)</option>
                                    <option value={2}>หัก ณ ที่จ่าย 2% (ค่าโฆษณา)</option>
                                    <option value={3}>หัก ณ ที่จ่าย 3% (ค่าบริการ / วิชาชีพอิสระ)</option>
                                    <option value={5}>หัก ณ ที่จ่าย 5% (ค่าเช่าทรัพย์สิน)</option>
                                </select>
                            </div>
                        </div>

                        {/* Custom Discount/Adjustment */}
                        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                            <span className="text-[11px] text-muted-foreground">ส่วนลดหรือค่าบริการเพิ่มเติม</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addAdjustment}
                                className="h-7 text-xs text-primary hover:bg-primary/10 gap-1 cursor-pointer"
                            >
                                <Percent className="h-3 w-3" /> + เพิ่มส่วนลด / ค่าจัดส่ง
                            </Button>
                        </div>

                        {adjustments.length > 0 && (
                            <div className="space-y-2 pt-1">
                                {adjustments.map((adj, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-2 bg-muted/60 rounded-lg border text-xs"
                                    >
                                        <Input
                                            value={adj.label}
                                            onChange={(e) => updateAdjustment(index, "label", e.target.value)}
                                            placeholder="เช่น ส่วนลดพิเศษ, ค่าจัดส่ง"
                                            className="flex-1 h-7 text-xs"
                                        />
                                        <div className="flex items-center gap-1.5">
                                            <select
                                                value={adj.type}
                                                onChange={(e) => updateAdjustment(index, "type", e.target.value)}
                                                className="h-7 rounded-md border border-input bg-background px-1.5 text-xs w-14"
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
                                                className="w-16 h-7 text-right text-xs"
                                                placeholder="0"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                onClick={() => removeAdjustment(index)}
                                            >
                                                <Trash className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Breakdown Summary Calculation Box */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between text-muted-foreground">
                            <span>มูลค่าสินค้าก่อนภาษี (Subtotal):</span>
                            <span>{formatMoney(netBeforeVat, billCurrency)}</span>
                        </div>
                        {taxType !== "none" && (
                            <div className="flex justify-between text-muted-foreground">
                                <span>
                                    ภาษีมูลค่าเพิ่ม VAT {vatRate}% {taxType === "inclusive" ? "(รวมในราคาแล้ว)" : "(คิดเพิ่ม)"}:
                                </span>
                                <span className={taxType === "exclusive" ? "text-primary font-bold" : ""}>
                                    {formatMoney(vatAmount, billCurrency)}
                                </span>
                            </div>
                        )}
                        {whtRate > 0 && (
                            <div className="flex justify-between text-amber-600 font-medium">
                                <span>หัก ภาษี ณ ที่จ่าย ({whtRate}%):</span>
                                <span>-{formatMoney(whtAmount, billCurrency)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-border font-sans">
                            <span className="text-xs font-bold text-foreground">ยอดรวมสุทธิที่ต้องชำระ (Total Payable):</span>
                            <span className="text-base font-bold text-primary font-mono">{formatMoney(finalPayable, billCurrency)}</span>
                        </div>
                    </div>

                    {/* Note */}
                    <div className="grid gap-1.5">
                        <Label htmlFor="note" className="text-xs font-semibold">หมายเหตุท้ายเอกสาร (Note / Bank Info)</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="ระบุเลขบัญชีธนาคารสำหรับโอนเงิน หรือเงื่อนไขเพิ่มเติม..."
                            className="text-xs min-h-[50px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="h-8 text-xs cursor-pointer">
                        ยกเลิก
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} size="sm" className="h-8 text-xs font-semibold bg-primary text-primary-foreground cursor-pointer">
                        {loading ? "กำลังบันทึก..." : `ออก${docType === "quotation" ? "ใบเสนอราคา" : docType === "draft" ? "ใบแจ้งหนี้" : "ใบเสร็จรับเงิน"}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
