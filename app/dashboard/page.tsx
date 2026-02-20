import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RecentActivity } from "@/components/dashboard/activity-feed"
import {
    DollarSign,
    FileText,
    AlertTriangle,
    TrendingUp,
} from "lucide-react"
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { Overview } from "@/components/dashboard/overview"

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ salesRange?: string; profitRange?: string }>
}) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { salesRange, profitRange } = await searchParams
    const selectedSalesRange = salesRange || "7d"
    const selectedProfitRange = profitRange || "7d"

    let stats: any = {
        todaySales: 0, pendingBills: 0, lowStockItems: 0,
        chartData: [], profitChartData: [], todayProfit: 0
    };
    let recentActivity: any[] = [];

    try {
        stats = await getDashboardStats(selectedSalesRange, selectedProfitRange);
        recentActivity = await getRecentActivity();
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
    }

    return (
        <div className="space-y-8">
            {/* Greeting and Header */}
            <div className="flex flex-col space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Hello, {user?.user_metadata?.full_name || "User"} 👋</h2>
                <p className="text-muted-foreground">
                    Here's what's happening with your business today.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                    title="Today's Sales"
                    value={`฿${stats.todaySales.toLocaleString()}`}
                    icon={DollarSign}
                    description="Total bills created today"
                />
                <KpiCard
                    title="Today's Profit"
                    value={`฿${(stats.todayProfit || 0).toLocaleString()}`}
                    icon={TrendingUp}
                    iconColor="text-emerald-500"
                    description="Sales - Expenses (Today)"
                />
                <KpiCard
                    title="Pending Bills"
                    value={stats.pendingBills}
                    icon={FileText}
                    iconColor="text-orange-500"
                    description="Draft status"
                />
                <KpiCard
                    title="Low Stock Items"
                    value={stats.lowStockItems}
                    icon={AlertTriangle}
                    iconColor="text-red-500"
                    description="Less than 10 items remaining"
                />
            </div>

            {/* Chart & Activity */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="col-span-4 space-y-4">
                    <Card className="rounded-xl border-0 shadow-sm bg-card">
                        <CardHeader>
                            <CardTitle>Sales</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-4">
                            <Overview data={stats.chartData} queryKey="salesRange" />
                        </CardContent>
                    </Card>
                    <Card className="rounded-xl border-0 shadow-sm bg-card">
                        <CardHeader>
                            <CardTitle>Profit</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-4">
                            <Overview
                                data={stats.profitChartData}
                                title="Profit"
                                color="#10b981" // Emerald-500
                                queryKey="profitRange"
                            />
                        </CardContent>
                    </Card>
                </div>
                <div className="col-span-3">
                    <Card className="rounded-xl border-0 shadow-sm bg-card h-full">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] overflow-y-auto md:h-auto md:overflow-visible">
                                <RecentActivity data={recentActivity} />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
