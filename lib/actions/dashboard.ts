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
async function getChartData(supabase: any, range: string, type: "sales" | "profit", storeId: string, validStoreIds: string[]) {
    const { startDate, dataPoints, dateFormat } = getRangeParams(range);

    // Fetch bills
    let billQuery = supabase
        .from("bills")
        .select("created_at, total_amount")
        .neq("status", "cancelled")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

    if (storeId) {
        billQuery = billQuery.eq("store_id", storeId);
    } else if (validStoreIds.length > 0) {
        billQuery = billQuery.in("store_id", validStoreIds);
    }

    const { data: bills } = await billQuery;

    // Fetch expenses
    let expenses: any[] = [];
    if (type === "profit") {
        let expQuery = supabase
            .from("expenses")
            .select("date, amount")
            .gte("date", startDate.toISOString().split("T")[0])
            .order("date", { ascending: true });

        if (storeId) {
            expQuery = expQuery.eq("store_id", storeId);
        } else if (validStoreIds.length > 0) {
            expQuery = expQuery.in("store_id", validStoreIds);
        }

        const { data: exp } = await expQuery;
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
            chartData.push({ name, total: hourSales });
        }
    } else if (dateFormat === "day") {
        for (let i = dataPoints - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];

            const daySales = bills?.filter((b: any) => b.created_at?.startsWith(dateStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            const name = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

            if (type === "sales") {
                chartData.push({ name, total: daySales });
            } else {
                const dayExpenses = expenses?.filter((e: any) => e.date?.startsWith(dateStr))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name, total: daySales - dayExpenses });
            }
        }
    } else if (dateFormat === "month") {
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthYearStr = d.toISOString().slice(0, 7);

            const monthSales = bills?.filter((b: any) => b.created_at?.startsWith(monthYearStr))
                .reduce((sum: number, b: any) => sum + Number(b.total_amount), 0) || 0;

            const name = d.toLocaleDateString("en-US", { month: "short" });

            if (type === "sales") {
                chartData.push({ name, total: monthSales });
            } else {
                const monthExpenses = expenses?.filter((e: any) => e.date?.startsWith(monthYearStr))
                    .reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
                chartData.push({ name, total: monthSales - monthExpenses });
            }
        }
    }
    return chartData;
}

