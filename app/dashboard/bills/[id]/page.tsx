import { getBill } from "@/lib/actions/bills";
import { getStoreProfile } from "@/lib/actions/profile";
import { BillDocument } from "@/components/bills/bill-document";
import { notFound } from "next/navigation";

export default async function BillDocumentPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [bill, store] = await Promise.all([getBill(id), getStoreProfile()]);

    if (!bill) {
        notFound();
    }

    return (
        <div className="py-4">
            <BillDocument
                bill={bill as any}
                storeName={store?.store_name || "MateFlow"}
                logoUrl={store?.avatar_url || ""}
                storeAddress={store?.store_address || ""}
                storePhone={store?.store_phone || ""}
                taxId={store?.tax_id || ""}
                signatureUrl={store?.signature_url || ""}
            />
        </div>
    );
}
