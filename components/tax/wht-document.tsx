import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

interface WhtDocumentProps {
    recordId: string;
    date: string;
    payerName: string;
    payerTaxId: string;
    payerAddress: string;
    receiverName: string;
    receiverTaxId: string;
    receiverAddress: string;
    incomeType: string;
    baseAmount: number;
    whtRate: number;
    whtAmount: number;
    signatureUrl?: string;
}

export function WhtDocument({
    recordId,
    date,
    payerName,
    payerTaxId,
    payerAddress,
    receiverName,
    receiverTaxId,
    receiverAddress,
    incomeType,
    baseAmount,
    whtRate,
    whtAmount,
    signatureUrl
}: WhtDocumentProps) {
    const handlePrint = () => {
        window.print();
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString("th-TH", {
            day: "numeric", month: "long", year: "numeric",
        });

    return (
        <div className="w-full">
            {/* Action bar — hidden on print */}
            <div className="flex items-center justify-between mb-6 print:hidden">
                <Button variant="ghost" onClick={() => window.history.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print
                    </Button>
                </div>
            </div>

            {/* Document Body */}
            <div className="bg-white border text-black border-black/20 rounded-md p-8 md:p-12 max-w-4xl mx-auto print:shadow-none print:border-none print:p-0 print:max-w-none">

                {/* Header */}
                <div className="text-center mb-8 border-b-2 border-black pb-4">
                    <h1 className="text-xl font-bold font-serif leading-tight">หนังสือรับรองการหักภาษี ณ ที่จ่าย</h1>
                    <p className="text-sm font-serif">(ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร)</p>
                    <p className="text-xs text-black/60 mt-2">No. {recordId.slice(0, 8).toUpperCase()}</p>
                </div>

                {/* Parties Details */}
                <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
                    <div className="border border-black p-4 rounded-sm">
                        <h2 className="font-bold underline mb-2">ผู้มีหน้าที่หักภาษี ณ ที่จ่าย (Payer)</h2>
                        <div className="space-y-1">
                            <p><span className="font-semibold">ชื่อ:</span> {payerName}</p>
                            <p><span className="font-semibold">เลขประจำตัวผู้เสียภาษี:</span> {payerTaxId}</p>
                            <p><span className="font-semibold">ที่อยู่:</span> {payerAddress || "-"}</p>
                        </div>
                    </div>

                    <div className="border border-black p-4 rounded-sm">
                        <h2 className="font-bold underline mb-2">ผู้ถูกหักภาษี ณ ที่จ่าย (Receiver)</h2>
                        <div className="space-y-1">
                            <p><span className="font-semibold">ชื่อ:</span> {receiverName}</p>
                            <p><span className="font-semibold">เลขประจำตัวผู้เสียภาษี:</span> {receiverTaxId}</p>
                            <p><span className="font-semibold">ที่อยู่:</span> {receiverAddress || "-"}</p>
                        </div>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="mb-8">
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead>
                            <tr className="bg-gray-100/50">
                                <th className="border border-black p-2 text-center w-12">ลำดับ</th>
                                <th className="border border-black p-2 text-left">ประเภทเงินได้พึงประเมินที่จ่าย</th>
                                <th className="border border-black p-2 text-center w-32">วัน เดือน ปี ที่จ่าย</th>
                                <th className="border border-black p-2 text-right w-32">จำนวนเงินที่จ่าย</th>
                                <th className="border border-black p-2 text-right w-32">ภาษีที่หักและนำส่งไว้</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="border border-black p-2 text-center">1</td>
                                <td className="border border-black p-2">{incomeType} ({whtRate}%)</td>
                                <td className="border border-black p-2 text-center">{formatDate(date)}</td>
                                <td className="border border-black p-2 text-right">
                                    {baseAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="border border-black p-2 text-right font-medium">
                                    {whtAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                            {/* Empty rows filler */}
                            <tr>
                                <td className="border border-black py-4"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr className="bg-gray-100/50 font-bold">
                                <td colSpan={3} className="border border-black p-2 text-right">รวมเงินที่จ่ายและภาษีที่หักนำส่ง</td>
                                <td className="border border-black p-2 text-right">
                                    {baseAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="border border-black p-2 text-right">
                                    {whtAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Signatures */}
                <div className="mt-16 flex justify-end">
                    <div className="text-center w-64 text-sm">
                        <p className="mb-2">ขอรับรองว่าข้อความและตัวเลขดังกล่าวถูกต้องทุกประการ</p>

                        {signatureUrl ? (
                            <div className="flex items-end justify-center h-16 mb-2">
                                <img src={signatureUrl} alt="Signature" className="max-h-16 max-w-[160px] object-contain" />
                            </div>
                        ) : (
                            <div className="border-b border-black border-dashed mx-4 mt-12 mb-2"></div>
                        )}
                        <p>ผู้จ่ายเงิน / ผู้หักภาษี</p>
                        <p className="mt-1">วันที่: {formatDate(new Date().toISOString())}</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
