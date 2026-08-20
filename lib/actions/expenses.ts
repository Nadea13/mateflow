"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Expense } from "@/types";
import { getStores } from "@/lib/actions/profile";

export async function getExpenses(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = storeId || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    let rawExpenses: any[] = [];

    // 1. Try active store
    if (targetStoreId) {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .eq("store_id", targetStoreId)
            .order("date", { ascending: false });

        if (!error && data && data.length > 0) {
            rawExpenses = data;
        }
    }

    // 2. Try all user's stores
    if (rawExpenses.length === 0 && validStoreIds.length > 0) {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .in("store_id", validStoreIds)
            .order("date", { ascending: false });

        if (!error && data && data.length > 0) {
            rawExpenses = data;
        }
    }

    // 3. Fallback: all expenses in table
    if (rawExpenses.length === 0) {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .order("date", { ascending: false });

        if (!error && data) {
            rawExpenses = data;
        }
    }

    return rawExpenses as Expense[];
}

export async function createExpense(data: {
    title: string;
    amount: number;
    category: string;
    description?: string;
    notes?: string;
    date: string;
    receipt_url?: string;
    vendor_name?: string;
    vendor_tax_id?: string;
    supplier_id?: string;
    supplier_name?: string;
    wht_rate?: number;
    wht_amount?: number;
    input_vat?: number;
    store_id?: string;
}) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const validStores = await getStores();
    const validStoreIds = validStores.map(s => s.id);

    const activeCookieStoreId = cookieStore.get("active_store_id")?.value;
    let targetStoreId = data.store_id || (activeCookieStoreId && validStoreIds.includes(activeCookieStoreId) ? activeCookieStoreId : validStoreIds[0]);

    if (!targetStoreId) {
        const { data: defaultStore } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .maybeSingle();
        if (defaultStore) targetStoreId = defaultStore.id;
    }

    const payload: any = {
        title: data.title,
        amount: Number(data.amount) || 0,
        category: data.category || "other",
        date: data.date || new Date().toISOString().split("T")[0],
        receipt_url: data.receipt_url || null,
        vendor_name: data.vendor_name || data.supplier_name || null,
        supplier_id: data.supplier_id || null,
        supplier_name: data.supplier_name || null,
        description: data.description || data.notes || null,
        notes: data.notes || data.description || null,
        wht_rate: data.wht_rate || null,
        wht_amount: data.wht_amount || null,
        input_vat: data.input_vat || null,
    };

    if (targetStoreId) {
        payload.store_id = targetStoreId;
    }

    let { error } = await supabase
        .from("expenses")
        .insert(payload);

    if (error) {
        console.error("Error creating expense:", error);
        return { error: error.message || "Failed to create expense" };
    }

    revalidatePath("/dashboard/expenses", "page");
    return { success: true };
}

export async function uploadReceipt(formData: FormData) {
    const file = formData.get("receipt") as File;
    if (!file) return { error: "No file provided" };

    try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", "receipts");

        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/upload`, {
            method: "POST",
            body: uploadFormData,
        });

        if (!res.ok) throw new Error("Upload failed");
        const json = await res.json();
        return { url: json.url };
    } catch (e: any) {
        return { error: e.message || "Failed to upload receipt" };
    }
}

export async function deleteExpense(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting expense:", error);
        return { error: "Failed to delete expense" };
    }

    revalidatePath("/dashboard/expenses", "page");
    return { success: true };
}
