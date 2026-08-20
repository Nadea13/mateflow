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
    ShoppingCart,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    CheckCircle2,
    Clock,
    Flame,
    Receipt,
    Wallet,
    Layers,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Overview } from "@/components/dashboard/overview";
import { RecentActivity } from "@/components/dashboard/activity-feed";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardContentProps {
    userName: string;
    stats: any;
    recentActivity: any[];
}

export function DashboardContent({ userName, stats, recentActivity }: DashboardContentProps) {
    const { t, locale } = useTranslation();
    const { currency } = useCurrencyStore();

    const urgentActions = stats.urgentActions || [];
    const topProducts = stats.topProducts || [];
    const monthInflow = stats.monthInflow || 0;
    const monthOutflow = stats.monthOutflow || 0;
    const netCashflow = monthInflow - monthOutflow;

    return (
        <div className="space-y-6">
            {/* Header with Quick Operational Launchers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        {t("dashboard.greeting")} {userName || "Merchant"} 👋
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        ศูนย์บัญชาการธุรกิจและติดตามการดำเนินงานประจำวันแบบเรียลไทม์
                    </p>
                </div>
                {/* Daily Quick Launchers */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href="/dashboard/bills">
                        <Button size="sm" className="h-8 text-xs gap-1.5 font-bold bg-primary text-primary-foreground shadow-sm cursor-pointer">
                            <FileText className="h-3.5 w-3.5" />
                            ออกเอกสาร
                        </Button>
                    </Link>
                    <Link href="/dashboard/catalog">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-semibold cursor-pointer">
                            <Package className="h-3.5 w-3.5 text-sky-500" />
                            เพิ่มสินค้า
                        </Button>
                    </Link>
                    <Link href="/dashboard/expenses">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 font-semibold cursor-pointer">
                            <Wallet className="h-3.5 w-3.5 text-amber-500" />
                            บันทึกรายจ่าย
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 🔴 ACTION REQUIRED BANNER (งานด่วนที่ต้องทำทันที) */}
            {urgentActions.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-1 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-bold text-foreground">งานด่วนที่ต้องดำเนินการ (Action Required)</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-mono font-medium">
                            {urgentActions.length} รายการ
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                        {urgentActions.map((action: any) => (
                            <div
                                key={action.id}
                                className="flex flex-col justify-between p-3 rounded-lg border bg-card/90 hover:bg-card transition-all text-xs space-y-2 shadow-2xs"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-foreground">{action.title}</span>
                                        <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                                            {action.type}
                                        </Badge>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-snug">
                                        {action.description}
                                    </p>
                                </div>
                                <Link href={action.actionHref} className="pt-1">
                                    <Button size="sm" variant="secondary" className="w-full h-7 text-[11px] font-semibold gap-1 justify-between">
                                        <span>{action.actionLabel}</span>
                                        <ChevronRight className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Financial & Metrics KPI Cards */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="ยอดขายวันนี้ (Today Sales)"
                    value={formatMoney(stats.todaySales || 0, currency, locale === "th" ? "th-TH" : "en-US")}
                    icon={DollarSign}
                    iconColor="text-emerald-600 dark:text-emerald-400"
                    description="ยอดขายรวมทุกบิลวันนี้"
                />
                <KpiCard
                    title="กำไรสุทธิวันนี้ (Net Profit)"
                    value={formatMoney(stats.todayProfit || 0, currency, locale === "th" ? "th-TH" : "en-US")}
                    icon={TrendingUp}
                    iconColor={stats.todayProfit >= 0 ? "text-blue-600 dark:text-blue-400" : "text-rose-600"}
                    description="ยอดขายหักค่าใช้จ่ายวันนี้"
                />
                <KpiCard
                    title="ยอดรอเก็บเงิน (Unpaid Bills)"
                    value={formatMoney(stats.pendingBillsAmount || 0, currency, locale === "th" ? "th-TH" : "en-US")}
                    icon={FileText}
                    iconColor="text-amber-600 dark:text-amber-400"
                    description={`ใบแจ้งหนี้รอชำระ ${stats.pendingBills || 0} ใบ`}
                />
                <KpiCard
                    title="สินค้าใกล้หมด (Low Stock)"
                    value={`${stats.lowStockItems || 0} รายการ`}
                    icon={AlertTriangle}
                    iconColor="text-rose-600 dark:text-rose-400"
                    description="สต็อกต่ำกว่าเกณฑ์แจ้งเตือน"
                />
            </div>

            {/* Monthly Cashflow Health Strip */}
            <div className="p-4 rounded-xl border border-border bg-card shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <ArrowUpRight className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-muted-foreground text-[11px] font-medium">เงินสดรับเข้าเดือนนี้ (Inflow)</span>
                        <p className="text-base font-bold font-mono text-emerald-600">
                            +{formatMoney(monthInflow, currency)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-600">
                        <ArrowDownRight className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-muted-foreground text-[11px] font-medium">รายจ่ายรวมเดือนนี้ (Outflow)</span>
                        <p className="text-base font-bold font-mono text-rose-600">
                            -{formatMoney(monthOutflow, currency)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                        <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                        <span className="text-muted-foreground text-[11px] font-medium">กระแสเงินสดสุทธิ (Net Cashflow)</span>
                        <p className={`text-base font-bold font-mono ${netCashflow >= 0 ? "text-primary" : "text-rose-600"}`}>
                            {netCashflow >= 0 ? "+" : ""}{formatMoney(netCashflow, currency)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts & Top Products & Activity Feed */}
            <div className="grid gap-4 lg:grid-cols-7">
                {/* Left Column: Analytics Charts (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                                <span>{t("dashboard.salesChart")}</span>
                                <Badge variant="secondary" className="text-[10px] font-mono">Revenue Trend</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                แนวโน้มรายรับรวมตามช่วงเวลา
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-2">
                            <Overview data={stats.chartData} title={t("dashboard.salesChart")} queryKey="salesRange" />
                        </CardContent>
                    </Card>

                    <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                                <span>{t("dashboard.profitChart")}</span>
                                <Badge variant="secondary" className="text-[10px] font-mono text-sky-600">Net Margin</Badge>
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                กำไรสุทธิหลังหักค่าใช้จ่ายตามช่วงเวลา
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

                {/* Right Column: Top Products & Live Activity Feed (3 Cols) */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Top Selling Products */}
                    <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                                <Flame className="h-4 w-4 text-amber-500" />
                                สินค้าขายดีประจำร้าน (Top Sellers)
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                5 อันดับสินค้าที่ทำยอดขายสูงสุด
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-1">
                            {topProducts.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    <Package className="h-8 w-8 mx-auto text-muted-foreground/40 mb-1.5" />
                                    ยังไม่มีข้อมูลการขายสินค้า
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {topProducts.map((p: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                                                    {idx + 1}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">{p.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">ขายแล้ว {p.quantity} ชิ้น</p>
                                                </div>
                                            </div>
                                            <span className="font-mono font-bold text-foreground">
                                                {formatMoney(p.revenue, currency)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Live Operations & Audit Stream */}
                    <Card className="rounded-lg border border-border bg-card p-4 shadow-2xs flex flex-col">
                        <CardHeader className="p-0 pb-3">
                            <CardTitle className="text-sm font-bold flex items-center justify-between">
                                <span>{t("dashboard.recentActivity")}</span>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                บันทึกความเคลื่อนไหวทางธุรกิจล่าสุด
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0 pt-1 flex-1">
                            <div className="h-[280px] overflow-y-auto pr-1">
                                <RecentActivity data={recentActivity} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
