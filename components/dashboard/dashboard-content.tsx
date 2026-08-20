"use client";

import { useTranslation } from "@/lib/i18n/provider";
import { useCurrencyStore } from "@/lib/currency/store";
import { formatMoney } from "@/lib/currency";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
    DollarSign,
    FileText,
    AlertTriangle,
    TrendingUp,
    Globe,
    Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/activity-feed";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardContentProps {
    userName: string;
    stats: any;
    recentActivity: any[];
}

export function DashboardContent({ userName, stats, recentActivity }: DashboardContentProps) {
    const { t, locale } = useTranslation();
    const { currency } = useCurrencyStore();

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">
                        {t("dashboard.greeting")} {userName || "Merchant"}
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {t("dashboard.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/bills">
                        <Button size="sm" className="h-8 text-xs gap-1.5 font-medium">
                            <Plus className="h-3.5 w-3.5" /> {t("bills.createBill")}
                        </Button>
                    </Link>
                    <Link href="/dashboard/integrations">
                        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 font-medium">
                            <Globe className="h-3.5 w-3.5 text-muted-foreground" /> {t("nav.integrations")}
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title={t("dashboard.todaySales")}
                    value={formatMoney(stats.todaySales || 0, currency, locale === "th" ? "th-TH" : "en-US")}
                    icon={DollarSign}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    description={t("dashboard.todaySalesDesc")}
                />
                <KpiCard
                    title={t("dashboard.todayProfit")}
                    value={formatMoney(stats.todayProfit || 0, currency, locale === "th" ? "th-TH" : "en-US")}
                    icon={TrendingUp}
                    iconColor="text-blue-600 dark:text-blue-400"
                    description={t("dashboard.todayProfitDesc")}
                />
                <KpiCard
                    title={t("dashboard.pendingBills")}
                    value={stats.pendingBills}
                    icon={FileText}
                    iconColor="text-amber-600 dark:text-amber-400"
                    description={t("dashboard.pendingBillsDesc")}
                />
                <KpiCard
                    title={t("dashboard.lowStock")}
                    value={stats.lowStockItems}
                    icon={AlertTriangle}
                    iconColor="text-rose-600 dark:text-rose-400"
                    description={t("dashboard.lowStockDesc")}
                />
            </div>

            {/* Charts & Activity Stream */}
            <div className="grid gap-4 lg:grid-cols-7">
                <div className="lg:col-span-4 space-y-4">
                    <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-semibold">{t("dashboard.salesChart")}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                {t("dashboard.todaySalesDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-2">
                            <Overview data={stats.chartData} title={t("dashboard.salesChart")} queryKey="salesRange" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-semibold">{t("dashboard.profitChart")}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                {t("dashboard.todayProfitDesc")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-2">
                            <Overview
                                data={stats.profitChartData}
                                title={t("dashboard.profitChart")}
                                color="#0284c7"
                                queryKey="profitRange"
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-3">
                    <Card className="rounded-lg border border-border bg-card h-full p-4 flex flex-col shadow-2xs">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-semibold">{t("dashboard.recentActivity")}</CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                {t("history.activities")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-2 flex-1">
                            <div className="h-[360px] overflow-y-auto pr-1">
                                <RecentActivity data={recentActivity} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
