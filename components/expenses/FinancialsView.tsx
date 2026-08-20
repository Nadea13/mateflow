"use client";

import { useState } from "react";
import { HandCoins, ShoppingCart, Percent, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { POTable } from "@/components/expenses/POTable";
import { TaxCalculator } from "@/components/tax/tax-calculator";
import { Button } from "@/components/ui/button";
import { CreateExpenseDialog } from "@/components/expenses/create-expense-dialog";
import { PODialog } from "@/components/expenses/PODialog";
import { ImportDialog } from "@/components/shared/import-dialog";
import { importExpenses } from "@/lib/actions/import";
import { useTranslation } from "@/lib/i18n/provider";

interface FinancialsViewProps {
    expenses: any[];
    pos: any[];
}

export function FinancialsView({ expenses, pos }: FinancialsViewProps) {
    const [activeTab, setActiveTab] = useState("expenses");
    const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
    const [poDialogOpen, setPoDialogOpen] = useState(false);
    const { t } = useTranslation();

    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
    const totalPOs = pos.reduce((sum: number, po: any) => sum + Number(po.total_amount), 0);

    const handleAdd = () => {
        if (activeTab === "expenses") {
            setExpenseDialogOpen(true);
        } else if (activeTab === "purchase-orders") {
            setPoDialogOpen(true);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("expenses.title")}</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t("expenses.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {activeTab === "expenses" && (
                        <ImportDialog type="expense" onImport={importExpenses} triggerText="Import" />
                    )}
                    {activeTab !== "tax-report" && (
                        <Button onClick={handleAdd} size="sm" className="h-8 text-xs gap-1.5 font-medium">
                            <Plus className="h-3.5 w-3.5" />
                            {activeTab === "expenses" ? t("expenses.addExpense") : t("expenses.createPO")}
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="expenses">
                        <HandCoins className="h-3.5 w-3.5" />
                        {t("expenses.tabExpenses")}
                    </TabsTrigger>
                    <TabsTrigger value="purchase-orders">
                        <ShoppingCart className="h-3.5 w-3.5" />
                        {t("expenses.tabPurchaseOrders")}
                    </TabsTrigger>
                    <TabsTrigger value="tax-report">
                        <Percent className="h-3.5 w-3.5" />
                        {t("expenses.taxReport")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{t("expenses.totalExpenses")}</h3>
                                <HandCoins className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-red-600">฿{totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("expenses.from")} {expenses.length} {t("expenses.items")}
                            </p>
                        </div>
                    </div>
                    <ExpenseTable expenses={expenses} />
                </TabsContent>

                <TabsContent value="purchase-orders" className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{t("expenses.totalPOs")}</h3>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="text-2xl font-bold text-blue-600">฿{totalPOs.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {t("expenses.from")} {pos.length} {t("expenses.orders")}
                            </p>
                        </div>
                    </div>
                    <POTable pos={pos} />
                </TabsContent>

                <TabsContent value="tax-report" className="space-y-6 pt-2">
                    <TaxCalculator />
                </TabsContent>
            </Tabs>

            <CreateExpenseDialog
                open={expenseDialogOpen}
                onOpenChange={setExpenseDialogOpen}
                showTrigger={false}
            />
            <PODialog
                open={poDialogOpen}
                onOpenChange={setPoDialogOpen}
            />
        </div>
    );
}
