import { TaxCalculator } from "@/components/tax/tax-calculator";
import { getYearlyTaxStats } from "@/lib/actions/tax";
import { Suspense } from "react";

export const metadata = {
    title: "Tax & Reports | Mateflow",
    description: "Manage your taxes, VAT, and Withholding Tax.",
};

export default async function TaxPage() {
    const stats = await getYearlyTaxStats();

    return (
        <div className="space-y-6">
            <div className="pb-3 border-b border-border">
                <h1 className="text-xl font-semibold tracking-tight text-foreground">Tax & Reports</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your VAT, Withholding Tax, and Income Tax estimates.</p>
            </div>

            <Suspense fallback={<div className="p-4 text-center text-muted-foreground">Loading tax data...</div>}>
                <TaxCalculator initialStats={stats} />
            </Suspense>
        </div>
    );
}
