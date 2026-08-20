"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bill } from "@/types";
import { Printer, Download, QrCode, FileText, Receipt, CheckCircle, Building2, Phone, Mail, MapPin, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import QRCode from "qrcode";
import promptpayQR from "promptpay-qr";

interface BillViewerDialogProps {
    bill: Bill | null;
    storeProfile?: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BillViewerDialog({ bill, storeProfile, open, onOpenChange }: BillViewerDialogProps) {
    const [template, setTemplate] = useState<"a4" | "slip">("a4");
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
    const printAreaRef = useRef<HTMLDivElement>(null);

    // Generate PromptPay QR Code based on store tax_id or phone and bill total
    useEffect(() => {
        if (!bill || !open) return;

        const targetAccount = storeProfile?.tax_id || storeProfile?.store_phone || "0800000000";
        try {
            const payload = promptpayQR(targetAccount, { amount: Number(bill.total_amount) });
            QRCode.toDataURL(payload, { width: 180, margin: 1 }, (err, url) => {
                if (!err && url) {
                    setQrCodeDataUrl(url);
                }
            });
        } catch (e) {
            console.warn("Could not generate PromptPay QR:", e);
        }
    }, [bill, storeProfile, open]);

    if (!bill) return null;

    const handlePrint = () => {
        window.print();
    };

    const billDate = new Date(bill.created_at).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const billNumber = `INV-${bill.id.slice(0, 8).toUpperCase()}`;

    // Determine if VAT / Tax was included in adjustments or store settings
    const hasVat = bill.adjustments && bill.adjustments.some(
        (adj) => adj.label?.toLowerCase().includes("vat") || adj.label?.toLowerCase().includes("tax") || adj.label?.includes("ภาษี")
    );

    // Dynamic Title Logic based on status & VAT
    let documentTitleThai = "ใบแจ้งหนี้";
    let documentTitleEn = "INVOICE";

    if (bill.status === "draft") {
        documentTitleThai = "ใบแจ้งหนี้";
        documentTitleEn = "INVOICE (DRAFT)";
    } else if (bill.status === "paid") {
        if (hasVat) {
            documentTitleThai = "ใบเสร็จรับเงิน / ใบกำกับภาษี";
            documentTitleEn = "RECEIPT / TAX INVOICE";
        } else {
            documentTitleThai = "ใบเสร็จรับเงิน";
            documentTitleEn = "RECEIPT";
        }
    } else if (bill.status === "cancelled") {
        documentTitleThai = "ใบแจ้งหนี้ (ยกเลิก)";
        documentTitleEn = "VOID INVOICE";
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6 print:p-0 print:max-w-none print:shadow-none print:border-none">
                {/* Actions Toolbar - Hidden during print */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border print:hidden">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base font-semibold">
                                {documentTitleThai}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                รหัสเอกสาร: {billNumber} • สถานะ: <span className="uppercase font-semibold text-foreground">{bill.status}</span>
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Template Switcher */}
                        <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/80">
                            <button
                                type="button"
                                onClick={() => setTemplate("a4")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    template === "a4" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                A4 เต็มรูป
                            </button>
                            <button
                                type="button"
                                onClick={() => setTemplate("slip")}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                    template === "slip" ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                สลิป 80mm
                            </button>
                        </div>

                        {/* Print Button */}
                        <Button
                            size="sm"
                            onClick={handlePrint}
                            className="h-8 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shadow-xs cursor-pointer"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            พิมพ์เอกสาร (Print / PDF)
                        </Button>
                    </div>
                </div>

                {/* Printable Document Canvas */}
                <div ref={printAreaRef} className="flex justify-center p-2 sm:p-4 bg-muted/20 rounded-xl">
                    {template === "a4" ? (
                        /* ================= A4 TAX INVOICE / RECEIPT TEMPLATE ================= */
                        <div className="w-full max-w-[760px] bg-card text-card-foreground p-8 rounded-xl shadow-xs border border-border print:border-none print:shadow-none print:p-0 print:w-full">
                            {/* Header: Store Info & Document Title */}
                            <div className="flex justify-between items-start border-b border-border pb-6">
                                <div className="space-y-1.5 max-w-[420px]">
                                    {storeProfile?.avatar_url ? (
                                        <img
                                            src={storeProfile.avatar_url}
                                            alt="Store Logo"
                                            className="h-14 w-14 rounded-lg object-contain mb-2 border border-border/60"
                                        />
                                    ) : null}
                                    <h2 className="text-lg font-bold text-foreground">
                                        {storeProfile?.store_name || "Mateflow Official Store"}
                                    </h2>
                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                                        {storeProfile?.store_address || "ที่อยู่สำนักงานใหญ่"}
                                    </p>
                                    <div className="text-xs text-muted-foreground pt-1 space-y-0.5 font-mono">
                                        {storeProfile?.tax_id && <p>เลขประจำตัวผู้เสียภาษี: {storeProfile.tax_id}</p>}
                                        {storeProfile?.store_phone && <p>โทรศัพท์: {storeProfile.store_phone}</p>}
                                    </div>
                                </div>

                                <div className="text-right space-y-2">
                                    <div className="inline-block px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg font-bold text-sm">
                                        {documentTitleThai}
                                    </div>
                                    <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{documentTitleEn}</p>
                                    <div className="text-xs space-y-1 font-mono pt-1">
                                        <p><span className="text-muted-foreground">เลขที่:</span> <span className="font-bold text-foreground">{billNumber}</span></p>
                                        <p><span className="text-muted-foreground">วันที่:</span> {billDate}</p>
                                        <p><span className="text-muted-foreground">สถานะ:</span> <span className={`uppercase font-semibold ${bill.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{bill.status}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="py-4 border-b border-border/80 grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ลูกค้า (Customer)</span>
                                    <p className="text-sm font-semibold text-foreground mt-0.5">{bill.customer_name || "ลูกค้าทั่วไป (Guest)"}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">เงื่อนไขการชำระเงิน</span>
                                    <p className="font-medium text-foreground mt-0.5">
                                        {bill.status === "paid" ? "ชำระเงินเรียบร้อยแล้ว (Paid)" : "รอการชำระเงิน (Pending)"}
                                    </p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="py-4">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-border/80 text-muted-foreground font-semibold">
                                            <th className="py-2 text-left w-10">#</th>
                                            <th className="py-2 text-left">รายการสินค้า (Description)</th>
                                            <th className="py-2 text-center w-20">จำนวน</th>
                                            <th className="py-2 text-right w-24">ราคา/หน่วย</th>
                                            <th className="py-2 text-right w-28">จำนวนเงิน (฿)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/40">
                                        {bill.items && bill.items.length > 0 ? (
                                            bill.items.map((item, idx) => (
                                                <tr key={item.id || idx}>
                                                    <td className="py-2.5 text-muted-foreground">{idx + 1}</td>
                                                    <td className="py-2.5 font-medium text-foreground">
                                                        {item.product_name}
                                                        {item.variant_name && <span className="text-muted-foreground text-[10px] block">({item.variant_name})</span>}
                                                    </td>
                                                    <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                                                    <td className="py-2.5 text-right font-mono">{Number(item.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="py-2.5 text-right font-mono font-semibold">{Number(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td className="py-2.5 text-muted-foreground">1</td>
                                                <td className="py-2.5 font-medium text-foreground">ยอดรวมการชำระค่าสินค้า</td>
                                                <td className="py-2.5 text-center font-mono">1</td>
                                                <td className="py-2.5 text-right font-mono">{Number(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="py-2.5 text-right font-mono font-semibold">{Number(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary & QR PromptPay & Authorized Signature */}
                            <div className="pt-4 border-t border-border/80 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Left Side: PromptPay QR Code & Notes */}
                                <div className="space-y-3">
                                    {qrCodeDataUrl && bill.status !== "paid" ? (
                                        <div className="inline-flex items-center gap-3 p-2.5 rounded-xl border border-border/80 bg-muted/30">
                                            <img src={qrCodeDataUrl} alt="PromptPay QR" className="w-20 h-20 rounded-md border border-border" />
                                            <div className="space-y-0.5 text-[10px]">
                                                <p className="font-bold text-foreground flex items-center gap-1">
                                                    <Sparkles className="h-3 w-3 text-primary" />
                                                    สแกนชำระเงิน (PromptPay)
                                                </p>
                                                <p className="text-muted-foreground">บัญชี: {storeProfile?.tax_id || storeProfile?.store_phone || "ร้านค้า"}</p>
                                                <p className="font-mono font-bold text-primary">฿{Number(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>
                                    ) : bill.status === "paid" ? (
                                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-semibold">
                                            <CheckCircle className="h-4 w-4" />
                                            ชำระเงินครบถ้วนแล้ว (PAID)
                                        </div>
                                    ) : null}

                                    {bill.note && (
                                        <div className="text-[11px] text-muted-foreground">
                                            <span className="font-semibold text-foreground">หมายเหตุ:</span> {bill.note}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Financial Calculation & Authorized Signature */}
                                <div className="space-y-4">
                                    <div className="space-y-1.5 text-xs">
                                        {/* Adjustments / Taxes Breakdown */}
                                        {bill.adjustments && bill.adjustments.map((adj, idx) => (
                                            <div key={idx} className="flex justify-between py-0.5 text-muted-foreground">
                                                <span>{adj.label}</span>
                                                <span className="font-mono">
                                                    {adj.type === "percent" ? `${adj.value}%` : `฿${adj.value}`}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="flex justify-between py-1 border-t border-b border-border/60">
                                            <span className="font-semibold text-foreground">ยอดรวมสุทธิ (Total Amount)</span>
                                            <span className="font-bold font-mono text-base text-primary">
                                                ฿{Number(bill.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Authorized Signature Box */}
                                    <div className="pt-4 flex flex-col items-center justify-center text-center">
                                        {storeProfile?.signature_url ? (
                                            <img
                                                src={storeProfile.signature_url}
                                                alt="Authorized Signature"
                                                className="h-14 max-w-[150px] object-contain mb-1"
                                            />
                                        ) : (
                                            <div className="h-14 border-b border-dashed border-border w-36 mb-1" />
                                        )}
                                        <div className="text-[10px] text-muted-foreground border-t border-border pt-1 w-40">
                                            ผู้มีอำนาจลงนาม / Authorized
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ================= 80MM THERMAL SLIP TEMPLATE ================= */
                        <div className="w-[320px] bg-white text-black p-5 rounded-lg font-mono text-xs shadow-md border border-neutral-200 print:shadow-none print:border-none print:w-full print:p-2">
                            <div className="text-center space-y-1 pb-3 border-b border-dashed border-neutral-400">
                                {storeProfile?.avatar_url && (
                                    <img src={storeProfile.avatar_url} alt="" className="w-10 h-10 mx-auto rounded-full object-cover mb-1 grayscale" />
                                )}
                                <h3 className="font-bold text-sm text-black">{storeProfile?.store_name || "MATEFLOW STORE"}</h3>
                                <p className="text-[10px] text-neutral-600 leading-tight">{storeProfile?.store_address || ""}</p>
                                {storeProfile?.tax_id && <p className="text-[10px] text-neutral-600">TAX ID: {storeProfile.tax_id}</p>}
                                {storeProfile?.store_phone && <p className="text-[10px] text-neutral-600">TEL: {storeProfile.store_phone}</p>}
                                <div className="pt-1">
                                    <span className="font-bold text-xs uppercase px-2 py-0.5 border border-black rounded inline-block">
                                        {documentTitleThai}
                                    </span>
                                </div>
                            </div>

                            <div className="py-2 text-[10px] space-y-0.5 border-b border-dashed border-neutral-400">
                                <div className="flex justify-between">
                                    <span>{billNumber}</span>
                                    <span>{billDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>CUST: {bill.customer_name || "GUEST"}</span>
                                    <span className="uppercase font-bold">{bill.status}</span>
                                </div>
                            </div>

                            {/* Slip Items */}
                            <div className="py-2 space-y-1.5 border-b border-dashed border-neutral-400 text-[11px]">
                                {bill.items && bill.items.length > 0 ? (
                                    bill.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between">
                                            <span className="truncate max-w-[170px]">{item.product_name} x{item.quantity}</span>
                                            <span>{Number(item.total_price).toFixed(2)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex justify-between">
                                        <span>ยอดชำระ</span>
                                        <span>{Number(bill.total_amount).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Total Amount */}
                            <div className="py-2 space-y-1 border-b border-dashed border-neutral-400">
                                <div className="flex justify-between text-sm font-bold">
                                    <span>TOTAL</span>
                                    <span>฿{Number(bill.total_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* QR Code on Slip */}
                            {qrCodeDataUrl && bill.status !== "paid" && (
                                <div className="pt-3 text-center space-y-1 flex flex-col items-center">
                                    <img src={qrCodeDataUrl} alt="" className="w-24 h-24" />
                                    <span className="text-[9px] text-neutral-500">Scan PromptPay to Pay</span>
                                </div>
                            )}

                            <div className="pt-3 text-center text-[9px] text-neutral-400">
                                <p>ขอบคุณที่ใช้บริการ / THANK YOU</p>
                                <p>POWERED BY MATEFLOW</p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
