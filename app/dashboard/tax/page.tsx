import { TaxCalculator } from "@/components/tax/tax-calculator";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Tax Report | MateFlow",
    description: "Estimated Yearly Tax Calculation",
};

export default function TaxPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Yearly Tax Report</h2>
                <p className="text-muted-foreground">Estimated income tax, VAT, and withholding tax.</p>
            </div>
            <TaxCalculator />
        </div>
    );
}
