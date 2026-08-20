import { getBills } from "@/lib/actions/bills";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { BillTable } from "@/components/bills/bill-table";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { importBills } from "@/lib/actions/import";
import { PageHeader } from "@/components/shared/page-header";

export default async function BillsPage() {
    const [bills, customers, products] = await Promise.all([
        getBills(),
        getCustomers(),
        getProducts(),
    ]);

    return (
        <div className="space-y-6">
            <PageHeader titleKey="bills.title" subtitleKey="bills.subtitle">
                <div className="flex items-center gap-2 flex-wrap">
                    <ImportDialog type="bill" onImport={importBills} triggerText="Import" />
                    <CreateBillDialog customers={customers} products={products} />
                </div>
            </PageHeader>
            <BillTable bills={bills} />
        </div>
    );
}

