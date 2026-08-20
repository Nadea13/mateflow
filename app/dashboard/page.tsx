import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { getDashboardStats, getRecentActivity } from "@/lib/actions/dashboard"
import { DashboardContent } from "@/components/dashboard/dashboard-content"

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ salesRange?: string; profitRange?: string }>
}) {
    const cookieStore = await cookies()
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
        <DashboardContent
            userName={user?.user_metadata?.full_name || "User"}
            stats={stats}
            recentActivity={recentActivity}
        />
    )
}

