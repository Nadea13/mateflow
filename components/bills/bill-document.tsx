"use client";

import { Bill, BillItem, BillAdjustment } from "@/types";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BillDocumentProps {
    bill: Bill & { items: BillItem[]; customer_name: string };
    storeName: string;
    logoUrl?: string;
    storeAddress?: string;
    storePhone?: string;
    taxId?: string;
    signatureUrl?: string;
}

export function BillDocument({ bill, storeName, logoUrl, storeAddress, storePhone, taxId, signatureUrl }: BillDocumentProps) {
    const router = useRouter();
    const isReceipt = bill.status === "paid";
    const docTitle = isReceipt ? "ใบเสร็จรับเงิน" : "ใบเสนอราคา";
    const docTitleEn = isReceipt ? "Receipt" : "Quotation";

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("en-US", {
            day: "numeric", month: "long", year: "numeric",
        });

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            {/* Action bar — hidden on print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </div>

            {/* Document */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-3xl mx-auto print:shadow-none print:border-0 print:p-0 print:max-w-none">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
                    <div className="flex items-start gap-3">
                        {logoUrl && (
                            <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded-full object-cover border border-gray-200" />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
                            {storeAddress && (
                                <p className="text-xs text-gray-500 mt-1 max-w-xs whitespace-pre-line">{storeAddress}</p>
                            )}
                            {storePhone && (
                                <p className="text-xs text-gray-500 mt-0.5">Tel: {storePhone}</p>
                            )}
                            {taxId && (
                                <p className="text-xs text-gray-500 mt-0.5">Tax ID: {taxId}</p>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-primary">{docTitle}</h2>
                        <p className="text-xs text-gray-400">{docTitleEn}</p>
                    </div>
                </div>

                {/* Info Row */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Customer</h3>
                        <p className="text-lg font-semibold text-gray-900">{bill.customer_name}</p>
                    </div>
                    <div className="text-right">
                        <div className="space-y-1">
                            <div>
                                <span className="text-xs text-gray-400">No. </span>
                                <span className="text-sm font-mono text-gray-700">{bill.id.slice(0, 8).toUpperCase()}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400">Date </span>
                                <span className="text-sm text-gray-700">{formatDate(bill.created_at)}</span>
                            </div>
                            {bill.validity_days !== undefined && bill.validity_days > 0 && !isReceipt && (
                                <div>
                                    <span className="text-xs text-gray-400">Valid Until </span>
                                    <span className="text-sm text-gray-700">
                                        {formatDate(new Date(new Date(bill.created_at).getTime() + bill.validity_days * 24 * 60 * 60 * 1000).toISOString())}
                                    </span>
                                </div>
                            )}
                            {bill.payment_terms !== undefined && bill.payment_terms > 0 && (
                                <div>
                                    <span className="text-xs text-gray-400">Due Date </span>
                                    <span className="text-sm text-gray-700">
                                        {formatDate(new Date(new Date(bill.created_at).getTime() + bill.payment_terms * 24 * 60 * 60 * 1000).toISOString())}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-6">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">#</th>
                            <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                            <th className="text-center py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Unit Price</th>
                            <th className="text-right py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.items.map((item, index) => (
                            <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-2.5 px-3 text-sm text-gray-500">{index + 1}</td>
                                <td className="py-2.5 px-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                                <td className="py-2.5 px-3 text-sm text-gray-700 text-center">{item.quantity}</td>
                                <td className="py-2.5 px-3 text-sm text-gray-700 text-right font-mono">
                                    ฿{Number(item.unit_price).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2.5 px-3 text-sm text-gray-900 text-right font-mono font-medium">
                                    ฿{Number(item.total_price).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                    <div className="w-72">
                        {/* Subtotal */}
                        <div className="flex justify-between py-1.5">
                            <span className="text-sm text-gray-500">Subtotal</span>
                            <span className="text-sm font-mono text-gray-700">
                                ฿{(() => {
                                    const sub = bill.items.reduce((s, i) => s + Number(i.total_price), 0);
                                    return sub.toLocaleString("th-TH", { minimumFractionDigits: 2 });
                                })()}
                            </span>
                        </div>

                        {/* Adjustments */}
                        {bill.adjustments && bill.adjustments.length > 0 && (
                            <>
                                {bill.adjustments.map((adj: BillAdjustment, i: number) => {
                                    const sub = bill.items.reduce((s, item) => s + Number(item.total_price), 0);
                                    const amount = adj.type === "percent" ? (sub * adj.value) / 100 : adj.value;
                                    return (
                                        <div key={i} className="flex justify-between py-1.5">
                                            <span className="text-sm text-gray-500">
                                                {adj.label} {adj.type === "percent" ? `(${adj.value}%)` : ""}
                                            </span>
                                            <span className={`text-sm font-mono ${amount < 0 ? "text-red-600" : "text-gray-700"}`}>
                                                {amount >= 0 ? "+" : ""}฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </>
                        )}

                        {/* Grand Total */}
                        <div className="flex justify-between py-2 border-t-2 border-gray-800 mt-1">
                            <span className="text-base font-bold text-gray-900">Grand Total</span>
                            <span className="text-base font-bold text-primary font-mono">
                                ฿{Number(bill.total_amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Note */}
                {bill.note && (
                    <div className="mb-8 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs font-semibold text-gray-400 uppercase">Note</span>
                        <p className="text-sm text-gray-700 mt-1">{bill.note}</p>
                    </div>
                )}

                {/* Footer / Signature area */}
                <div className="grid grid-cols-2 gap-8 mt-12 pt-4">
                    <div className="text-center">
                        {signatureUrl ? (
                            <div className="flex items-end justify-center h-16 mb-2">
                                <img src={signatureUrl} alt="Signature" className="max-h-16 max-w-[160px] object-contain" />
                            </div>
                        ) : (
                            <div className="border-b border-gray-300 mb-2 h-16"></div>
                        )}
                        <p className="text-xs text-gray-500">Issued by</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-gray-300 mb-2 h-16"></div>
                        <p className="text-xs text-gray-500">
                            {isReceipt ? "Received by" : "Approved by"}
                        </p>
                    </div>
                </div>

                {/* Status watermark for paid */}
                {isReceipt && (
                    <div className="text-center mt-6">
                        <span className="inline-block px-4 py-1 border-2 border-green-500 text-green-600 font-bold text-sm rounded-md tracking-wider uppercase">
                            PAID
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
