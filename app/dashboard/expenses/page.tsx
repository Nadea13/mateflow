import { getExpenses } from "@/lib/actions/expenses";
import { getPurchaseOrders } from "@/lib/actions/purchase-orders";
import { FinancialsView } from "@/components/expenses/FinancialsView";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
    const expenses = await getExpenses();
    const pos = await getPurchaseOrders();

    return (
        <FinancialsView
            expenses={expenses as any}
            pos={pos as any}
        />
    );
}
