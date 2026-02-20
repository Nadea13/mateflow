import { getExpenses } from "@/lib/actions/expenses";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { CreateExpenseDialog } from "@/components/expenses/create-expense-dialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { importExpenses } from "@/lib/actions/import";
import { HandCoins } from "lucide-react";

export default async function ExpensesPage() {
    const expenses = await getExpenses();

    const totalAmount = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
                    <p className="text-muted-foreground">
                        Manage and track your business expenses.
                    </p>
                </div>
                {/* Mobile Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-2 md:hidden w-full">
                    <ImportDialog type="expense" onImport={importExpenses} triggerText="Import" />
                    <CreateExpenseDialog />
                </div>
                <div className="hidden md:flex items-center gap-2">
                    <ImportDialog type="expense" onImport={importExpenses} triggerText="Import" />
                    <CreateExpenseDialog />
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                    <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Expenses</h3>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">฿{totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        from {expenses.length} items
                    </p>
                </div>
            </div>

            <ExpenseTable expenses={expenses as any} />


        </div>
    );
}
