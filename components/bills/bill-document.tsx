"use client";

import { Bill, BillItem, BillAdjustment } from "@/types";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft, Globe, FileCheck2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatMoney, CurrencyCode } from "@/lib/currency";

interface BillDocumentProps {
    bill: Bill & { items: BillItem[]; customer_name: string };
    storeName: string;
    logoUrl?: string;
    storeAddress?: string;
    storePhone?: string;
    taxId?: string;
    signatureUrl?: string;
}

export function BillDocument({
    bill,
    storeName,
    logoUrl,
    storeAddress,
    storePhone,
    taxId,
    signatureUrl,
}: BillDocumentProps) {
    const router = useRouter();
    const isReceipt = bill.status === "paid";
    const billCurrency = (bill.currency as CurrencyCode) || "USD";

    const docTitle = isReceipt ? "COMMERCIAL INVOICE & RECEIPT" : "PROFORMA INVOICE / QUOTATION";
    const docSubtitle = isReceipt ? "Official Tax Invoice / Payment Voucher" : "Commercial Price Quotation";

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    const handlePrint = () => {
        window.print();
    };

    const subtotal = bill.items.reduce((s, i) => s + Number(i.total_price), 0);

    return (
        <div className="pb-12">
            {/* Action bar — hidden on print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 font-medium" onClick={() => router.back()}>
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Invoices
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5 font-medium" onClick={handlePrint}>
                    <Printer className="h-3.5 w-3.5" /> Print / Export PDF
                </Button>
            </div>

            {/* Document */}
            <div className="bg-white text-slate-900 border border-slate-200 rounded-xl shadow-lg p-10 max-w-4xl mx-auto print:shadow-none print:border-0 print:p-0 print:max-w-none">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                    <div className="flex items-start gap-4">
                        {logoUrl && (
                            <img
                                src={logoUrl}
                                alt="Company Logo"
                                className="h-16 w-16 rounded-lg object-contain border border-slate-200 p-1"
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{storeName || "MATEFLOW GLOBAL"}</h1>
                            {storeAddress && (
                                <p className="text-xs text-slate-600 mt-1 max-w-sm whitespace-pre-line leading-relaxed">
                                    {storeAddress}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                                {storePhone && <span>Tel: {storePhone}</span>}
                                {taxId && <span>Tax / VAT ID: {taxId}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-extrabold text-teal-700 tracking-wider">{docTitle}</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{docSubtitle}</p>
                        <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded bg-slate-100 text-xs font-mono font-medium text-slate-700">
                            <Globe className="h-3.5 w-3.5 text-slate-500" /> Currency: {billCurrency}
                        </div>
                    </div>
                </div>

                {/* Info Row */}
                <div className="grid grid-cols-2 gap-8 mb-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Billed To</h3>
                        <p className="text-base font-bold text-slate-900">{bill.customer_name}</p>
                        <p className="text-xs text-slate-500 mt-1">Authorized Buyer / Account</p>
                    </div>
                    <div className="text-right flex flex-col justify-between">
                        <div className="space-y-1 text-xs">
                            <div>
                                <span className="text-slate-400">Invoice No: </span>
                                <span className="font-mono font-bold text-slate-900">{bill.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="text-slate-400">Issue Date: </span>
                                <span className="text-slate-700 font-medium">{formatDate(bill.created_at)}</span>
                            </div>
                            {bill.validity_days !== undefined && bill.validity_days > 0 && !isReceipt && (
                                <div>
                                    <span className="text-slate-400">Quote Validity: </span>
                                    <span className="text-slate-700 font-medium">
                                        {formatDate(
                                            new Date(
                                                new Date(bill.created_at).getTime() +
                                                    bill.validity_days * 24 * 60 * 60 * 1000
                                            ).toISOString()
                                        )}
                                    </span>
                                </div>
                            )}
                            {bill.payment_terms !== undefined && bill.payment_terms > 0 && (
                                <div>
                                    <span className="text-slate-400">Payment Due: </span>
                                    <span className="text-slate-700 font-medium">
                                        {formatDate(
                                            new Date(
                                                new Date(bill.created_at).getTime() +
                                                    bill.payment_terms * 24 * 60 * 60 * 1000
                                            ).toISOString()
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-6 text-sm">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-600 uppercase w-12">#</th>
                            <th className="text-left py-2.5 px-3 text-xs font-bold text-slate-600 uppercase">Item / Description</th>
                            <th className="text-center py-2.5 px-3 text-xs font-bold text-slate-600 uppercase w-20">Qty</th>
                            <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-600 uppercase w-32">Unit Price</th>
                            <th className="text-right py-2.5 px-3 text-xs font-bold text-slate-600 uppercase w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items.map((item, index) => (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="py-3 px-3 text-slate-400">{index + 1}</td>
                                <td className="py-3 px-3">
                                    <div className="font-semibold text-slate-900">{item.product_name}</div>
                                    {item.sku && <div className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.sku}</div>}
                                </td>
                                <td className="py-3 px-3 text-slate-700 text-center font-medium">{item.quantity}</td>
                                <td className="py-3 px-3 text-slate-700 text-right font-mono">
                                    {formatMoney(item.unit_price, billCurrency)}
                                </td>
                                <td className="py-3 px-3 text-slate-900 text-right font-mono font-semibold">
                                    {formatMoney(item.total_price, billCurrency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-80 space-y-2">
                        {/* Subtotal */}
                        <div className="flex justify-between py-1.5 text-sm border-b border-slate-200">
                            <span className="text-slate-500 font-medium">Subtotal</span>
                            <span className="font-mono text-slate-800 font-semibold">{formatMoney(subtotal, billCurrency)}</span>
                        </div>

                        {/* Adjustments */}
                        {bill.adjustments && bill.adjustments.length > 0 && (
                            <div className="border-b border-slate-200 pb-1">
                                {bill.adjustments.map((adj: BillAdjustment, i: number) => {
                                    let amount = 0;
                                    if (adj.type === "percent") {
                                        amount = (subtotal * adj.value) / 100;
                                    } else {
                                        amount = adj.value;
                                    }

                                    return (
                                        <div key={i} className="flex justify-between py-1 text-xs">
                                            <span className="text-slate-500">{adj.label}</span>
                                            <span className={`font-mono font-medium ${amount < 0 ? "text-red-600" : "text-slate-700"}`}>
                                                {amount > 0 ? "+" : ""}
                                                {formatMoney(amount, billCurrency)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between py-2 border-t-2 border-slate-900 mt-1">
                            <span className="text-base font-black text-slate-900">Total Payable</span>
                            <span className="text-lg font-black text-teal-700 font-mono">
                                {formatMoney(Number(bill.total_amount), billCurrency)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Note */}
                {bill.note && (
                    <div className="mb-8 p-3.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Commercial Terms & Instructions</span>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed">{bill.note}</p>
                    </div>
                )}

                {/* Footer / Signature */}
                <div className="grid grid-cols-2 gap-12 mt-12 pt-6 border-t border-slate-100">
                    <div className="text-center">
                        {signatureUrl ? (
                            <div className="flex items-end justify-center h-16 mb-2">
                                <img src={signatureUrl} alt="Signature" className="max-h-16 max-w-[160px] object-contain" />
                            </div>
                        ) : (
                            <div className="border-b border-slate-300 mb-2 h-16"></div>
                        )}
                        <p className="text-xs font-semibold text-slate-600">Authorized Signature & Company Seal</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-slate-300 mb-2 h-16"></div>
                        <p className="text-xs font-semibold text-slate-600">
                            {isReceipt ? "Customer Acknowledgment" : "Buyer Acceptance & PO Reference"}
                        </p>
                    </div>
                </div>

                {/* Status badge */}
                {isReceipt && (
                    <div className="text-center mt-8">
                        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 border-2 border-green-600 text-green-700 font-extrabold text-xs rounded-md tracking-wider uppercase bg-green-50">
                            <FileCheck2 className="h-4 w-4" /> PAID & SETTLED
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
