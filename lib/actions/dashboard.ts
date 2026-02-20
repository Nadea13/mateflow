"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

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
async function getChartData(supabase: any, range: string, type: "sales" | "profit") {
    const { startDate, dataPoints, dateFormat } = getRangeParams(range);

    // Fetch bills
    const { data: bills } = await supabase
        .from("bills")
        .select("created_at, total_amount")
        .neq("status", "cancelled")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

    // Fetch expenses if profit
    let expenses: any[] = [];
    if (type === "profit") {
        const { data } = await supabase
            .from("expenses")
            .select("date, amount, created_at")
            .gte("created_at", startDate.toISOString())
            .order("created_at", { ascending: true });
        expenses = data || [];
    }

    const chartData = [];

    if (dateFormat === "hour") {
        for (let i = 0; i < 24; i++) {
            const d = new Date(startDate);
            d.setHours(i);
            const hourPrefix = d.toISOString().slice(0, 13);
            const displayTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

            const hourSales = bills?.filter((b: any) => b.created_at.startsWith(hourPrefix))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            if (type === "sales") {
                chartData.push({ name: displayTime, total: hourSales });
            } else {
                const hourExpenses = expenses?.filter((e: any) => e.created_at.startsWith(hourPrefix))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name: displayTime, total: hourSales - hourExpenses });
            }
        }
    } else if (dateFormat === "day") {
        for (let i = 0; i < dataPoints; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split("T")[0];
            const displayDate = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

            const daySales = bills?.filter((b: any) => b.created_at.startsWith(dateStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            if (type === "sales") {
                chartData.push({ name: displayDate, total: daySales });
            } else {
                const dayExpenses = expenses?.filter((e: any) => e.date === dateStr)
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name: displayDate, total: daySales - dayExpenses });
            }
        }
    } else if (dateFormat === "month") {
        for (let i = 0; i < 12; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() - (11 - i));
            const monthStr = d.toISOString().slice(0, 7);
            const displayDate = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });

            const monthSales = bills?.filter((b: any) => b.created_at.startsWith(monthStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            if (type === "sales") {
                chartData.push({ name: displayDate, total: monthSales });
            } else {
                const monthExpenses = expenses?.filter((e: any) => e.date.startsWith(monthStr))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name: displayDate, total: monthSales - monthExpenses });
            }
        }
    } else if (dateFormat === "year") {
        const years = range === "3y" ? 3 : 5;
        for (let i = 0; i < years; i++) {
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
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 0. Global Stats (Total Revenue & Total Orders)
    const { data: allBills } = await supabase
        .from("bills")
        .select("total_amount")
        .neq("status", "cancelled");

    let totalRevenue = 0;
    let totalOrders = 0;

    if (allBills) {
        totalRevenue = allBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
        totalOrders = allBills.length;
    }

    // 1. Today's Sales
    const { data: todayBills } = await supabase
        .from("bills")
        .select("total_amount")
        .neq("status", "cancelled")
        .gte("created_at", todayISO);

    let todaySales = 0;
    if (todayBills) {
        todaySales = todayBills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);
    }

    // 2. Pending & Low Stock
    const { count: pendingBills } = await supabase
        .from("bills")
        .select("*", { count: "exact", head: true })
        .eq("status", "draft");

    const { count: lowStockItems } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .lt("stock", 10);

    // 4. Sales Chart Data
    const chartData = await getChartData(supabase, salesRange, "sales");

    // 5. Profit Chart Data
    const profitChartData = await getChartData(supabase, profitRange, "profit");

    // 6. Today's Profit
    const { data: todayExpenses } = await supabase
        .from("expenses")
        .select("amount")
        .gte("date", todayISO);

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
        activeNow: 1, // Hardcoded for now
    };
}

export async function getInventorySummary() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Get products with low stock first, limit to top 20 for the chat context
    const { data: products, error } = await supabase
        .from("products")
        .select("name, stock")
        .order("stock", { ascending: true })
        .limit(20);

    if (error) {
        console.error("Error fetching inventory summary:", error);
        return [];
    }

    return products;
}

export async function getRecentActivity() {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    // Fetch latest from each table
    const [
        { data: bills },
        { data: products },
        { data: customers },
        { data: expenses }
    ] = await Promise.all([
        supabase
            .from("bills")
            .select(`id, total_amount, created_at, customers(name)`)
            .neq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("products")
            .select("id, name, stock, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("customers")
            .select("id, name, created_at")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("expenses")
            .select("id, title, amount, created_at")
            .order("created_at", { ascending: false })
            .limit(5)
    ]);

    // Normalize data
    const activities = [
        ...(bills || []).map((b: any) => ({
            type: "bill",
            id: b.id,
            title: b.customers?.name || "Unknown Customer",
            description: `Created a bill of ฿${Number(b.total_amount).toLocaleString()}`,
            time: b.created_at
        })),
        ...(products || []).map((p: any) => ({
            type: "product",
            id: p.id,
            title: p.name,
            description: `New product added (Stock: ${p.stock})`,
            time: p.created_at
        })),
        ...(customers || []).map((c: any) => ({
            type: "customer",
            id: c.id,
            title: c.name,
            description: "New customer registered",
            time: c.created_at
        })),
        ...(expenses || []).map((e: any) => ({
            type: "expense",
            id: e.id,
            title: e.title,
            description: `Expense recorded: ฿${Number(e.amount).toLocaleString()}`,
            time: e.created_at
        }))
    ];

    // Sort by time desc and take top 10
    return activities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 10);
}
