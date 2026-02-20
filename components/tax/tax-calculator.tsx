"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { calculateTax, getYearlyTaxStats, TaxStats } from "@/lib/actions/tax";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";

function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TaxCalculatorProps {
    initialStats?: TaxStats;
}

export function TaxCalculator({ initialStats }: TaxCalculatorProps) {
    const [deductions, setDeductions] = useState(60000); // Standard personal allowance
    const [stats, setStats] = useState<TaxStats | null>(initialStats || null);
    const [taxData, setTaxData] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    // New States
    const [taxType, setTaxType] = useState<'personal' | 'corporate'>('personal');
    const [inputVat, setInputVat] = useState<number>(0);

    // Withholding Tax Tool
    const [whtAmount, setWhtAmount] = useState<number>(0);
    const [whtRate, setWhtRate] = useState<number>(3); // Default 3%

    useEffect(() => {
        const init = async () => {
            // Only fetch if stats are missing or strict refresh needed, 
            // but here we just rely on initialStats if provided or fetch once.
            if (!stats) {
                setLoading(true);
                try {
                    const data = await getYearlyTaxStats();
                    setStats(data);
                } catch (error) {
                    console.error("Failed to fetch tax stats", error);
                } finally {
                    setLoading(false);
                }
            }
        };
        init();
    }, [stats]);

    // Recalculate tax when deductions, stats, or taxType change
    useEffect(() => {
        const fetchTax = async () => {
            if (!stats) return;
            setLoading(true);
            const netProfit = stats.totalIncome - stats.totalExpenses;
            const res = await calculateTax(netProfit, deductions, taxType);
            setTaxData(res);
            setLoading(false);
        };
        fetchTax();
    }, [stats, deductions, taxType]);

    // Reset deductions when switching tax type for better UX
    useEffect(() => {
        if (taxType === 'corporate') {
            setDeductions(0); // Usually expenses are already deducted
        } else {
            setDeductions(60000); // Default for Personal
        }
    }, [taxType]);

    if (!stats) {
        return <div className="p-4 text-center text-muted-foreground">Loading tax data...</div>;
    }

    const netProfit = stats.totalIncome - stats.totalExpenses;
    const outputVat = stats.totalOutputVat || 0;
    const netVat = outputVat - inputVat;
    const whtTaxValue = (whtAmount * whtRate) / 100;
    const whtNetReceived = whtAmount - whtTaxValue;

    return (
        <div className="space-y-8">
            {/* Top Cards: Income, Expenses, Profit */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-teal-600">฿{fmt(stats.totalIncome)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">฿{fmt(stats.totalExpenses)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                            ฿{fmt(netProfit)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="income-tax" className="space-y-4">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="income-tax" className="text-xs sm:text-sm">Income Tax</TabsTrigger>
                    <TabsTrigger value="vat" className="text-xs sm:text-sm">VAT</TabsTrigger>
                    <TabsTrigger value="wht" className="text-xs sm:text-sm">WHT</TabsTrigger>
                </TabsList>

                {/* INCOME TAX TAB */}
                <TabsContent value="income-tax" className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pb-2">
                        <span className="text-sm font-medium">Tax Type:</span>
                        <div className="grid grid-cols-2 rounded-md shadow-sm">
                            <button
                                onClick={() => setTaxType('personal')}
                                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-l-md border ${taxType === 'personal'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-foreground border-input hover:bg-accent'
                                    }`}
                            >
                                Personal
                            </button>
                            <button
                                onClick={() => setTaxType('corporate')}
                                className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-r-md border-t border-b border-r ${taxType === 'corporate'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-foreground border-input hover:bg-accent'
                                    }`}
                            >
                                SME Corporate
                            </button>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Calculation</CardTitle>
                                <CardDescription>
                                    {taxType === 'personal'
                                        ? "Calculate Personal Income Tax (Progressive Rate 0-35%)"
                                        : "Calculate SME Corporate Tax (Flat Rate 0%, 15%, 20%)"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="deductions">
                                        {taxType === 'personal' ? "Deductions" : "Adjustments"}
                                    </Label>
                                    <Input
                                        id="deductions"
                                        type="number"
                                        value={deductions}
                                        onChange={(e) => setDeductions(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {taxType === 'personal'
                                            ? "Standard personal deduction 60,000 THB (Can add more e.g., Social Security)"
                                            : "Tax adjustments (if any)"}
                                    </p>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Net Taxable Income</span>
                                        <span className="font-bold">฿{fmt(taxData?.taxableIncome || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                                        <span>Estimated Tax</span>
                                        <span className="text-primary">฿{fmt(taxData?.totalTax || 0)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Tax Brackets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {taxData?.taxBreakdown.map((item: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-muted/50">
                                            <div className="flex-1">
                                                <div className="font-medium">{item.bracket}</div>
                                                <div className="text-xs text-muted-foreground">Rate: {item.rate}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono">฿{fmt(item.amount_in_bracket)}</div>
                                                {item.tax > 0 && (
                                                    <div className="text-xs text-red-500 font-medium">+฿{fmt(item.tax)}</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* VAT TAB */}
                <TabsContent value="vat" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>VAT Summary</CardTitle>
                                <CardDescription>Output - Input VAT</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Output VAT (From bills)</Label>
                                    <div className="text-xl font-bold text-teal-600 bg-muted/30 p-3 rounded-md border">
                                        ฿{fmt(outputVat)}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="inputVat">Input VAT (Self-declared)</Label>
                                    <Input
                                        id="inputVat"
                                        type="number"
                                        value={inputVat}
                                        onChange={(e) => setInputVat(Number(e.target.value))}
                                        placeholder="Enter Input VAT from tax invoices..."
                                    />
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                        <span className="font-medium">VAT Payable</span>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-2xl font-bold ${netVat > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                ฿{fmt(Math.abs(netVat))}
                                            </span>
                                            <span className="text-sm font-normal text-muted-foreground">
                                                {netVat > 0 ? "(Payable)" : "(Refundable)"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-muted/10">
                            <CardHeader>
                                <CardTitle className="text-base">Note</CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground space-y-2">
                                <p>• <strong>Output VAT</strong> calculated from bills with "VAT 7%" checked.</p>
                                <p>• <strong>Input VAT</strong> must be summed from actual tax invoices received.</p>
                                <p>• File P.P. 30 by the 15th of the following month.</p>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* WITHHOLDING TAX TAB */}
                <TabsContent value="wht" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>WHT Calculator</CardTitle>
                            <CardDescription>Calculate withholding tax and net payment.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="whtAmount">Amount (Before Tax)</Label>
                                        <Input
                                            id="whtAmount"
                                            type="number"
                                            value={whtAmount}
                                            onChange={(e) => setWhtAmount(Number(e.target.value))}
                                            placeholder="Ex. 10000"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tax Rate</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {[1, 2, 3, 5].map(rate => (
                                                <Button
                                                    key={rate}
                                                    variant={whtRate === rate ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setWhtRate(rate)}
                                                    className="w-12"
                                                >
                                                    {rate}%
                                                </Button>
                                            ))}
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    value={whtRate}
                                                    onChange={(e) => setWhtRate(Number(e.target.value))}
                                                    className="w-20 h-9"
                                                />
                                                <span className="text-sm">%</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            1% = Transport, 3% = Service/Professional, 5% = Rent/Public Actor
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-muted p-6 rounded-lg space-y-4 flex flex-col justify-center">
                                    <div className="flex justify-between text-sm">
                                        <span>WHT Amount:</span>
                                        <span className="font-bold text-red-500">฿{fmt(whtTaxValue)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-4">
                                        <span>Net to Pay:</span>
                                        <span className="text-emerald-600">฿{fmt(whtNetReceived)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
