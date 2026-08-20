"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Expense } from "@/types";

export async function getExpenses(storeId?: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const targetStoreId = storeId || cookieStore.get("active_store_id")?.value;

    let query = supabase.from("expenses").select("*").order("date", { ascending: false });

    if (targetStoreId) {
        query = query.eq("store_id", targetStoreId);
    }

    let { data: expenses, error } = await query;

    if (error || !expenses) {
        const fallback = await supabase
            .from("expenses")
            .select("*")
            .order("date", { ascending: false });
        expenses = fallback.data || [];
    }

    return expenses;
}

export async function createExpense(data: {
    title: string;
    amount: number;
    category: string;
    description?: string;
    date: string;
    receipt_url?: string;
    vendor_name?: string;
    vendor_tax_id?: string;
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

    let targetStoreId = data.store_id || cookieStore.get("active_store_id")?.value;
    if (!targetStoreId) {
        const { data: defaultStore } = await supabase
            .from("stores")
            .select("id")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: true })
            .maybeSingle();
        if (defaultStore) targetStoreId = defaultStore.id;
    }

    const payload: any = {
        store_id: targetStoreId || user.id,
        ...data,
    };

    let { error } = await supabase
        .from("expenses")
        .insert(payload);

    if (error && (error.code === "PGRST204" || error.message?.includes("store_id"))) {
        delete payload.store_id;
        payload.user_id = user.id;
        const fallbackRes = await supabase.from("expenses").insert(payload);
        error = fallbackRes.error;
    }

    if (error) {
        console.error("Error creating expense:", error);
        return { error: "Failed to create expense" };
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

        const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/upload`, {
            method: "POST",
            body: uploadFormData,
        });

        const data = await res.json();
        if (data.success) {
            return { success: true, receipt_url: data.url };
        }
        return { error: data.error || "Upload failed" };
    } catch (err: any) {
        return { error: err.message || "Failed to upload receipt" };
    }
}

export async function deleteExpense(id: string) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

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
