import { getStoreProfile } from "@/lib/actions/profile";
import { getWhtRecords } from "@/lib/actions/tax";
import { WhtDocument } from "@/components/tax/wht-document";
import { redirect } from "next/navigation";

export const metadata = {
    title: "50 Tawi Certificate | Mateflow",
    description: "Withholding Tax Certificate (50 Tawi)",
};

export default async function WhtDocumentPage({ params }: { params: { id: string } }) {
    const profile = await getStoreProfile();

    if (!profile) {
        redirect("/login");
    }

    // Since we don't have a direct "getWhtRecordById" yet, 
    // we'll fetch them all for the year and find the one we need.
    const currentYear = new Date().getFullYear();
    const records = await getWhtRecords(currentYear);
    const record = records.find(r => r.id === params.id);

    if (!record) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <h1 className="text-2xl font-bold mb-4">Document Not Found</h1>
                <p className="text-muted-foreground">The requested 50 Tawi certificate could not be found.</p>
            </div>
        );
    }

    // Determine Payer and Receiver based on who deducted whom
    const isExpense = record.source === "expense";

    // If it's an expense, the SME (profile) is the PAYER (we deduct from vendor)
    // If it's a bill, the customer is the PAYER (they deduct from us)
    const payerName = isExpense ? profile.store_name : record.partyName;
    const payerTaxId = isExpense ? profile.tax_id : record.taxId;
    const payerAddress = isExpense ? profile.store_address : ""; // Customer address not fetched in getWhtRecords yet, use empty for mock

    const receiverName = isExpense ? record.partyName : profile.store_name;
    const receiverTaxId = isExpense ? record.taxId : profile.tax_id;
    const receiverAddress = isExpense ? "" : profile.store_address;


    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <WhtDocument
                recordId={record.id}
                date={record.date}
                payerName={payerName}
                payerTaxId={payerTaxId}
                payerAddress={payerAddress}
                receiverName={receiverName}
                receiverTaxId={receiverTaxId}
                receiverAddress={receiverAddress}
                incomeType={record.category.split(' (')[0]} // e.g. "Service (3%)" -> "Service"
                baseAmount={record.baseAmount}
                whtRate={parseInt(record.category.match(/\((\d+)%\)/)?.[1] || "3")}
                whtAmount={record.whtAmount}
                signatureUrl={isExpense ? profile.signature_url : undefined}
            />
        </div>
    );
}