export async function getDashboardStats(salesRange: string = "7d", profitRange: string = "7d") {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    const emptyStats = {
        todaySales: 0,
        pendingBills: 0,
        pendingBillsAmount: 0,
        expiringQuotationsCount: 0,
        lowStockItems: 0,
        lowStockProducts: [] as any[],
        chartData: [] as any[],
        profitChartData: [] as any[],
        totalRevenue: 0,
        totalOrders: 0,
        todayProfit: 0,
        monthInflow: 0,
        monthOutflow: 0,
        topProducts: [] as any[],
        urgentActions: [] as any[],
        activeNow: 1,
    };

    if (!user) return emptyStats;

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();
    const currentMonthPrefix = today.toISOString().slice(0, 7);

    // 1. Fetch All Active Bills
    let billsQuery = supabase
        .from("bills")
        .select(`
            id,
            store_id,
            customer_id,
            total_amount,
            status,
            adjustments,
            payment_terms,
            validity_days,
            created_at,
            customer:customers(name),
            items:bill_items(product_id, product_name, quantity, total_price)
        `)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false });

    if (targetStoreId) {
        billsQuery = billsQuery.eq("store_id", targetStoreId);
    } else if (validStoreIds.length > 0) {
        billsQuery = billsQuery.in("store_id", validStoreIds);
    }

    const { data: rawBills } = await billsQuery;
    const bills = rawBills || [];

    // 2. Fetch All Expenses
    let expQuery = supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });

    if (targetStoreId) {
        expQuery = expQuery.eq("store_id", targetStoreId);
    } else if (validStoreIds.length > 0) {
        expQuery = expQuery.in("store_id", validStoreIds);
    }

    const { data: rawExpenses } = await expQuery;
    const expenses = rawExpenses || [];

    // 3. Fetch Products for Stock Analytics
    let prodQuery = supabase
        .from("products")
        .select("id, name, sku, price, cost_price, stock, min_stock_level, supplier_id")
        .order("stock", { ascending: true });

    if (targetStoreId) {
        prodQuery = prodQuery.eq("store_id", targetStoreId);
    } else if (validStoreIds.length > 0) {
        prodQuery = prodQuery.in("store_id", validStoreIds);
    }

    const { data: rawProducts } = await prodQuery;
    const products = rawProducts || [];

    // --- Calculations ---

    // Total Revenue & Total Orders
    const totalRevenue = bills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);
    const totalOrders = bills.length;

    // Today's Sales & Expenses
    const todayBills = bills.filter(b => b.created_at >= todayISO);
    const todaySales = todayBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const todayExpenses = expenses.filter(e => e.date >= todayISO.split("T")[0]);
    const todayExpensesTotal = todayExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const todayProfit = todaySales - todayExpensesTotal;

    // Monthly Cashflow: Inflow (Paid bills this month) vs Outflow (Expenses this month)
    const monthPaidBills = bills.filter(b => b.status === "paid" && b.created_at?.startsWith(currentMonthPrefix));
    const monthInflow = monthPaidBills.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    const monthExpenses = expenses.filter(e => e.date?.startsWith(currentMonthPrefix));
    const monthOutflow = monthExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // Pending & Overdue Invoices (Status: draft, and not quotation tag)
    const pendingDrafts = bills.filter(b => {
        const isQuotation = b.status === "quotation" || b.adjustments?.some((a: any) => a.label === "__is_quotation__");
        return (b.status === "draft" && !isQuotation);
    });

    const pendingBillsCount = pendingDrafts.length;
    const pendingBillsAmount = pendingDrafts.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

    // Expiring Quotations (Status: quotation)
    const activeQuotations = bills.filter(b => {
        return b.status === "quotation" || (b.status === "draft" && b.adjustments?.some((a: any) => a.label === "__is_quotation__"));
    });
    const expiringQuotationsCount = activeQuotations.length;

    // Low Stock Products
    const lowStockProductsList = products.filter(p => Number(p.stock) <= (Number(p.min_stock_level) || 10));
    const lowStockItemsCount = lowStockProductsList.length;

    // Top 5 Best Selling Products (Aggregated from bill items)
    const productSalesMap: Record<string, { id: string; name: string; quantity: number; revenue: number }> = {};
    bills.forEach(bill => {
        if (bill.items && Array.isArray(bill.items)) {
            bill.items.forEach((item: any) => {
                const pId = item.product_id || item.product_name;
                if (!productSalesMap[pId]) {
                    productSalesMap[pId] = {
                        id: item.product_id,
                        name: item.product_name,
                        quantity: 0,
                        revenue: 0,
                    };
                }
                productSalesMap[pId].quantity += Number(item.quantity || 0);
                productSalesMap[pId].revenue += Number(item.total_price || (item.quantity * item.unit_price) || 0);
            });
        }
    });

    const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

    // Build Urgent Operational Action Items
    const urgentActions: any[] = [];

    if (lowStockItemsCount > 0) {
        urgentActions.push({
            id: "low-stock-alert",
            type: "stock",
            level: "warning",
            title: `สินค้าใกล้หมดสต็อก ${lowStockItemsCount} รายการ`,
            description: `มีสินค้าต่ำกว่าเกณฑ์แจ้งเตือน เช่น ${lowStockProductsList.slice(0, 2).map(p => p.name).join(", ")}`,
            actionLabel: "จัดการสต็อกสินค้า",
            actionHref: "/dashboard/catalog",
        });
    }

    if (pendingBillsCount > 0) {
        urgentActions.push({
            id: "pending-bills-alert",
            type: "billing",
            level: "info",
            title: `ใบแจ้งหนี้รอเก็บเงิน ${pendingBillsCount} ใบ (฿${pendingBillsAmount.toLocaleString()})`,
            description: "มีใบแจ้งหนี้ที่ออกแล้วรอการชำระเงิน ตรวจสอบหรือส่ง QR Code ให้ลูกค้า",
            actionLabel: "ดูใบแจ้งหนี้",
            actionHref: "/dashboard/bills",
        });
    }

    if (expiringQuotationsCount > 0) {
        urgentActions.push({
            id: "quotations-alert",
            type: "quotation",
            level: "neutral",
            title: `ใบเสนอราคาเปิดอยู่ ${expiringQuotationsCount} ใบ`,
            description: "ติดตามผลกับลูกค้าก่อนหมดอายุการเสนอราคา",
            actionLabel: "ดูใบเสนอราคา",
            actionHref: "/dashboard/bills",
        });
    }

    // Chart Data
    const chartData = await getChartData(supabase, salesRange, "sales", targetStoreId, validStoreIds);
    const profitChartData = await getChartData(supabase, profitRange, "profit", targetStoreId, validStoreIds);

    return {
        todaySales,
        pendingBills: pendingBillsCount,
        pendingBillsAmount,
        expiringQuotationsCount,
        lowStockItems: lowStockItemsCount,
        lowStockProducts: lowStockProductsList.slice(0, 5),
        chartData,
        profitChartData,
        totalRevenue,
        totalOrders,
        todayProfit,
        monthInflow,
        monthOutflow,
        topProducts,
        urgentActions,
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

    let prodQuery = supabase
        .from("products")
        .select("name, stock")
        .order("stock", { ascending: true })
        .limit(20);

    if (targetStoreId) {
        prodQuery = prodQuery.eq("store_id", targetStoreId);
    } else if (validStoreIds.length > 0) {
        prodQuery = prodQuery.in("store_id", validStoreIds);
    }

    const { data: products } = await prodQuery;
    return products || [];
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

    // Fetch latest strictly from active store or valid stores
    let billsQuery = supabase
        .from("bills")
        .select(`id, total_amount, status, created_at, customer:customers(name)`)
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(6);

    let prodsQuery = supabase
        .from("products")
        .select("id, name, stock, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

    let custsQuery = supabase
        .from("customers")
        .select("id, name, created_at")
        .order("created_at", { ascending: false })
        .limit(6);

    let expsQuery = supabase
        .from("expenses")
        .select("id, title, amount, date")
        .order("date", { ascending: false })
        .limit(6);

    if (targetStoreId) {
        billsQuery = billsQuery.eq("store_id", targetStoreId);
        prodsQuery = prodsQuery.eq("store_id", targetStoreId);
        custsQuery = custsQuery.eq("store_id", targetStoreId);
        expsQuery = expsQuery.eq("store_id", targetStoreId);
    } else if (validStoreIds.length > 0) {
        billsQuery = billsQuery.in("store_id", validStoreIds);
        prodsQuery = prodsQuery.in("store_id", validStoreIds);
        custsQuery = custsQuery.in("store_id", validStoreIds);
        expsQuery = expsQuery.in("store_id", validStoreIds);
    }

    const [
        { data: bills },
        { data: products },
        { data: customers },
        { data: expenses }
    ] = await Promise.all([
        billsQuery,
        prodsQuery,
        custsQuery,
        expsQuery
    ]);

    const activities: any[] = [];

    bills?.forEach((b: any) => {
        const isPaid = b.status === "paid";
        activities.push({
            id: `bill-${b.id}`,
            type: "bill",
            title: isPaid ? `รับชำระเงินจาก ${b.customer?.name || "ลูกค้า"}` : `ออกเอกสารให้ ${b.customer?.name || "ลูกค้า"}`,
            description: `ยอดรวม ฿${Number(b.total_amount || 0).toLocaleString()} • สถานะ: ${b.status}`,
            timestamp: b.created_at,
        });
    });

    products?.forEach((p: any) => {
        activities.push({
            id: `prod-${p.id}`,
            type: "product",
            title: `เพิ่มสินค้าใหม่: ${p.name}`,
            description: `สต็อกเริ่มต้น ${p.stock} ชิ้น`,
            timestamp: p.created_at,
        });
    });

    customers?.forEach((c: any) => {
        activities.push({
            id: `cust-${c.id}`,
            type: "customer",
            title: `ลงทะเบียนลูกค้าใหม่: ${c.name}`,
            description: "บันทึกลงสมุดรายชื่อลูกค้าแล้ว",
            timestamp: c.created_at,
        });
    });

    expenses?.forEach((e: any) => {
        activities.push({
            id: `exp-${e.id}`,
            type: "expense",
            title: e.title,
            description: `บันทึกค่าใช้จ่าย ฿${Number(e.amount || 0).toLocaleString()}`,
            timestamp: e.date,
        });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return activities.slice(0, 10);
}
