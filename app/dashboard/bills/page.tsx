import { getBills } from "@/lib/actions/bills";
import { getCustomers } from "@/lib/actions/customers";
import { getProducts } from "@/lib/actions/products";
import { BillTable } from "@/components/bills/bill-table";
import { CreateBillDialog } from "@/components/bills/create-bill-dialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { importBills } from "@/lib/actions/import";

export default async function BillsPage() {
    const [bills, customers, products] = await Promise.all([
        getBills(),
        getCustomers(),
        getProducts(),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Bills</h2>
                    <p className="text-muted-foreground">Manage your invoices and billing.</p>
                </div>
                {/* Mobile Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4 md:hidden">
                    <ImportDialog type="bill" onImport={importBills} triggerText="Import" />
                    <CreateBillDialog customers={customers} products={products} />
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <ImportDialog type="bill" onImport={importBills} triggerText="Import" />
                    <CreateBillDialog customers={customers} products={products} />
                </div>
            </div>
            <BillTable bills={bills} />


        </div>
    );
}
