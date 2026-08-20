"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getStores } from "@/lib/actions/profile";

// Helper to determine range parameters
function getRangeParams(range: string) {
    let daysToSubtract = 6;
    let dataPoints = 7;
    let dateFormat: "hour" | "day" | "month" | "year" = "day";

    switch (range) {
        case "1d":
            daysToSubtract = 0;
            dataPoints = 24;
            dateFormat = "hour";
            break;
        case "3d":
            daysToSubtract = 2;
            dataPoints = 3;
            break;
        case "7d":
            daysToSubtract = 6;
            dataPoints = 7;
            break;
        case "14d":
            daysToSubtract = 13;
            dataPoints = 14;
            break;
        case "30d":
            daysToSubtract = 29;
            dataPoints = 30;
            break;
        case "1y":
            daysToSubtract = 364;
            dataPoints = 12;
            dateFormat = "month";
            break;
        case "3y":
            daysToSubtract = 365 * 3;
            dataPoints = 3;
            dateFormat = "year";
            break;
        case "5y":
            daysToSubtract = 365 * 5;
            dataPoints = 5;
            dateFormat = "year";
            break;
        default:
            daysToSubtract = 6;
            dataPoints = 7;
    }

    const startDate = new Date();
    if (dateFormat === "year") {
        startDate.setFullYear(startDate.getFullYear() - (range === "3y" ? 3 : 5));
    } else if (dateFormat === "month") {
        startDate.setMonth(startDate.getMonth() - 11);
    } else {
        startDate.setDate(startDate.getDate() - daysToSubtract);
    }
    startDate.setHours(0, 0, 0, 0);

    return { startDate, dataPoints, dateFormat };
}

// Helper to fetch and process chart data
async function getChartData(supabase: any, range: string, type: "sales" | "profit", storeId: string) {
    const { startDate, dataPoints, dateFormat } = getRangeParams(range);

    if (!storeId) return [];

    // Fetch bills scoped to storeId
    const { data: bills } = await supabase
        .from("bills")
        .select("created_at, total_amount")
        .eq("store_id", storeId)
        .neq("status", "cancelled")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

    // Fetch expenses if profit scoped to storeId
    let expenses: any[] = [];
    if (type === "profit") {
        const { data: exp } = await supabase
            .from("expenses")
            .select("date, amount")
            .eq("store_id", storeId)
            .gte("date", startDate.toISOString().split("T")[0])
            .order("date", { ascending: true });
        expenses = exp || [];
    }

    const chartData = [];

    if (dateFormat === "hour") {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 24; i++) {
            const hourDate = new Date(today);
            hourDate.setHours(i);

            const nextHourDate = new Date(today);
            nextHourDate.setHours(i + 1);

            const hourSales = bills?.filter((b: any) => {
                const bDate = new Date(b.created_at);
                return bDate >= hourDate && bDate < nextHourDate;
            }).reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            const name = `${i.toString().padStart(2, "0")}:00`;

            if (type === "sales") {
                chartData.push({ name, total: hourSales });
            } else {
                chartData.push({ name, total: hourSales });
            }
        }
    } else if (dateFormat === "day") {
        for (let i = dataPoints - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];

            const daySales = bills?.filter((b: any) => b.created_at.startsWith(dateStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            const name = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            if (type === "sales") {
                chartData.push({ name, total: daySales });
            } else {
                const dayExpenses = expenses?.filter((e: any) => e.date.startsWith(dateStr))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name, total: daySales - dayExpenses });
            }
        }
    } else if (dateFormat === "month") {
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthYearStr = d.toISOString().slice(0, 7);

            const monthSales = bills?.filter((b: any) => b.created_at.startsWith(monthYearStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            const name = d.toLocaleDateString("en-US", { month: "short" });

            if (type === "sales") {
                chartData.push({ name, total: monthSales });
            } else {
                const monthExpenses = expenses?.filter((e: any) => e.date.startsWith(monthYearStr))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name, total: monthSales - monthExpenses });
            }
        }
    } else if (dateFormat === "year") {
        const years = range === "3y" ? 3 : 5;
        for (let i = years - 1; i >= 0; i--) {
            const d = new Date();
            d.setFullYear(d.getFullYear() - ((years - 1) - i));
            const yearStr = d.getFullYear().toString();

            const yearSales = bills?.filter((b: any) => b.created_at.startsWith(yearStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            if (type === "sales") {
                chartData.push({ name: yearStr, total: yearSales });
            } else {
                const yearExpenses = expenses?.filter((e: any) => e.date.startsWith(yearStr))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name: yearStr, total: yearSales - yearExpenses });
            }
        }
    }
    return chartData;
}

