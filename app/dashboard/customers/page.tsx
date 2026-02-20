import { CustomerDialog } from "@/components/customers/customer-dialog";
import { CustomerTable } from "@/components/customers/customer-table";
import { getCustomers } from "@/lib/actions/customers";
import { Customer } from "@/types";
import { ImportDialog } from "@/components/shared/import-dialog";
import { importCustomers } from "@/lib/actions/import";

export default async function CustomersPage() {
    const customers = await getCustomers() as Customer[];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
                    <p className="text-muted-foreground">
                        Manage your customer database.
                    </p>
                </div>
                {/* Mobile Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-4 md:hidden">
                    <ImportDialog type="customer" onImport={importCustomers} triggerText="Import" />
                    <CustomerDialog />
                </div>
                <div className="hidden md:flex items-center space-x-2">
                    <ImportDialog type="customer" onImport={importCustomers} triggerText="Import" />
                    <CustomerDialog />
                </div>
            </div>

            <CustomerTable customers={customers} />


        </div>
    );
}
