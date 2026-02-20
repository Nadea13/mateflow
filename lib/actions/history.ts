"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export interface HistoryItem {
    id: string;
    type: "bill" | "product" | "customer" | "expense";
    title: string;
    description: string;
    time: string;
    amount?: number;
    status?: string;
}

export async function getHistory(type: string = "all"): Promise<HistoryItem[]> {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);

    const limit = 50; // Fetch limit per category to keep it performant

    let activities: HistoryItem[] = [];

    // Parallel fetching based on type
    const promises = [];

    if (type === "all" || type === "bill") {
        promises.push(
            supabase
                .from("bills")
                .select(`id, total_amount, status, created_at, customers(name)`)
                .neq("status", "cancelled")
                .order("created_at", { ascending: false })
                .limit(limit)
                .then(({ data }) =>
                    (data || []).map((b: any) => ({
                        type: "bill",
                        id: b.id,
                        title: b.customers?.name || "Unknown Customer",
                        description: `Created a bill of ฿${Number(b.total_amount).toLocaleString()}`,
                        time: b.created_at,
                        amount: Number(b.total_amount),
                        status: b.status
                    }))
                )
        );
    }

    if (type === "all" || type === "product") {
        promises.push(
            supabase
                .from("products")
                .select("id, name, stock, price, created_at")
                .order("created_at", { ascending: false })
                .limit(limit)
                .then(({ data }) =>
                    (data || []).map((p: any) => ({
                        type: "product",
                        id: p.id,
                        title: p.name,
                        description: `Added product (Stock: ${p.stock}, Price: ฿${p.price})`,
                        time: p.created_at
                    }))
                )
        );
    }

    if (type === "all" || type === "customer") {
        promises.push(
            supabase
                .from("customers")
                .select("id, name, email, created_at")
                .order("created_at", { ascending: false })
                .limit(limit)
                .then(({ data }) =>
                    (data || []).map((c: any) => ({
                        type: "customer",
                        id: c.id,
                        title: c.name,
                        description: c.email ? `Registered customer (${c.email})` : "Registered new customer",
                        time: c.created_at
                    }))
                )
        );
    }

    if (type === "all" || type === "expense") {
        promises.push(
            supabase
                .from("expenses")
                .select("id, title, amount, category, created_at")
                .order("created_at", { ascending: false })
                .limit(limit)
                .then(({ data }) =>
                    (data || []).map((e: any) => ({
                        type: "expense",
                        id: e.id,
                        title: e.title,
                        description: `Expense: ฿${Number(e.amount).toLocaleString()} (${e.category})`,
                        time: e.created_at,
                        amount: Number(e.amount)
                    }))
                )
        );
    }

    const results = await Promise.all(promises);

    // Flatten results
    activities = results.flat() as HistoryItem[];

    // Sort by time descending
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}