export async function getDashboardStats(salesRange: string = "7d", profitRange: string = "7d") {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {
            todaySales: 0,
            pendingBills: 0,
            lowStockItems: 0,
            chartData: [],
            profitChartData: [],
            totalRevenue: 0,
            totalOrders: 0,
            todayProfit: 0,
            activeNow: 1,
        };
    }

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    if (validStoreIds.length === 0) {
        return {
            todaySales: 0,
            pendingBills: 0,
            lowStockItems: 0,
            chartData: [],
            profitChartData: [],
            totalRevenue: 0,
            totalOrders: 0,
            todayProfit: 0,
            activeNow: 1,
        };
    }

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 0. Store-Scoped Total Revenue & Total Orders
    const { data: allBills } = await supabase
        .from("bills")
        .select("total_amount")
        .eq("store_id", targetStoreId)
        .neq("status", "cancelled");

    let totalRevenue = 0;
    let totalOrders = 0;

    if (allBills) {
        totalRevenue = allBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
        totalOrders = allBills.length;
    }

    // 1. Store-Scoped Today's Sales
    const { data: todayBills } = await supabase
        .from("bills")
        .select("total_amount")
        .eq("store_id", targetStoreId)
        .neq("status", "cancelled")
        .gte("created_at", todayISO);

    let todaySales = 0;
    if (todayBills) {
        todaySales = todayBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
    }

    // 2. Store-Scoped Pending & Low Stock
    const { count: pendingBills } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("store_id", targetStoreId)
        .eq("status", "draft");

    const { count: lowStockItems } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("store_id", targetStoreId)
        .lt("stock", 10);

    // 4. Sales & Profit Chart Data
    const chartData = await getChartData(supabase, salesRange, "sales", targetStoreId);
    const profitChartData = await getChartData(supabase, profitRange, "profit", targetStoreId);

    // 6. Today's Profit
    const { data: todayExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .eq("store_id", targetStoreId)
        .gte("date", todayISO.split("T")[0]);

    let todayExpensesTotal = 0;
    if (todayExpenses) {
        todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    }
    const todayProfit = todaySales - todayExpensesTotal;

    return {
        todaySales,
        pendingBills: pendingBills || 0,
        lowStockItems: lowStockItems || 0,
        chartData,
        profitChartData,
        totalRevenue,
        totalOrders,
        todayProfit,
        activeNow: 1,
    };
}

export async function getInventorySummary() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);
    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0];

    if (!targetStoreId) return [];

    const { data: products, error } = await supabase
        .from("products")
        .select("name, stock")
        .eq("store_id", targetStoreId)
        .order("stock", { ascending: true })
        .limit(20);

    if (error) {
        return [];
    }

    return products;
}

export async function getRecentActivity() {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);
    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0];

    if (!targetStoreId) return [];

    // Fetch latest strictly from active store
    const [
        { data: bills },
        { data: products },
        { data: customers },
        { data: expenses }
    ] = await Promise.all([
        supabase
            .from("bills")
            .select(`id, total_amount, created_at, customers(name)`)
            .eq("store_id", targetStoreId)
            .neq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("products")
            .select("id, name, stock, created_at")
            .eq("store_id", targetStoreId)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("customers")
            .select("id, name, created_at")
            .eq("store_id", targetStoreId)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("expenses")
            .select("id, title, amount, date")
            .eq("store_id", targetStoreId)
            .order("date", { ascending: false })
            .limit(5)
    ]);

    const activities: any[] = [];

    bills?.forEach((b: any) => {
        activities.push({
            id: `bill-${b.id}`,
            type: "bill",
            title: b.customers?.name || "Customer",
            description: `Created a bill of $${b.total_amount}`,
            timestamp: b.created_at,
        });
    });

    products?.forEach((p: any) => {
        activities.push({
            id: `prod-${p.id}`,
            type: "product",
            title: p.name,
            description: `New product added (Stock: ${p.stock})`,
            timestamp: p.created_at,
        });
    });

    customers?.forEach((c: any) => {
        activities.push({
            id: `cust-${c.id}`,
            type: "customer",
            title: c.name,
            description: "New customer registered",
            timestamp: c.created_at,
        });
    });

    expenses?.forEach((e: any) => {
        activities.push({
            id: `exp-${e.id}`,
            type: "expense",
            title: e.title,
            description: `Recorded expense of $${e.amount}`,
            timestamp: e.date,
        });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 10);
}
